// Marketplace Hub - All marketplace actions
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

async function nt(sb: any, t: string, m: string, c: string, ri?: string, rt?: string) {
  try {
    await sb.from("notifications").insert({
      title: t, message: m, target: "client", target_client_cpf: c,
      type: "info", reference_id: ri || null, reference_type: rt || "marketplace",
    });
  } catch (_) {}
}

function gc() {
  const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let r = "MKT-";
  for (let i = 0; i < 6; i++) r += c.charAt(Math.floor(Math.random() * c.length));
  return r;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: ch });

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const cpf = req.headers.get("x-client-cpf");
  if (!cpf) return j({ error: "CPF obrigatório" }, 401);

  const url = new URL(req.url);
  const a = url.searchParams.get("action");
  const mt = req.method;

  console.log("mk-hub", a, mt);

  try {
    // ==================== LISTINGS (mklist) ====================

    if (mt === "GET" && a === "listings") {
      const pg = parseInt(url.searchParams.get("page") || "1"), lm = 20, of = (pg - 1) * lm;
      let q = sb.from("vault_marketplace_listings").select(
        `*, seller:vault_seller_profiles!inner(id, member:vault_members!inner(client_name, tier), average_rating, total_sales_count, current_fee_percent)`,
        { count: "exact" }
      ).eq("status", "active");
      const sr = url.searchParams.get("search"), br = url.searchParams.get("brand"),
        sz = url.searchParams.get("size"), cn = url.searchParams.get("condition"),
        pm = url.searchParams.get("price_min"), px = url.searchParams.get("price_max"),
        so = url.searchParams.get("sort") || "recent";
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
      if (ids.length > 0) {
        const { data: fv } = await sb.from("vault_marketplace_favorites").select("listing_id").eq("user_cpf", cpf).in("listing_id", ids);
        fs = new Set((fv || []).map((f: any) => f.listing_id));
      }
      return j({ listings: (data || []).map((l: any) => ({ ...l, is_favorited: fs.has(l.id) })), total: count });
    }

    if (mt === "GET" && a === "listing-detail") {
      const id = url.searchParams.get("id");
      if (!id) throw new Error("ID obrigatório");
      const { data, error } = await sb.from("vault_marketplace_listings").select(
        `*, seller:vault_seller_profiles!inner(id, member:vault_members!inner(client_name, tier), average_rating, total_sales_count, current_fee_percent, bio)`
      ).eq("id", id).single();
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
      if (!sl) {
        const { data: ns, error: se } = await sb.from("vault_seller_profiles").insert({ member_id: mb.id }).select().single();
        if (se) throw se;
        sl = ns;
      }
      const { data: li, error } = await sb.from("vault_marketplace_listings").insert({
        seller_id: sl.id, vault_item_id: b.vault_item_id || null, title: b.title,
        description: b.description || null, brand: b.brand || null, model: b.model || null,
        colorway: b.colorway || null, size: b.size || null, condition: b.condition || "usado_bom",
        photos: b.photos || [], price: b.price, original_purchase_price: b.original_purchase_price || null,
        shipping_mode: b.shipping_mode || "direct", shipping_cost_estimate: b.shipping_cost_estimate || 0,
        is_vault_certified: !!b.vault_item_id, status: "active", published_at: new Date().toISOString(),
      }).select().single();
      if (error) throw error;
      return j({ success: true, listing: li });
    }

    if (mt === "PUT" && a === "update-listing") {
      const b = await req.json();
      const mb = await gm(sb, cpf);
      if (!mb) throw new Error("Membro não encontrado");
      const sl = await gs(sb, mb.id);
      if (!sl) throw new Error("Vendedor não encontrado");
      const { error } = await sb.from("vault_marketplace_listings").update({
        title: b.title, description: b.description, price: b.price, condition: b.condition,
        shipping_mode: b.shipping_mode, shipping_cost_estimate: b.shipping_cost_estimate,
        photos: b.photos, status: b.status,
      }).eq("id", b.id).eq("seller_id", sl.id);
      if (error) throw error;
      return j({ success: true });
    }

    if (mt === "POST" && a === "toggle-favorite") {
      const { listing_id } = await req.json();
      const { data: ex } = await sb.from("vault_marketplace_favorites").select("id").eq("listing_id", listing_id).eq("user_cpf", cpf).maybeSingle();
      if (ex) {
        await sb.from("vault_marketplace_favorites").delete().eq("id", ex.id);
        return j({ favorited: false });
      }
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
      const { data: sl } = await sb.from("vault_seller_profiles").select(
        `id, bio, total_sales_count, total_sales_value, average_rating, ratings_count, current_fee_percent, member:vault_members!inner(client_name, tier, created_at)`
      ).eq("id", sid).single();
      if (!sl) throw new Error("Vendedor não encontrado");
      const { data: ls } = await sb.from("vault_marketplace_listings").select("*").eq("seller_id", sid).eq("status", "active").order("published_at", { ascending: false });
      const { data: rv } = await sb.from("vault_marketplace_orders").select("buyer_name, buyer_rating, buyer_review, created_at").eq("seller_id", sid).not("buyer_rating", "is", null).order("created_at", { ascending: false }).limit(10);
      return j({ ...sl, listings: ls || [], recent_reviews: rv || [] });
    }

    // ==================== ORDERS (mkord) ====================

    if (mt === "POST" && a === "create-order") {
      const b = await req.json();
      const { data: li } = await sb.from("vault_marketplace_listings").select(
        `*, seller:vault_seller_profiles!inner(id, current_fee_percent, member:vault_members!inner(client_cpf, client_name))`
      ).eq("id", b.listing_id).eq("status", "active").single();
      if (!li) throw new Error("Anúncio não encontrado");
      if (li.seller?.member?.client_cpf === cpf) throw new Error("Não pode comprar próprio anúncio");
      const fp = li.seller?.current_fee_percent || 14;
      const fa = Math.round(li.price * fp) / 100;
      const sp = li.price - fa;
      const oc = gc();
      const { data: od, error } = await sb.from("vault_marketplace_orders").insert({
        order_code: oc, listing_id: li.id, buyer_cpf: cpf, buyer_name: b.buyer_name,
        seller_id: li.seller.id, sale_price: li.price, fee_percent: fp, fee_amount: fa,
        seller_payout: sp, shipping_mode: li.shipping_mode,
        shipping_cost: li.shipping_cost_estimate || 0, status: "pending_payment",
      }).select().single();
      if (error) throw error;
      await sb.from("vault_marketplace_listings").update({ status: "reserved" }).eq("id", li.id);
      await nt(sb, "🛒 Nova venda!", `${b.buyer_name} comprou "${li.title}".`, li.seller.member.client_cpf, od.id, "marketplace_order");
      return j({ success: true, order: od });
    }

    if (mt === "PUT" && a === "confirm-payment") {
      const b = await req.json();
      const pe = new Date();
      pe.setDate(pe.getDate() + 10);
      const { error } = await sb.from("vault_marketplace_orders").update({
        status: "paid", payment_method: b.payment_method, paid_at: new Date().toISOString(),
        protection_ends_at: pe.toISOString(),
      }).eq("id", b.order_id).eq("buyer_cpf", cpf);
      if (error) throw error;
      return j({ success: true });
    }

    if (mt === "GET" && a === "my-orders") {
      const { data, error } = await sb.from("vault_marketplace_orders").select(
        `*, listing:vault_marketplace_listings!inner(title, brand, model, size, photos, condition, is_vault_certified)`
      ).eq("buyer_cpf", cpf).order("created_at", { ascending: false });
      if (error) throw error;
      return j({ orders: data || [] });
    }

    if (mt === "GET" && a === "my-sales") {
      const { data: mb } = await sb.from("vault_members").select("id").eq("client_cpf", cpf).single();
      if (!mb) return j({ orders: [] });
      const { data: sl } = await sb.from("vault_seller_profiles").select("id").eq("member_id", mb.id).maybeSingle();
      if (!sl) return j({ orders: [] });
      const { data, error } = await sb.from("vault_marketplace_orders").select(
        `*, listing:vault_marketplace_listings!inner(title, brand, model, size, photos, condition)`
      ).eq("seller_id", sl.id).order("created_at", { ascending: false });
      if (error) throw error;
      return j({ orders: data || [] });
    }

    if (mt === "PUT" && a === "update-order-status") {
      const b = await req.json();
      const u: Record<string, any> = { status: b.status };
      if (b.status === "shipped") {
        u.shipped_at = new Date().toISOString();
        u.tracking_code = b.tracking_code || null;
      } else if (b.status === "delivered") {
        u.delivered_at = new Date().toISOString();
      } else if (b.status === "cancelled") {
        u.cancelled_at = new Date().toISOString();
        if (b.listing_id) await sb.from("vault_marketplace_listings").update({ status: "active" }).eq("id", b.listing_id);
      } else if (b.status === "payout_released") {
        u.payout_released_at = new Date().toISOString();
        u.payout_method = b.payout_method || "pix";
      }
      if (b.admin_notes) u.admin_notes = b.admin_notes;
      const { error } = await sb.from("vault_marketplace_orders").update(u).eq("id", b.order_id);
      if (error) throw error;
      return j({ success: true });
    }

    if (mt === "POST" && a === "open-dispute") {
      const b = await req.json();
      const { error } = await sb.from("vault_marketplace_orders").update({
        dispute_status: "open", admin_notes: b.reason || "Disputa aberta",
      }).eq("id", b.order_id).eq("buyer_cpf", cpf);
      if (error) throw error;
      return j({ success: true });
    }

    if (mt === "PUT" && a === "resolve-dispute") {
      const b = await req.json();
      const { error } = await sb.from("vault_marketplace_orders").update({
        dispute_status: b.resolution, admin_notes: b.admin_notes || null,
        status: b.new_status || "dispute_resolved",
      }).eq("id", b.order_id);
      if (error) throw error;
      return j({ success: true });
    }

    if (mt === "POST" && a === "rate-seller") {
      const b = await req.json();
      const { error } = await sb.from("vault_marketplace_orders").update({
        buyer_rating: b.rating, buyer_review: b.review || null,
      }).eq("id", b.order_id).eq("buyer_cpf", cpf);
      if (error) throw error;
      const { data: od } = await sb.from("vault_marketplace_orders").select("seller_id").eq("id", b.order_id).single();
      if (od) {
        const { data: ar } = await sb.from("vault_marketplace_orders").select("buyer_rating").eq("seller_id", od.seller_id).not("buyer_rating", "is", null);
        if (ar && ar.length > 0) {
          const avg = ar.reduce((s: number, r: any) => s + r.buyer_rating, 0) / ar.length;
          await sb.from("vault_seller_profiles").update({
            average_rating: Math.round(avg * 10) / 10, ratings_count: ar.length,
          }).eq("id", od.seller_id);
        }
      }
      return j({ success: true });
    }

    if (mt === "GET" && a === "admin-orders") {
      const st = url.searchParams.get("status");
      let q = sb.from("vault_marketplace_orders").select(
        `*, listing:vault_marketplace_listings!inner(title, brand, model, size, photos, condition)`
      ).order("created_at", { ascending: false });
      if (st && st !== "all") q = q.eq("status", st);
      const { data, error } = await q;
      if (error) throw error;
      return j({ orders: data || [] });
    }

    // ==================== CHAT (mkchat) ====================

    if (mt === "GET" && a === "chat-messages") {
      const oi = url.searchParams.get("order_id"), li = url.searchParams.get("listing_id");
      let q = sb.from("vault_marketplace_messages").select("*").order("created_at", { ascending: true });
      if (oi) q = q.eq("order_id", oi);
      else if (li) q = q.eq("listing_id", li);
      else throw new Error("order_id ou listing_id obrigatório");
      const { data, error } = await q;
      if (error) throw error;
      if (data && data.length > 0) {
        const ur = data.filter((m: any) => m.sender_cpf !== cpf && !m.read_at).map((m: any) => m.id);
        if (ur.length > 0) await sb.from("vault_marketplace_messages").update({ read_at: new Date().toISOString() }).in("id", ur);
      }
      return j({ messages: data || [] });
    }

    if (mt === "POST" && a === "send-message") {
      const b = await req.json();
      const { data: mg, error } = await sb.from("vault_marketplace_messages").insert({
        order_id: b.order_id || null, listing_id: b.listing_id || null,
        sender_cpf: cpf, sender_name: b.sender_name, message: b.message,
        is_admin: b.is_admin || false,
      }).select().single();
      if (error) throw error;
      if (b.order_id) {
        const { data: od } = await sb.from("vault_marketplace_orders").select(
          `buyer_cpf, listing:vault_marketplace_listings!inner(title), seller:vault_seller_profiles!inner(member:vault_members!inner(client_cpf))`
        ).eq("id", b.order_id).single();
        if (od) {
          const to = cpf === od.buyer_cpf ? od.seller?.member?.client_cpf : od.buyer_cpf;
          if (to) await nt(sb, "💬 Nova mensagem", `Mensagem sobre "${od.listing?.title}".`, to, b.order_id, "marketplace_chat");
        }
      }
      return j({ success: true, message: mg });
    }

    // ==================== OFFERS (mkoff) ====================

    if (mt === "POST" && a === "make-offer") {
      const b = await req.json();
      const { data: li } = await sb.from("vault_marketplace_listings").select(
        `id, title, seller:vault_seller_profiles!inner(member:vault_members!inner(client_cpf))`
      ).eq("id", b.listing_id).eq("status", "active").single();
      if (!li) throw new Error("Anúncio não encontrado");
      if (li.seller?.member?.client_cpf === cpf) throw new Error("Não pode ofertar próprio anúncio");
      const { data: of2, error } = await sb.from("vault_marketplace_offers").insert({
        listing_id: b.listing_id, buyer_cpf: cpf, buyer_name: b.buyer_name || "Comprador",
        offer_price: b.offer_price, message: b.message || null,
      }).select().single();
      if (error) throw error;
      await nt(sb, "💰 Nova oferta!", `R$ ${b.offer_price.toFixed(2)} por "${li.title}".`, li.seller.member.client_cpf, li.id, "marketplace_offer");
      return j({ success: true, offer: of2 });
    }

    if (mt === "GET" && a === "listing-offers") {
      const lid = url.searchParams.get("listing_id");
      if (!lid) throw new Error("listing_id obrigatório");
      const { data, error } = await sb.from("vault_marketplace_offers").select("*").eq("listing_id", lid).order("created_at", { ascending: false });
      if (error) throw error;
      return j({ offers: data || [] });
    }

    if (mt === "GET" && a === "my-offers") {
      const { data, error } = await sb.from("vault_marketplace_offers").select(
        `*, listing:vault_marketplace_listings!inner(title, photos, price)`
      ).eq("buyer_cpf", cpf).order("created_at", { ascending: false });
      if (error) throw error;
      return j({ offers: data || [] });
    }

    if (mt === "PUT" && a === "respond-offer") {
      const b = await req.json();
      const { data: of2 } = await sb.from("vault_marketplace_offers").select(
        `id, listing_id, buyer_cpf, offer_price, listing:vault_marketplace_listings!inner(title)`
      ).eq("id", b.offer_id).single();
      if (!of2) throw new Error("Oferta não encontrada");
      const u: Record<string, any> = { responded_at: new Date().toISOString() };
      if (b.response === "accept") {
        u.status = "accepted";
        await nt(sb, "✅ Oferta aceita!", `Oferta por "${of2.listing?.title}" aceita!`, of2.buyer_cpf, of2.listing_id, "marketplace_offer");
      } else if (b.response === "reject") {
        u.status = "rejected";
        await nt(sb, "❌ Recusada", `Oferta por "${of2.listing?.title}" recusada.`, of2.buyer_cpf, of2.listing_id, "marketplace_offer");
      } else if (b.response === "counter") {
        u.status = "counter";
        u.counter_price = b.counter_price;
        u.counter_message = b.counter_message || null;
        await nt(sb, "🔄 Contra-proposta!", `R$ ${b.counter_price?.toFixed(2)} por "${of2.listing?.title}".`, of2.buyer_cpf, of2.listing_id, "marketplace_offer");
      }
      const { error } = await sb.from("vault_marketplace_offers").update(u).eq("id", b.offer_id);
      if (error) throw error;
      return j({ success: true });
    }

    return j({ error: "Ação não encontrada" }, 404);
  } catch (e: any) {
    console.error("vault-marketplace error:", e);
    return j({ error: e.message }, 500);
  }
});
