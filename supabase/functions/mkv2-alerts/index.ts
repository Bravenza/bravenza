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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: H });

  const sb = sc();
  const url = new URL(req.url);
  const a = url.searchParams.get("action");
  const mt = req.method;

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
