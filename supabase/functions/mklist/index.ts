import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ch = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-client-cpf",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

function j(d: unknown, s = 200) {
  return new Response(JSON.stringify(d), { status: s, headers: { ...ch, "Content-Type": "application/json" } });
}

async function gm(sb: any, c: string) {
  const { data } = await sb.from("vault_members").select("id").eq("client_cpf", c).single();
  return data;
}

async function gs(sb: any, m: string) {
  const { data } = await sb.from("vault_seller_profiles").select("*").eq("member_id", m).maybeSingle();
  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: ch });

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const cpf = req.headers.get("x-client-cpf");
  if (!cpf) return j({ error: "CPF obrigatório" }, 401);

  const url = new URL(req.url);
  const a = url.searchParams.get("action");
  const mt = req.method;

  console.log("mklist", a, mt);

  try {
    if (mt === "GET" && a === "listings") {
      const pg = parseInt(url.searchParams.get("page") || "1"), lm = 20, of = (pg - 1) * lm;
      let q = sb.from("vault_marketplace_listings").select(`*, seller:vault_seller_profiles!inner(id, member:vault_members!inner(client_name, tier), average_rating, total_sales_count, current_fee_percent)`, { count: "exact" }).eq("status", "active");
      const sr = url.searchParams.get("search"), br = url.searchParams.get("brand"), sz = url.searchParams.get("size"), cn = url.searchParams.get("condition"), pm = url.searchParams.get("price_min"), px = url.searchParams.get("price_max"), so = url.searchParams.get("sort") || "recent";
      if (sr) q = q.or(`title.ilike.%${sr}%,brand.ilike.%${sr}%,model.ilike.%${sr}%`);
      if (br) q = q.ilike("brand", `%${br}%`);
      if (sz) q = q.eq("size", sz);
      if (cn) q = q.eq("condition", cn);
      if (pm) q = q.gte("price", parseFloat(pm));
      if (px) q = q.lte("price", parseFloat(px));
      if (so === "price_asc") q = q.order("price", { ascending: true });
      else if (so === "price_desc") q = q.order("price", { ascending: false });
      else if (so === "popular") q = q.order("views_count", { ascending: false });
      else q = q.order("published_at", { ascending: false });
      q = q.range(of, of + lm - 1);
      const { data, count, error } = await q;
      if (error) throw error;
      const ids = (data || []).map((l: any) => l.id);
      let fs = new Set<string>();
      if (ids.length > 0) { const { data: fv } = await sb.from("vault_marketplace_favorites").select("listing_id").eq("user_cpf", cpf).in("listing_id", ids); fs = new Set((fv || []).map((f: any) => f.listing_id)); }
      return j({ listings: (data || []).map((l: any) => ({ ...l, is_favorited: fs.has(l.id) })), total: count });
    }
    if (mt === "GET" && a === "listing-detail") {
      const id = url.searchParams.get("id");
      if (!id) throw new Error("ID obrigatório");
      const { data, error } = await sb.from("vault_marketplace_listings").select(`*, seller:vault_seller_profiles!inner(id, member:vault_members!inner(client_name, tier), average_rating, total_sales_count, current_fee_percent, bio)`).eq("id", id).single();
      if (error) throw error;
      await sb.from("vault_marketplace_listings").update({ views_count: (data.views_count || 0) + 1 }).eq("id", id);
      const { data: fv } = await sb.from("vault_marketplace_favorites").select("id").eq("listing_id", id).eq("user_cpf", cpf).maybeSingle();
      return j({ ...data, is_favorited: !!fv });
    }
    if (mt === "GET" && a === "my-listings") {
      const mb = await gm(sb, cpf);
      if (!mb) return j({ listings: [], seller: null });
      const sl = await gs(sb, mb.id);
      if (!sl) return j({ listings: [], seller: null });
      const { data } = await sb.from("vault_marketplace_listings").select("*").eq("seller_id", sl.id).order("created_at", { ascending: false });
      return j({ listings: data || [], seller: sl });
    }
    if (mt === "POST" && a === "create-listing") {
      const b = await req.json();
      const mb = await gm(sb, cpf);
      if (!mb) throw new Error("Membro não encontrado");
      let sl = await gs(sb, mb.id);
      if (!sl) { const { data: ns, error: se } = await sb.from("vault_seller_profiles").insert({ member_id: mb.id }).select().single(); if (se) throw se; sl = ns; }
      const { data: li, error } = await sb.from("vault_marketplace_listings").insert({ seller_id: sl.id, vault_item_id: b.vault_item_id || null, title: b.title, description: b.description || null, brand: b.brand || null, model: b.model || null, colorway: b.colorway || null, size: b.size || null, condition: b.condition || "usado_bom", photos: b.photos || [], price: b.price, original_purchase_price: b.original_purchase_price || null, shipping_mode: b.shipping_mode || "direct", shipping_cost_estimate: b.shipping_cost_estimate || 0, is_vault_certified: !!b.vault_item_id, status: "active", published_at: new Date().toISOString() }).select().single();
      if (error) throw error;
      return j({ success: true, listing: li });
    }
    if (mt === "PUT" && a === "update-listing") {
      const b = await req.json();
      const mb = await gm(sb, cpf);
      if (!mb) throw new Error("Membro não encontrado");
      const sl = await gs(sb, mb.id);
      if (!sl) throw new Error("Vendedor não encontrado");
      const { error } = await sb.from("vault_marketplace_listings").update({ title: b.title, description: b.description, price: b.price, condition: b.condition, shipping_mode: b.shipping_mode, shipping_cost_estimate: b.shipping_cost_estimate, photos: b.photos, status: b.status }).eq("id", b.id).eq("seller_id", sl.id);
      if (error) throw error;
      return j({ success: true });
    }
    if (mt === "POST" && a === "toggle-favorite") {
      const { listing_id } = await req.json();
      const { data: ex } = await sb.from("vault_marketplace_favorites").select("id").eq("listing_id", listing_id).eq("user_cpf", cpf).maybeSingle();
      if (ex) { await sb.from("vault_marketplace_favorites").delete().eq("id", ex.id); return j({ favorited: false }); }
      await sb.from("vault_marketplace_favorites").insert({ listing_id, user_cpf: cpf });
      return j({ favorited: true });
    }
    if (mt === "DELETE" && a === "delete-listing") {
      const id = url.searchParams.get("id");
      if (!id) throw new Error("ID obrigatório");
      const mb = await gm(sb, cpf);
      if (!mb) throw new Error("Membro não encontrado");
      const sl = await gs(sb, mb.id);
      if (!sl) throw new Error("Vendedor não encontrado");
      const { error } = await sb.from("vault_marketplace_listings").delete().eq("id", id).eq("seller_id", sl.id);
      if (error) throw error;
      return j({ success: true });
    }
    if (mt === "GET" && a === "seller-profile") {
      const mb = await gm(sb, cpf);
      if (!mb) return j({ seller: null });
      return j({ seller: await gs(sb, mb.id) });
    }
    if (mt === "GET" && a === "seller-public-profile") {
      const sid = url.searchParams.get("seller_id");
      if (!sid) throw new Error("seller_id obrigatório");
      const { data: sl } = await sb.from("vault_seller_profiles").select(`id, bio, total_sales_count, total_sales_value, average_rating, ratings_count, current_fee_percent, member:vault_members!inner(client_name, tier, created_at)`).eq("id", sid).single();
      if (!sl) throw new Error("Vendedor não encontrado");
      const { data: ls } = await sb.from("vault_marketplace_listings").select("*").eq("seller_id", sid).eq("status", "active").order("published_at", { ascending: false });
      const { data: rv } = await sb.from("vault_marketplace_orders").select("buyer_name, buyer_rating, buyer_review, created_at").eq("seller_id", sid).not("buyer_rating", "is", null).order("created_at", { ascending: false }).limit(10);
      return j({ ...sl, listings: ls || [], recent_reviews: rv || [] });
    }
    return j({ error: "Ação não encontrada" }, 404);
  } catch (e: any) {
    console.error("mklist error:", e);
    return j({ error: e.message }, 500);
  }
});
