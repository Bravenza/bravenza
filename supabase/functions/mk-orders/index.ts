// mk-orders: Core Orders, Payments, My Orders/Sales, Status Updates, Rate, Admin Orders/Disputes, Wallet, Buyer Cancel
import {
  corsHeaders, jsonResponse, createSupabaseClient,
  getMember, getSellerProfile, notify, getMemberEmail, sendMarketplaceEmail, sendMarketplaceWhatsApp, generateOrderCode,
} from "../_shared/mk-helpers.ts";

const j = jsonResponse;
const gm = getMember;
const gs = getSellerProfile;
const nt = notify;
const ge = getMemberEmail;
const em = sendMarketplaceEmail;
const wa = sendMarketplaceWhatsApp;
const gc = generateOrderCode;

const PUBLIC_ACTIONS = new Set<string>([]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const sb = createSupabaseClient();
  const url = new URL(req.url);
  const a = url.searchParams.get("action");
  const mt = req.method;

  console.log("mk-orders", a, mt);

  // Inline auth resolution
  let cpf: string | null = "visitor";
  const isPublic = PUBLIC_ACTIONS.has(a || "");
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authErr } = await sb.auth.getUser(token);
    if (!authErr && userData?.user) {
      const { data: prof } = await sb.from("client_profiles").select("cpf").eq("user_id", userData.user.id).single();
      if (prof?.cpf) cpf = prof.cpf;
    }
  }
  if (!isPublic && cpf === "visitor") {
    return j({ error: "Autenticação obrigatória" }, 401);
  }

  try {
    // ==================== CREATE ORDER ====================
    if (mt === "POST" && a === "create-order") {
      const b = await req.json();
      let li: any = null;
      const { data: directListing } = await sb.from("vault_marketplace_listings").select(
        `*, seller:vault_seller_profiles!inner(id, current_fee_percent, member:vault_members!inner(client_cpf, client_name))`
      ).eq("id", b.listing_id).eq("status", "active").maybeSingle();
      if (directListing) { li = directListing; }
      else {
        const { data: offer } = await sb.from("marketplace_offers").select(
          `*, seller:vault_seller_profiles!inner(id, current_fee_percent, member:vault_members!inner(client_cpf, client_name))`
        ).eq("id", b.listing_id).eq("status", "active").maybeSingle();
        if (offer) {
          if (offer.listing_id) {
            const { data: linked } = await sb.from("vault_marketplace_listings").select(
              `*, seller:vault_seller_profiles!inner(id, current_fee_percent, member:vault_members!inner(client_cpf, client_name))`
            ).eq("id", offer.listing_id).maybeSingle();
            if (linked) li = linked;
          }
          if (!li) {
            const normalizedMode = offer.shipping_mode === "seller_ships" ? "direct" : offer.shipping_mode === "hub" ? "bravenza" : offer.shipping_mode || "direct";
            li = { id: offer.id, title: `${offer.description || "Sneaker"}`, price: offer.price, shipping_mode: normalizedMode, shipping_cost_estimate: offer.shipping_cost_estimate || 0, seller: offer.seller, _is_offer: true };
          }
        }
      }
      if (!li) throw new Error("Anúncio não encontrado ou já vendido");
      if (li.seller?.member?.client_cpf === cpf) throw new Error("Não pode comprar próprio anúncio");
      const fp = li.seller?.current_fee_percent || 14;
      const fa = Math.round(li.price * fp / 100 * 100) / 100;
      const sp = Math.round((li.price - fa) * 100) / 100;
      const oc = gc();
      const shippingCost = b.shipping_cost || li.shipping_cost_estimate || 0;
      const reqAuth = li.price >= 2000 || b.requires_authentication === true;
      const authFee = reqAuth && li.price < 2000 ? (b.authentication_fee || 49.90) : 0;
      const { data: od, error } = await sb.from("vault_marketplace_orders").insert({
        order_code: oc, listing_id: li._is_offer ? null : li.id, buyer_cpf: cpf, buyer_name: b.buyer_name,
        seller_id: li.seller.id, sale_price: li.price, fee_percent: fp, fee_amount: fa,
        seller_payout: sp, shipping_mode: reqAuth ? "bravenza" : (li.shipping_mode || "direct"),
        shipping_cost: shippingCost, status: "pending_payment",
        requires_authentication: reqAuth, authentication_requested: b.requires_authentication || false,
        authentication_fee: authFee,
      }).select().single();
      if (error) throw error;
      if (!li._is_offer) await sb.from("vault_marketplace_listings").update({ status: "reserved" }).eq("id", li.id);
      if (li._is_offer) await sb.from("marketplace_offers").update({ status: "reserved" }).eq("id", b.listing_id);
      const titleForNotification = li.title || "Sneaker";
      await nt(sb, "🛒 Nova venda!", `${b.buyer_name} comprou "${titleForNotification}".`, li.seller.member.client_cpf, od.id, "marketplace_order");
      await sb.from("marketplace_activity_feed").insert({ event_type: "sale", title: `Venda: ${titleForNotification}`, description: `R$ ${li.price} — comprador: ${b.buyer_name}`, listing_id: li._is_offer ? null : li.id, seller_id: li.seller.id }).then(() => {});
      const buyerInfo = await ge(sb, cpf);
      if (buyerInfo) {
        em("mk_purchase_confirmed", { recipient_name: buyerInfo.name, recipient_email: buyerInfo.email, order_code: od.order_code, product_name: titleForNotification, price: li.price, size: li.size || b.size, condition: li.condition, shipping_mode: li.shipping_mode || "direct" });
        if (buyerInfo.phone) wa("mk_purchase_confirmed", { recipient_phone: buyerInfo.phone, recipient_name: buyerInfo.name, order_code: od.order_code, product_name: titleForNotification, price: li.price });
      }
      const sellerInfo = await ge(sb, li.seller.member.client_cpf);
      if (sellerInfo) {
        em("mk_new_sale", { recipient_name: sellerInfo.name, recipient_email: sellerInfo.email, order_code: od.order_code, product_name: titleForNotification, price: li.price, size: li.size || b.size, buyer_name: b.buyer_name, shipping_mode: li.shipping_mode || "direct" });
        if (sellerInfo.phone) wa("mk_new_sale", { recipient_phone: sellerInfo.phone, recipient_name: sellerInfo.name, order_code: od.order_code, product_name: titleForNotification, price: li.price, buyer_name: b.buyer_name, shipping_mode: li.shipping_mode || "direct" });
      }
      return j({ success: true, order: od });
    }

    // ==================== CONFIRM PAYMENT ====================
    if (mt === "PUT" && a === "confirm-payment") {
      const b = await req.json();
      const pe = new Date();
      let bizDays = 0;
      while (bizDays < 8) { pe.setDate(pe.getDate() + 1); const dow = pe.getDay(); if (dow !== 0 && dow !== 6) bizDays++; }
      const { error } = await sb.from("vault_marketplace_orders").update({
        status: "paid", payment_method: b.payment_method, paid_at: new Date().toISOString(),
        protection_ends_at: pe.toISOString(),
      }).eq("id", b.order_id).eq("buyer_cpf", cpf);
      if (error) throw error;
      return j({ success: true });
    }

    // ==================== MY ORDERS ====================
    if (mt === "GET" && a === "my-orders") {
      const { data, error } = await sb.from("vault_marketplace_orders").select(
        `*, listing:vault_marketplace_listings(title, brand, model, size, photos, condition, is_vault_certified)`
      ).eq("buyer_cpf", cpf).order("created_at", { ascending: false });
      if (error) throw error;
      return j({ orders: data || [] });
    }

    // ==================== MY SALES ====================
    if (mt === "GET" && a === "my-sales") {
      const { data: mb } = await sb.from("vault_members").select("id").eq("client_cpf", cpf).single();
      if (!mb) return j({ orders: [] });
      const { data: sl } = await sb.from("vault_seller_profiles").select("id").eq("member_id", mb.id).maybeSingle();
      if (!sl) return j({ orders: [] });
      const { data, error } = await sb.from("vault_marketplace_orders").select(
        `*, listing:vault_marketplace_listings(title, brand, model, size, photos, condition)`
      ).eq("seller_id", sl.id).order("created_at", { ascending: false });
      if (error) throw error;
      return j({ orders: data || [] });
    }

    // ==================== UPDATE ORDER STATUS ====================
    if (mt === "PUT" && a === "update-order-status") {
      const b = await req.json();
      const u: Record<string, any> = { status: b.status };
      if (b.status === "shipped") { u.shipped_at = new Date().toISOString(); u.tracking_code = b.tracking_code || null; }
      else if (b.status === "delivered") { u.delivered_at = new Date().toISOString(); }
      else if (b.status === "cancelled") {
        u.cancelled_at = new Date().toISOString();
        if (b.listing_id) await sb.from("vault_marketplace_listings").update({ status: "active" }).eq("id", b.listing_id);
      } else if (b.status === "payout_released") {
        u.payout_released_at = new Date().toISOString();
        u.payout_method = b.payout_method || "pix";
        u.payout_proof_url = b.payout_proof_url || null;
        const { data: od } = await sb.from("vault_marketplace_orders").select("listing_id, sale_price, seller_id").eq("id", b.order_id).single();
        if (od?.listing_id) {
          const { data: listing } = await sb.from("vault_marketplace_listings").select("product_id").eq("id", od.listing_id).maybeSingle();
          if (listing?.product_id) {
            await sb.from("marketplace_offers").update({ status: "sold", sold_at: new Date().toISOString() }).eq("listing_id", od.listing_id).eq("status", "active");
            const { data: activeOffers } = await sb.from("marketplace_offers").select("price").eq("product_id", listing.product_id).eq("status", "active");
            const prices = (activeOffers || []).map((o: any) => o.price);
            await sb.from("marketplace_products").update({ lowest_price: prices.length > 0 ? Math.min(...prices) : null, total_offers: prices.length }).eq("id", listing.product_id);
          }
          if (od.seller_id) {
            const { data: sl } = await sb.from("vault_seller_profiles").select("member:vault_members!inner(client_cpf)").eq("id", od.seller_id).single();
            if (sl?.member?.client_cpf) {
              const { data: orderInfo } = await sb.from("vault_marketplace_orders").select("order_code, seller_payout").eq("id", b.order_id).single();
              await nt(sb, "💸 Repasse realizado!", `Pedido ${orderInfo?.order_code} — R$ ${orderInfo?.seller_payout?.toFixed(2)} transferido via PIX.`, sl.member.client_cpf, b.order_id, "marketplace_payout");
              const sellerEmail = await ge(sb, sl.member.client_cpf);
              if (sellerEmail) {
                em("mk_payout_released", { recipient_name: sellerEmail.name, recipient_email: sellerEmail.email, order_code: orderInfo?.order_code, payout_amount: orderInfo?.seller_payout, payout_method: b.payout_method || "pix" });
                if (sellerEmail.phone) wa("mk_payout_released", { recipient_phone: sellerEmail.phone, recipient_name: sellerEmail.name, order_code: orderInfo?.order_code, payout_amount: orderInfo?.seller_payout });
              }
            }
          }
        }
      } else if (b.status === "in_transit_to_hub") { u.hub_tracking_code = b.hub_tracking_code || null; }
      if (b.admin_notes) u.admin_notes = b.admin_notes;
      const { error } = await sb.from("vault_marketplace_orders").update(u).eq("id", b.order_id);
      if (error) throw error;
      if (["shipped", "delivered", "cancelled"].includes(b.status)) {
        const { data: orderData } = await sb.from("vault_marketplace_orders").select(
          `order_code, buyer_cpf, buyer_name, seller_id, shipping_mode, tracking_code, sale_price, listing:vault_marketplace_listings(title, size, condition)`
        ).eq("id", b.order_id).single();
        if (orderData) {
          const productName = orderData.listing?.title || "Sneaker";
          const { data: slInfo } = await sb.from("vault_seller_profiles").select("member:vault_members!inner(client_cpf)").eq("id", orderData.seller_id).single();
          const sellerCpf = slInfo?.member?.client_cpf;
          if (b.status === "cancelled") {
            const buyerCancelEmail = await ge(sb, orderData.buyer_cpf);
            if (buyerCancelEmail) { em("mk_order_cancelled", { recipient_name: buyerCancelEmail.name, recipient_email: buyerCancelEmail.email, order_code: orderData.order_code, product_name: productName, cancel_reason: b.admin_notes || "Cancelado" }); if (buyerCancelEmail.phone) wa("mk_order_cancelled", { recipient_phone: buyerCancelEmail.phone, recipient_name: buyerCancelEmail.name, order_code: orderData.order_code, product_name: productName, cancel_reason: b.admin_notes || "Cancelado" }); }
            if (sellerCpf) { const sellerCancelEmail = await ge(sb, sellerCpf); if (sellerCancelEmail) em("mk_order_cancelled", { recipient_name: sellerCancelEmail.name, recipient_email: sellerCancelEmail.email, order_code: orderData.order_code, product_name: productName, cancel_reason: b.admin_notes || "Cancelado" }); }
          } else if (b.status === "shipped") {
            const buyerEmail = await ge(sb, orderData.buyer_cpf);
            if (buyerEmail) { em("mk_seller_shipped", { recipient_name: buyerEmail.name, recipient_email: buyerEmail.email, order_code: orderData.order_code, product_name: productName, tracking_code: orderData.tracking_code || b.tracking_code, shipping_mode: orderData.shipping_mode }); if (buyerEmail.phone) wa("mk_seller_shipped", { recipient_phone: buyerEmail.phone, recipient_name: buyerEmail.name, order_code: orderData.order_code, product_name: productName, tracking_code: orderData.tracking_code || b.tracking_code, shipping_mode: orderData.shipping_mode }); }
          } else if (b.status === "delivered") {
            const buyerEmail = await ge(sb, orderData.buyer_cpf);
            if (buyerEmail) { em("mk_delivery_confirmed", { recipient_name: buyerEmail.name, recipient_email: buyerEmail.email, order_code: orderData.order_code, product_name: productName }); if (buyerEmail.phone) wa("mk_delivery_confirmed", { recipient_phone: buyerEmail.phone, recipient_name: buyerEmail.name, order_code: orderData.order_code, product_name: productName }); }
          }
        }
      }
      return j({ success: true });
    }

    // ==================== RATE SELLER ====================
    if (mt === "POST" && a === "rate-seller") {
      const b = await req.json();
      const { error } = await sb.from("vault_marketplace_orders").update({ buyer_rating: b.rating, buyer_review: b.review || null }).eq("id", b.order_id).eq("buyer_cpf", cpf);
      if (error) throw error;
      const { data: od } = await sb.from("vault_marketplace_orders").select("seller_id").eq("id", b.order_id).single();
      if (od) {
        const { data: ar } = await sb.from("vault_marketplace_orders").select("buyer_rating").eq("seller_id", od.seller_id).not("buyer_rating", "is", null);
        if (ar && ar.length > 0) {
          const avg = ar.reduce((s: number, r: any) => s + r.buyer_rating, 0) / ar.length;
          await sb.from("vault_seller_profiles").update({ average_rating: Math.round(avg * 10) / 10, ratings_count: ar.length }).eq("id", od.seller_id);
        }
      }
      return j({ success: true });
    }

    // ==================== ADMIN ORDERS ====================
    if (mt === "GET" && a === "admin-orders") {
      const st = url.searchParams.get("status");
      let q = sb.from("vault_marketplace_orders").select(`*, listing:vault_marketplace_listings(title, brand, model, size, photos, condition)`).order("created_at", { ascending: false });
      if (st && st !== "all") q = q.eq("status", st);
      const { data, error } = await q;
      if (error) throw error;
      return j({ orders: data || [] });
    }

    // ==================== ADMIN DISPUTES ====================
    if (mt === "GET" && a === "admin-disputes") {
      const { data, error } = await sb.from("vault_marketplace_orders").select(`*, listing:vault_marketplace_listings(title, brand, model, size, photos, condition)`).not("dispute_status", "is", null).order("dispute_opened_at", { ascending: false });
      if (error) throw error;
      return j({ disputes: data || [] });
    }

    // ==================== BUYER CANCEL (30-min window) ====================
    if (mt === "PUT" && a === "cancel-buyer-order") {
      const b = await req.json();
      const { data: od, error: fetchErr } = await sb.from("vault_marketplace_orders")
        .select("id, status, cancellation_window_ends_at, listing_id, order_code, seller_id, sale_price")
        .eq("id", b.order_id).eq("buyer_cpf", cpf).single();
      if (fetchErr || !od) throw new Error("Pedido não encontrado");
      if (od.status !== "paid") throw new Error("Cancelamento só é possível para pedidos pagos");
      if (!od.cancellation_window_ends_at || new Date(od.cancellation_window_ends_at) < new Date()) throw new Error("Janela de cancelamento expirada (30 minutos após pagamento)");
      const { error: upErr } = await sb.from("vault_marketplace_orders").update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancellation_reason: b.reason || "Cancelado pelo comprador (janela de 30 min)" }).eq("id", od.id);
      if (upErr) throw upErr;
      if (od.listing_id) await sb.from("vault_marketplace_listings").update({ status: "active" }).eq("id", od.listing_id);
      const { data: slInfo } = await sb.from("vault_seller_profiles").select("member:vault_members!inner(client_cpf, client_name)").eq("id", od.seller_id).single();
      if (slInfo?.member?.client_cpf) {
        await nt(sb, "❌ Compra cancelada", `Pedido ${od.order_code} foi cancelado pelo comprador.`, slInfo.member.client_cpf, od.id, "marketplace_order");
        const sellerEmail = await ge(sb, slInfo.member.client_cpf);
        if (sellerEmail) em("mk_order_cancelled", { recipient_name: sellerEmail.name, recipient_email: sellerEmail.email, order_code: od.order_code, product_name: `Pedido ${od.order_code}`, cancel_reason: b.reason || "Cancelado pelo comprador" });
      }
      return j({ success: true });
    }

    // ==================== WALLET BALANCE ====================
    if (mt === "GET" && a === "wallet-balance") {
      const { data: wb } = await sb.from("wallet_balances").select("*").eq("user_cpf", cpf).maybeSingle();
      const { data: txs } = await sb.from("wallet_transactions").select("*").eq("user_cpf", cpf).order("created_at", { ascending: false }).limit(50);
      return j({ balance: wb?.balance || 0, last_transaction_at: wb?.last_transaction_at || null, transactions: txs || [] });
    }

    return j({ error: "Ação não encontrada" }, 404);
  } catch (e: any) {
    console.error("mk-orders error:", e);
    return j({ error: e.message }, 500);
  }
});
