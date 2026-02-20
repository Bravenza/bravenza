// mk-cron-tasks: Handles periodic marketplace maintenance tasks
// - Auto-expire offers older than 48h with no activity
// - Record daily price history snapshots
// - Log execution to cron_execution_logs
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
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

  const startedAt = new Date().toISOString();
  let logId: string | null = null;

  try {
    // Create execution log entry
    const { data: logEntry } = await sb
      .from("cron_execution_logs")
      .insert({ job_name: "mk-cron-tasks", started_at: startedAt, status: "running" })
      .select("id")
      .single();
    logId = logEntry?.id || null;

    const now = new Date();
    const results: Record<string, unknown> = {};

    // ── 1. Auto-expire stale offers (no update in 48h, status=active) ──
    const cutoff48h = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
    const { data: expiredOffers, error: expErr } = await sb
      .from("marketplace_offers")
      .update({ status: "expired", updated_at: now.toISOString() })
      .eq("status", "active")
      .lt("updated_at", cutoff48h)
      .select("id");

    if (expErr) console.error("[mk-cron-tasks] Expire error:", expErr);
    results.expired_offers = expiredOffers?.length || 0;

    // ── 2. Daily price history snapshot ──
    const today = now.toISOString().split("T")[0];

    // Check if snapshot already taken today
    const { data: existing } = await sb
      .from("marketplace_price_history")
      .select("id")
      .eq("recorded_date", today)
      .limit(1);

    if (!existing || existing.length === 0) {
      // Get active product price stats
      const { data: products } = await sb
        .from("marketplace_products")
        .select("id")
        .eq("is_active", true)
        .gt("total_offers", 0);

      let snapshotCount = 0;
      for (const product of products || []) {
        const { data: stats } = await sb
          .from("marketplace_offers")
          .select("price")
          .eq("product_id", product.id)
          .eq("status", "active");

        if (stats && stats.length > 0) {
          const prices = stats.map((s) => s.price);
          const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
          const min = Math.min(...prices);
          const max = Math.max(...prices);

          await sb.from("marketplace_price_history").insert({
            product_id: product.id,
            recorded_date: today,
            avg_price: Math.round(avg * 100) / 100,
            min_price: min,
            max_price: max,
            offers_count: prices.length,
          });
          snapshotCount++;
        }
      }
      results.price_snapshots = snapshotCount;
    } else {
      results.price_snapshots = "already_done_today";
    }

    // ── Finalize log ──
    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - new Date(startedAt).getTime();

    if (logId) {
      await sb
        .from("cron_execution_logs")
        .update({
          status: "success",
          finished_at: finishedAt.toISOString(),
          duration_ms: durationMs,
          result: results,
        })
        .eq("id", logId);
    }

    console.log("[mk-cron-tasks] Done:", results);

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[mk-cron-tasks] Error:", message);

    if (logId) {
      await sb
        .from("cron_execution_logs")
        .update({
          status: "error",
          finished_at: new Date().toISOString(),
          error_message: message,
          duration_ms: Date.now() - new Date(startedAt).getTime(),
        })
        .eq("id", logId);
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
