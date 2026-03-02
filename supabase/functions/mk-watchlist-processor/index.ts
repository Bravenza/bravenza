import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const H = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const j = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...H, "Content-Type": "application/json" } });
const sc = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const COOLDOWN_HOURS = 24;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: H });

  const sb = sc();
  const now = new Date();

  try {
    // Fetch active alerts not in cooldown
    const { data: alerts, error } = await sb
      .from("alerts")
      .select("id, owner_id, product_id, target_price, target_size, channels, cooldown_until")
      .eq("is_active", true);
    if (error) throw error;

    const activeAlerts = (alerts || []).filter((a: any) => {
      if (!a.cooldown_until) return true;
      return new Date(a.cooldown_until) < now;
    });

    let triggered = 0;
    let skipped = 0;

    for (const alert of activeAlerts) {
      // Check if product has matching offers
      let query = sb
        .from("marketplace_offers")
        .select("id, price, size, product_id")
        .eq("product_id", alert.product_id)
        .eq("status", "active");

      if (alert.target_price) {
        query = query.lte("price", alert.target_price);
      }
      if (alert.target_size) {
        query = query.eq("size", alert.target_size);
      }

      const { data: matches } = await query.limit(1);

      if (matches && matches.length > 0) {
        const match = matches[0];

        // Resolve CPF from owner_id (auth uid)
        const { data: cp } = await sb
          .from("client_profiles")
          .select("cpf, full_name")
          .eq("user_id", alert.owner_id)
          .single();

        if (cp?.cpf) {
          // Get product info
          const { data: prod } = await sb
            .from("marketplace_products")
            .select("brand, model")
            .eq("id", alert.product_id)
            .single();

          const productName = prod ? `${prod.brand} ${prod.model}` : "Sneaker";
          const priceStr = `R$ ${match.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

          // Send in-app notification
          await sb.from("notifications").insert({
            title: "🔔 Alerta de preço!",
            message: `${productName} disponível por ${priceStr} (tam. ${match.size}).`,
            target: "client",
            target_client_cpf: cp.cpf,
            type: "info",
            reference_id: alert.product_id,
            reference_type: "marketplace_alert",
          });

          // Send push if channels include push
          if (alert.channels === "push" || alert.channels === "both") {
            const u = Deno.env.get("SUPABASE_URL");
            const k = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
            if (u && k) {
              fetch(`${u}/functions/v1/send-push`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${k}` },
                body: JSON.stringify({
                  cpf: cp.cpf,
                  title: "🔔 Alerta de preço!",
                  body: `${productName} por ${priceStr} (tam. ${match.size})`,
                  url: `/marketplace/produto/${alert.product_id}`,
                }),
              }).catch(() => {});
            }
          }

          // Send email if channels include email
          if (alert.channels === "email" || alert.channels === "both") {
            const u = Deno.env.get("SUPABASE_URL");
            const k = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
            if (u && k) {
              const { data: vm } = await sb
                .from("vault_members")
                .select("client_email")
                .eq("client_cpf", cp.cpf)
                .maybeSingle();
              if (vm?.client_email) {
                fetch(`${u}/functions/v1/send-marketplace-email`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "Authorization": `Bearer ${k}` },
                  body: JSON.stringify({
                    type: "mk_price_alert",
                    recipient_name: cp.full_name,
                    recipient_email: vm.client_email,
                    product_name: productName,
                    price: match.price,
                    size: match.size,
                    product_id: alert.product_id,
                  }),
                }).catch(() => {});
              }
            }
          }

          // Set cooldown
          const cooldownEnd = new Date(now.getTime() + COOLDOWN_HOURS * 3600000);
          await sb
            .from("alerts")
            .update({ cooldown_until: cooldownEnd.toISOString() })
            .eq("id", alert.id);

          triggered++;
        } else {
          skipped++;
        }
      }
    }

    // Log execution
    await sb.from("cron_execution_logs").insert({
      job_name: "watchlist-processor",
      status: "success",
      started_at: now.toISOString(),
      finished_at: new Date().toISOString(),
      duration_ms: Date.now() - now.getTime(),
      result: { total_alerts: activeAlerts.length, triggered, skipped },
    });

    return j({ ok: true, data: { processed: activeAlerts.length, triggered, skipped } });
  } catch (e: any) {
    console.error("mk-watchlist-processor error:", e);
    await sb.from("cron_execution_logs").insert({
      job_name: "watchlist-processor",
      status: "error",
      started_at: now.toISOString(),
      finished_at: new Date().toISOString(),
      error_message: e.message,
    }).catch(() => {});
    return j({ ok: false, error: e.message }, 500);
  }
});
