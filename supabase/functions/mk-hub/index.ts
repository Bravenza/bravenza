// Marketplace Hub - All marketplace actions
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

// Email helper: get member name+email by CPF
async function ge(sb: any, cpf: string): Promise<{ name: string; email: string } | null> {
  const { data } = await sb.from("vault_members").select("client_name, client_email").eq("client_cpf", cpf).maybeSingle();
  if (!data?.client_email) return null;
  return { name: data.client_name, email: data.client_email };
}

// Email helper: send marketplace email via edge function
async function em(type: string, data: Record<string, any>) {
  try {
    const baseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!baseUrl || !serviceKey) return;
    fetch(`${baseUrl}/functions/v1/send-marketplace-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceKey}` },
      body: JSON.stringify({ type, ...data }),
    }).catch((e: any) => console.error("[mk-hub] email fire-and-forget error:", e));
  } catch (e) { console.error("[mk-hub] email error:", e); }
}

function gc() {
  const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let r = "MKT-";
  for (let i = 0; i < 6; i++) r += c.charAt(Math.floor(Math.random() * c.length));
  return r;
}

Deno.serve(async (req) => {
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
        `*, seller:vault_seller_profiles!inner(id, seller_cep, plan_id, verified_badge, member:vault_members!inner(client_name, tier), average_rating, total_sales_count, current_fee_percent)`,
        { count: "exact" }
      ).eq("status", "active");
      const sr = url.searchParams.get("search"), br = url.searchParams.get("brand"),
        sz = url.searchParams.get("size"), cn = url.searchParams.get("condition"),
        pm = url.searchParams.get("price_min"), px = url.searchParams.get("price_max"),
        so = url.searchParams.get("sort") || "recent",
        fo = url.searchParams.get("favorites_only"),
        md = url.searchParams.get("modality"),
        to = url.searchParams.get("trusted_only");
      if (fo === "true") {
        const { data: favs } = await sb.from("vault_marketplace_favorites").select("listing_id").eq("user_cpf", cpf);
        const favIds = (favs || []).map((f: any) => f.listing_id);
        if (favIds.length === 0) return j({ listings: [], total: 0 });
        q = q.in("id", favIds);
      }
      if (sr) q = q.or(`title.ilike.%${sr}%,brand.ilike.%${sr}%,model.ilike.%${sr}%`);
      if (br) q = q.ilike("brand", `%${br}%`);
      if (sz) q = q.eq("size", sz);
      if (cn) q = q.eq("condition", cn);
      if (pm) q = q.gte("price", parseFloat(pm));
      if (px) q = q.lte("price", parseFloat(px));
      if (md === "pro") q = q.eq("shipping_mode", "pro");
      else if (md === "direct") q = q.eq("shipping_mode", "direct");
      if (to === "true") {
        // Filter by trusted sellers (ouro or elite tier)
        q = q.in("seller.member.tier", ["ouro", "elite"]);
      }
      // Apply boost priority: boosted listings always appear first
      // Then apply user-selected sort
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
        `*, seller:vault_seller_profiles!inner(id, seller_cep, member:vault_members!inner(client_name, tier), average_rating, total_sales_count, current_fee_percent, bio)`
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
        shipping_mode: (b.price >= 2000) ? "bravenza" : (b.shipping_mode || "direct"), shipping_cost_estimate: b.shipping_cost_estimate || 0,
        is_vault_certified: !!b.vault_item_id, status: "active", published_at: new Date().toISOString(),
      }).select().single();
      if (error) throw error;
      // Log activity
      await sb.from("marketplace_activity_feed").insert({
        event_type: "new_listing", title: `Novo anúncio: ${b.title}`,
        description: `${b.brand || ""} ${b.model || ""} — R$ ${b.price}`,
        listing_id: li.id, seller_id: sl.id,
      }).then(() => {});
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
        shipping_mode: (b.price >= 2000) ? "bravenza" : b.shipping_mode, shipping_cost_estimate: b.shipping_cost_estimate,
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
        `id, bio, total_sales_count, total_sales_value, average_rating, ratings_count, current_fee_percent, plan_id, verified_badge, member:vault_members!inner(client_name, tier, created_at)`
      ).eq("id", sid).single();
      if (!sl) throw new Error("Vendedor não encontrado");
      const { data: ls } = await sb.from("vault_marketplace_listings").select("*").eq("seller_id", sid).eq("status", "active").order("published_at", { ascending: false });
      const { data: rv } = await sb.from("vault_marketplace_orders").select("buyer_name, buyer_rating, buyer_review, created_at").eq("seller_id", sid).not("buyer_rating", "is", null).order("created_at", { ascending: false }).limit(10);
      // Get collections for Elite sellers
      const { data: collections } = await sb.from("seller_collections").select("*").eq("seller_id", sid).eq("is_active", true).order("sort_order", { ascending: true });
      return j({ ...sl, listings: ls || [], recent_reviews: rv || [], collections: collections || [] });
    }

    // ==================== ORDERS (mkord) ====================

    if (mt === "POST" && a === "create-order") {
      const b = await req.json();
      // Try listing first, then fall back to finding via offer
      let li: any = null;
      const { data: directListing } = await sb.from("vault_marketplace_listings").select(
        `*, seller:vault_seller_profiles!inner(id, current_fee_percent, member:vault_members!inner(client_cpf, client_name))`
      ).eq("id", b.listing_id).eq("status", "active").maybeSingle();
      
      if (directListing) {
        li = directListing;
      } else {
        // listing_id might be an offer id — find the offer and its linked listing or create order from offer
        const { data: offer } = await sb.from("marketplace_offers").select(
          `*, seller:vault_seller_profiles!inner(id, current_fee_percent, member:vault_members!inner(client_cpf, client_name))`
        ).eq("id", b.listing_id).eq("status", "active").maybeSingle();
        if (offer) {
          // If offer has a linked listing, use it; otherwise create a virtual listing object
          if (offer.listing_id) {
            const { data: linked } = await sb.from("vault_marketplace_listings").select(
              `*, seller:vault_seller_profiles!inner(id, current_fee_percent, member:vault_members!inner(client_cpf, client_name))`
            ).eq("id", offer.listing_id).maybeSingle();
            if (linked) li = linked;
          }
          if (!li) {
            // Use offer data directly
            const normalizedMode = offer.shipping_mode === "seller_ships" ? "direct" : offer.shipping_mode === "hub" ? "bravenza" : offer.shipping_mode || "direct";
            li = {
              id: offer.id,
              title: `${offer.description || "Sneaker"}`,
              price: offer.price,
              shipping_mode: normalizedMode,
              shipping_cost_estimate: offer.shipping_cost_estimate || 0,
              seller: offer.seller,
              _is_offer: true,
            };
          }
        }
      }
      if (!li) throw new Error("Anúncio não encontrado ou já vendido");
      if (li.seller?.member?.client_cpf === cpf) throw new Error("Não pode comprar próprio anúncio");
      const fp = li.seller?.current_fee_percent || 14;
      const fa = Math.round(li.price * fp) / 100;
      const sp = li.price - fa;
      const oc = gc();
      const shippingCost = b.shipping_cost || li.shipping_cost_estimate || 0;
      // Authentication enforcement: mandatory for items > R$2000
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
      // Reserve the listing/offer
      if (!li._is_offer) {
        await sb.from("vault_marketplace_listings").update({ status: "reserved" }).eq("id", li.id);
      }
      // Also reserve the offer if it exists
      if (li._is_offer) {
        await sb.from("marketplace_offers").update({ status: "reserved" }).eq("id", b.listing_id);
      }
      const titleForNotification = li.title || "Sneaker";
      await nt(sb, "🛒 Nova venda!", `${b.buyer_name} comprou "${titleForNotification}".`, li.seller.member.client_cpf, od.id, "marketplace_order");
      await sb.from("marketplace_activity_feed").insert({
        event_type: "sale", title: `Venda: ${titleForNotification}`,
        description: `R$ ${li.price} — comprador: ${b.buyer_name}`,
        listing_id: li._is_offer ? null : li.id, seller_id: li.seller.id,
      }).then(() => {});
      // Send emails: purchase confirmed to buyer, new sale to seller
      const buyerInfo = await ge(sb, cpf);
      if (buyerInfo) {
        em("mk_purchase_confirmed", {
          recipient_name: buyerInfo.name, recipient_email: buyerInfo.email,
          order_code: od.order_code, product_name: titleForNotification,
          price: li.price, size: li.size || b.size, condition: li.condition,
          shipping_mode: li.shipping_mode || "direct",
        });
      }
      const sellerInfo = await ge(sb, li.seller.member.client_cpf);
      if (sellerInfo) {
        em("mk_new_sale", {
          recipient_name: sellerInfo.name, recipient_email: sellerInfo.email,
          order_code: od.order_code, product_name: titleForNotification,
          price: li.price, size: li.size || b.size, buyer_name: b.buyer_name,
          shipping_mode: li.shipping_mode || "direct",
        });
      }
      return j({ success: true, order: od });
    }

    if (mt === "PUT" && a === "confirm-payment") {
      const b = await req.json();
      // 8 dias úteis ≈ adicionar dias pulando fins de semana
      const pe = new Date();
      let bizDays = 0;
      while (bizDays < 8) {
        pe.setDate(pe.getDate() + 1);
        const dow = pe.getDay();
        if (dow !== 0 && dow !== 6) bizDays++;
      }
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
        u.payout_proof_url = b.payout_proof_url || null;
        // Mark offer as sold for analytics
        const { data: od } = await sb.from("vault_marketplace_orders").select("listing_id, sale_price, seller_id").eq("id", b.order_id).single();
        if (od?.listing_id) {
          // Update the listing's linked offer to "sold"
          const { data: listing } = await sb.from("vault_marketplace_listings").select("product_id").eq("id", od.listing_id).maybeSingle();
          if (listing?.product_id) {
            await sb.from("marketplace_offers").update({ status: "sold", sold_at: new Date().toISOString() })
              .eq("listing_id", od.listing_id).eq("status", "active");
            // Update product stats
            const { data: activeOffers } = await sb.from("marketplace_offers").select("price").eq("product_id", listing.product_id).eq("status", "active");
            const prices = (activeOffers || []).map((o: any) => o.price);
            await sb.from("marketplace_products").update({
              lowest_price: prices.length > 0 ? Math.min(...prices) : null,
              total_offers: prices.length,
            }).eq("id", listing.product_id);
          }
          // Update seller sales count
          if (od.seller_id) {
            const { data: completedSales } = await sb.from("vault_marketplace_orders").select("id")
              .eq("seller_id", od.seller_id).eq("status", "payout_released");
            await sb.from("vault_seller_profiles").update({
              total_sales_count: (completedSales?.length || 0) + 1,
              total_sales_value: 0, // Will be calculated by tier check
            }).eq("id", od.seller_id);
          }
          // Notify seller about payout
          if (od.seller_id) {
            const { data: sl } = await sb.from("vault_seller_profiles").select("member:vault_members!inner(client_cpf)").eq("id", od.seller_id).single();
            if (sl?.member?.client_cpf) {
              const { data: orderInfo } = await sb.from("vault_marketplace_orders").select("order_code, seller_payout").eq("id", b.order_id).single();
              await nt(sb, "💸 Repasse realizado!", `Pedido ${orderInfo?.order_code} — R$ ${orderInfo?.seller_payout?.toFixed(2)} transferido via PIX.`, sl.member.client_cpf, b.order_id, "marketplace_payout");
              // Email: payout released to seller
              const sellerEmail = await ge(sb, sl.member.client_cpf);
              if (sellerEmail) {
                em("mk_payout_released", {
                  recipient_name: sellerEmail.name, recipient_email: sellerEmail.email,
                  order_code: orderInfo?.order_code, payout_amount: orderInfo?.seller_payout,
                  payout_method: b.payout_method || "pix",
                });
              }
            }
          }
        }
      } else if (b.status === "in_transit_to_hub") {
        u.hub_tracking_code = b.hub_tracking_code || null;
      }
      if (b.admin_notes) u.admin_notes = b.admin_notes;
      const { error } = await sb.from("vault_marketplace_orders").update(u).eq("id", b.order_id);
      if (error) throw error;

      // Send emails for shipped/delivered/cancelled status changes
      if (["shipped", "delivered", "cancelled"].includes(b.status)) {
        const { data: orderData } = await sb.from("vault_marketplace_orders").select(
          `order_code, buyer_cpf, buyer_name, seller_id, shipping_mode, tracking_code, listing:vault_marketplace_listings!inner(title, size, condition)`
        ).eq("id", b.order_id).single();
        if (orderData) {
          if (b.status === "cancelled") {
            // Email cancelled to buyer
            const buyerCancelEmail = await ge(sb, orderData.buyer_cpf);
            if (buyerCancelEmail) {
              em("mk_order_cancelled", {
                recipient_name: buyerCancelEmail.name, recipient_email: buyerCancelEmail.email,
                order_code: orderData.order_code, product_name: orderData.listing?.title,
                cancel_reason: b.admin_notes || "Cancelado",
              });
            }
            // Email cancelled to seller
            const { data: slCancel } = await sb.from("vault_seller_profiles").select("member:vault_members!inner(client_cpf)").eq("id", orderData.seller_id).single();
            if (slCancel?.member?.client_cpf) {
              const sellerCancelEmail = await ge(sb, slCancel.member.client_cpf);
              if (sellerCancelEmail) {
                em("mk_order_cancelled", {
                  recipient_name: sellerCancelEmail.name, recipient_email: sellerCancelEmail.email,
                  order_code: orderData.order_code, product_name: orderData.listing?.title,
                  cancel_reason: b.admin_notes || "Cancelado",
                });
              }
            }
          } else {
            const buyerEmail = await ge(sb, orderData.buyer_cpf);
            if (buyerEmail) {
              if (b.status === "shipped") {
                em("mk_seller_shipped", {
                  recipient_name: buyerEmail.name, recipient_email: buyerEmail.email,
                  order_code: orderData.order_code, product_name: orderData.listing?.title,
                  tracking_code: orderData.tracking_code || b.tracking_code,
                  shipping_mode: orderData.shipping_mode,
                });
              } else if (b.status === "delivered") {
                em("mk_delivery_confirmed", {
                  recipient_name: buyerEmail.name, recipient_email: buyerEmail.email,
                  order_code: orderData.order_code, product_name: orderData.listing?.title,
                });
              }
            }
          }
        }
      }

      return j({ success: true });
    }

    if (mt === "POST" && a === "open-dispute") {
      const b = await req.json();
      const { error } = await sb.from("vault_marketplace_orders").update({
        dispute_status: "open", admin_notes: b.reason || "Disputa aberta",
      }).eq("id", b.order_id).eq("buyer_cpf", cpf);
      if (error) throw error;
      // Email: dispute opened - notify both parties
      const { data: disputeOrder } = await sb.from("vault_marketplace_orders").select(
        `order_code, buyer_cpf, buyer_name, seller_id, listing:vault_marketplace_listings!inner(title)`
      ).eq("id", b.order_id).single();
      if (disputeOrder) {
        // Notify seller
        const { data: sellerData } = await sb.from("vault_seller_profiles").select("member:vault_members!inner(client_cpf, client_name)").eq("id", disputeOrder.seller_id).single();
        if (sellerData?.member?.client_cpf) {
          const sellerEmail = await ge(sb, sellerData.member.client_cpf);
          if (sellerEmail) {
            em("mk_dispute_opened", {
              recipient_name: sellerEmail.name, recipient_email: sellerEmail.email,
              order_code: disputeOrder.order_code, dispute_reason: b.reason,
              dispute_opened_by: disputeOrder.buyer_name || "Comprador",
            });
          }
        }
        // Notify buyer confirmation
        const buyerEmail = await ge(sb, cpf);
        if (buyerEmail) {
          em("mk_dispute_opened", {
            recipient_name: buyerEmail.name, recipient_email: buyerEmail.email,
            order_code: disputeOrder.order_code, dispute_reason: b.reason,
            dispute_opened_by: "Você",
          });
        }
      }
      return j({ success: true });
    }

    if (mt === "PUT" && a === "resolve-dispute") {
      const b = await req.json();
      const { error } = await sb.from("vault_marketplace_orders").update({
        dispute_status: b.resolution, admin_notes: b.admin_notes || null,
        status: b.new_status || "dispute_resolved",
      }).eq("id", b.order_id);
      if (error) throw error;
      // Email: dispute resolved to both parties
      const { data: drOrder } = await sb.from("vault_marketplace_orders").select(
        `order_code, buyer_cpf, seller_id`
      ).eq("id", b.order_id).single();
      if (drOrder) {
        const buyerDrEmail = await ge(sb, drOrder.buyer_cpf);
        if (buyerDrEmail) {
          em("mk_dispute_resolved", {
            recipient_name: buyerDrEmail.name, recipient_email: buyerDrEmail.email,
            order_code: drOrder.order_code, dispute_resolution: b.admin_notes || b.resolution,
          });
        }
        const { data: slDr } = await sb.from("vault_seller_profiles").select("member:vault_members!inner(client_cpf)").eq("id", drOrder.seller_id).single();
        if (slDr?.member?.client_cpf) {
          const sellerDrEmail = await ge(sb, slDr.member.client_cpf);
          if (sellerDrEmail) {
            em("mk_dispute_resolved", {
              recipient_name: sellerDrEmail.name, recipient_email: sellerDrEmail.email,
              order_code: drOrder.order_code, dispute_resolution: b.admin_notes || b.resolution,
            });
          }
        }
      }
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
      // Email: offer received to seller
      const sellerOfferEmail = await ge(sb, li.seller.member.client_cpf);
      if (sellerOfferEmail) {
        em("mk_offer_received", {
          recipient_name: sellerOfferEmail.name, recipient_email: sellerOfferEmail.email,
          listing_title: li.title, offer_price: b.offer_price,
          buyer_name: b.buyer_name || "Comprador",
        });
      }
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
        // Email: offer accepted
        const buyerAccEmail = await ge(sb, of2.buyer_cpf);
        if (buyerAccEmail) {
          em("mk_offer_accepted", {
            recipient_name: buyerAccEmail.name, recipient_email: buyerAccEmail.email,
            listing_title: of2.listing?.title, offer_price: of2.offer_price,
          });
        }
      } else if (b.response === "reject") {
        u.status = "rejected";
        await nt(sb, "❌ Recusada", `Oferta por "${of2.listing?.title}" recusada.`, of2.buyer_cpf, of2.listing_id, "marketplace_offer");
      } else if (b.response === "counter") {
        u.status = "counter";
        u.counter_price = b.counter_price;
        u.counter_message = b.counter_message || null;
        await nt(sb, "🔄 Contra-proposta!", `R$ ${b.counter_price?.toFixed(2)} por "${of2.listing?.title}".`, of2.buyer_cpf, of2.listing_id, "marketplace_offer");
        // Email: counter offer
        const buyerCntEmail = await ge(sb, of2.buyer_cpf);
        if (buyerCntEmail) {
          em("mk_offer_counter", {
            recipient_name: buyerCntEmail.name, recipient_email: buyerCntEmail.email,
            listing_title: of2.listing?.title, offer_price: of2.offer_price,
            counter_price: b.counter_price, counter_message: b.counter_message,
          });
        }
      }
      const { error } = await sb.from("vault_marketplace_offers").update(u).eq("id", b.offer_id);
      if (error) throw error;
      return j({ success: true });
    }

    // ==================== FREIGHT QUOTE ====================
    if (mt === "POST" && a === "freight-quote") {
      const b = await req.json();
      const { listing_id, buyer_cep } = b;
      if (!listing_id || !buyer_cep) throw new Error("listing_id e buyer_cep obrigatórios");

      // Try to get listing first, fall back to offer if not found
      let listing: any = null;
      const { data: li } = await sb.from("vault_marketplace_listings").select(
        `*, seller:vault_seller_profiles!inner(seller_cep)`
      ).eq("id", listing_id).maybeSingle();
      
      if (li) {
        listing = li;
      } else {
        // listing_id might actually be an offer id - check marketplace_offers
        const { data: offer } = await sb.from("marketplace_offers").select(
          `*, seller:vault_seller_profiles!inner(seller_cep)`
        ).eq("id", listing_id).maybeSingle();
        if (offer) {
          listing = {
            ...offer,
            shipping_mode: offer.shipping_mode === "seller_ships" ? "direct" : offer.shipping_mode === "hub" ? "bravenza" : offer.shipping_mode || "direct",
          };
        }
      }
      if (!listing) throw new Error("Anúncio não encontrado");

      const sellerCep = listing.seller?.seller_cep;
      const isBravenza = listing.shipping_mode === "bravenza";

      // Get Bravenza warehouse CEP
      const { data: whSetting } = await sb.from("system_settings").select("value").eq("key", "bravenza_warehouse_cep").maybeSingle();
      const bravenzaCep = whSetting?.value ? String(whSetting.value).replace(/"/g, "") : "90040191";

      // Default package for sneakers
      const pkg = { weight: 1.2, height: 15, width: 35, length: 30 };
      const insuranceValue = listing.price || 0;

      // SuperFrete API
      const sfToken = Deno.env.get("SUPERFRETE_API_TOKEN");
      if (!sfToken) throw new Error("Token SuperFrete não configurado");

      const sfHeaders = {
        "Authorization": `Bearer ${sfToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Bravenza/1.0",
      };

      const quotePayload = (fromCep: string, toCep: string) => ({
        from: { postal_code: fromCep.replace(/\D/g, "") },
        to: { postal_code: toCep.replace(/\D/g, "") },
        services: "1,2,3",
        package: pkg,
        options: { insurance_value: insuranceValue, receipt: false, own_hand: false },
      });

      const doQuote = async (fromCep: string, toCep: string) => {
        const res = await fetch("https://api.superfrete.com/api/v0/calculator", {
          method: "POST",
          headers: sfHeaders,
          body: JSON.stringify(quotePayload(fromCep, toCep)),
        });
        const data = await res.json();
        if (!res.ok) {
          console.error("SuperFrete quote error:", data);
          return [];
        }
        return Array.isArray(data) ? data : [];
      };

      let quotes: any[] = [];
      let legs: any = null;

      if (isBravenza) {
        // Two-leg: seller → Bravenza, then Bravenza → buyer
        const fromCep = sellerCep || bravenzaCep;
        const leg1 = await doQuote(fromCep, bravenzaCep);
        const leg2 = await doQuote(bravenzaCep, buyer_cep);

        // Combine: for each service, sum prices from both legs
        const leg2Map: Record<number, any> = {};
        for (const q of leg2) { if (q.id) leg2Map[q.id] = q; }

        for (const q1 of leg1) {
          const q2 = leg2Map[q1.id];
          if (q2 && !q1.error && !q2.error) {
            const BRAVENZA_PROCESSING_DAYS = 5;
            quotes.push({
              ...q1,
              price: (parseFloat(q1.price || "0") + parseFloat(q2.price || "0")).toFixed(2),
              delivery_time: (q1.delivery_time || 0) + BRAVENZA_PROCESSING_DAYS + (q2.delivery_time || 0),
              legs: {
                seller_to_bravenza: { price: q1.price, delivery_time: q1.delivery_time },
                bravenza_processing: { delivery_time: BRAVENZA_PROCESSING_DAYS },
                bravenza_to_buyer: { price: q2.price, delivery_time: q2.delivery_time },
              },
            });
          }
        }
        legs = { mode: "bravenza", seller_cep: fromCep, warehouse_cep: bravenzaCep, buyer_cep: buyer_cep };
      } else {
        // Direct: seller → buyer
        const fromCep = sellerCep || bravenzaCep;
        quotes = await doQuote(fromCep, buyer_cep);
        quotes = quotes.filter((q: any) => !q.error);
        legs = { mode: "direct", seller_cep: fromCep, buyer_cep: buyer_cep };
      }

      return j({ quotes, legs, shipping_mode: listing.shipping_mode });
    }

    // ==================== CATALOG ====================

    if (mt === "GET" && a === "catalog-products") {
      const pg = parseInt(url.searchParams.get("page") || "1"), lm = 24, of = (pg - 1) * lm;
      let q = sb.from("marketplace_products").select("*", { count: "exact" }).eq("is_active", true);
      const sr = url.searchParams.get("search"), br = url.searchParams.get("brand"), cat = url.searchParams.get("category");
      if (sr) q = q.or(`brand.ilike.%${sr}%,model.ilike.%${sr}%,colorway.ilike.%${sr}%`);
      if (br) q = q.ilike("brand", `%${br}%`);
      if (cat) q = q.eq("category", cat);
      q = q.order("total_offers", { ascending: false }).order("created_at", { ascending: false });
      q = q.range(of, of + lm - 1);
      const { data, count, error } = await q;
      if (error) throw error;
      return j({ products: data || [], total: count });
    }

    if (mt === "GET" && a === "catalog-product") {
      const slug = url.searchParams.get("slug");
      if (!slug) throw new Error("slug obrigatório");
      const { data: prod, error } = await sb.from("marketplace_products").select("*").eq("slug", slug).eq("is_active", true).single();
      if (error || !prod) throw new Error("Produto não encontrado");
      // Get distinct sizes with active offers
      const { data: offersRaw } = await sb.from("marketplace_offers").select("size").eq("product_id", prod.id).eq("status", "active");
      const sizes = [...new Set((offersRaw || []).map((o: any) => o.size))].sort((a, b) => {
        const na = parseFloat(a), nb = parseFloat(b);
        return isNaN(na) || isNaN(nb) ? a.localeCompare(b) : na - nb;
      });
      // Get all active offers with seller info
      // Offers sorted: boosted first, then by price
      const { data: offers } = await sb.from("marketplace_offers").select(
        `*, seller:vault_seller_profiles!inner(id, seller_cep, average_rating, total_sales_count, current_fee_percent, plan_id, verified_badge, member:vault_members!inner(client_name, tier))`
      ).eq("product_id", prod.id).eq("status", "active").order("price", { ascending: true });
      // Sort: boosted offers first
      const sorted = (offers || []).sort((a: any, b: any) => {
        const aBoost = a.boost_level && a.boost_active_until && new Date(a.boost_active_until) > new Date() ? 1 : 0;
        const bBoost = b.boost_level && b.boost_active_until && new Date(b.boost_active_until) > new Date() ? 1 : 0;
        if (bBoost !== aBoost) return bBoost - aBoost;
        // Then Elite sellers first
        const planOrder: Record<string, number> = { elite: 3, pro: 2, free: 1 };
        const aPlan = planOrder[a.seller?.plan_id || "free"] || 0;
        const bPlan = planOrder[b.seller?.plan_id || "free"] || 0;
        if (bPlan !== aPlan) return bPlan - aPlan;
        return a.price - b.price;
      });
      return j({ product: prod, sizes, offers: sorted });
    }

    if (mt === "GET" && a === "catalog-offers") {
      const pid = url.searchParams.get("product_id"), sz = url.searchParams.get("size");
      if (!pid) throw new Error("product_id obrigatório");
      let q = sb.from("marketplace_offers").select(
        `*, seller:vault_seller_profiles!inner(id, seller_cep, average_rating, total_sales_count, current_fee_percent, plan_id, verified_badge, member:vault_members!inner(client_name, tier))`
      ).eq("product_id", pid).eq("status", "active");
      if (sz) q = q.eq("size", sz);
      q = q.order("price", { ascending: true });
      const { data, error } = await q;
      if (error) throw error;
      return j({ offers: data || [] });
    }

    if (mt === "GET" && a === "catalog-search") {
      const q = url.searchParams.get("q") || "";
      if (!q || q.length < 2) return j({ products: [] });
      const { data } = await sb.from("marketplace_products").select("id, slug, brand, model, colorway, images, lowest_price, total_offers")
        .eq("is_active", true)
        .or(`brand.ilike.%${q}%,model.ilike.%${q}%,colorway.ilike.%${q}%`)
        .order("total_offers", { ascending: false })
        .limit(10);
      return j({ products: data || [] });
    }

    if (mt === "POST" && a === "catalog-create-product") {
      const b = await req.json();
      if (!b.brand || !b.model) throw new Error("brand e model obrigatórios");
      // Check if product already exists
      const { data: existing } = await sb.from("marketplace_products")
        .select("id, slug")
        .ilike("brand", b.brand)
        .ilike("model", b.model)
        .eq("is_active", true)
        .maybeSingle();
      if (existing) return j({ product: existing, already_exists: true });

      // Auto-generate description via AI if not provided
      let description = b.description || null;
      if (!description) {
        try {
          const aiKey = Deno.env.get("LOVABLE_API_KEY");
          if (aiKey) {
            const colorInfo = b.colorway ? ` no colorway "${b.colorway}"` : "";
            const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: { "Authorization": `Bearer ${aiKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash-lite",
                messages: [
                  { role: "system", content: "Você é um especialista em sneakers. Escreva descrições em português brasileiro para catálogos de marketplace de sneakers. O texto deve ser envolvente, informativo e conter detalhes sobre a história do modelo, materiais, tecnologia e relevância cultural. Máximo 3 frases. Não use aspas no início/fim." },
                  { role: "user", content: `Escreva uma descrição de catálogo para o sneaker ${b.brand} ${b.model}${colorInfo}. SKU: ${b.sku || "N/A"}.` }
                ],
                max_tokens: 200,
                temperature: 0.7,
              }),
            });
            if (aiRes.ok) {
              const aiData = await aiRes.json();
              description = aiData.choices?.[0]?.message?.content?.trim() || null;
              console.log("AI description generated for", b.brand, b.model);
            }
          }
        } catch (aiErr) {
          console.error("AI description generation failed:", aiErr);
        }
      }

      const mb = await gm(sb, cpf);
      const { data: prod, error } = await sb.from("marketplace_products").insert({
        brand: b.brand,
        model: b.model,
        colorway: b.colorway || null,
        sku: b.sku || null,
        category: b.category || "sneakers",
        images: b.images || [],
        description,
        created_by_seller_id: mb?.id || null,
      }).select().single();
      if (error) throw error;
      return j({ product: prod, already_exists: false });
    }

    if (mt === "POST" && a === "catalog-create-offer") {
      const b = await req.json();
      if (!b.product_id || !b.size || !b.price) throw new Error("product_id, size e price obrigatórios");
      const mb = await gm(sb, cpf);
      if (!mb) throw new Error("Membro não encontrado");
      let sl = await gs(sb, mb.id);
      if (!sl) {
        const { data: ns, error: se } = await sb.from("vault_seller_profiles").insert({ member_id: mb.id }).select().single();
        if (se) throw se;
        sl = ns;
      }
      // Also create a legacy listing for backward compatibility
      const { data: li } = await sb.from("vault_marketplace_listings").insert({
        seller_id: sl.id,
        vault_item_id: b.vault_item_id || null,
        title: `${b.brand || ""} ${b.model || ""} ${b.size || ""}`.trim(),
        description: b.description || null,
        brand: b.brand || null,
        model: b.model || null,
        size: b.size,
        condition: b.condition || "novo",
        photos: b.photos || [],
        price: b.price,
        original_purchase_price: b.original_purchase_price || null,
        shipping_mode: b.price >= 2000 ? "bravenza" : (b.shipping_mode || "direct"),
        shipping_cost_estimate: 0,
        is_vault_certified: !!b.vault_item_id,
        status: "active",
        published_at: new Date().toISOString(),
        product_id: b.product_id,
      }).select().single();
      const { data: offer, error } = await sb.from("marketplace_offers").insert({
        product_id: b.product_id,
        seller_id: sl.id,
        listing_id: li?.id || null,
        size: b.size,
        condition: b.condition || "novo",
        price: b.price,
        original_purchase_price: b.original_purchase_price || null,
        description: b.description || null,
        defects: b.defects || null,
        photos: b.photos || [],
        proof_photos: b.proof_photos || [],
        has_receipt: b.has_receipt || false,
        shipping_mode: b.price >= 2000 ? "bravenza" : (b.shipping_mode === "hub" ? "bravenza" : b.shipping_mode === "seller_ships" ? "direct" : b.shipping_mode || "direct"),
        status: "active",
        published_at: new Date().toISOString(),
      }).select().single();
      if (error) throw error;
      return j({ offer, listing: li });
    }

    // ==================== WATCHLIST ====================

    if (mt === "GET" && a === "watchlist-check") {
      const pid = url.searchParams.get("product_id"), sz = url.searchParams.get("size") || "";
      if (!pid) throw new Error("product_id obrigatório");
      const { data } = await sb.from("marketplace_watchlist").select("id, max_price, is_active")
        .eq("product_id", pid).eq("size", sz).eq("user_cpf", cpf).eq("is_active", true).maybeSingle();
      return j({ active: !!data, max_price: data?.max_price || null });
    }

    if (mt === "POST" && a === "watchlist-toggle") {
      const b = await req.json();
      const { product_id, size, max_price } = b;
      if (!product_id) throw new Error("product_id obrigatório");
      const sz = size || "";
      // Check existing
      const { data: ex } = await sb.from("marketplace_watchlist").select("id, is_active")
        .eq("product_id", product_id).eq("size", sz).eq("user_cpf", cpf).maybeSingle();
      if (ex) {
        if (ex.is_active) {
          // Deactivate
          await sb.from("marketplace_watchlist").update({ is_active: false }).eq("id", ex.id);
          return j({ active: false, max_price: null });
        } else {
          // Reactivate
          await sb.from("marketplace_watchlist").update({ is_active: true, max_price: max_price || null }).eq("id", ex.id);
          return j({ active: true, max_price: max_price || null });
        }
      }
      // Create new
      await sb.from("marketplace_watchlist").insert({
        product_id, size: sz, user_cpf: cpf, max_price: max_price || null,
        is_active: true, notify_email: true, notify_push: true,
      });
      return j({ active: true, max_price: max_price || null });
    }

    // ==================== PRODUCT COMMENTS ====================

    if (mt === "GET" && a === "product-comments") {
      const pid = url.searchParams.get("product_id");
      if (!pid) throw new Error("product_id obrigatório");
      const { data, error } = await sb.from("marketplace_product_comments").select("*")
        .eq("product_id", pid).eq("is_visible", true).order("created_at", { ascending: true });
      if (error) throw error;
      return j({ comments: data || [] });
    }

    if (mt === "POST" && a === "product-comment") {
      const b = await req.json();
      if (!b.product_id || !b.content) throw new Error("product_id e content obrigatórios");
      // Get user name
      const { data: member } = await sb.from("vault_members").select("client_name").eq("client_cpf", cpf).maybeSingle();
      const userName = member?.client_name || "Usuário";
      const { data: comment, error } = await sb.from("marketplace_product_comments").insert({
        product_id: b.product_id,
        user_cpf: cpf,
        user_name: userName,
        content: b.content,
        parent_id: b.parent_id || null,
        is_seller_reply: false,
      }).select().single();
      if (error) throw error;
      return j({ comment });
    }

    // ==================== AUTO PAYOUT CHECK ====================

    if (mt === "GET" && a === "check-auto-payout") {
      // Find orders where protection has expired and payout not yet released
      const { data: orders, error } = await sb.from("vault_marketplace_orders").select("id, order_code, seller_id, seller_payout, protection_ends_at")
        .eq("status", "delivered").is("payout_released_at", null).is("dispute_status", null);
      if (error) throw error;
      const now = new Date();
      const eligible = (orders || []).filter((o: any) => o.protection_ends_at && new Date(o.protection_ends_at) < now);
      // Mark as payout_pending
      for (const o of eligible) {
        await sb.from("vault_marketplace_orders").update({
          status: "payout_pending",
        }).eq("id", o.id);
        // Notify seller
        const { data: sl } = await sb.from("vault_seller_profiles").select("member:vault_members!inner(client_cpf)").eq("id", o.seller_id).single();
        if (sl?.member?.client_cpf) {
          await nt(sb, "💰 Pagamento liberado!", `Pedido ${o.order_code} — R$ ${o.seller_payout.toFixed(2)} será transferido.`, sl.member.client_cpf, o.id, "marketplace_payout");
        }
      }
      return j({ checked: (orders || []).length, eligible: eligible.length });
    }

    // ==================== PRODUCT ANALYTICS ====================

    if (mt === "GET" && a === "product-analytics") {
      const pid = url.searchParams.get("product_id");
      if (!pid) throw new Error("product_id obrigatório");

      // Get all offers (active + sold) for price history
      const { data: allOffers } = await sb.from("marketplace_offers")
        .select("price, created_at, status, sold_at")
        .eq("product_id", pid)
        .order("created_at", { ascending: true });

      // Build daily price points (last 90 days)
      const now = new Date();
      const cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      const dailyMap: Record<string, { prices: number[] }> = {};

      for (const o of (allOffers || [])) {
        const d = new Date(o.created_at);
        if (d < cutoff) continue;
        const key = d.toISOString().slice(0, 10);
        if (!dailyMap[key]) dailyMap[key] = { prices: [] };
        dailyMap[key].prices.push(o.price);
      }

      const priceHistory = Object.entries(dailyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, { prices }]) => ({
          date,
          min_price: Math.min(...prices),
          avg_price: Math.round(prices.reduce((s, p) => s + p, 0) / prices.length),
          max_price: Math.max(...prices),
          offers_count: prices.length,
        }));

      // Sales stats
      const soldOffers = (allOffers || []).filter((o: any) => o.status === "sold" || o.sold_at);
      const totalSold = soldOffers.length;
      const avgSalePrice = totalSold > 0
        ? Math.round(soldOffers.reduce((s: number, o: any) => s + o.price, 0) / totalSold)
        : null;

      // Price trend (compare first half vs second half of recent offers)
      let priceTrend: "up" | "down" | "stable" = "stable";
      let trendPercent = 0;
      const recentOffers = (allOffers || []).filter((o: any) => new Date(o.created_at) >= cutoff);
      if (recentOffers.length >= 4) {
        const mid = Math.floor(recentOffers.length / 2);
        const firstHalf = recentOffers.slice(0, mid);
        const secondHalf = recentOffers.slice(mid);
        const avgFirst = firstHalf.reduce((s: number, o: any) => s + o.price, 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((s: number, o: any) => s + o.price, 0) / secondHalf.length;
        if (avgFirst > 0) {
          trendPercent = Math.abs(((avgSecond - avgFirst) / avgFirst) * 100);
          if (trendPercent > 2) {
            priceTrend = avgSecond > avgFirst ? "up" : "down";
          }
        }
      }

      return j({
        analytics: {
          price_history: priceHistory,
          total_sold: totalSold,
          avg_sale_price: avgSalePrice,
          price_trend: priceTrend,
          trend_percent: trendPercent,
        },
      });
    }

    // ==================== HUB PRO ====================

    if (mt === "GET" && a === "hub-orders") {
      // Get all PRO (bravenza) orders
      const { data, error } = await sb.from("vault_marketplace_orders").select(
        `*, listing:vault_marketplace_listings!inner(title, brand, model, size, photos, condition)`
      ).eq("shipping_mode", "bravenza").order("created_at", { ascending: false });
      if (error) throw error;
      return j({ orders: data || [] });
    }

    if (mt === "PUT" && a === "hub-update-status") {
      const b = await req.json();
      const u: Record<string, any> = { status: b.status };
      if (b.status === "hub_received") {
        u.hub_received_at = new Date().toISOString();
        u.status = "hub_received";
      } else if (b.status === "in_transit_to_hub") {
        u.hub_tracking_code = b.hub_tracking_code || null;
      } else if (b.status === "in_transit_to_buyer") {
        u.hub_tracking_to_buyer = b.hub_tracking_to_buyer || null;
        u.hub_shipped_at = new Date().toISOString();
      } else if (b.status === "cancelled" && b.refund_amount) {
        u.refund_amount = b.refund_amount;
        u.refund_at = new Date().toISOString();
        // Re-activate listing
        const { data: od } = await sb.from("vault_marketplace_orders").select("listing_id, buyer_cpf").eq("id", b.order_id).single();
        if (od?.listing_id) await sb.from("vault_marketplace_listings").update({ status: "active" }).eq("id", od.listing_id);
        if (od?.buyer_cpf) await nt(sb, "💰 Reembolso processado", `Pedido cancelado — inspeção reprovada. Reembolso de R$ ${b.refund_amount.toFixed(2)}.`, od.buyer_cpf, b.order_id, "marketplace_refund");
      }
      const { error } = await sb.from("vault_marketplace_orders").update(u).eq("id", b.order_id);
      if (error) throw error;
      // Notify buyer on key state changes
      if (["hub_received", "in_transit_to_buyer"].includes(b.status)) {
        const { data: od } = await sb.from("vault_marketplace_orders").select("buyer_cpf, order_code").eq("id", b.order_id).single();
        if (od?.buyer_cpf) {
          const msgs: Record<string, string> = {
            hub_received: `Pedido ${od.order_code} recebido no Hub Bravenza para inspeção.`,
            in_transit_to_buyer: `Pedido ${od.order_code} aprovado e enviado para você!`,
          };
          await nt(sb, "📦 Atualização do pedido", msgs[b.status] || "Status atualizado.", od.buyer_cpf, b.order_id, "marketplace_order");
        }
      }
      return j({ success: true });
    }

    if (mt === "POST" && a === "hub-inspect") {
      const b = await req.json();
      if (!b.order_id || !b.result) throw new Error("order_id e result obrigatórios");

      // Generate laudo ID and QR for approved inspections
      let laudoId: string | null = null;
      let laudoQrUrl: string | null = null;
      if (b.result === "approved") {
        laudoId = `BRV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        const baseUrl = Deno.env.get("SITE_URL") || "https://bravenza.lovable.app";
        laudoQrUrl = `${baseUrl}/autenticidade?laudo=${laudoId}`;
      }

      // Create inspection record
      const { data: insp, error: ie } = await sb.from("marketplace_inspections").insert({
        order_id: b.order_id,
        status: b.result === "approved" ? "inspection_approved" : "inspection_rejected",
        result: b.result,
        checklist: b.checklist || null,
        notes: b.notes || null,
        rejection_reason: b.rejection_reason || null,
        inspection_photos: b.inspection_photos || null,
        inspected_at: new Date().toISOString(),
        laudo_id: laudoId,
        laudo_qr_url: laudoQrUrl,
      }).select().single();
      if (ie) throw ie;

      // Update order
      const newStatus = b.result === "approved" ? "inspection_approved" : "inspection_rejected";
      await sb.from("vault_marketplace_orders").update({
        status: newStatus,
        inspection_id: insp.id,
        inspection_result: b.result,
      }).eq("id", b.order_id);

      // Notify buyer
      const { data: od } = await sb.from("vault_marketplace_orders").select("buyer_cpf, order_code, seller_id").eq("id", b.order_id).single();
      if (od?.buyer_cpf) {
        if (b.result === "approved") {
          await nt(sb, "✅ Inspeção aprovada!", `Pedido ${od.order_code} autenticado! Laudo: ${laudoId}`, od.buyer_cpf, b.order_id, "marketplace_inspection");
        } else {
          await nt(sb, "❌ Inspeção reprovada", `Pedido ${od.order_code} não passou na inspeção. Motivo: ${b.rejection_reason || "Veja detalhes"}`, od.buyer_cpf, b.order_id, "marketplace_inspection");
          const { data: sl } = await sb.from("vault_seller_profiles").select("member:vault_members!inner(client_cpf)").eq("id", od.seller_id).single();
          if (sl?.member?.client_cpf) {
            await nt(sb, "❌ Item reprovado na inspeção", `Pedido ${od.order_code}: ${b.rejection_reason || "Não passou na autenticação"}.`, sl.member.client_cpf, b.order_id, "marketplace_inspection");
          }
        }
        // Email: inspection result to buyer
        const buyerEmail = await ge(sb, od.buyer_cpf);
        if (buyerEmail) {
          em("mk_inspection_result", {
            recipient_name: buyerEmail.name, recipient_email: buyerEmail.email,
            order_code: od.order_code, inspection_result: b.result,
            rejection_reason: b.rejection_reason || null,
          });
        }
      }
      return j({ success: true, inspection: insp, laudo_id: laudoId, laudo_qr_url: laudoQrUrl });
    }

    // ==================== LAUDO LOOKUP ====================
    if (mt === "GET" && a === "laudo-lookup") {
      const laudoId = url.searchParams.get("laudo_id");
      if (!laudoId) throw new Error("laudo_id obrigatório");
      const { data: insp } = await sb.from("marketplace_inspections").select(
        `*, order:vault_marketplace_orders!inner(order_code, buyer_name, sale_price, listing:vault_marketplace_listings!inner(title, brand, model, size, photos, condition))`
      ).eq("laudo_id", laudoId).eq("result", "approved").maybeSingle();
      if (!insp) return j({ found: false });
      return j({
        found: true,
        laudo: {
          laudo_id: insp.laudo_id,
          inspected_at: insp.inspected_at,
          checklist: insp.checklist,
          notes: insp.notes,
          inspection_photos: insp.inspection_photos,
          order_code: insp.order?.order_code,
          product: {
            title: insp.order?.listing?.title,
            brand: insp.order?.listing?.brand,
            model: insp.order?.listing?.model,
            size: insp.order?.listing?.size,
            condition: insp.order?.listing?.condition,
            photos: insp.order?.listing?.photos,
          },
        },
      });
    }

    // ==================== SELLER TIER CALCULATION ====================

    if (mt === "POST" && a === "recalc-seller-tier") {
      const b = await req.json();
      const sid = b.seller_id;
      if (!sid) throw new Error("seller_id obrigatório");

      // Get all completed orders for this seller
      const { data: allOrders } = await sb.from("vault_marketplace_orders")
        .select("status, shipped_at, paid_at, dispute_status, inspection_result, created_at")
        .eq("seller_id", sid);

      const orders = allOrders || [];
      const total = orders.length;
      if (total === 0) {
        await sb.from("vault_seller_profiles").update({ tier: "bronze", tier_updated_at: new Date().toISOString() }).eq("id", sid);
        return j({ tier: "bronze", metrics: {} });
      }

      // Calculate metrics
      const completed = orders.filter((o: any) => ["completed", "delivered", "payout_released", "payout_pending"].includes(o.status));
      const cancelled = orders.filter((o: any) => o.status === "cancelled");
      const disputed = orders.filter((o: any) => o.dispute_status === "open" || o.dispute_status === "resolved_buyer");
      const proOrders = orders.filter((o: any) => o.inspection_result);
      const proApproved = proOrders.filter((o: any) => o.inspection_result === "approved");

      // On-time: shipped within 3 days of paid
      const shippedOrders = orders.filter((o: any) => o.shipped_at && o.paid_at);
      const onTime = shippedOrders.filter((o: any) => {
        const diff = (new Date(o.shipped_at).getTime() - new Date(o.paid_at).getTime()) / (1000 * 60 * 60 * 24);
        return diff <= 3;
      });

      const onTimeRate = shippedOrders.length > 0 ? Math.round((onTime.length / shippedOrders.length) * 100) : 100;
      const cancellationRate = total > 0 ? Math.round((cancelled.length / total) * 100) : 0;
      const disputeRate = total > 0 ? Math.round((disputed.length / total) * 100) : 0;
      const proApprovalRate = proOrders.length > 0 ? Math.round((proApproved.length / proOrders.length) * 100) : 100;

      // Determine tier
      let tier = "bronze";
      let payoutDays = 10;
      let feePercent = 14;

      if (completed.length >= 50 && onTimeRate >= 95 && disputeRate <= 2 && cancellationRate <= 3 && proApprovalRate >= 98) {
        tier = "elite"; payoutDays = 3; feePercent = 8;
      } else if (completed.length >= 20 && onTimeRate >= 90 && disputeRate <= 5 && cancellationRate <= 5 && proApprovalRate >= 95) {
        tier = "ouro"; payoutDays = 5; feePercent = 10;
      } else if (completed.length >= 5 && onTimeRate >= 80 && disputeRate <= 10 && cancellationRate <= 10) {
        tier = "prata"; payoutDays = 7; feePercent = 12;
      }

      await sb.from("vault_seller_profiles").update({
        tier, tier_updated_at: new Date().toISOString(),
        on_time_shipping_rate: onTimeRate,
        cancellation_rate: cancellationRate,
        dispute_rate: disputeRate,
        pro_approval_rate: proApprovalRate,
        payout_speed_days: payoutDays,
        current_fee_percent: feePercent,
      }).eq("id", sid);

      return j({
        tier,
        metrics: { total_orders: total, completed: completed.length, onTimeRate, cancellationRate, disputeRate, proApprovalRate },
        benefits: { payout_days: payoutDays, fee_percent: feePercent },
      });
    }

    // ==================== SELLER ONBOARDING ====================

    if (mt === "GET" && a === "seller-onboarding-status") {
      const mb = await gm(sb, cpf);
      if (!mb) return j({ onboarded: false, seller: null });
      const sl = await gs(sb, mb.id);
      if (!sl) return j({ onboarded: false, seller: null });
      return j({
        onboarded: !!sl.onboarding_completed_at,
        seller: {
          id: sl.id,
          full_name: sl.full_name,
          cpf_cnpj: sl.cpf_cnpj ? `***${sl.cpf_cnpj.slice(-4)}` : null,
          phone: sl.phone ? `***${sl.phone.slice(-4)}` : null,
           pix_key_type: sl.pix_key_type,
           pix_key: sl.pix_key ? `${sl.pix_key.slice(0, 3)}***` : null,
           pix_beneficiary: sl.pix_beneficiary,
           bank_name: sl.bank_name,
           account_type: sl.account_type || "pf",
          kyc_status: sl.kyc_status,
          terms_accepted_at: sl.terms_accepted_at,
          onboarding_completed_at: sl.onboarding_completed_at,
        },
      });
    }

    if (mt === "POST" && a === "seller-onboarding") {
      const b = await req.json();
      const mb = await gm(sb, cpf);
      if (!mb) throw new Error("Membro não encontrado");

      // Validate required fields
      if (!b.full_name || !b.cpf_cnpj || !b.phone || !b.seller_cep || !b.pix_key_type || !b.pix_key || !b.pix_beneficiary || !b.bank_name || !b.terms_accepted) {
        throw new Error("Todos os campos obrigatórios devem ser preenchidos");
      }

      const hasDocuments = b.id_front_url && b.id_back_url && b.id_selfie_url;

      let sl = await gs(sb, mb.id);
      const isCnpj = b.cpf_cnpj.length > 11;
      const onboardingData: Record<string, unknown> = {
        full_name: b.full_name,
        cpf_cnpj: b.cpf_cnpj,
        phone: b.phone,
        seller_cep: b.seller_cep,
        pix_key_type: b.pix_key_type,
        pix_key: b.pix_key,
        pix_beneficiary: b.pix_beneficiary,
        bank_name: b.bank_name,
        account_type: isCnpj ? "pj" : "pf",
        terms_accepted_at: new Date().toISOString(),
        kyc_status: hasDocuments ? "pending_review" : "pending_docs",
        onboarding_completed_at: new Date().toISOString(),
      };

      if (hasDocuments) {
        onboardingData.id_front_url = b.id_front_url;
        onboardingData.id_back_url = b.id_back_url;
        onboardingData.id_selfie_url = b.id_selfie_url;
      }

      if (sl) {
        await sb.from("vault_seller_profiles").update(onboardingData).eq("id", sl.id);
      } else {
        const { error } = await sb.from("vault_seller_profiles").insert({ member_id: mb.id, ...onboardingData });
        if (error) throw error;
      }

      // Notify admins about new seller pending review
      if (hasDocuments) {
        await sb.from("notifications").insert({
          title: "Novo vendedor aguardando aprovação",
          message: `${b.full_name} enviou documentos para verificação de identidade.`,
          target: "admin",
          type: "info",
          reference_type: "seller_kyc",
        });
      }

      console.log("Seller onboarding completed for CPF:", cpf, "kyc_status:", hasDocuments ? "pending_review" : "pending_docs");
      return j({ success: true });
    }

    if (mt === "GET" && a === "seller-tier-info") {
      const sid = url.searchParams.get("seller_id");
      if (!sid) throw new Error("seller_id obrigatório");
      const { data } = await sb.from("vault_seller_profiles").select(
        "tier, on_time_shipping_rate, cancellation_rate, dispute_rate, pro_approval_rate, payout_speed_days, current_fee_percent, total_sales_count, average_rating"
      ).eq("id", sid).single();
      if (!data) throw new Error("Vendedor não encontrado");

      const tierConfig: Record<string, { label: string; color: string; nextTier: string | null; nextReqs: string }> = {
        bronze: { label: "Bronze", color: "#CD7F32", nextTier: "prata", nextReqs: "5 vendas, 80% no prazo" },
        prata: { label: "Prata", color: "#C0C0C0", nextTier: "ouro", nextReqs: "20 vendas, 90% no prazo, <5% disputas" },
        ouro: { label: "Ouro", color: "#D4AF37", nextTier: "elite", nextReqs: "50 vendas, 95% no prazo, <2% disputas" },
        elite: { label: "Elite", color: "#B9F2FF", nextTier: null, nextReqs: "Nível máximo alcançado!" },
      };

      return j({ ...data, tierInfo: tierConfig[data.tier] || tierConfig.bronze });
    }

    // ==================== COUPONS ====================

    if (mt === "POST" && a === "create-coupon") {
      const b = await req.json();
      const mb = await gm(sb, cpf);
      if (!mb) throw new Error("Membro não encontrado");
      const sl = await gs(sb, mb.id);
      if (!sl) throw new Error("Vendedor não encontrado");
      if (!b.code || !b.discount_value) throw new Error("code e discount_value obrigatórios");
      const { data: coupon, error } = await sb.from("marketplace_coupons").insert({
        seller_id: sl.id, code: b.code.toUpperCase().trim(),
        discount_type: b.discount_type || "percent", discount_value: b.discount_value,
        min_purchase: b.min_purchase || 0, max_uses: b.max_uses || null,
        valid_until: b.valid_until || null, listing_ids: b.listing_ids || null,
      }).select().single();
      if (error) throw error;
      return j({ success: true, coupon });
    }

    if (mt === "GET" && a === "my-coupons") {
      const mb = await gm(sb, cpf);
      if (!mb) return j({ coupons: [] });
      const sl = await gs(sb, mb.id);
      if (!sl) return j({ coupons: [] });
      const { data } = await sb.from("marketplace_coupons").select("*").eq("seller_id", sl.id).order("created_at", { ascending: false });
      return j({ coupons: data || [] });
    }

    if (mt === "PUT" && a === "update-coupon") {
      const b = await req.json();
      const mb = await gm(sb, cpf);
      if (!mb) throw new Error("Membro não encontrado");
      const sl = await gs(sb, mb.id);
      if (!sl) throw new Error("Vendedor não encontrado");
      const { error } = await sb.from("marketplace_coupons").update({
        is_active: b.is_active, max_uses: b.max_uses, valid_until: b.valid_until,
        discount_value: b.discount_value, min_purchase: b.min_purchase,
      }).eq("id", b.coupon_id).eq("seller_id", sl.id);
      if (error) throw error;
      return j({ success: true });
    }

    if (mt === "DELETE" && a === "delete-coupon") {
      const id = url.searchParams.get("id");
      if (!id) throw new Error("ID obrigatório");
      const mb = await gm(sb, cpf);
      if (!mb) throw new Error("Membro não encontrado");
      const sl = await gs(sb, mb.id);
      if (!sl) throw new Error("Vendedor não encontrado");
      await sb.from("marketplace_coupons").delete().eq("id", id).eq("seller_id", sl.id);
      return j({ success: true });
    }

    if (mt === "POST" && a === "validate-coupon") {
      const b = await req.json();
      if (!b.code || !b.listing_id) throw new Error("code e listing_id obrigatórios");
      const { data: listing } = await sb.from("vault_marketplace_listings").select("seller_id, price").eq("id", b.listing_id).single();
      if (!listing) throw new Error("Anúncio não encontrado");
      const { data: coupon } = await sb.from("marketplace_coupons").select("*")
        .eq("seller_id", listing.seller_id).eq("code", b.code.toUpperCase().trim()).eq("is_active", true).maybeSingle();
      if (!coupon) return j({ valid: false, reason: "Cupom não encontrado ou inativo" });
      if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) return j({ valid: false, reason: "Cupom expirado" });
      if (coupon.max_uses && coupon.uses_count >= coupon.max_uses) return j({ valid: false, reason: "Cupom esgotado" });
      if (coupon.min_purchase && listing.price < coupon.min_purchase) return j({ valid: false, reason: `Compra mínima: R$ ${coupon.min_purchase}` });
      if (coupon.listing_ids && coupon.listing_ids.length > 0 && !coupon.listing_ids.includes(b.listing_id)) return j({ valid: false, reason: "Cupom não válido para este anúncio" });
      const discount = coupon.discount_type === "percent" ? Math.round(listing.price * coupon.discount_value / 100) : coupon.discount_value;
      return j({ valid: true, coupon_id: coupon.id, discount, discount_type: coupon.discount_type, discount_value: coupon.discount_value, final_price: Math.max(0, listing.price - discount) });
    }

    if (mt === "POST" && a === "use-coupon") {
      const b = await req.json();
      if (!b.coupon_id) throw new Error("coupon_id obrigatório");
      await sb.from("marketplace_coupons").update({ uses_count: sb.rpc ? undefined : 0 }).eq("id", b.coupon_id);
      // Increment uses_count
      const { data: c } = await sb.from("marketplace_coupons").select("uses_count").eq("id", b.coupon_id).single();
      if (c) await sb.from("marketplace_coupons").update({ uses_count: (c.uses_count || 0) + 1 }).eq("id", b.coupon_id);
      return j({ success: true });
    }

    // ==================== SELLER ANALYTICS ====================

    if (mt === "GET" && a === "seller-analytics") {
      const mb = await gm(sb, cpf);
      if (!mb) return j({ analytics: null });
      const sl = await gs(sb, mb.id);
      if (!sl) return j({ analytics: null });

      // Total views from all listings
      const { data: listings } = await sb.from("vault_marketplace_listings").select("id, views_count, price, status, created_at, published_at").eq("seller_id", sl.id);
      const totalViews = (listings || []).reduce((s: number, l: any) => s + (l.views_count || 0), 0);
      const activeListings = (listings || []).filter((l: any) => l.status === "active").length;

      // Orders (sales)
      const { data: orders } = await sb.from("vault_marketplace_orders").select("id, status, sale_price, fee_amount, seller_payout, created_at, paid_at, payout_released_at").eq("seller_id", sl.id);
      const completedOrders = (orders || []).filter((o: any) => ["delivered", "payout_released", "payout_pending", "completed"].includes(o.status));
      const totalRevenue = completedOrders.reduce((s: number, o: any) => s + (o.seller_payout || 0), 0);
      const totalFees = completedOrders.reduce((s: number, o: any) => s + (o.fee_amount || 0), 0);
      const conversionRate = totalViews > 0 ? Math.round((completedOrders.length / totalViews) * 10000) / 100 : 0;

      // Monthly breakdown (last 6 months)
      const monthlyData: Record<string, { revenue: number; sales: number; views: number }> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthlyData[key] = { revenue: 0, sales: 0, views: 0 };
      }
      for (const o of completedOrders) {
        const key = o.created_at.slice(0, 7);
        if (monthlyData[key]) { monthlyData[key].revenue += o.seller_payout || 0; monthlyData[key].sales += 1; }
      }

      return j({
        analytics: {
          total_views: totalViews, active_listings: activeListings,
          total_sales: completedOrders.length, total_revenue: Math.round(totalRevenue * 100) / 100,
          total_fees: Math.round(totalFees * 100) / 100, conversion_rate: conversionRate,
          average_order_value: completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length) : 0,
          monthly: Object.entries(monthlyData).map(([month, data]) => ({ month, ...data })),
          tier: sl.tier || "bronze", fee_percent: sl.current_fee_percent || 14,
          rating: sl.average_rating, ratings_count: sl.ratings_count || 0,
        },
      });
    }

    // ==================== ACTIVITY FEED ====================

    if (mt === "GET" && a === "activity-feed") {
      const limit = parseInt(url.searchParams.get("limit") || "20");
      const { data, error } = await sb.from("marketplace_activity_feed").select("*").order("created_at", { ascending: false }).limit(limit);
      if (error) throw error;
      return j({ events: data || [] });
    }

    if (mt === "POST" && a === "log-activity") {
      const b = await req.json();
      await sb.from("marketplace_activity_feed").insert({
        event_type: b.event_type, title: b.title, description: b.description || null,
        listing_id: b.listing_id || null, product_id: b.product_id || null,
        seller_id: b.seller_id || null, metadata: b.metadata || {},
      });
      return j({ success: true });
    }

    if (mt === "GET" && a === "price-drop-suggestions") {
      const mb = await gm(sb, cpf);
      if (!mb) return j({ suggestions: [] });
      const sl = await gs(sb, mb.id);
      if (!sl) return j({ suggestions: [] });

      // Fetch active listings older than 7 days with low views
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: staleListings } = await sb
        .from("vault_marketplace_listings")
        .select("id, title, price, views_count, created_at, published_at")
        .eq("seller_id", sl.id)
        .eq("status", "active")
        .lt("published_at", sevenDaysAgo)
        .order("published_at", { ascending: true });

      if (!staleListings || staleListings.length === 0) return j({ suggestions: [] });

      const suggestions = staleListings.map((l: any) => {
        const daysListed = Math.floor((Date.now() - new Date(l.published_at || l.created_at).getTime()) / (1000 * 60 * 60 * 24));
        let dropPercent = 5;
        let reason = "Sem vendas há mais de 7 dias";
        if (daysListed > 30) { dropPercent = 15; reason = "Anúncio parado há mais de 30 dias — redução agressiva recomendada"; }
        else if (daysListed > 14) { dropPercent = 10; reason = "Sem interesse há 2+ semanas — considere reduzir o preço"; }
        if (l.views_count < 5) { dropPercent += 3; reason += ". Poucas visualizações"; }

        const suggestedPrice = Math.round(l.price * (1 - dropPercent / 100));
        return {
          listing_id: l.id,
          title: l.title,
          current_price: l.price,
          suggested_price: suggestedPrice,
          days_listed: daysListed,
          views: l.views_count || 0,
          reason,
        };
      });

      return j({ suggestions });
    }

    // ==================== PRODUCT COMMENTS (Q&A) ====================
    if (mt === "GET" && a === "product-comments") {
      const pid = url.searchParams.get("product_id");
      if (!pid) return j({ error: "product_id obrigatório" }, 400);
      const { data: cmts } = await sb.from("marketplace_product_comments")
        .select("*")
        .eq("product_id", pid)
        .eq("is_visible", true)
        .order("created_at", { ascending: true });
      return j({ comments: cmts || [] });
    }

    if (mt === "POST" && a === "product-comment") {
      const body = await req.json();
      const { product_id, content, parent_id } = body;
      if (!product_id || !content) return j({ error: "product_id e content obrigatórios" }, 400);

      const m = await gm(sb, cpf);
      let userName = "Anônimo";
      if (m) {
        const { data: mem } = await sb.from("vault_members").select("client_name").eq("id", m.id).single();
        if (mem) userName = mem.client_name;
      }

      const { data, error } = await sb.from("marketplace_product_comments").insert({
        product_id,
        user_cpf: cpf,
        user_name: userName,
        content,
        parent_id: parent_id || null,
      }).select().single();

      if (error) return j({ error: error.message }, 400);
      return j({ comment: data });
    }

    // ==================== CHECK PURCHASE (for review permission) ====================
    if (mt === "GET" && a === "check-purchase") {
      const pid = url.searchParams.get("product_id");
      if (!pid) return j({ error: "product_id obrigatório" }, 400);
      // Check if user has a delivered/completed marketplace order for an offer of this product
      const { data: orders } = await sb.from("vault_marketplace_orders")
        .select("id")
        .eq("buyer_cpf", cpf)
        .in("status", ["delivered", "completed"])
        .limit(100);

      let hasPurchased = false;
      if (orders && orders.length > 0) {
        // Check if any sold offer exists for this product
        const { data: soldOffers } = await sb.from("marketplace_offers")
          .select("id")
          .eq("product_id", pid)
          .eq("status", "sold")
          .limit(1);
        if (soldOffers && soldOffers.length > 0) {
          hasPurchased = true;
        }
      }
      return j({ has_purchased: hasPurchased });
    }

    // ==================== PRODUCT REVIEWS ====================
    if (mt === "GET" && a === "product-reviews") {
      const pid = url.searchParams.get("product_id");
      if (!pid) return j({ error: "product_id obrigatório" }, 400);
      const { data: reviews } = await sb.from("marketplace_product_reviews")
        .select("*")
        .eq("product_id", pid)
        .eq("is_visible", true)
        .order("created_at", { ascending: false });

      const list = reviews || [];
      const avg = list.length > 0 ? list.reduce((s: number, r: any) => s + r.rating, 0) / list.length : 0;
      return j({ reviews: list, average: Math.round(avg * 10) / 10, total: list.length });
    }

    if (mt === "POST" && a === "product-review") {
      const body = await req.json();
      const { product_id, rating, comment, product_quality, authenticity_score, shipping_speed } = body;
      if (!product_id || !rating) return j({ error: "product_id e rating obrigatórios" }, 400);

      const m = await gm(sb, cpf);
      let reviewerName = "Anônimo";
      if (m) {
        const { data: mem } = await sb.from("vault_members").select("client_name").eq("id", m.id).single();
        if (mem) reviewerName = mem.client_name;
      }

      const { data, error } = await sb.from("marketplace_product_reviews").insert({
        product_id,
        reviewer_cpf: cpf,
        reviewer_name: reviewerName,
        rating,
        comment: comment || null,
        product_quality: product_quality || null,
        authenticity_score: authenticity_score || null,
        shipping_speed: shipping_speed || null,
      }).select().single();

      if (error) return j({ error: error.message }, 400);
      return j({ review: data });
    }

    // ==================== BOOST SYSTEM ====================

    if (mt === "POST" && a === "boost-activate") {
      const b = await req.json();
      const { offer_id } = b;
      if (!offer_id) throw new Error("offer_id obrigatório");
      const mb = await gm(sb, cpf);
      if (!mb) throw new Error("Membro não encontrado");
      const sl = await gs(sb, mb.id);
      if (!sl) throw new Error("Vendedor não encontrado");
      // Check plan boost slots
      const { data: plan } = await sb.from("marketplace_plans").select("boost_slots").eq("id", sl.plan_id || "free").single();
      const maxBoosts = plan?.boost_slots || 1;
      // Count current active boosts
      const { data: activeBoosts } = await sb.from("marketplace_offers").select("id")
        .eq("seller_id", sl.id).not("boost_level", "is", null)
        .gt("boost_active_until", new Date().toISOString());
      if ((activeBoosts?.length || 0) >= maxBoosts) {
        throw new Error(`Limite de ${maxBoosts} boost(s) do seu plano atingido.`);
      }
      // Activate boost for 7 days
      const boostUntil = new Date();
      boostUntil.setDate(boostUntil.getDate() + 7);
      const boostLevel = sl.plan_id === "elite" ? "premium" : sl.plan_id === "pro" ? "standard" : "basic";
      const { error } = await sb.from("marketplace_offers").update({
        boost_level: boostLevel,
        boost_active_until: boostUntil.toISOString(),
      }).eq("id", offer_id).eq("seller_id", sl.id);
      if (error) throw error;
      // Also boost the linked listing
      const { data: offer } = await sb.from("marketplace_offers").select("listing_id").eq("id", offer_id).single();
      if (offer?.listing_id) {
        await sb.from("vault_marketplace_listings").update({ pro_recommendation: "boosted" }).eq("id", offer.listing_id);
      }
      return j({ success: true, boost_level: boostLevel, boost_until: boostUntil.toISOString() });
    }

    if (mt === "POST" && a === "boost-deactivate") {
      const b = await req.json();
      const mb = await gm(sb, cpf);
      if (!mb) throw new Error("Membro não encontrado");
      const sl = await gs(sb, mb.id);
      if (!sl) throw new Error("Vendedor não encontrado");
      await sb.from("marketplace_offers").update({ boost_level: null, boost_active_until: null })
        .eq("id", b.offer_id).eq("seller_id", sl.id);
      return j({ success: true });
    }

    if (mt === "GET" && a === "my-boosts") {
      const mb = await gm(sb, cpf);
      if (!mb) return j({ boosts: [], max_slots: 1 });
      const sl = await gs(sb, mb.id);
      if (!sl) return j({ boosts: [], max_slots: 1 });
      const { data: plan } = await sb.from("marketplace_plans").select("boost_slots").eq("id", sl.plan_id || "free").single();
      const { data: boosts } = await sb.from("marketplace_offers").select("id, boost_level, boost_active_until, product_id, size, price")
        .eq("seller_id", sl.id).not("boost_level", "is", null)
        .gt("boost_active_until", new Date().toISOString());
      return j({ boosts: boosts || [], max_slots: plan?.boost_slots || 1, used: (boosts?.length || 0) });
    }

    // ==================== COLLECTIONS (Elite storefront) ====================

    if (mt === "GET" && a === "my-collections") {
      const mb = await gm(sb, cpf);
      if (!mb) return j({ collections: [] });
      const sl = await gs(sb, mb.id);
      if (!sl) return j({ collections: [] });
      const { data } = await sb.from("seller_collections").select("*").eq("seller_id", sl.id).order("sort_order", { ascending: true });
      return j({ collections: data || [] });
    }

    if (mt === "POST" && a === "create-collection") {
      const b = await req.json();
      const mb = await gm(sb, cpf);
      if (!mb) throw new Error("Membro não encontrado");
      const sl = await gs(sb, mb.id);
      if (!sl) throw new Error("Vendedor não encontrado");
      if (sl.plan_id !== "elite") throw new Error("Coleções disponíveis apenas no plano Elite.");
      const { data, error } = await sb.from("seller_collections").insert({
        seller_id: sl.id, name: b.name, description: b.description || null,
        cover_image: b.cover_image || null, listing_ids: b.listing_ids || [],
      }).select().single();
      if (error) throw error;
      return j({ collection: data });
    }

    if (mt === "PUT" && a === "update-collection") {
      const b = await req.json();
      const mb = await gm(sb, cpf);
      if (!mb) throw new Error("Membro não encontrado");
      const sl = await gs(sb, mb.id);
      if (!sl) throw new Error("Vendedor não encontrado");
      const { error } = await sb.from("seller_collections").update({
        name: b.name, description: b.description, cover_image: b.cover_image,
        listing_ids: b.listing_ids, is_active: b.is_active, updated_at: new Date().toISOString(),
      }).eq("id", b.id).eq("seller_id", sl.id);
      if (error) throw error;
      return j({ success: true });
    }

    if (mt === "DELETE" && a === "delete-collection") {
      const id = url.searchParams.get("id");
      if (!id) throw new Error("ID obrigatório");
      const mb = await gm(sb, cpf);
      if (!mb) throw new Error("Membro não encontrado");
      const sl = await gs(sb, mb.id);
      if (!sl) throw new Error("Vendedor não encontrado");
      await sb.from("seller_collections").delete().eq("id", id).eq("seller_id", sl.id);
      return j({ success: true });
    }

    return j({ error: "Ação não encontrada" }, 404);
  } catch (e: any) {
    console.error("vault-marketplace error:", e);
    return j({ error: e.message }, 500);
  }
});
