// mkv2-cron-tasks: Handles periodic marketplace maintenance tasks
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
      .insert({ job_name: "mkv2-cron-tasks", started_at: startedAt, status: "running" })
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

    if (expErr) console.error("[mkv2-cron-tasks] Expire error:", expErr);
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

    // ── 3. AutoCut — automatic price reduction ──
    const { data: autocutRules, error: acErr } = await sb
      .from("marketplace_autocut_rules")
      .select("*, offer:marketplace_offers(id, price, status)")
      .eq("is_active", true);

    if (acErr) console.error("[mkv2-cron-tasks] AutoCut fetch error:", acErr);

    let autocutApplied = 0;
    for (const rule of autocutRules || []) {
      const offer = rule.offer;
      if (!offer || offer.status !== "active") continue;

      // Check interval: skip if last cut was too recent
      if (rule.last_cut_at) {
        const lastCut = new Date(rule.last_cut_at).getTime();
        const intervalMs = (rule.interval_hours || 24) * 60 * 60 * 1000;
        if (now.getTime() - lastCut < intervalMs) continue;
      }

      // Calculate new price
      let newPrice: number;
      if (rule.reduction_type === "percent") {
        newPrice = offer.price * (1 - (rule.reduction_amount / 100));
      } else {
        newPrice = offer.price - rule.reduction_amount;
      }

      // Respect min price
      newPrice = Math.max(newPrice, rule.min_price);
      // Round to 2 decimals
      newPrice = Math.round(newPrice * 100) / 100;

      // If price hasn't changed (already at minimum), deactivate
      if (newPrice >= offer.price) {
        await sb.from("marketplace_autocut_rules").update({ is_active: false }).eq("id", rule.id);
        continue;
      }

      // Apply the cut
      await sb.from("marketplace_offers").update({ price: newPrice, updated_at: now.toISOString() }).eq("id", offer.id);
      await sb.from("marketplace_autocut_rules").update({
        last_cut_at: now.toISOString(),
        cuts_count: (rule.cuts_count || 0) + 1,
      }).eq("id", rule.id);

      autocutApplied++;
      console.log(`[mkv2-cron-tasks] AutoCut: offer ${offer.id} ${offer.price} → ${newPrice}`);
    }
    results.autocut_applied = autocutApplied;

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

    console.log("[mkv2-cron-tasks] Done:", results);

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[mkv2-cron-tasks] Error:", message);

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
