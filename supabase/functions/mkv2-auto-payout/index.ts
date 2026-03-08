// Auto-payout: Transitions eligible marketplace orders to payout_pending
// after the protection period (8 business days) has elapsed.
// Should be called via cron (hourly).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkIdempotency, setIdempotencyResult, markIdempotencyFailed } from "../_shared/idempotency.ts";
import { requireServiceOrAdmin, authErrorResponse } from "../_shared/auth-guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-cron-key",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Auth: require service-role, cron key, or admin session
  try {
    await requireServiceOrAdmin(req, sb);
  } catch (error) {
    return authErrorResponse(error);
  }

  try {
    // Log execution start
    const startedAt = new Date().toISOString();
    const { data: logEntry } = await sb
      .from("cron_execution_logs")
      .insert({ job_name: "mkv2-auto-payout", started_at: startedAt, status: "running" })
      .select("id")
      .single();
    const logId = logEntry?.id;

    const now = new Date().toISOString();

    // Find orders that are "delivered" and past protection period, with no open disputes
    const { data: eligible, error } = await sb
      .from("vault_marketplace_orders")
      .select("id, order_code, seller_id, seller_payout, buyer_cpf, protection_ends_at")
      .in("status", ["delivered", "completed"])
      .is("dispute_status", null)
      .is("payout_released_at", null)
      .lt("protection_ends_at", now)
      .limit(50);

    if (error) throw error;

    if (!eligible || eligible.length === 0) {
      console.log("[mkv2-auto-payout] No eligible orders for payout");
      return new Response(
        JSON.stringify({ processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[mkv2-auto-payout] Found ${eligible.length} eligible orders`);

    let processed = 0;

    for (const order of eligible) {
      // Idempotency: prevent duplicate payout transitions for same order
      const payoutIdempKey = `auto-payout-${order.id}`;
      const idempCheck = await checkIdempotency(sb, payoutIdempKey, 120); // 2h TTL
      if (idempCheck.isDuplicate) {
        console.log(`[mkv2-auto-payout] Skipping duplicate payout for order ${order.order_code}`);
        continue;
      }

      // Transition to payout_pending
      const { error: updateErr } = await sb
        .from("vault_marketplace_orders")
        .update({
          payout_status: "payout_pending",
          payout_amount: order.seller_payout,
          status: "payout_pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (updateErr) {
        console.error(`[mkv2-auto-payout] Failed to update order ${order.order_code}:`, updateErr);
        await markIdempotencyFailed(sb, payoutIdempKey, updateErr.message || "Update failed").catch(() => {});
        continue;
      }

      // Notify seller
      if (order.seller_id) {
        const { data: seller } = await sb
          .from("vault_seller_profiles")
          .select("member:vault_members!inner(client_cpf, client_name)")
          .eq("id", order.seller_id)
          .single();

        if (seller?.member?.client_cpf) {
          await sb.from("notifications").insert({
            title: "💰 Repasse disponível!",
            message: `Pedido ${order.order_code} — R$ ${order.seller_payout?.toFixed(2)} está pronto para repasse.`,
            target: "client",
            target_client_cpf: seller.member.client_cpf,
            type: "info",
            reference_id: order.id,
            reference_type: "marketplace_payout",
          });
        }
      }

      // Notify admin
      await sb.from("notifications").insert({
        title: "📤 Repasse pendente",
        message: `Pedido ${order.order_code} — R$ ${order.seller_payout?.toFixed(2)} aguardando repasse manual ao vendedor.`,
        target: "admin",
        type: "info",
        reference_id: order.id,
        reference_type: "marketplace_payout",
      });

      // Mark idempotency as completed (prevents stuck "processing" state)
      await setIdempotencyResult(sb, payoutIdempKey, {
        order_id: order.id,
        order_code: order.order_code,
        payout_amount: order.seller_payout,
      }).catch((e: unknown) => console.warn(`[mkv2-auto-payout] Failed to finalize idempotency for ${order.order_code}:`, e));

      processed++;
    }

    console.log(`[mkv2-auto-payout] Processed ${processed} orders`);

    if (logId) {
      await sb.from("cron_execution_logs").update({
        status: "success",
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - new Date(startedAt).getTime(),
        result: { processed, total_eligible: eligible.length },
      }).eq("id", logId);
    }

    return new Response(
      JSON.stringify({ processed, total_eligible: eligible.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[mkv2-auto-payout] Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
