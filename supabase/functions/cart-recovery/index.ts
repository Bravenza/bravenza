import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireServiceOrAdmin } from "../_shared/auth-guard.ts";
import { jsonResponse } from "../_shared/mk-helpers.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, x-supabase-client-platform, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Service guard
    try { await requireServiceOrAdmin(req, supabase); } catch (e: any) {
      return jsonResponse({ error: e.message || "Unauthorized" }, e.status || 401);
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || "process";

    if (action === "record") {
      // ─── Record a new abandoned cart ───
      const { cpf, cart_snapshot, cart_total, item_count } = body;
      if (!cpf || !cart_snapshot) {
        throw new Error("cpf and cart_snapshot are required");
      }

      // Upsert: only one pending per user
      const { error } = await supabase
        .from("abandoned_carts")
        .upsert(
          {
            user_cpf: cpf,
            cart_snapshot,
            cart_total: cart_total || 0,
            item_count: item_count || 0,
            checkout_started_at: new Date().toISOString(),
            status: "pending",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_cpf", ignoreDuplicates: false }
        );

      if (error) throw error;
      console.log(`[cart-recovery] Recorded abandoned cart for CPF: ${cpf.slice(0, 3)}***`);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "clear") {
      // ─── Clear abandoned cart (user completed checkout) ───
      const { cpf } = body;
      if (!cpf) throw new Error("cpf is required");

      const { error } = await supabase
        .from("abandoned_carts")
        .update({ status: "recovered", recovered_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("user_cpf", cpf)
        .eq("status", "pending");

      if (error) throw error;
      console.log(`[cart-recovery] Cleared abandoned cart for CPF: ${cpf.slice(0, 3)}***`);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── Process: find pending carts older than 1 hour, send recovery emails ───
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: abandonedCarts, error: fetchError } = await supabase
      .from("abandoned_carts")
      .select("*")
      .eq("status", "pending")
      .lt("checkout_started_at", oneHourAgo)
      .limit(50);

    if (fetchError) throw fetchError;

    if (!abandonedCarts || abandonedCarts.length === 0) {
      console.log("[cart-recovery] No abandoned carts to process");
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let sent = 0;
    let failed = 0;

    for (const cart of abandonedCarts) {
      try {
        // Get user email from vault_members
        const { data: member } = await supabase
          .from("vault_members")
          .select("client_name, client_email")
          .eq("client_cpf", cart.user_cpf)
          .maybeSingle();

        if (!member?.client_email) {
          // Try client_profiles
          const { data: profile } = await supabase
            .from("client_profiles")
            .select("full_name")
            .eq("cpf", cart.user_cpf)
            .maybeSingle();
          
          // No email found, mark as expired
          await supabase
            .from("abandoned_carts")
            .update({ status: "expired", updated_at: new Date().toISOString() })
            .eq("id", cart.id);
          
          console.log(`[cart-recovery] No email for CPF ${cart.user_cpf.slice(0, 3)}***, skipping`);
          continue;
        }

        const cartItems = (cart.cart_snapshot as any[]) || [];
        const appUrl = "https://bravenza.lovable.app";

        // Send recovery email via existing send-marketplace-email
        await fetch(`${supabaseUrl}/functions/v1/send-marketplace-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            type: "mk_cart_abandoned",
            recipient_name: member.client_name || "Cliente",
            recipient_email: member.client_email,
            cart_items: cartItems.slice(0, 5).map((item: any) => ({
              name: item.product_name || item.name || "Produto",
              price: item.price || 0,
              size: item.size || "",
            })),
            cart_total: cart.cart_total,
            cart_item_count: cart.item_count,
            recovery_url: `${appUrl}/marketplace`,
          }),
        });

        // Also send push notification
        try {
          await fetch(`${supabaseUrl}/functions/v1/send-push`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              target_cpf: cart.user_cpf,
              payload: {
                title: "🛒 Seu carrinho está esperando!",
                body: `Você tem ${cart.item_count} ${cart.item_count === 1 ? "item" : "itens"} aguardando. Finalize antes que esgotem!`,
                tag: "cart-recovery",
                url: "/marketplace",
              },
            }),
          });
        } catch (_pushErr) {
          // Push is best-effort
        }

        // Update status
        await supabase
          .from("abandoned_carts")
          .update({
            status: "email_sent",
            recovery_email_sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", cart.id);

        sent++;
        console.log(`[cart-recovery] Recovery email sent to ${member.client_email}`);
      } catch (err: any) {
        failed++;
        console.error(`[cart-recovery] Failed for cart ${cart.id}:`, err.message);
      }
    }

    console.log(`[cart-recovery] Processed: ${sent} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({ success: true, processed: sent, failed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[cart-recovery] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
