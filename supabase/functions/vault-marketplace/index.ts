import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-client-cpf",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function notify(
  sb: any,
  title: string,
  message: string,
  cpf: string,
  refId?: string,
  refType?: string
) {
  try {
    await sb.from("notifications").insert({
      title,
      message,
      target: "client",
      target_client_cpf: cpf,
      type: "info",
      reference_id: refId || null,
      reference_type: refType || "marketplace",
    });
  } catch (e) {
    console.error("Notification error:", e);
  }
}

async function getMember(sb: any, cpf: string) {
  const { data } = await sb.from("vault_members").select("id").eq("client_cpf", cpf).single();
  return data;
}

async function getSeller(sb: any, memberId: string) {
  const { data } = await sb.from("vault_seller_profiles").select("*").eq("member_id", memberId).maybeSingle();
  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const cpf = req.headers.get("x-client-cpf");
  if (!cpf) return json({ error: "CPF não informado" }, 401);

  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  const method = req.method;

  try {
    if (method === "GET" && action === "listings") {
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = 20;
      const offset = (page - 1) * limit;
      const brand = url.searchParams.get("brand");
      const size = url.searchParams.get("size");
      const condition = url.searchParams.get("condition");
      const priceMin = url.searchParams.get("price_min");
      const priceMax = url.searchParams.get("price_max");
      const search = url.searchParams.get("search");
      const sort = url.searchParams.get("sort") || "recent";

      let query = sb
        .from("vault_marketplace_listings")
        .select(`*, seller:vault_seller_profiles!inner(id, member:vault_members!inner(client_name, tier), average_rating, total_sales_count, current_fee_percent)`, { count: "exact" })
        .eq("status", "active");

      if (search) query = query.or(`title.ilike.%${search}%,brand.ilike.%${search}%,model.ilike.%${search}%,colorway.ilike.%${search}%`);
      if (brand) query = query.ilike("brand", `%${brand}%`);
      if (size) query = query.eq("size", size);
      if (condition) query = query.eq("condition", condition);
      if (priceMin) query = query.gte("price", parseFloat(priceMin));
      if (priceMax) query = query.lte("price", parseFloat(priceMax));

      if (sort === "price_asc") query = query.order("price", { ascending: true });
      else if (sort === "price_desc") query = query.order("price", { ascending: false });
      else if (sort === "popular") query = query.order("views_count", { ascending: false });
      else query = query.order("published_at", { ascending: false });

      query = query.range(offset, offset + limit - 1);

      const { data, count, error } = await query;
      if (error) throw error;

      const ids = (data || []).map((l: any) => l.id);
      let favSet = new Set<string>();
      if (ids.length > 0) {
        const { data: favs } = await sb.from("vault_marketplace_favorites").select("listing_id").eq("user_cpf", cpf).in("listing_id", ids);
        favSet = new Set((favs || []).map((f: any) => f.listing_id));
      }

      return json({ listings: (data || []).map((l: any) => ({ ...l, is_favorited: favSet.has(l.id) })), total: count });
    }

    if (method === "GET" && action === "listing-detail") {
      const id = url.searchParams.get("id");
      if (!id) throw new Error("ID obrigatório");
      const { data, error } = await sb.from("vault_marketplace_listings").select(`*, seller:vault_seller_profiles!inner(id, member:vault_members!inner(client_name, tier), average_rating, total_sales_count, current_fee_percent, bio)`).eq("id", id).single();
      if (error) throw error;
      await sb.from("vault_marketplace_listings").update({ views_count: (data.views_count || 0) + 1 }).eq("id", id);
      const { data: fav } = await sb.from("vault_marketplace_favorites").select("id").eq("listing_id", id).eq("user_cpf", cpf).maybeSingle();
      return json({ ...data, is_favorited: !!fav });
    }

    if (method === "GET" && action === "my-listings") {
      const member = await getMember(sb, cpf);
      if (!member) return json({ listings: [], seller: null });
      const seller = await getSeller(sb, member.id);
      if (!seller) return json({ listings: [], seller: null });
      const { data: listings } = await sb.from("vault_marketplace_listings").select("*").eq("seller_id", seller.id).order("created_at", { ascending: false });
      return json({ listings: listings || [], seller });
    }

    if (method === "POST" && action === "create-listing") {
      const body = await req.json();
      const member = await getMember(sb, cpf);
      if (!member) throw new Error("Você precisa ser membro do Vault Club");
      let seller = await getSeller(sb, member.id);
      if (!seller) {
        const { data: ns, error: se } = await sb.from("vault_seller_profiles").insert({ member_id: member.id }).select().single();
        if (se) throw se;
        seller = ns;
      }
      const { data: listing, error } = await sb.from("vault_marketplace_listings").insert({
        seller_id: seller.id, vault_item_id: body.vault_item_id || null, title: body.title, description: body.description || null,
        brand: body.brand || null, model: body.model || null, colorway: body.colorway || null, size: body.size || null,
        condition: body.condition || "usado_bom", photos: body.photos || [], price: body.price,
        original_purchase_price: body.original_purchase_price || null, shipping_mode: body.shipping_mode || "direct",
        shipping_cost_estimate: body.shipping_cost_estimate || 0, is_vault_certified: !!body.vault_item_id,
        status: "active", published_at: new Date().toISOString(),
      }).select().single();
      if (error) throw error;
      return json({ success: true, listing });
    }

    if (method === "PUT" && action === "update-listing") {
      const body = await req.json();
      const member = await getMember(sb, cpf);
      if (!member) throw new Error("Membro não encontrado");
      const seller = await getSeller(sb, member.id);
      if (!seller) throw new Error("Perfil de vendedor não encontrado");
      const { error } = await sb.from("vault_marketplace_listings").update({
        title: body.title, description: body.description, price: body.price, condition: body.condition,
        shipping_mode: body.shipping_mode, shipping_cost_estimate: body.shipping_cost_estimate, photos: body.photos, status: body.status,
      }).eq("id", body.id).eq("seller_id", seller.id);
      if (error) throw error;
      return json({ success: true });
    }

    if (method === "POST" && action === "toggle-favorite") {
      const { listing_id } = await req.json();
      const { data: existing } = await sb.from("vault_marketplace_favorites").select("id").eq("listing_id", listing_id).eq("user_cpf", cpf).maybeSingle();
      if (existing) {
        await sb.from("vault_marketplace_favorites").delete().eq("id", existing.id);
        return json({ favorited: false });
      }
      await sb.from("vault_marketplace_favorites").insert({ listing_id, user_cpf: cpf });
      return json({ favorited: true });
    }

    if (method === "DELETE" && action === "delete-listing") {
      const id = url.searchParams.get("id");
      if (!id) throw new Error("ID obrigatório");
      const member = await getMember(sb, cpf);
      if (!member) throw new Error("Membro não encontrado");
      const seller = await getSeller(sb, member.id);
      if (!seller) throw new Error("Vendedor não encontrado");
      const { error } = await sb.from("vault_marketplace_listings").delete().eq("id", id).eq("seller_id", seller.id);
      if (error) throw error;
      return json({ success: true });
    }

    if (method === "GET" && action === "seller-profile") {
      const member = await getMember(sb, cpf);
      if (!member) return json({ seller: null });
      const seller = await getSeller(sb, member.id);
      return json({ seller });
    }

    if (method === "POST" && action === "create-order") {
      const body = await req.json();
      const { data: listing, error: le } = await sb.from("vault_marketplace_listings").select(`*, seller:vault_seller_profiles!inner(id, current_fee_percent, member:vault_members!inner(client_cpf, client_name))`).eq("id", body.listing_id).eq("status", "active").single();
      if (le || !listing) throw new Error("Anúncio não encontrado ou já vendido");
      if (listing.seller.member.client_cpf === cpf) throw new Error("Você não pode comprar seu próprio anúncio");
      const salePrice = listing.price + (listing.shipping_cost_estimate || 0);
      const fp = listing.seller.current_fee_percent;
      const feeAmount = Math.round(listing.price * (fp / 100) * 100) / 100;
      const sellerPayout = listing.price - feeAmount;
      const { data: order, error: oe } = await sb.from("vault_marketplace_orders").insert({
        listing_id: body.listing_id, buyer_cpf: cpf, buyer_name: body.buyer_name,
        buyer_email: body.buyer_email || null, buyer_phone: body.buyer_phone || null, buyer_address: body.buyer_address || null,
        seller_id: listing.seller.id, sale_price: salePrice, fee_percent: fp, fee_amount: feeAmount, seller_payout: sellerPayout,
        shipping_mode: listing.shipping_mode, shipping_cost: listing.shipping_cost_estimate || 0,
        status: "pending_payment", payment_method: body.payment_method || null,
      }).select().single();
      if (oe) throw oe;
      await sb.from("vault_marketplace_listings").update({ status: "reserved" }).eq("id", body.listing_id);
      await notify(sb, "🛒 Nova venda no Marketplace!", `${body.buyer_name} quer comprar "${listing.title}". Aguardando pagamento.`, listing.seller.member.client_cpf, order.id, "marketplace_order");
      return json({ success: true, order });
    }

    if (method === "PUT" && action === "confirm-payment") {
      const body = await req.json();
      const { data: order } = await sb.from("vault_marketplace_orders").select(`id, seller_id, listing:vault_marketplace_listings!inner(title), seller:vault_seller_profiles!inner(member:vault_members!inner(client_cpf))`).eq("id", body.order_id).eq("buyer_cpf", cpf).single();
      const { error } = await sb.from("vault_marketplace_orders").update({ status: "paid", payment_method: body.payment_method, payment_id: body.payment_id || null, mp_payment_id: body.mp_payment_id || null, pix_transaction_id: body.pix_transaction_id || null, paid_at: new Date().toISOString() }).eq("id", body.order_id).eq("buyer_cpf", cpf);
      if (error) throw error;
      if (order) await notify(sb, "💰 Pagamento confirmado!", `O pagamento de "${order.listing?.title}" foi confirmado. Envie o produto!`, order.seller?.member?.client_cpf, body.order_id, "marketplace_order");
      return json({ success: true });
    }

    if (method === "GET" && action === "my-orders") {
      const { data, error } = await sb.from("vault_marketplace_orders").select(`*, listing:vault_marketplace_listings!inner(title, brand, model, size, photos, condition, is_vault_certified)`).eq("buyer_cpf", cpf).order("created_at", { ascending: false });
      if (error) throw error;
      return json({ orders: data || [] });
    }

    if (method === "GET" && action === "my-sales") {
      const member = await getMember(sb, cpf);
      if (!member) return json({ orders: [] });
      const seller = await getSeller(sb, member.id);
      if (!seller) return json({ orders: [] });
      const { data, error } = await sb.from("vault_marketplace_orders").select(`*, listing:vault_marketplace_listings!inner(title, brand, model, size, photos, condition)`).eq("seller_id", seller.id).order("created_at", { ascending: false });
      if (error) throw error;
      return json({ orders: data || [] });
    }

    if (method === "PUT" && action === "update-order-status") {
      const body = await req.json();
      const oid = body.order_id;
      const ns = body.status;
      const { data: od } = await sb.from("vault_marketplace_orders").select(`id, buyer_cpf, buyer_name, order_code, listing:vault_marketplace_listings!inner(title), seller:vault_seller_profiles!inner(member:vault_members!inner(client_cpf, client_name))`).eq("id", oid).single();
      const u: Record<string, any> = { status: ns };
      if (ns === "shipped") {
        u.shipped_at = new Date().toISOString();
        u.tracking_code = body.tracking_code || null;
        if (od) await notify(sb, "📦 Seu pedido foi enviado!", `O pedido "${od.listing?.title}" foi enviado.${body.tracking_code ? ` Rastreio: ${body.tracking_code}` : ""}`, od.buyer_cpf, oid, "marketplace_order");
      } else if (ns === "delivered") {
        u.delivered_at = new Date().toISOString();
        const { data: pd } = await sb.rpc("calculate_protection_end", { delivery_date: new Date().toISOString() });
        if (pd) u.protection_ends_at = pd;
        if (od) {
          await notify(sb, "✅ Pedido entregue!", `"${od.listing?.title}" foi entregue. Você tem 7 dias úteis para reportar problemas.`, od.buyer_cpf, oid, "marketplace_order");
          await notify(sb, "✅ Entrega confirmada!", `"${od.listing?.title}" foi entregue ao comprador.`, od.seller?.member?.client_cpf, oid, "marketplace_order");
        }
      } else if (ns === "completed") {
        u.payout_released_at = new Date().toISOString();
        u.payout_method = body.payout_method || "pix";
        u.payout_proof_url = body.payout_proof_url || null;
        if (od) await notify(sb, "💸 Repasse liberado!", `O valor da venda de "${od.listing?.title}" foi liberado.`, od.seller?.member?.client_cpf, oid, "marketplace_order");
      } else if (ns === "cancelled") {
        u.cancelled_at = new Date().toISOString();
        u.cancellation_reason = body.reason || null;
        const { data: co } = await sb.from("vault_marketplace_orders").select("listing_id").eq("id", oid).single();
        if (co) await sb.from("vault_marketplace_listings").update({ status: "active" }).eq("id", co.listing_id);
        if (od) await notify(sb, "❌ Pedido cancelado", `O pedido "${od.listing?.title}" foi cancelado.`, od.buyer_cpf, oid, "marketplace_order");
      } else if (ns === "disputed") {
        u.dispute_status = "open";
        u.dispute_reason = body.reason || null;
        u.dispute_opened_at = new Date().toISOString();
        if (od) await notify(sb, "⚠️ Disputa aberta", `Disputa aberta no pedido "${od.listing?.title}".`, od.seller?.member?.client_cpf, oid, "marketplace_order");
      }
      if (body.admin_notes) u.admin_notes = body.admin_notes;
      const { error } = await sb.from("vault_marketplace_orders").update(u).eq("id", oid);
      if (error) throw error;
      return json({ success: true });
    }

    if (method === "PUT" && action === "resolve-dispute") {
      const body = await req.json();
      const oid = body.order_id;
      const { data: order } = await sb.from("vault_marketplace_orders").select(`id, buyer_cpf, seller_id, listing:vault_marketplace_listings!inner(title), seller:vault_seller_profiles!inner(member:vault_members!inner(client_cpf))`).eq("id", oid).single();
      const u: Record<string, any> = { dispute_status: "resolved", dispute_resolved_at: new Date().toISOString(), dispute_resolution: body.resolution, admin_notes: body.admin_notes || null };
      if (body.resolution === "refund_buyer") {
        u.status = "cancelled"; u.cancelled_at = new Date().toISOString(); u.dispute_refund_amount = body.refund_amount || 0;
        if (order) { const { data: lo } = await sb.from("vault_marketplace_orders").select("listing_id").eq("id", oid).single(); if (lo) await sb.from("vault_marketplace_listings").update({ status: "active" }).eq("id", lo.listing_id); }
      } else if (body.resolution === "favor_seller") {
        u.status = "completed"; u.payout_released_at = new Date().toISOString(); u.payout_method = "pix";
      } else { u.dispute_refund_amount = body.refund_amount || 0; }
      const { error } = await sb.from("vault_marketplace_orders").update(u).eq("id", oid);
      if (error) throw error;
      if (order) {
        const rl = body.resolution === "refund_buyer" ? "reembolso ao comprador" : body.resolution === "favor_seller" ? "decisão a favor do vendedor" : "acordo parcial";
        await notify(sb, "📋 Disputa resolvida", `A disputa de "${order.listing?.title}" foi resolvida: ${rl}.`, order.buyer_cpf, oid, "marketplace_order");
        await notify(sb, "📋 Disputa resolvida", `A disputa de "${order.listing?.title}" foi resolvida.`, order.seller?.member?.client_cpf, oid, "marketplace_order");
      }
      return json({ success: true });
    }

    if (method === "POST" && action === "rate-seller") {
      const body = await req.json();
      const { data: order, error: oe } = await sb.from("vault_marketplace_orders").select("id, seller_id, status").eq("id", body.order_id).eq("buyer_cpf", cpf).single();
      if (oe || !order) throw new Error("Pedido não encontrado");
      if (!["delivered", "completed"].includes(order.status)) throw new Error("Só é possível avaliar após a entrega");
      const { error } = await sb.from("vault_marketplace_orders").update({ buyer_rating: body.rating, buyer_review: body.review || null, buyer_rated_at: new Date().toISOString() }).eq("id", body.order_id);
      if (error) throw error;
      const { data: all } = await sb.from("vault_marketplace_orders").select("buyer_rating").eq("seller_id", order.seller_id).not("buyer_rating", "is", null);
      if (all && all.length > 0) {
        const avg = all.reduce((s: number, r: any) => s + r.buyer_rating, 0) / all.length;
        await sb.from("vault_seller_profiles").update({ average_rating: Math.round(avg * 10) / 10, ratings_count: all.length }).eq("id", order.seller_id);
      }
      return json({ success: true });
    }

    if (method === "GET" && action === "chat-messages") {
      const orderId = url.searchParams.get("order_id");
      const listingId = url.searchParams.get("listing_id");
      let query = sb.from("vault_marketplace_messages").select("*").order("created_at", { ascending: true });
      if (orderId) query = query.eq("order_id", orderId);
      else if (listingId) query = query.eq("listing_id", listingId);
      else throw new Error("order_id ou listing_id obrigatório");
      const { data, error } = await query;
      if (error) throw error;
      if (data && data.length > 0) {
        const unread = data.filter((m: any) => m.sender_cpf !== cpf && !m.read_at).map((m: any) => m.id);
        if (unread.length > 0) await sb.from("vault_marketplace_messages").update({ read_at: new Date().toISOString() }).in("id", unread);
      }
      return json({ messages: data || [] });
    }

    if (method === "POST" && action === "send-message") {
      const body = await req.json();
      const { data: msg, error } = await sb.from("vault_marketplace_messages").insert({ order_id: body.order_id || null, listing_id: body.listing_id || null, sender_cpf: cpf, sender_name: body.sender_name, message: body.message, is_admin: body.is_admin || false }).select().single();
      if (error) throw error;
      if (body.order_id) {
        const { data: order } = await sb.from("vault_marketplace_orders").select(`buyer_cpf, buyer_name, listing:vault_marketplace_listings!inner(title), seller:vault_seller_profiles!inner(member:vault_members!inner(client_cpf, client_name))`).eq("id", body.order_id).single();
        if (order) {
          const to = cpf === order.buyer_cpf ? order.seller?.member?.client_cpf : order.buyer_cpf;
          const from = cpf === order.buyer_cpf ? order.buyer_name : order.seller?.member?.client_name;
          if (to) await notify(sb, "💬 Nova mensagem", `${from} enviou uma mensagem sobre "${order.listing?.title}".`, to, body.order_id, "marketplace_chat");
        }
      }
      return json({ success: true, message: msg });
    }

    if (method === "POST" && action === "open-dispute") {
      const body = await req.json();
      const { data: order, error: oe } = await sb.from("vault_marketplace_orders").select(`id, status, protection_ends_at, buyer_name, listing:vault_marketplace_listings!inner(title), seller:vault_seller_profiles!inner(member:vault_members!inner(client_cpf))`).eq("id", body.order_id).eq("buyer_cpf", cpf).single();
      if (oe || !order) throw new Error("Pedido não encontrado");
      if (order.status !== "delivered") throw new Error("Disputas só podem ser abertas após a entrega");
      if (order.protection_ends_at && new Date(order.protection_ends_at) < new Date()) throw new Error("O período de proteção já expirou");
      const { error } = await sb.from("vault_marketplace_orders").update({ status: "disputed", dispute_status: "open", dispute_reason: body.reason, dispute_opened_at: new Date().toISOString() }).eq("id", body.order_id);
      if (error) throw error;
      if (order.seller?.member?.client_cpf) await notify(sb, "⚠️ Disputa aberta", `O comprador ${order.buyer_name} abriu uma disputa: "${body.reason}"`, order.seller.member.client_cpf, body.order_id, "marketplace_order");
      await sb.from("vault_marketplace_messages").insert({ order_id: body.order_id, sender_cpf: cpf, sender_name: "Sistema", message: `⚠️ Disputa aberta: ${body.reason}`, is_admin: false });
      return json({ success: true });
    }

    if (method === "GET" && action === "admin-orders") {
      const status = url.searchParams.get("status");
      let query = sb.from("vault_marketplace_orders").select(`*, listing:vault_marketplace_listings!inner(title, brand, model, size, photos, condition, is_vault_certified)`).order("created_at", { ascending: false }).limit(100);
      if (status && status !== "all") query = query.eq("status", status);
      const { data, error } = await query;
      if (error) throw error;
      return json({ orders: data || [] });
    }

    if (method === "GET" && action === "seller-public-profile") {
      const sid = url.searchParams.get("seller_id");
      if (!sid) throw new Error("seller_id obrigatório");
      const { data: seller } = await sb.from("vault_seller_profiles").select(`id, bio, total_sales_count, total_sales_value, average_rating, ratings_count, current_fee_percent, member:vault_members!inner(client_name, tier, created_at)`).eq("id", sid).single();
      if (!seller) throw new Error("Vendedor não encontrado");
      const { data: listings } = await sb.from("vault_marketplace_listings").select("*").eq("seller_id", sid).eq("status", "active").order("published_at", { ascending: false });
      const { data: reviews } = await sb.from("vault_marketplace_orders").select("buyer_name, buyer_rating, buyer_review, created_at").eq("seller_id", sid).not("buyer_rating", "is", null).order("created_at", { ascending: false }).limit(10);
      return json({ ...seller, listings: listings || [], recent_reviews: reviews || [] });
    }

    if (method === "POST" && action === "make-offer") {
      const body = await req.json();
      const { data: listing } = await sb.from("vault_marketplace_listings").select(`id, title, price, seller_id, seller:vault_seller_profiles!inner(member:vault_members!inner(client_cpf))`).eq("id", body.listing_id).eq("status", "active").single();
      if (!listing) throw new Error("Anúncio não encontrado");
      if (listing.seller?.member?.client_cpf === cpf) throw new Error("Não pode fazer oferta no próprio anúncio");
      const { data: offer, error } = await sb.from("vault_marketplace_offers").insert({ listing_id: body.listing_id, buyer_cpf: cpf, buyer_name: body.buyer_name || "Comprador", offer_price: body.offer_price, message: body.message || null }).select().single();
      if (error) throw error;
      await notify(sb, "💰 Nova oferta recebida!", `${body.buyer_name || "Um comprador"} ofereceu R$ ${body.offer_price.toFixed(2)} por "${listing.title}".`, listing.seller.member.client_cpf, listing.id, "marketplace_offer");
      return json({ success: true, offer });
    }

    if (method === "GET" && action === "listing-offers") {
      const lid = url.searchParams.get("listing_id");
      if (!lid) throw new Error("listing_id obrigatório");
      const { data, error } = await sb.from("vault_marketplace_offers").select("*").eq("listing_id", lid).order("created_at", { ascending: false });
      if (error) throw error;
      return json({ offers: data || [] });
    }

    if (method === "GET" && action === "my-offers") {
      const { data, error } = await sb.from("vault_marketplace_offers").select(`*, listing:vault_marketplace_listings!inner(title, photos, price)`).eq("buyer_cpf", cpf).order("created_at", { ascending: false });
      if (error) throw error;
      return json({ offers: data || [] });
    }

    if (method === "PUT" && action === "respond-offer") {
      const body = await req.json();
      const { data: offer } = await sb.from("vault_marketplace_offers").select(`id, listing_id, buyer_cpf, buyer_name, offer_price, listing:vault_marketplace_listings!inner(title, seller_id)`).eq("id", body.offer_id).single();
      if (!offer) throw new Error("Oferta não encontrada");
      const u: Record<string, any> = { responded_at: new Date().toISOString() };
      if (body.response === "accept") {
        u.status = "accepted";
        await notify(sb, "✅ Oferta aceita!", `Sua oferta de R$ ${offer.offer_price.toFixed(2)} por "${offer.listing?.title}" foi aceita!`, offer.buyer_cpf, offer.listing_id, "marketplace_offer");
      } else if (body.response === "reject") {
        u.status = "rejected";
        await notify(sb, "❌ Oferta recusada", `Sua oferta por "${offer.listing?.title}" foi recusada.`, offer.buyer_cpf, offer.listing_id, "marketplace_offer");
      } else if (body.response === "counter") {
        u.status = "counter"; u.counter_price = body.counter_price; u.counter_message = body.counter_message || null;
        await notify(sb, "🔄 Contra-proposta!", `Contra-proposta de R$ ${body.counter_price?.toFixed(2)} por "${offer.listing?.title}".`, offer.buyer_cpf, offer.listing_id, "marketplace_offer");
      }
      const { error } = await sb.from("vault_marketplace_offers").update(u).eq("id", body.offer_id);
      if (error) throw error;
      return json({ success: true });
    }

    return json({ error: "Ação não encontrada" }, 404);
  } catch (error: any) {
    console.error("Marketplace error:", error);
    return json({ error: error.message }, 500);
  }
});
