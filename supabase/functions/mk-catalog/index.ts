import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

const PUB = new Set(["catalog-products", "catalog-product", "catalog-offers", "catalog-search"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "";
  const mt = req.method;

  // Resolve CPF
  let cpf = "visitor";
  const ah = req.headers.get("authorization");
  if (ah && ah.startsWith("Bearer ")) {
    try {
      const { data: u } = await sb.auth.getUser(ah.replace("Bearer ", ""));
      if (u && u.user) {
        const { data: p } = await sb.from("client_profiles").select("cpf").eq("user_id", u.user.id).single();
        if (p && p.cpf) cpf = p.cpf;
      }
    } catch (_e) { /* ignore */ }
  }

  if (!PUB.has(action) && cpf === "visitor") return json({ error: "Auth required" }, 401);

  try {
    if (mt === "GET" && action === "catalog-products") {
      const limit = +(url.searchParams.get("limit") || "20");
      const cursor = url.searchParams.get("cursor");
      const search = url.searchParams.get("search");
      const brand = url.searchParams.get("brand");
      const category = url.searchParams.get("category");
      let q = sb.from("marketplace_products").select("*", { count: "exact" }).eq("is_active", true);
      if (search) q = q.or("brand.ilike.%" + search + "%,model.ilike.%" + search + "%,colorway.ilike.%" + search + "%,sku.ilike.%" + search + "%");
      if (brand) q = q.ilike("brand", "%" + brand + "%");
      if (category) q = q.eq("category", category);
      if (cursor) q = q.lt("created_at", cursor);
      q = q.order("created_at", { ascending: false }).limit(limit + 1);
      const { data, count, error } = await q;
      if (error) throw error;
      const items = data || [];
      const hasMore = items.length > limit;
      const page = hasMore ? items.slice(0, limit) : items;
      return json({ products: page, total: count || 0, next_cursor: hasMore ? page[page.length - 1].created_at : null, has_more: hasMore });
    }

    if (mt === "GET" && action === "catalog-product") {
      const id = url.searchParams.get("id");
      const slug = url.searchParams.get("slug");
      let q = sb.from("marketplace_products").select("*");
      if (slug) q = q.eq("slug", slug);
      else if (id) q = q.eq("id", id);
      else throw new Error("id ou slug obrigatório");
      const { data, error } = await q.single();
      if (error) throw error;
      const sel = "*, seller:vault_seller_profiles!inner(id, plan_id, verified_badge, average_rating, total_sales_count, current_fee_percent, member:vault_members!inner(client_name, tier))";
      const { data: od } = await sb.from("marketplace_offers").select(sel).eq("product_id", data.id).eq("status", "active").order("price", { ascending: true });
      const offers = od || [];
      const sizes = [...new Set(offers.map((o: any) => o.size))].sort();
      const maxIF = offers.reduce((m: number, o: any) => Math.max(m, o.interest_free_installments || 0), 0);
      return json({ product: data, offers: offers, sizes: sizes, max_interest_free_installments: maxIF });
    }

    if (mt === "GET" && action === "catalog-offers") {
      const pid = url.searchParams.get("product_id");
      if (!pid) throw new Error("product_id obrigatório");
      const sel = "*, seller:vault_seller_profiles!inner(id, plan_id, verified_badge, average_rating, total_sales_count, current_fee_percent, member:vault_members!inner(client_name, tier))";
      let q = sb.from("marketplace_offers").select(sel).eq("product_id", pid).eq("status", "active");
      const sz = url.searchParams.get("size");
      const cn = url.searchParams.get("condition");
      if (sz) q = q.eq("size", sz);
      if (cn) q = q.eq("condition", cn);
      q = q.order("price", { ascending: true });
      const { data, error } = await q;
      if (error) throw error;
      const sizes = [...new Set((data || []).map((o: any) => o.size))].sort();
      return json({ offers: data || [], available_sizes: sizes });
    }

    if (mt === "GET" && action === "catalog-search") {
      const sr = url.searchParams.get("q") || "";
      if (!sr || sr.length < 2) return json({ products: [] });
      const { data, error } = await sb.from("marketplace_products")
        .select("id,brand,model,colorway,images,lowest_price,total_offers,slug")
        .eq("is_active", true)
        .or("brand.ilike.%" + sr + "%,model.ilike.%" + sr + "%,colorway.ilike.%" + sr + "%,sku.ilike.%" + sr + "%")
        .order("total_offers", { ascending: false }).limit(10);
      if (error) throw error;
      return json({ products: data || [] });
    }

    if (mt === "POST" && action === "catalog-create-product") {
      const b = await req.json();
      if (!b.brand || !b.model) throw new Error("brand e model obrigatórios");
      const { data: ex } = await sb.from("marketplace_products").select("id,brand,model,slug").ilike("brand", b.brand).ilike("model", b.model).maybeSingle();
      if (ex) return json({ product: ex, already_exists: true });
      const desc = b.description || (b.brand + " " + b.model + (b.colorway ? " - " + b.colorway : ""));
      const { data: mb } = await sb.from("vault_members").select("id").eq("client_cpf", cpf).maybeSingle();
      const { data: prod, error } = await sb.from("marketplace_products").insert({
        brand: b.brand, model: b.model, colorway: b.colorway || null, sku: b.sku || null,
        category: b.category || "sneakers", images: b.images || [], description: desc,
        created_by_seller_id: mb?.id || null,
      }).select().single();
      if (error) throw error;
      return json({ product: prod, already_exists: false });
    }

    if (mt === "POST" && action === "catalog-create-offer") {
      const b = await req.json();
      if (!b.product_id || !b.size || !b.price) throw new Error("product_id, size e price obrigatórios");
      const { data: mb } = await sb.from("vault_members").select("id").eq("client_cpf", cpf).single();
      if (!mb) throw new Error("Membro não encontrado");
      const { data: sl0 } = await sb.from("vault_seller_profiles").select("*").eq("member_id", mb.id).maybeSingle();
      let sl = sl0;
      if (!sl) {
        const { data: ns, error: se } = await sb.from("vault_seller_profiles").insert({ member_id: mb.id }).select().single();
        if (se) throw se;
        sl = ns;
      }
      const sm = b.price >= 2000 ? "bravenza" : (b.shipping_mode === "hub" ? "bravenza" : b.shipping_mode === "seller_ships" ? "direct" : b.shipping_mode || "direct");
      const { data: li } = await sb.from("vault_marketplace_listings").insert({
        seller_id: sl.id, vault_item_id: b.vault_item_id || null,
        title: ((b.brand || "") + " " + (b.model || "") + " " + (b.size || "")).trim(),
        description: b.description || null, brand: b.brand || null, model: b.model || null,
        size: b.size, condition: b.condition || "novo", photos: b.photos || [],
        price: b.price, original_purchase_price: b.original_purchase_price || null,
        shipping_mode: b.price >= 2000 ? "bravenza" : sm, shipping_cost_estimate: 0,
        is_vault_certified: !!b.vault_item_id, status: "active",
        published_at: new Date().toISOString(), product_id: b.product_id,
      }).select().single();
      const { data: offer, error } = await sb.from("marketplace_offers").insert({
        product_id: b.product_id, seller_id: sl.id, listing_id: li?.id || null,
        size: b.size, condition: b.condition || "novo", price: b.price,
        original_purchase_price: b.original_purchase_price || null,
        description: b.description || null, defects: b.defects || null,
        photos: b.photos || [], proof_photos: b.proof_photos || [],
        has_receipt: b.has_receipt || false, shipping_mode: b.price >= 2000 ? "bravenza" : sm,
        status: "active", published_at: new Date().toISOString(),
        interest_free_installments: b.interest_free_installments || 0,
      }).select().single();
      if (error) throw error;
      if (li?.id && b.interest_free_installments > 0) {
        await sb.from("vault_marketplace_listings").update({ interest_free_installments: b.interest_free_installments }).eq("id", li.id);
      }
      return json({ offer: offer, listing: li });
    }

    if (mt === "GET" && action === "watchlist-check") {
      const pid = url.searchParams.get("product_id");
      const sz = url.searchParams.get("size") || "";
      if (!pid) throw new Error("product_id obrigatório");
      const { data } = await sb.from("marketplace_watchlist").select("id,max_price,is_active").eq("product_id", pid).eq("size", sz).eq("user_cpf", cpf).eq("is_active", true).maybeSingle();
      return json({ active: !!data, max_price: data?.max_price || null });
    }

    if (mt === "POST" && action === "watchlist-toggle") {
      const b = await req.json();
      if (!b.product_id) throw new Error("product_id obrigatório");
      const sz = b.size || "";
      const { data: ex } = await sb.from("marketplace_watchlist").select("id,is_active").eq("product_id", b.product_id).eq("size", sz).eq("user_cpf", cpf).maybeSingle();
      if (ex) {
        if (ex.is_active) {
          await sb.from("marketplace_watchlist").update({ is_active: false }).eq("id", ex.id);
          return json({ active: false, max_price: null });
        } else {
          await sb.from("marketplace_watchlist").update({ is_active: true, max_price: b.max_price || null }).eq("id", ex.id);
          return json({ active: true, max_price: b.max_price || null });
        }
      }
      await sb.from("marketplace_watchlist").insert({ product_id: b.product_id, size: sz, user_cpf: cpf, max_price: b.max_price || null, is_active: true, notify_email: true, notify_push: true });
      return json({ active: true, max_price: b.max_price || null });
    }

    return json({ error: "Ação não encontrada" }, 404);
  } catch (e: any) {
    console.error("mk-catalog error:", e);
    return json({ error: e.message }, 500);
  }
});
