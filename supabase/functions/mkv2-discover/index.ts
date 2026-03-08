/**
 * mkv2-discover — Discovery, search, saved searches, admin moderation
 *
 * Auth model: Supabase JWT via shared auth-guard.ts
 *
 * Action tiers:
 *   PUBLIC_ACTIONS  → activity-feed, price-history, recommendations, freight-quote, product-coupons
 *   AUTH_ACTIONS    → log-activity, saved-searches, save-search, delete-saved-search,
 *                     drop-reminders, toggle-drop-reminder
 *   ADMIN_ACTIONS   → admin-flag-listing, admin-pending-offers, admin-moderate-offer
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  requireAdmin,
  authErrorResponse,
  AuthError,
} from "../_shared/auth-guard.ts";
import { resolveCpf as _rc } from "../_shared/mk-helpers.ts";

const H = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};
const j = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), {
    status: s,
    headers: { ...H, "Content-Type": "application/json" },
  });
const sc = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

const nt = async (
  sb: any,
  t: string,
  m: string,
  cpf: string,
  rid?: string,
  rt?: string
) => {
  try {
    await sb.from("notifications").insert({
      title: t,
      message: m,
      target: "client",
      target_client_cpf: cpf,
      type: "info",
      reference_id: rid || null,
      reference_type: rt || "marketplace",
    });
  } catch (_) {}
};

// ── Action tier constants ──
const PUBLIC_ACTIONS = new Set([
  "activity-feed",
  "price-history",
  "recommendations",
  "freight-quote",
  "product-coupons",
]);
const ADMIN_ACTIONS = new Set([
  "admin-flag-listing",
  "admin-pending-offers",
  "admin-moderate-offer",
]);
// AUTH_ACTIONS (implicit): everything else that isn't public or admin

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: H });

  const sb = sc();
  const url = new URL(req.url);
  const a = url.searchParams.get("action");
  const mt = req.method;

  // ── Admin actions: require admin role via auth-guard ──
  if (ADMIN_ACTIONS.has(a || "")) {
    console.log(`[mkv2-discover] Admin action "${a}" — checking auth...`);
    const authHeader = req.headers.get("authorization");
    console.log(`[mkv2-discover] Auth header present: ${!!authHeader}, starts with Bearer: ${authHeader?.startsWith("Bearer ")}`);
    let adminAuth;
    try {
      adminAuth = await requireAdmin(req, sb);
      console.log(`[mkv2-discover] Admin auth OK: userId=${adminAuth.userId}`);
    } catch (error) {
      console.log(`[mkv2-discover] Admin auth FAILED:`, error);
      return authErrorResponse(error);
    }

    try {
      if (mt === "PUT" && a === "admin-flag-listing") {
        const b = await req.json();
        if (!b.listing_id) throw new Error("listing_id obrigatório");
        const ns = b.flagged ? "flagged" : "active";
        await sb
          .from("vault_marketplace_listings")
          .update({
            status: ns,
            pro_recommendation: b.flagged ? b.reason || "Flagged" : null,
          })
          .eq("id", b.listing_id);
        return j({ success: true });
      }

      if (mt === "GET" && a === "admin-pending-offers") {
        const sf = url.searchParams.get("status") || "pending_review";
        let q = sb.from("marketplace_offers").select(
          `id,price,size,condition,description,photos,status,created_at,views_count,has_receipt,defects,product:marketplace_products!inner(brand,model,images),seller:vault_seller_profiles!inner(id,plan_id,kyc_status,member:vault_members!inner(client_name,client_cpf))`
        );
        if (sf !== "all") q = q.eq("status", sf);
        const { data, error } = await q
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) throw error;
        return j({ offers: data || [] });
      }

      if (mt === "PUT" && a === "admin-moderate-offer") {
        const b = await req.json();
        const { offer_id, action: ma, reason } = b;
        if (!offer_id || !ma)
          throw new Error("offer_id e action obrigatórios");
        const ud2: any = { updated_at: new Date().toISOString() };
        if (ma === "approve") {
          ud2.status = "active";
          ud2.published_at = new Date().toISOString();
          ud2.activated_at = new Date().toISOString();
        } else if (ma === "reject") ud2.status = "rejected";
        else if (ma === "flag") ud2.status = "flagged";
        else throw new Error("Ação inválida");
        await sb
          .from("marketplace_offers")
          .update(ud2)
          .eq("id", offer_id);
        const { data: of2 } = await sb
          .from("marketplace_offers")
          .select(
            `product:marketplace_products(brand,model),seller:vault_seller_profiles!inner(member:vault_members!inner(client_cpf))`
          )
          .eq("id", offer_id)
          .single();
        if (of2?.seller?.member?.client_cpf) {
          const pn =
            `${of2.product?.brand || ""} ${of2.product?.model || ""}`.trim();
          const msgs: Record<string, string> = {
            approve: `✅ Anúncio "${pn}" aprovado!`,
            reject: `❌ Anúncio "${pn}" rejeitado.${reason ? ` Motivo: ${reason}` : ""}`,
            flag: `⚠️ Anúncio "${pn}" sinalizado.`,
          };
          await nt(
            sb,
            "Moderação",
            msgs[ma] || "",
            of2.seller.member.client_cpf,
            offer_id,
            "marketplace_moderation"
          );
        }
        return j({ success: true });
      }

      return j({ error: "Ação admin não encontrada" }, 404);
    } catch (e: any) {
      console.error("mkv2-discover admin error:", e);
      return j({ error: e.message }, 500);
    }
  }

  // ── Public + Auth actions: resolve CPF ──
  const { cpf: _c, errorResponse: _e } = await _rc(req, sb, PUBLIC_ACTIONS, a);
  if (_e) return _e;
  const cpf = _c!;

  try {
    if (mt === "POST" && a === "freight-quote") {
      const b = await req.json();
      if (!b.listing_id || !b.buyer_cep)
        throw new Error("listing_id e buyer_cep obrigatórios");
      let li: any = null;
      const { data: d1 } = await sb
        .from("vault_marketplace_listings")
        .select(`*,seller:vault_seller_profiles!inner(seller_cep)`)
        .eq("id", b.listing_id)
        .maybeSingle();
      if (d1) li = d1;
      else {
        const { data: d2 } = await sb
          .from("marketplace_offers")
          .select(`*,seller:vault_seller_profiles!inner(seller_cep)`)
          .eq("id", b.listing_id)
          .maybeSingle();
        if (d2)
          li = {
            ...d2,
            shipping_mode:
              d2.shipping_mode === "seller_ships"
                ? "direct"
                : d2.shipping_mode === "hub"
                  ? "bravenza"
                  : d2.shipping_mode || "direct",
          };
      }
      if (!li) throw new Error("Anúncio não encontrado");
      const sCep = li.seller?.seller_cep;
      const isBrv = li.shipping_mode === "bravenza";
      const { data: ws } = await sb
        .from("system_settings")
        .select("value")
        .eq("key", "bravenza_warehouse_cep")
        .maybeSingle();
      const wCep = ws?.value
        ? String(ws.value).replace(/"/g, "")
        : "90040191";
      const pkg = { weight: 1.2, height: 15, width: 35, length: 30 };
      const iv = li.price || 0;
      const sfT = Deno.env.get("SUPERFRETE_API_TOKEN");
      if (!sfT) throw new Error("Token SuperFrete não configurado");
      const sfH = {
        Authorization: `Bearer ${sfT}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "Bravenza/1.0",
      };
      const qp = (f: string, t: string) => ({
        from: { postal_code: f.replace(/\D/g, "") },
        to: { postal_code: t.replace(/\D/g, "") },
        services: "1,2,3",
        package: pkg,
        options: { insurance_value: iv, receipt: false, own_hand: false },
      });
      const dq = async (f: string, t: string) => {
        const r = await fetch(
          "https://api.superfrete.com/api/v0/calculator",
          {
            method: "POST",
            headers: sfH,
            body: JSON.stringify(qp(f, t)),
          }
        );
        const d = await r.json();
        if (!r.ok) return [];
        return Array.isArray(d) ? d : [];
      };
      let quotes: any[] = [];
      let legs: any = null;
      if (isBrv) {
        const fc = sCep || wCep;
        const l1 = await dq(fc, wCep);
        const l2 = await dq(wCep, b.buyer_cep);
        const m2: Record<number, any> = {};
        for (const q of l2) if (q.id) m2[q.id] = q;
        for (const q1 of l1) {
          const q2 = m2[q1.id];
          if (q2 && !q1.error && !q2.error)
            quotes.push({
              ...q1,
              price: (+(q1.price || 0) + +(q2.price || 0)).toFixed(2),
              delivery_time:
                (q1.delivery_time || 0) + 5 + (q2.delivery_time || 0),
              legs: {
                seller_to_bravenza: {
                  price: q1.price,
                  delivery_time: q1.delivery_time,
                },
                bravenza_processing: { delivery_time: 5 },
                bravenza_to_buyer: {
                  price: q2.price,
                  delivery_time: q2.delivery_time,
                },
              },
            });
        }
        legs = {
          mode: "bravenza",
          seller_cep: fc,
          warehouse_cep: wCep,
          buyer_cep: b.buyer_cep,
        };
      } else {
        const fc = sCep || wCep;
        quotes = (await dq(fc, b.buyer_cep)).filter((q: any) => !q.error);
        legs = { mode: "direct", seller_cep: fc, buyer_cep: b.buyer_cep };
      }
      return j({
        quotes,
        legs,
        listing_price: li.price,
        shipping_mode: li.shipping_mode,
      });
    }

    if (mt === "GET" && a === "activity-feed") {
      const lim = +(url.searchParams.get("limit") || "20");
      const beforeId = url.searchParams.get("before_id");
      let q = sb
        .from("marketplace_activity_feed")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(lim);
      if (beforeId) {
        const { data: ref } = await sb
          .from("marketplace_activity_feed")
          .select("created_at")
          .eq("id", beforeId)
          .single();
        if (ref) q = q.lt("created_at", ref.created_at);
      }
      const { data, error } = await q;
      if (error) throw error;
      const hasMore = (data || []).length === lim;
      return j({ events: data || [], has_more: hasMore });
    }

    if (mt === "POST" && a === "log-activity") {
      const b = await req.json();
      await sb.from("marketplace_activity_feed").insert({
        event_type: b.event_type,
        title: b.title,
        description: b.description || null,
        listing_id: b.listing_id || null,
        product_id: b.product_id || null,
        seller_id: b.seller_id || null,
        metadata: b.metadata || {},
      });
      return j({ success: true });
    }

    if (mt === "GET" && a === "price-history") {
      const pid = url.searchParams.get("product_id");
      if (!pid) throw new Error("product_id obrigatório");
      const days = +(url.searchParams.get("days") || "90");
      const since = new Date();
      since.setDate(since.getDate() - days);
      const { data, error } = await sb
        .from("marketplace_price_history")
        .select("*")
        .eq("product_id", pid)
        .gte("recorded_date", since.toISOString().split("T")[0])
        .order("recorded_date", { ascending: true });
      if (error) throw error;
      const { data: lo } = await sb
        .from("marketplace_offers")
        .select("price")
        .eq("product_id", pid)
        .eq("status", "active");
      const prices = (lo || []).map((o: any) => o.price);
      const live =
        prices.length > 0
          ? {
              min: Math.min(...prices),
              max: Math.max(...prices),
              avg: Math.round(
                prices.reduce((a: number, b: number) => a + b, 0) /
                  prices.length
              ),
              count: prices.length,
            }
          : null;
      return j({ history: data || [], live });
    }

    if (mt === "GET" && a === "recommendations") {
      const pid = url.searchParams.get("product_id");
      const lim = +(url.searchParams.get("limit") || "8");
      if (!pid) throw new Error("product_id obrigatório");
      const { data: src } = await sb
        .from("marketplace_products")
        .select("brand,category")
        .eq("id", pid)
        .single();
      if (!src) throw new Error("Produto não encontrado");
      const { data: sim } = await sb
        .from("marketplace_products")
        .select(
          "id,brand,model,colorway,images,lowest_price,total_offers,slug"
        )
        .or(`brand.eq.${src.brand},category.eq.${src.category}`)
        .neq("id", pid)
        .eq("is_active", true)
        .gt("total_offers", 0)
        .order("total_offers", { ascending: false })
        .limit(lim);
      return j({ similar: sim || [], also_bought: [] });
    }

    if (mt === "GET" && a === "saved-searches") {
      const { data } = await sb
        .from("marketplace_saved_searches")
        .select("*")
        .eq("user_cpf", cpf)
        .order("created_at", { ascending: false });
      return j({ searches: data || [] });
    }

    if (mt === "POST" && a === "save-search") {
      const b = await req.json();
      const { data, error } = await sb
        .from("marketplace_saved_searches")
        .insert({
          user_cpf: cpf,
          name: b.name || "Busca salva",
          filters: b.filters || {},
          notify_new_listings: b.notify !== false,
        })
        .select()
        .single();
      if (error) throw error;
      return j({ search: data });
    }

    if (mt === "DELETE" && a === "delete-saved-search") {
      const id = url.searchParams.get("id");
      if (!id) throw new Error("ID obrigatório");
      await sb
        .from("marketplace_saved_searches")
        .delete()
        .eq("id", id)
        .eq("user_cpf", cpf);
      return j({ success: true });
    }

    if (mt === "GET" && a === "drop-reminders") {
      const { data } = await sb
        .from("marketplace_drop_reminders")
        .select("release_key,release_brand,release_model,release_date")
        .eq("user_cpf", cpf);
      return j({ reminders: data || [] });
    }

    if (mt === "POST" && a === "toggle-drop-reminder") {
      const b = await req.json();
      if (!b.release_key) throw new Error("release_key obrigatório");
      const { data: ex } = await sb
        .from("marketplace_drop_reminders")
        .select("id")
        .eq("user_cpf", cpf)
        .eq("release_key", b.release_key)
        .maybeSingle();
      if (ex) {
        await sb
          .from("marketplace_drop_reminders")
          .delete()
          .eq("id", ex.id);
        return j({ active: false });
      }
      await sb.from("marketplace_drop_reminders").insert({
        user_cpf: cpf,
        release_key: b.release_key,
        release_brand: b.release_brand || "",
        release_model: b.release_model || "",
        release_date:
          b.release_date || new Date().toISOString().split("T")[0],
      });
      return j({ active: true });
    }

    if (mt === "GET" && a === "product-coupons") {
      const pid = url.searchParams.get("product_id");
      if (!pid) throw new Error("product_id obrigatório");
      const { data: ao } = await sb
        .from("marketplace_offers")
        .select("seller_id")
        .eq("product_id", pid)
        .eq("status", "active");
      const sids = [...new Set((ao || []).map((o: any) => o.seller_id))];
      if (!sids.length) return j({ coupons: [] });
      const { data: cs } = await sb
        .from("marketplace_coupons")
        .select(
          "id,code,discount_type,discount_value,min_purchase,valid_until,seller_id"
        )
        .in("seller_id", sids)
        .eq("is_active", true)
        .or(
          `valid_until.is.null,valid_until.gt.${new Date().toISOString()}`
        );
      return j({
        coupons: (cs || []).map((c: any) => ({
          code: c.code,
          discount_type: c.discount_type,
          discount_value: c.discount_value,
          min_purchase: c.min_purchase,
          valid_until: c.valid_until,
        })),
      });
    }

    return j({ error: "Ação não encontrada" }, 404);
  } catch (e: any) {
    console.error("mkv2-discover error:", e);
    return j({ error: e.message }, 500);
  }
});
