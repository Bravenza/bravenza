const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mpToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN")!;

    if (!mpToken) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN not configured");
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const body = await req.json();
    const { action } = body;

    // ── CREATE SUBSCRIPTION ──────────────────────────────────────────
    if (action === "create") {
      const { seller_id, plan_id, payer_email } = body;

      // Get plan details
      const { data: plan } = await supabase
        .from("marketplace_plans")
        .select("*")
        .eq("id", plan_id)
        .single();

      if (!plan || plan.price_monthly <= 0) {
        throw new Error("Plano inválido ou gratuito");
      }

      // Create a preapproval (recurring) in Mercado Pago
      const mpResponse = await fetch("https://api.mercadopago.com/preapproval", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mpToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: `Bravenza Marketplace - ${plan.name}`,
          auto_recurring: {
            frequency: 1,
            frequency_type: "months",
            transaction_amount: plan.price_monthly,
            currency_id: "BRL",
          },
          payer_email,
          back_url: "https://bravenza.lovable.app/marketplace/planos",
          status: "pending",
        }),
      });

      const mpData = await mpResponse.json();

      if (!mpResponse.ok) {
        console.error("MP subscription error:", mpData);
        throw new Error(mpData.message || "Erro ao criar assinatura no Mercado Pago");
      }

      // Upsert subscription in our DB
      await supabase.from("marketplace_subscriptions").upsert(
        {
          seller_id,
          plan_id,
          status: "pending",
          payment_provider: "mercadopago",
          provider_subscription_id: mpData.id,
          current_period_start: new Date().toISOString(),
          current_period_end: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "seller_id" }
      );

      return new Response(
        JSON.stringify({
          success: true,
          checkout_url: mpData.init_point,
          subscription_id: mpData.id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── WEBHOOK (called by MP webhook) ──────────────────────────────
    if (action === "webhook") {
      const { type, data } = body;

      if (type === "subscription_preapproval") {
        const preapprovalId = data?.id;
        if (!preapprovalId) throw new Error("No preapproval ID");

        // Fetch subscription status from MP
        const mpRes = await fetch(
          `https://api.mercadopago.com/preapproval/${preapprovalId}`,
          { headers: { Authorization: `Bearer ${mpToken}` } }
        );
        const mpSub = await mpRes.json();

        // Map MP status to our status
        let dbStatus = "pending";
        if (mpSub.status === "authorized") dbStatus = "active";
        else if (mpSub.status === "paused") dbStatus = "paused";
        else if (mpSub.status === "cancelled") dbStatus = "cancelled";

        // Update subscription
        const { data: sub } = await supabase
          .from("marketplace_subscriptions")
          .update({
            status: dbStatus,
            last_payment_status: mpSub.status,
            last_payment_at: new Date().toISOString(),
            current_period_end: mpSub.next_payment_date || null,
            updated_at: new Date().toISOString(),
          })
          .eq("provider_subscription_id", preapprovalId)
          .select("seller_id, plan_id")
          .single();

        // If activated, update seller plan_id (trigger auto-calculates current_fee_percent)
        if (dbStatus === "active" && sub) {
          const isElite = sub.plan_id === "elite";
          await supabase
            .from("vault_seller_profiles")
            .update({
              plan_id: sub.plan_id,
              support_priority: isElite ? 3 : sub.plan_id === "pro" ? 2 : 0,
              verified_badge: isElite,
              updated_at: new Date().toISOString(),
            })
            .eq("id", sub.seller_id);
        }

        // If cancelled/expired, downgrade to free
        if (dbStatus === "cancelled" && sub) {
          await downgradeSellerToFree(supabase, sub.seller_id);
        }
      }

      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── CANCEL SUBSCRIPTION ──────────────────────────────────────────
    if (action === "cancel") {
      const { seller_id } = body;

      const { data: sub } = await supabase
        .from("marketplace_subscriptions")
        .select("*")
        .eq("seller_id", seller_id)
        .eq("status", "active")
        .single();

      if (!sub || !sub.provider_subscription_id) {
        throw new Error("Nenhuma assinatura ativa encontrada");
      }

      // Cancel in Mercado Pago
      const mpRes = await fetch(
        `https://api.mercadopago.com/preapproval/${sub.provider_subscription_id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${mpToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "cancelled" }),
        }
      );

      if (!mpRes.ok) {
        const err = await mpRes.json();
        throw new Error(err.message || "Erro ao cancelar assinatura");
      }

      // Mark as cancel_at_period_end
      await supabase
        .from("marketplace_subscriptions")
        .update({
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sub.id);

      return new Response(
        JSON.stringify({ success: true, message: "Assinatura será cancelada ao final do período" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── GET STATUS ──────────────────────────────────────────────────
    if (action === "status") {
      const { seller_id } = body;

      const { data: sub } = await supabase
        .from("marketplace_subscriptions")
        .select("*, marketplace_plans(*)")
        .eq("seller_id", seller_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return new Response(JSON.stringify({ subscription: sub }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error: any) {
    console.error("mk-subscription error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function downgradeSellerToFree(supabase: any, sellerId: string) {
  // Update seller to free plan (trigger auto-calculates current_fee_percent to 14)
  await supabase
    .from("vault_seller_profiles")
    .update({
      plan_id: "free",
      support_priority: 0,
      verified_badge: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sellerId);

  // Pause excess listings (keep only 5 most recent active)
  const { data: activeOffers } = await supabase
    .from("marketplace_offers")
    .select("id")
    .eq("seller_id", sellerId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (activeOffers && activeOffers.length > 5) {
    const toPause = activeOffers.slice(5).map((o: any) => o.id);
    await supabase
      .from("marketplace_offers")
      .update({ status: "paused" })
      .in("id", toPause);
  }

  // Create notification
  const { data: seller } = await supabase
    .from("vault_seller_profiles")
    .select("member_id")
    .eq("id", sellerId)
    .single();

  if (seller?.member_id) {
    const { data: member } = await supabase
      .from("vault_members")
      .select("client_cpf")
      .eq("id", seller.member_id)
      .single();

    if (member?.client_cpf) {
      await supabase.from("notifications").insert({
        target: "client",
        target_client_cpf: member.client_cpf,
        type: "warning",
        title: "📉 Plano rebaixado para Free",
        message:
          "Seu plano expirou. Seus anúncios excedentes foram pausados automaticamente. Faça upgrade para reativar.",
        reference_type: "marketplace_plan",
      });
    }
  }
}
