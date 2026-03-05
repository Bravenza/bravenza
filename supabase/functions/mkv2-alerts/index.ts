import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const H = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};
const j = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...H, "Content-Type": "application/json" } });
const sc = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const getUid = async (sb: any, req: Request): Promise<string | null> => {
  const ah = req.headers.get("authorization");
  if (!ah?.startsWith("Bearer ")) return null;
  const { data: u } = await sb.auth.getUser(ah.replace("Bearer ", ""));
  return u?.user?.id || null;
};

const FREE_ALERT_LIMIT = 5;
const COOLDOWN_HOURS = 24;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: H });

  const sb = sc();
  const url = new URL(req.url);
  const a = url.searchParams.get("action") || (() => {
    try { const ct = req.headers.get("content-type"); if (ct?.includes("json")) { /* handled below */ } } catch {}
    return null;
  })();
  const mt = req.method;

  // ─── PROCESS (cron / internal) ────────────────────────────
  if (mt === "POST" && (a === "alerts:process" || url.searchParams.get("action") === "alerts:process")) {
    return handleProcess(sb);
  }

  // For body-based action detection (cron sends JSON body)
  if (mt === "POST" && !a) {
    try {
      const body = await req.clone().json();
      if (body?.action === "alerts:process") {
        return handleProcess(sb);
      }
    } catch {}
  }

  const uid = await getUid(sb, req);
  if (!uid) return j({ ok: false, error: "Auth required" }, 401);

  try {
    // ─── LIST ───────────────────────────────────────────────
    if (mt === "GET" && a === "alerts:list") {
      const { data, error } = await sb
        .from("alerts")
        .select("id, product_id, target_price, target_size, channels, is_active, cooldown_until, created_at")
        .eq("owner_id", uid)
        .order("created_at", { ascending: false });
      if (error) throw error;

      return j({ ok: true, data: data || [] });
    }

    // ─── UPSERT (create or update) ──────────────────────────
    if (mt === "POST" && a === "alerts:upsert") {
      const b = await req.json();
      if (!b.product_id) return j({ ok: false, error: "product_id obrigatório" }, 400);

      // Check plan limit
      if (!b.id) {
        // Creating new — check limit
        const { count } = await sb
          .from("alerts")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", uid)
          .eq("is_active", true);

        // Check if user has premium plan via seller profile
        let isPremium = false;
        const { data: cp } = await sb
          .from("client_profiles")
          .select("cpf")
          .eq("user_id", uid)
          .single();
        if (cp?.cpf) {
          const { data: vm } = await sb
            .from("vault_members")
            .select("id")
            .eq("client_cpf", cp.cpf)
            .single();
          if (vm) {
            const { data: sp } = await sb
              .from("vault_seller_profiles")
              .select("id")
              .eq("member_id", vm.id)
              .maybeSingle();
            if (sp) {
              const { data: sub } = await sb
                .from("marketplace_subscriptions")
                .select("plan_id")
                .eq("seller_id", sp.id)
                .eq("status", "active")
                .maybeSingle();
              if (sub && sub.plan_id !== "free") isPremium = true;
            }
          }
        }

        if (!isPremium && (count || 0) >= FREE_ALERT_LIMIT) {
          return j({ ok: false, error: `Limite de ${FREE_ALERT_LIMIT} alertas atingido. Faça upgrade para alertas ilimitados.` }, 403);
        }
      }

      if (b.id) {
        // Update existing
        const { error } = await sb
          .from("alerts")
          .update({
            target_price: b.target_price ?? null,
            target_size: b.target_size ?? null,
            channels: b.channels || "push",
            is_active: b.is_active !== false,
          })
          .eq("id", b.id)
          .eq("owner_id", uid);
        if (error) throw error;
        return j({ ok: true });
      } else {
        // Create new
        const { data, error } = await sb
          .from("alerts")
          .insert({
            owner_id: uid,
            product_id: b.product_id,
            target_price: b.target_price ?? null,
            target_size: b.target_size ?? null,
            channels: b.channels || "push",
            is_active: true,
          })
          .select()
          .single();
        if (error) throw error;
        return j({ ok: true, data });
      }
    }

    // ─── DELETE ──────────────────────────────────────────────
    if (mt === "DELETE" && a === "alerts:delete") {
      const alertId = url.searchParams.get("alert_id");
      if (!alertId) return j({ ok: false, error: "alert_id obrigatório" }, 400);

      const { error } = await sb
        .from("alerts")
        .delete()
        .eq("id", alertId)
        .eq("owner_id", uid);
      if (error) throw error;

      return j({ ok: true });
    }

    return j({ ok: false, error: "Ação não encontrada" }, 404);
  } catch (e: any) {
    console.error("mkv2-alerts error:", e);
    return j({ ok: false, error: e.message }, 500);
  }
});

// ─── PROCESS: background watchlist scanner ──────────────────
async function handleProcess(sb: any): Promise<Response> {
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
    console.error("mkv2-alerts process error:", e);
    await sb.from("cron_execution_logs").insert({
      job_name: "watchlist-processor",
      status: "error",
      started_at: now.toISOString(),
      finished_at: new Date().toISOString(),
      error_message: e.message,
    }).catch(() => {});
    return j({ ok: false, error: e.message }, 500);
  }
}
