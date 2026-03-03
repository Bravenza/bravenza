import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function createServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function getMember(sb: any, cpf: string) {
  const { data } = await sb
    .from("vault_members")
    .select("id")
    .eq("client_cpf", cpf)
    .single();
  return data;
}

async function getSellerProfile(sb: any, memberId: string) {
  const { data } = await sb
    .from("vault_seller_profiles")
    .select("*")
    .eq("member_id", memberId)
    .maybeSingle();
  return data;
}

const PUBLIC_ACTIONS = new Set([
  "catalog-products",
  "catalog-product",
  "catalog-offers",
  "catalog-search",
]);

/** Resolve CPF from auth header */
async function resolveCpf(req: Request, sb: any): Promise<string> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return "visitor";

  const { data: u } = await sb.auth.getUser(authHeader.replace("Bearer ", ""));
  if (!u?.user) return "visitor";

  const { data: p } = await sb
    .from("client_profiles")
    .select("cpf")
    .eq("user_id", u.user.id)
    .single();

  return p?.cpf || "visitor";
}

/** Seller select fragment for offer queries */
const SELLER_SELECT = `*,seller:vault_seller_profiles!inner(
  id,plan_id,verified_badge,average_rating,total_sales_count,current_fee_percent,
  member:vault_members!inner(client_name,tier)
)`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const sb = createServiceClient();
  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  const method = req.method;

  // Resolve authenticated user CPF
  const cpf = await resolveCpf(req, sb);

  // Require auth for non-public actions
  if (!PUBLIC_ACTIONS.has(action || "") && cpf === "visitor") {
    return jsonResponse({ error: "Auth required" }, 401);
  }

  try {
    // ─── GET: catalog-products ─────────────────────────────────
    if (method === "GET" && action === "catalog-products") {
      const limit = +(url.searchParams.get("limit") || "20");
      const cursor = url.searchParams.get("cursor");
      const search = url.searchParams.get("search");
      const brand = url.searchParams.get("brand");
      const category = url.searchParams.get("category");

      let q = sb
        .from("marketplace_products")
        .select("*", { count: "exact" })
        .eq("is_active", true);

      if (search) {
        q = q.or(
          `brand.ilike.%${search}%,model.ilike.%${search}%,colorway.ilike.%${search}%,sku.ilike.%${search}%`
        );
      }
      if (brand) q = q.ilike("brand", `%${brand}%`);
      if (category) q = q.eq("category", category);
      if (cursor) q = q.lt("created_at", cursor);

      q = q.order("created_at", { ascending: false }).limit(limit + 1);

      const { data, count, error } = await q;
      if (error) throw error;

      const items = data || [];
      const hasMore = items.length > limit;
      const page = hasMore ? items.slice(0, limit) : items;
      const nextCursor = hasMore ? page[page.length - 1].created_at : null;

      return jsonResponse({
        products: page,
        total: count || 0,
        next_cursor: nextCursor,
        has_more: hasMore,
      });
    }

    // ─── GET: catalog-product (single) ────────────────────────
    if (method === "GET" && action === "catalog-product") {
      const id = url.searchParams.get("id");
      const slug = url.searchParams.get("slug");

      let q = sb.from("marketplace_products").select("*");
      if (slug) q = q.eq("slug", slug);
      else if (id) q = q.eq("id", id);
      else throw new Error("id ou slug obrigatório");

      const { data, error } = await q.single();
      if (error) throw error;

      const { data: offers } = await sb
        .from("marketplace_offers")
        .select(SELLER_SELECT)
        .eq("product_id", data.id)
        .eq("status", "active")
        .order("price", { ascending: true });

      const offerList = offers || [];
      const sizes = [...new Set(offerList.map((o: any) => o.size))].sort();
      const maxInterestFree = offerList.reduce(
        (m: number, o: any) => Math.max(m, o.interest_free_installments || 0),
        0
      );

      return jsonResponse({
        product: data,
        offers: offerList,
        sizes,
        max_interest_free_installments: maxInterestFree,
      });
    }

    // ─── GET: catalog-offers ──────────────────────────────────
    if (method === "GET" && action === "catalog-offers") {
      const productId = url.searchParams.get("product_id");
      if (!productId) throw new Error("product_id obrigatório");

      const size = url.searchParams.get("size");
      const condition = url.searchParams.get("condition");

      let q = sb
        .from("marketplace_offers")
        .select(SELLER_SELECT)
        .eq("product_id", productId)
        .eq("status", "active");

      if (size) q = q.eq("size", size);
      if (condition) q = q.eq("condition", condition);
      q = q.order("price", { ascending: true });

      const { data, error } = await q;
      if (error) throw error;

      const sizes = [...new Set((data || []).map((o: any) => o.size))].sort();
      return jsonResponse({ offers: data || [], available_sizes: sizes });
    }

    // ─── GET: catalog-search ──────────────────────────────────
    if (method === "GET" && action === "catalog-search") {
      const searchQuery = url.searchParams.get("q") || "";
      if (!searchQuery || searchQuery.length < 2) {
        return jsonResponse({ products: [] });
      }

      const { data, error } = await sb
        .from("marketplace_products")
        .select(
          "id,brand,model,colorway,images,lowest_price,total_offers,slug"
        )
        .eq("is_active", true)
        .or(
          `brand.ilike.%${searchQuery}%,model.ilike.%${searchQuery}%,colorway.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`
        )
        .order("total_offers", { ascending: false })
        .limit(10);

      if (error) throw error;
      return jsonResponse({ products: data || [] });
    }

    // ─── POST: catalog-create-product ─────────────────────────
    if (method === "POST" && action === "catalog-create-product") {
      const body = await req.json();
      if (!body.brand || !body.model) {
        throw new Error("brand e model obrigatórios");
      }

      // Check if product already exists
      const { data: existing } = await sb
        .from("marketplace_products")
        .select("id,brand,model,slug")
        .ilike("brand", body.brand)
        .ilike("model", body.model)
        .maybeSingle();

      if (existing) {
        return jsonResponse({ product: existing, already_exists: true });
      }

      const description =
        body.description ||
        `${body.brand} ${body.model}${body.colorway ? ` - ${body.colorway}` : ""}`;
      const member = await getMember(sb, cpf);

      const { data: product, error } = await sb
        .from("marketplace_products")
        .insert({
          brand: body.brand,
          model: body.model,
          colorway: body.colorway || null,
          sku: body.sku || null,
          category: body.category || "sneakers",
          images: body.images || [],
          description,
          created_by_seller_id: member?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return jsonResponse({ product, already_exists: false });
    }

    // ─── POST: catalog-create-offer ───────────────────────────
    if (method === "POST" && action === "catalog-create-offer") {
      const body = await req.json();
      if (!body.product_id || !body.size || !body.price) {
        throw new Error("product_id, size e price obrigatórios");
      }

      const member = await getMember(sb, cpf);
      if (!member) throw new Error("Membro não encontrado");

      // Get or create seller profile
      let seller = await getSellerProfile(sb, member.id);
      if (!seller) {
        const { data: newSeller, error: sellerErr } = await sb
          .from("vault_seller_profiles")
          .insert({ member_id: member.id })
          .select()
          .single();
        if (sellerErr) throw sellerErr;
        seller = newSeller;
      }

      // Determine shipping mode
      const shippingMode =
        body.price >= 2000
          ? "bravenza"
          : body.shipping_mode === "hub"
          ? "bravenza"
          : body.shipping_mode === "seller_ships"
          ? "direct"
          : body.shipping_mode || "direct";

      // Create listing
      const { data: listing } = await sb
        .from("vault_marketplace_listings")
        .insert({
          seller_id: seller.id,
          vault_item_id: body.vault_item_id || null,
          title: `${body.brand || ""} ${body.model || ""} ${body.size || ""}`.trim(),
          description: body.description || null,
          brand: body.brand || null,
          model: body.model || null,
          size: body.size,
          condition: body.condition || "novo",
          photos: body.photos || [],
          price: body.price,
          original_purchase_price: body.original_purchase_price || null,
          shipping_mode: body.price >= 2000 ? "bravenza" : shippingMode,
          shipping_cost_estimate: 0,
          is_vault_certified: !!body.vault_item_id,
          status: "active",
          published_at: new Date().toISOString(),
          product_id: body.product_id,
        })
        .select()
        .single();

      // Create offer
      const { data: offer, error } = await sb
        .from("marketplace_offers")
        .insert({
          product_id: body.product_id,
          seller_id: seller.id,
          listing_id: listing?.id || null,
          size: body.size,
          condition: body.condition || "novo",
          price: body.price,
          original_purchase_price: body.original_purchase_price || null,
          description: body.description || null,
          defects: body.defects || null,
          photos: body.photos || [],
          proof_photos: body.proof_photos || [],
          has_receipt: body.has_receipt || false,
          shipping_mode: body.price >= 2000 ? "bravenza" : shippingMode,
          status: "active",
          published_at: new Date().toISOString(),
          interest_free_installments: body.interest_free_installments || 0,
        })
        .select()
        .single();

      if (error) throw error;

      // Update listing with installments if applicable
      if (listing?.id && body.interest_free_installments > 0) {
        await sb
          .from("vault_marketplace_listings")
          .update({ interest_free_installments: body.interest_free_installments })
          .eq("id", listing.id);
      }

      return jsonResponse({ offer, listing });
    }

    // ─── GET: watchlist-check ─────────────────────────────────
    if (method === "GET" && action === "watchlist-check") {
      const productId = url.searchParams.get("product_id");
      const size = url.searchParams.get("size") || "";
      if (!productId) throw new Error("product_id obrigatório");

      const { data } = await sb
        .from("marketplace_watchlist")
        .select("id,max_price,is_active")
        .eq("product_id", productId)
        .eq("size", size)
        .eq("user_cpf", cpf)
        .eq("is_active", true)
        .maybeSingle();

      return jsonResponse({
        active: !!data,
        max_price: data?.max_price || null,
      });
    }

    // ─── POST: watchlist-toggle ───────────────────────────────
    if (method === "POST" && action === "watchlist-toggle") {
      const body = await req.json();
      const { product_id, max_price } = body;
      if (!product_id) throw new Error("product_id obrigatório");

      const size = body.size || "";

      const { data: existing } = await sb
        .from("marketplace_watchlist")
        .select("id,is_active")
        .eq("product_id", product_id)
        .eq("size", size)
        .eq("user_cpf", cpf)
        .maybeSingle();

      if (existing) {
        if (existing.is_active) {
          await sb
            .from("marketplace_watchlist")
            .update({ is_active: false })
            .eq("id", existing.id);
          return jsonResponse({ active: false, max_price: null });
        } else {
          await sb
            .from("marketplace_watchlist")
            .update({ is_active: true, max_price: max_price || null })
            .eq("id", existing.id);
          return jsonResponse({ active: true, max_price: max_price || null });
        }
      }

      await sb.from("marketplace_watchlist").insert({
        product_id,
        size,
        user_cpf: cpf,
        max_price: max_price || null,
        is_active: true,
        notify_email: true,
        notify_push: true,
      });

      return jsonResponse({ active: true, max_price: max_price || null });
    }

    return jsonResponse({ error: "Ação não encontrada" }, 404);
  } catch (e: any) {
    console.error("mkv2-catalog error:", e);
    return jsonResponse({ error: e.message }, 500);
  }
});
