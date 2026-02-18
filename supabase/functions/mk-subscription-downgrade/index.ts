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
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date().toISOString();

    // 1. Find subscriptions past their grace period that are still active
    const { data: expiredSubs } = await supabase
      .from("marketplace_subscriptions")
      .select("id, seller_id, plan_id, grace_period_end, current_period_end, cancel_at_period_end")
      .in("status", ["active", "past_due"])
      .not("plan_id", "eq", "free");

    if (!expiredSubs || expiredSubs.length === 0) {
      return new Response(
        JSON.stringify({ message: "No subscriptions to process", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let processedCount = 0;

    for (const sub of expiredSubs) {
      const effectiveEnd = sub.grace_period_end || sub.current_period_end;

      // Skip if not expired yet
      if (!effectiveEnd || new Date(effectiveEnd) > new Date(now)) {
        // Check if cancel_at_period_end and period ended (without grace)
        if (sub.cancel_at_period_end && sub.current_period_end && new Date(sub.current_period_end) <= new Date(now)) {
          // User requested cancellation and period ended
        } else {
          continue;
        }
      }

      // Mark subscription as expired
      await supabase
        .from("marketplace_subscriptions")
        .update({
          status: "expired",
          updated_at: now,
        })
        .eq("id", sub.id);

      // Downgrade seller to free
      await supabase
        .from("vault_seller_profiles")
        .update({
          plan_id: "free",
          current_fee_percent: 14,
          support_priority: 0,
          updated_at: now,
        })
        .eq("id", sub.seller_id);

      // Pause excess listings (keep 5 most recent)
      const { data: activeOffers } = await supabase
        .from("marketplace_offers")
        .select("id")
        .eq("seller_id", sub.seller_id)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (activeOffers && activeOffers.length > 5) {
        const toPause = activeOffers.slice(5).map((o: any) => o.id);
        await supabase
          .from("marketplace_offers")
          .update({ status: "paused" })
          .in("id", toPause);
      }

      // Notify seller
      const { data: seller } = await supabase
        .from("vault_seller_profiles")
        .select("member_id")
        .eq("id", sub.seller_id)
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

      processedCount++;
    }

    // 2. Handle past_due: subscriptions with failed payment past grace
    const { data: pastDueSubs } = await supabase
      .from("marketplace_subscriptions")
      .select("id, seller_id, current_period_end")
      .eq("status", "active")
      .eq("last_payment_status", "paused")
      .not("plan_id", "eq", "free");

    if (pastDueSubs) {
      for (const sub of pastDueSubs) {
        // Set grace period of 3 days if not already set
        if (sub.current_period_end && new Date(sub.current_period_end) <= new Date(now)) {
          const gracePeriod = new Date(now);
          gracePeriod.setDate(gracePeriod.getDate() + 3);

          await supabase
            .from("marketplace_subscriptions")
            .update({
              status: "past_due",
              grace_period_end: gracePeriod.toISOString(),
              updated_at: now,
            })
            .eq("id", sub.id);
        }
      }
    }

    return new Response(
      JSON.stringify({ message: "Downgrade check complete", processed: processedCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("mk-subscription-downgrade error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
