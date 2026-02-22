// mk-hub: Catalog, Listings, Search, Offers/Negotiation, Product interactions, Admin Moderation
// Orders/payments → mk-orders | Seller operations → mk-seller
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders, jsonResponse, createSupabaseClient, resolveCpf,
  getMember, getSellerProfile, notify, getMemberEmail, sendMarketplaceEmail, sendMarketplaceWhatsApp,
} from "../_shared/mk-helpers.ts";

const j = jsonResponse;
const gm = getMember;
const gs = getSellerProfile;
const nt = notify;
const ge = getMemberEmail;
const em = sendMarketplaceEmail;
const wa = sendMarketplaceWhatsApp;

const PUBLIC_ACTIONS = new Set([
  "listings", "listing-detail", "seller-public-profile",
  "catalog-products", "catalog-product", "catalog-offers", "catalog-search",
  "activity-feed", "product-comments", "product-reviews", "product-analytics",
  "freight-quote", "price-history", "recommendations", "product-coupons",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const sb = createSupabaseClient();
  const url = new URL(req.url);
  const a = url.searchParams.get("action");
  const mt = req.method;

  console.log("mk-hub", a, mt);

  const auth = await resolveCpf(req, sb, PUBLIC_ACTIONS, a);
  if (auth.errorResponse) return auth.errorResponse;
  const cpf = auth.cpf;

  try {
    // ==================== LISTINGS ====================

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
      if (to === "true") q = q.in("seller.member.tier", ["ouro", "elite"]);
      if (so === "price_asc") q = q.order("price", { ascending: true });
      else if (so === "price_desc") q = q.order("price", { ascending: false });
      else if (so === "popular") q = q.order("views_count", { ascending: false });
      else q = q.order("published_at", { ascending: false });
      q = q.range(of, of + lm - 1);
      const { data, count, error } = await q;
      if (error) throw error;
      const planOrder: Record<string, number> = { elite: 3, pro: 2, free: 1 };
      let sorted: any[];
      if (so === "best_seller") {
        sorted = (data || []).sort((a: any, b: any) => (b.seller?.total_sales_count || 0) - (a.seller?.total_sales_count || 0));
      } else if (so === "recent" || !so) {
        sorted = (data || []).sort((a: any, b: any) => {
          const aBoosted = a.seller?.plan_id !== "free" && a.pro_recommendation === "boosted" ? 1 : 0;
          const bBoosted = b.seller?.plan_id !== "free" && b.pro_recommendation === "boosted" ? 1 : 0;
          if (bBoosted !== aBoosted) return bBoosted - aBoosted;
          const aPlan = planOrder[a.seller?.plan_id || "free"] || 0;
          const bPlan = planOrder[b.seller?.plan_id || "free"] || 0;
          if (bPlan !== aPlan) return bPlan - aPlan;
          return 0;
        });
      } else {
        sorted = data || [];
      }
      const ids = sorted.map((l: any) => l.id);
      let fs = new Set<string>();
      if (ids.length > 0) {
        const { data: fv } = await sb.from("vault_marketplace_favorites").select("listing_id").eq("user_cpf", cpf).in("listing_id", ids);
        fs = new Set((fv || []).map((f: any) => f.listing_id));
      }
      return j({ listings: sorted.map((l: any) => ({ ...l, is_favorited: fs.has(l.id) })), total: count });
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
        `id, bio, avatar_url, storefront_banner, storefront_tagline, total_sales_count, total_sales_value, average_rating, ratings_count, current_fee_percent, plan_id, verified_badge, followers_count, member:vault_members!inner(client_name, tier, created_at)`
      ).eq("id", sid).single();
      if (!sl) throw new Error("Vendedor não encontrado");
      const { data: ls } = await sb.from("vault_marketplace_listings").select("*").eq("seller_id", sid).eq("status", "active").order("published_at", { ascending: false });
      const { data: rv } = await sb.from("vault_marketplace_orders").select("buyer_name, buyer_rating, buyer_review, created_at").eq("seller_id", sid).not("buyer_rating", "is", null).order("created_at", { ascending: false }).limit(10);
      const { data: collections } = await sb.from("seller_collections").select("*").eq("seller_id", sid).eq("is_active", true).order("sort_order", { ascending: true });
      return j({ ...sl, listings: ls || [], recent_reviews: rv || [], collections: collections || [] });
    }

    // ==================== OFFERS / NEGOTIATION ====================

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
        bundle_id: b.bundle_id || null, bundle_discount_percent: b.bundle_discount_percent || 0,
      }).select().single();
      if (error) throw error;
      await sb.from("marketplace_negotiation_events").insert({
        offer_id: of2.id, event_type: "offer_made", actor_cpf: cpf,
        actor_name: b.buyer_name || "Comprador", price: b.offer_price, message: b.message || null,
      });
      await nt(sb, "💰 Nova oferta!", `R$ ${b.offer_price.toFixed(2)} por "${li.title}".`, li.seller.member.client_cpf, li.id, "marketplace_offer");
      const sellerOfferEmail = await ge(sb, li.seller.member.client_cpf);
      if (sellerOfferEmail) {
        em("mk_offer_received", {
          recipient_name: sellerOfferEmail.name, recipient_email: sellerOfferEmail.email,
          listing_title: li.title, offer_price: b.offer_price,
          buyer_name: b.buyer_name || "Comprador",
        });
        if (sellerOfferEmail.phone) wa("mk_offer_received", { recipient_phone: sellerOfferEmail.phone, recipient_name: sellerOfferEmail.name, listing_title: li.title, offer_price: b.offer_price, buyer_name: b.buyer_name || "Comprador" });
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
        `id, listing_id, buyer_cpf, buyer_name, offer_price, listing:vault_marketplace_listings!inner(title)`
      ).eq("id", b.offer_id).single();
      if (!of2) throw new Error("Oferta não encontrada");
      const u: Record<string, any> = { responded_at: new Date().toISOString() };
      if (b.response === "accept") {
        u.status = "accepted";
        await sb.from("marketplace_negotiation_events").insert({ offer_id: of2.id, event_type: "accepted", actor_cpf: cpf, price: of2.offer_price });
        await nt(sb, "✅ Oferta aceita!", `Oferta por "${of2.listing?.title}" aceita!`, of2.buyer_cpf, of2.listing_id, "marketplace_offer");
        const buyerAccEmail = await ge(sb, of2.buyer_cpf);
        if (buyerAccEmail) {
          em("mk_offer_accepted", { recipient_name: buyerAccEmail.name, recipient_email: buyerAccEmail.email, listing_title: of2.listing?.title, offer_price: of2.offer_price });
          if (buyerAccEmail.phone) wa("mk_offer_accepted", { recipient_phone: buyerAccEmail.phone, recipient_name: buyerAccEmail.name, listing_title: of2.listing?.title, offer_price: of2.offer_price });
        }
      } else if (b.response === "reject") {
        u.status = "rejected";
        await sb.from("marketplace_negotiation_events").insert({ offer_id: of2.id, event_type: "rejected", actor_cpf: cpf, message: b.reason || null });
        await nt(sb, "❌ Recusada", `Oferta por "${of2.listing?.title}" recusada.`, of2.buyer_cpf, of2.listing_id, "marketplace_offer");
        const buyerRejEmail = await ge(sb, of2.buyer_cpf);
        if (buyerRejEmail) {
          em("mk_offer_rejected", { recipient_name: buyerRejEmail.name, recipient_email: buyerRejEmail.email, listing_title: of2.listing?.title, offer_price: of2.offer_price, reject_reason: b.reason || "Sem motivo informado" });
          if (buyerRejEmail.phone) wa("mk_offer_rejected", { recipient_phone: buyerRejEmail.phone, recipient_name: buyerRejEmail.name, listing_title: of2.listing?.title, offer_price: of2.offer_price });
        }
      } else if (b.response === "counter") {
        u.status = "counter"; u.counter_price = b.counter_price; u.counter_message = b.counter_message || null;
        u.expires_at = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
        await sb.from("marketplace_negotiation_events").insert({ offer_id: of2.id, event_type: "counter_sent", actor_cpf: cpf, price: b.counter_price, message: b.counter_message || null });
        await nt(sb, "🔄 Contra-proposta!", `R$ ${b.counter_price?.toFixed(2)} por "${of2.listing?.title}".`, of2.buyer_cpf, of2.listing_id, "marketplace_offer");
        const buyerCntEmail = await ge(sb, of2.buyer_cpf);
        if (buyerCntEmail) {
          em("mk_offer_counter", { recipient_name: buyerCntEmail.name, recipient_email: buyerCntEmail.email, listing_title: of2.listing?.title, offer_price: of2.offer_price, counter_price: b.counter_price, counter_message: b.counter_message });
          if (buyerCntEmail.phone) wa("mk_offer_counter", { recipient_phone: buyerCntEmail.phone, recipient_name: buyerCntEmail.name, listing_title: of2.listing?.title, offer_price: of2.offer_price, counter_price: b.counter_price });
        }
      }
      const { error } = await sb.from("vault_marketplace_offers").update(u).eq("id", b.offer_id);
      if (error) throw error;
      return j({ success: true });
    }

    if (mt === "PUT" && a === "accept-counter") {
      const b = await req.json();
      const { data: of2 } = await sb.from("vault_marketplace_offers").select(
        `id, listing_id, buyer_cpf, counter_price, listing:vault_marketplace_listings!inner(title, seller:vault_seller_profiles!inner(member:vault_members!inner(client_cpf)))`
      ).eq("id", b.offer_id).eq("buyer_cpf", cpf).eq("status", "counter").single();
      if (!of2) throw new Error("Contra-proposta não encontrada ou já respondida");
      await sb.from("vault_marketplace_offers").update({ status: "accepted", offer_price: of2.counter_price, responded_at: new Date().toISOString() }).eq("id", of2.id);
      await sb.from("marketplace_negotiation_events").insert({ offer_id: of2.id, event_type: "counter_accepted", actor_cpf: cpf, price: of2.counter_price });
      const sellerCpf = of2.listing?.seller?.member?.client_cpf;
      if (sellerCpf) await nt(sb, "✅ Contra-proposta aceita!", `Comprador aceitou R$ ${of2.counter_price?.toFixed(2)} por "${of2.listing?.title}".`, sellerCpf, of2.listing_id, "marketplace_offer");
      return j({ success: true });
    }

    if (mt === "PUT" && a === "reject-counter") {
      const b = await req.json();
      const { data: of2 } = await sb.from("vault_marketplace_offers").select(
        `id, listing_id, buyer_cpf, listing:vault_marketplace_listings!inner(title, seller:vault_seller_profiles!inner(member:vault_members!inner(client_cpf)))`
      ).eq("id", b.offer_id).eq("buyer_cpf", cpf).eq("status", "counter").single();
      if (!of2) throw new Error("Contra-proposta não encontrada");
      await sb.from("vault_marketplace_offers").update({ status: "rejected", responded_at: new Date().toISOString() }).eq("id", of2.id);
      await sb.from("marketplace_negotiation_events").insert({ offer_id: of2.id, event_type: "rejected", actor_cpf: cpf, message: "Comprador recusou contra-proposta" });
      const sellerCpf = of2.listing?.seller?.member?.client_cpf;
      if (sellerCpf) await nt(sb, "❌ Contra-proposta recusada", `Comprador recusou a contra-proposta por "${of2.listing?.title}".`, sellerCpf, of2.listing_id, "marketplace_offer");
      return j({ success: true });
    }

    if (mt === "POST" && a === "bundle-offer") {
      const b = await req.json();
      const { listing_ids, prices, message: bundleMsg, buyer_name, discount_percent } = b;
      if (!listing_ids || listing_ids.length < 2) throw new Error("Bundle requer pelo menos 2 anúncios");
      const { data: listings } = await sb.from("vault_marketplace_listings").select(
        `id, title, price, seller_id, seller:vault_seller_profiles!inner(member:vault_members!inner(client_cpf))`
      ).in("id", listing_ids).eq("status", "active");
      if (!listings || listings.length !== listing_ids.length) throw new Error("Alguns anúncios não foram encontrados");
      const sellerIds = [...new Set(listings.map((l: any) => l.seller_id))];
      if (sellerIds.length > 1) throw new Error("Bundle só permite anúncios do mesmo vendedor");
      if (listings[0].seller?.member?.client_cpf === cpf) throw new Error("Não pode ofertar próprios anúncios");
      const bundleId = crypto.randomUUID();
      const offers: any[] = [];
      for (let i = 0; i < listings.length; i++) {
        const li = listings[i];
        const offerPrice = prices?.[i] || li.price * (1 - (discount_percent || 0) / 100);
        const { data: of2 } = await sb.from("vault_marketplace_offers").insert({
          listing_id: li.id, buyer_cpf: cpf, buyer_name: buyer_name || "Comprador",
          offer_price: Math.round(offerPrice * 100) / 100, message: bundleMsg || null,
          bundle_id: bundleId, bundle_discount_percent: discount_percent || 0,
        }).select().single();
        if (of2) {
          offers.push(of2);
          await sb.from("marketplace_negotiation_events").insert({
            offer_id: of2.id, event_type: "offer_made", actor_cpf: cpf,
            actor_name: buyer_name || "Comprador", price: offerPrice,
            message: `Bundle (${listings.length} itens) — ${bundleMsg || ""}`,
          });
        }
      }
      const totalOriginal = listings.reduce((s: number, l: any) => s + l.price, 0);
      const totalOffer = offers.reduce((s: number, o: any) => s + o.offer_price, 0);
      await nt(sb, "📦 Bundle offer!", `${offers.length} itens por R$ ${totalOffer.toFixed(2)} (de R$ ${totalOriginal.toFixed(2)}).`, listings[0].seller.member.client_cpf, bundleId, "marketplace_bundle");
      return j({ success: true, bundle_id: bundleId, offers });
    }

    if (mt === "GET" && a === "negotiation-timeline") {
      const offerId = url.searchParams.get("offer_id");
      if (!offerId) throw new Error("offer_id obrigatório");
      const { data: events, error } = await sb.from("marketplace_negotiation_events").select("*").eq("offer_id", offerId).order("created_at", { ascending: true });
      if (error) throw error;
      return j({ events: events || [] });
    }

    if (mt === "POST" && a === "expire-offers") {
      const count = await sb.rpc("auto_expire_marketplace_offers");
      return j({ success: true, expired_count: count?.data || 0 });
    }

    // ==================== CATALOG ====================

    if (mt === "GET" && a === "catalog-products") {
      const pg = parseInt(url.searchParams.get("page") || "1"), lm = 20, of2 = (pg - 1) * lm;
      const sr = url.searchParams.get("search"), br = url.searchParams.get("brand"), cat = url.searchParams.get("category");
      let q = sb.from("marketplace_products").select("*", { count: "exact" }).eq("is_active", true);
      if (sr) q = q.or(`brand.ilike.%${sr}%,model.ilike.%${sr}%,colorway.ilike.%${sr}%,sku.ilike.%${sr}%`);
      if (br) q = q.ilike("brand", `%${br}%`);
      if (cat) q = q.eq("category", cat);
      q = q.order("total_offers", { ascending: false }).range(of2, of2 + lm - 1);
      const { data, count, error } = await q;
      if (error) throw error;
      return j({ products: data || [], total: count || 0 });
    }

    if (mt === "GET" && a === "catalog-product") {
      const id = url.searchParams.get("id"), slug = url.searchParams.get("slug");
      let q = sb.from("marketplace_products").select("*");
      if (slug) q = q.eq("slug", slug);
      else if (id) q = q.eq("id", id);
      else throw new Error("id ou slug obrigatório");
      const { data, error } = await q.single();
      if (error) throw error;
      return j({ product: data });
    }

    if (mt === "GET" && a === "catalog-offers") {
      const pid = url.searchParams.get("product_id");
      if (!pid) throw new Error("product_id obrigatório");
      const sz = url.searchParams.get("size"), cn = url.searchParams.get("condition");
      let q = sb.from("marketplace_offers").select(
        `*, seller:vault_seller_profiles!inner(id, plan_id, verified_badge, average_rating, total_sales_count, current_fee_percent, member:vault_members!inner(client_name, tier))`
      ).eq("product_id", pid).eq("status", "active");
      if (sz) q = q.eq("size", sz);
      if (cn) q = q.eq("condition", cn);
      q = q.order("price", { ascending: true });
      const { data, error } = await q;
      if (error) throw error;
      const sizes = [...new Set((data || []).map((o: any) => o.size))].sort();
      return j({ offers: data || [], available_sizes: sizes });
    }

    if (mt === "GET" && a === "catalog-search") {
      const sr = url.searchParams.get("q") || "";
      if (!sr || sr.length < 2) return j({ products: [] });
      const { data, error } = await sb.from("marketplace_products").select("id, brand, model, colorway, images, lowest_price, total_offers, slug")
        .eq("is_active", true).or(`brand.ilike.%${sr}%,model.ilike.%${sr}%,colorway.ilike.%${sr}%,sku.ilike.%${sr}%`)
        .order("total_offers", { ascending: false }).limit(10);
      if (error) throw error;
      return j({ products: data || [] });
    }

    if (mt === "POST" && a === "catalog-create-product") {
      const b = await req.json();
      if (!b.brand || !b.model) throw new Error("brand e model obrigatórios");
      const { data: existing } = await sb.from("marketplace_products").select("id, brand, model, slug")
        .ilike("brand", b.brand).ilike("model", b.model).maybeSingle();
      if (existing) return j({ product: existing, already_exists: true });
      const description = b.description || `${b.brand} ${b.model}${b.colorway ? ` - ${b.colorway}` : ""}`;
      const mb = await gm(sb, cpf);
      const { data: prod, error } = await sb.from("marketplace_products").insert({
        brand: b.brand, model: b.model, colorway: b.colorway || null, sku: b.sku || null,
        category: b.category || "sneakers", images: b.images || [], description,
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
      const { data: li } = await sb.from("vault_marketplace_listings").insert({
        seller_id: sl.id, vault_item_id: b.vault_item_id || null,
        title: `${b.brand || ""} ${b.model || ""} ${b.size || ""}`.trim(),
        description: b.description || null, brand: b.brand || null, model: b.model || null,
        size: b.size, condition: b.condition || "novo", photos: b.photos || [],
        price: b.price, original_purchase_price: b.original_purchase_price || null,
        shipping_mode: b.price >= 2000 ? "bravenza" : (b.shipping_mode || "direct"),
        shipping_cost_estimate: 0, is_vault_certified: !!b.vault_item_id,
        status: "active", published_at: new Date().toISOString(), product_id: b.product_id,
      }).select().single();
      const { data: offer, error } = await sb.from("marketplace_offers").insert({
        product_id: b.product_id, seller_id: sl.id, listing_id: li?.id || null,
        size: b.size, condition: b.condition || "novo", price: b.price,
        original_purchase_price: b.original_purchase_price || null,
        description: b.description || null, defects: b.defects || null,
        photos: b.photos || [], proof_photos: b.proof_photos || [],
        has_receipt: b.has_receipt || false,
        shipping_mode: b.price >= 2000 ? "bravenza" : (b.shipping_mode === "hub" ? "bravenza" : b.shipping_mode === "seller_ships" ? "direct" : b.shipping_mode || "direct"),
        status: "active", published_at: new Date().toISOString(),
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
      const { data: ex } = await sb.from("marketplace_watchlist").select("id, is_active")
        .eq("product_id", product_id).eq("size", sz).eq("user_cpf", cpf).maybeSingle();
      if (ex) {
        if (ex.is_active) {
          await sb.from("marketplace_watchlist").update({ is_active: false }).eq("id", ex.id);
          return j({ active: false, max_price: null });
        } else {
          await sb.from("marketplace_watchlist").update({ is_active: true, max_price: max_price || null }).eq("id", ex.id);
          return j({ active: true, max_price: max_price || null });
        }
      }
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
      const { data, error } = await sb.from("marketplace_product_comments_public").select("*")
        .eq("product_id", pid).eq("is_visible", true).order("created_at", { ascending: true });
      if (error) throw error;
      return j({ comments: data || [] });
    }

    if (mt === "POST" && a === "product-comment") {
      const b = await req.json();
      if (!b.product_id || !b.content) throw new Error("product_id e content obrigatórios");
      const { data: member } = await sb.from("vault_members").select("client_name").eq("client_cpf", cpf).maybeSingle();
      const userName = member?.client_name || "Usuário";
      const { data: comment, error } = await sb.from("marketplace_product_comments").insert({
        product_id: b.product_id, user_cpf: cpf, user_name: userName,
        content: b.content, parent_id: b.parent_id || null, is_seller_reply: false,
      }).select().single();
      if (error) throw error;
      return j({ comment });
    }

    // ==================== PRODUCT REVIEWS ====================

    if (mt === "GET" && a === "product-reviews") {
      const pid = url.searchParams.get("product_id");
      if (!pid) throw new Error("product_id obrigatório");
      const { data: reviews } = await sb.from("marketplace_product_reviews").select("*")
        .eq("product_id", pid).eq("is_visible", true).order("created_at", { ascending: false });
      const list = reviews || [];
      const avg = list.length > 0 ? list.reduce((s: number, r: any) => s + r.rating, 0) / list.length : 0;
      return j({ reviews: list, average: Math.round(avg * 10) / 10, total: list.length });
    }

    if (mt === "POST" && a === "product-review") {
      const b = await req.json();
      if (!b.product_id || !b.rating) throw new Error("product_id e rating obrigatórios");
      const m = await gm(sb, cpf);
      let reviewerName = "Anônimo";
      if (m) {
        const { data: mem } = await sb.from("vault_members").select("client_name").eq("id", m.id).single();
        if (mem) reviewerName = mem.client_name;
      }
      const { data, error } = await sb.from("marketplace_product_reviews").insert({
        product_id: b.product_id, reviewer_cpf: cpf, reviewer_name: reviewerName,
        rating: b.rating, comment: b.comment || null, product_quality: b.product_quality || null,
        authenticity_score: b.authenticity_score || null, shipping_speed: b.shipping_speed || null,
      }).select().single();
      if (error) throw error;
      return j({ review: data });
    }

    if (mt === "GET" && a === "check-purchase") {
      const pid = url.searchParams.get("product_id");
      if (!pid) throw new Error("product_id obrigatório");
      const { data: orders } = await sb.from("vault_marketplace_orders").select("id")
        .eq("buyer_cpf", cpf).in("status", ["delivered", "completed"]).limit(100);
      let hasPurchased = false;
      if (orders && orders.length > 0) {
        const { data: soldOffers } = await sb.from("marketplace_offers").select("id")
          .eq("product_id", pid).eq("status", "sold").limit(1);
        if (soldOffers && soldOffers.length > 0) hasPurchased = true;
      }
      return j({ has_purchased: hasPurchased });
    }

    // ==================== PRODUCT ANALYTICS ====================

    if (mt === "GET" && a === "product-analytics") {
      const pid = url.searchParams.get("product_id");
      if (!pid) throw new Error("product_id obrigatório");
      const { data: allOffers } = await sb.from("marketplace_offers").select("price, created_at, status, sold_at")
        .eq("product_id", pid).order("created_at", { ascending: true });
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
      const priceHistory = Object.entries(dailyMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, { prices }]) => ({
        date, min_price: Math.min(...prices), avg_price: Math.round(prices.reduce((s, p) => s + p, 0) / prices.length),
        max_price: Math.max(...prices), offers_count: prices.length,
      }));
      const soldOffers = (allOffers || []).filter((o: any) => o.status === "sold" || o.sold_at);
      const totalSold = soldOffers.length;
      const avgSalePrice = totalSold > 0 ? Math.round(soldOffers.reduce((s: number, o: any) => s + o.price, 0) / totalSold) : null;
      let priceTrend: "up" | "down" | "stable" = "stable";
      let trendPercent = 0;
      const recentOffers = (allOffers || []).filter((o: any) => new Date(o.created_at) >= cutoff);
      if (recentOffers.length >= 4) {
        const mid = Math.floor(recentOffers.length / 2);
        const avgFirst = recentOffers.slice(0, mid).reduce((s: number, o: any) => s + o.price, 0) / mid;
        const avgSecond = recentOffers.slice(mid).reduce((s: number, o: any) => s + o.price, 0) / (recentOffers.length - mid);
        if (avgFirst > 0) {
          trendPercent = Math.abs(((avgSecond - avgFirst) / avgFirst) * 100);
          if (trendPercent > 2) priceTrend = avgSecond > avgFirst ? "up" : "down";
        }
      }
      return j({ analytics: { price_history: priceHistory, total_sold: totalSold, avg_sale_price: avgSalePrice, price_trend: priceTrend, trend_percent: trendPercent } });
    }

    // ==================== FREIGHT QUOTE ====================

    if (mt === "POST" && a === "freight-quote") {
      const b = await req.json();
      const { listing_id, buyer_cep } = b;
      if (!listing_id || !buyer_cep) throw new Error("listing_id e buyer_cep obrigatórios");
      let listing: any = null;
      const { data: li } = await sb.from("vault_marketplace_listings").select(`*, seller:vault_seller_profiles!inner(seller_cep)`).eq("id", listing_id).maybeSingle();
      if (li) { listing = li; } else {
        const { data: offer } = await sb.from("marketplace_offers").select(`*, seller:vault_seller_profiles!inner(seller_cep)`).eq("id", listing_id).maybeSingle();
        if (offer) listing = { ...offer, shipping_mode: offer.shipping_mode === "seller_ships" ? "direct" : offer.shipping_mode === "hub" ? "bravenza" : offer.shipping_mode || "direct" };
      }
      if (!listing) throw new Error("Anúncio não encontrado");
      const sellerCep = listing.seller?.seller_cep;
      const isBravenza = listing.shipping_mode === "bravenza";
      const { data: whSetting } = await sb.from("system_settings").select("value").eq("key", "bravenza_warehouse_cep").maybeSingle();
      const bravenzaCep = whSetting?.value ? String(whSetting.value).replace(/"/g, "") : "90040191";
      const pkg = { weight: 1.2, height: 15, width: 35, length: 30 };
      const insuranceValue = listing.price || 0;
      const sfToken = Deno.env.get("SUPERFRETE_API_TOKEN");
      if (!sfToken) throw new Error("Token SuperFrete não configurado");
      const sfHeaders = { "Authorization": `Bearer ${sfToken}`, "Content-Type": "application/json", "Accept": "application/json", "User-Agent": "Bravenza/1.0" };
      const quotePayload = (fromCep: string, toCep: string) => ({
        from: { postal_code: fromCep.replace(/\D/g, "") }, to: { postal_code: toCep.replace(/\D/g, "") },
        services: "1,2,3", package: pkg, options: { insurance_value: insuranceValue, receipt: false, own_hand: false },
      });
      const doQuote = async (fromCep: string, toCep: string) => {
        const res = await fetch("https://api.superfrete.com/api/v0/calculator", { method: "POST", headers: sfHeaders, body: JSON.stringify(quotePayload(fromCep, toCep)) });
        const data = await res.json();
        if (!res.ok) { console.error("SuperFrete quote error:", data); return []; }
        return Array.isArray(data) ? data : [];
      };
      let quotes: any[] = [];
      let legs: any = null;
      if (isBravenza) {
        const fromCep = sellerCep || bravenzaCep;
        const leg1 = await doQuote(fromCep, bravenzaCep);
        const leg2 = await doQuote(bravenzaCep, buyer_cep);
        const leg2Map: Record<number, any> = {};
        for (const q of leg2) { if (q.id) leg2Map[q.id] = q; }
        for (const q1 of leg1) {
          const q2 = leg2Map[q1.id];
          if (q2 && !q1.error && !q2.error) {
            const BRAVENZA_PROCESSING_DAYS = 5;
            quotes.push({
              ...q1, price: (parseFloat(q1.price || "0") + parseFloat(q2.price || "0")).toFixed(2),
              delivery_time: (q1.delivery_time || 0) + BRAVENZA_PROCESSING_DAYS + (q2.delivery_time || 0),
              legs: { seller_to_bravenza: { price: q1.price, delivery_time: q1.delivery_time }, bravenza_processing: { delivery_time: BRAVENZA_PROCESSING_DAYS }, bravenza_to_buyer: { price: q2.price, delivery_time: q2.delivery_time } },
            });
          }
        }
        legs = { mode: "bravenza", seller_cep: fromCep, warehouse_cep: bravenzaCep, buyer_cep };
      } else {
        const fromCep = sellerCep || bravenzaCep;
        quotes = await doQuote(fromCep, buyer_cep);
        quotes = quotes.filter((q: any) => !q.error);
        legs = { mode: "direct", seller_cep: fromCep, buyer_cep };
      }
      return j({ quotes, legs, listing_price: listing.price, shipping_mode: listing.shipping_mode });
    }

    // ==================== ADMIN MODERATION ====================

    if (mt === "GET" && a === "admin-pending-offers") {
      const statusFilter = url.searchParams.get("status") || "pending_review";
      let q = sb.from("marketplace_offers").select(
        `*, product:marketplace_products!inner(brand, model, images), seller:vault_seller_profiles!inner(id, plan_id, kyc_status, member:vault_members!inner(client_name, client_cpf))`
      ).order("created_at", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      const { data, error } = await q.limit(100);
      if (error) throw error;
      return j({ offers: data || [] });
    }

    if (mt === "PUT" && a === "admin-moderate-offer") {
      const b = await req.json();
      const { offer_id, action: modAction, reason } = b;
      if (!offer_id || !modAction) throw new Error("offer_id e action obrigatórios");
      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (modAction === "approve") { updates.status = "active"; updates.activated_at = new Date().toISOString(); }
      else if (modAction === "reject") { updates.status = "rejected"; updates.pro_recommendation = reason || "Rejeitado pela moderação"; }
      else if (modAction === "flag") { updates.status = "flagged"; updates.pro_recommendation = reason || "Flagged for review"; }
      const { error } = await sb.from("marketplace_offers").update(updates).eq("id", offer_id);
      if (error) throw error;
      const { data: offer } = await sb.from("marketplace_offers").select(`seller:vault_seller_profiles!inner(member:vault_members!inner(client_cpf))`).eq("id", offer_id).single();
      if (offer?.seller?.member?.client_cpf) {
        const statusLabel = modAction === "approve" ? "aprovado" : modAction === "reject" ? "rejeitado" : "sinalizado";
        await nt(sb, `Anúncio ${statusLabel}`, reason || `Seu anúncio foi ${statusLabel} pela moderação.`, offer.seller.member.client_cpf, offer_id, "marketplace_moderation");
      }
      return j({ success: true });
    }

    if (mt === "PUT" && a === "admin-flag-listing") {
      const b = await req.json();
      const { listing_id, flagged, reason } = b;
      if (!listing_id) throw new Error("listing_id obrigatório");
      const newStatus = flagged ? "flagged" : "active";
      const { error } = await sb.from("vault_marketplace_listings").update({ status: newStatus, pro_recommendation: flagged ? (reason || "Flagged") : null }).eq("id", listing_id);
      if (error) throw error;
      return j({ success: true });
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

    // ==================== PRICE HISTORY ====================

    if (mt === "GET" && a === "price-history") {
      const productId = url.searchParams.get("product_id");
      if (!productId) throw new Error("product_id obrigatório");
      const days = parseInt(url.searchParams.get("days") || "90");
      const since = new Date(); since.setDate(since.getDate() - days);
      const { data, error } = await sb.from("marketplace_price_history").select("*")
        .eq("product_id", productId).gte("recorded_date", since.toISOString().split("T")[0])
        .order("recorded_date", { ascending: true });
      if (error) throw error;
      const { data: liveOffers } = await sb.from("marketplace_offers").select("price").eq("product_id", productId).eq("status", "active");
      const prices = (liveOffers || []).map((o: any) => o.price);
      const liveStats = prices.length > 0 ? { min: Math.min(...prices), max: Math.max(...prices), avg: Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length), count: prices.length } : null;
      return j({ history: data || [], live: liveStats });
    }

    // ==================== RECOMMENDATIONS ====================

    if (mt === "GET" && a === "recommendations") {
      const productId = url.searchParams.get("product_id");
      const limit = parseInt(url.searchParams.get("limit") || "8");
      if (!productId) throw new Error("product_id obrigatório");
      const { data: source } = await sb.from("marketplace_products").select("brand, category").eq("id", productId).single();
      if (!source) throw new Error("Produto não encontrado");
      const { data: similar } = await sb.from("marketplace_products").select("id, brand, model, colorway, images, lowest_price, total_offers, slug")
        .or(`brand.eq.${source.brand},category.eq.${source.category}`).neq("id", productId).eq("is_active", true).gt("total_offers", 0)
        .order("total_offers", { ascending: false }).limit(limit);
      const { data: buyerOrders } = await sb.from("vault_marketplace_orders").select("buyer_cpf").eq("product_id", productId).limit(50);
      const buyerCpfs = [...new Set((buyerOrders || []).map((o: any) => o.buyer_cpf))];
      let alsoBooked: any[] = [];
      if (buyerCpfs.length > 0) {
        const { data: otherOrders } = await sb.from("vault_marketplace_orders")
          .select("product_id, product:marketplace_products(id, brand, model, colorway, images, lowest_price, total_offers, slug)")
          .in("buyer_cpf", buyerCpfs.slice(0, 10)).neq("product_id", productId).limit(20);
        const freq: Record<string, { product: any; count: number }> = {};
        for (const o of (otherOrders || [])) {
          if (o.product) { const pid = (o.product as any).id; if (!freq[pid]) freq[pid] = { product: o.product, count: 0 }; freq[pid].count++; }
        }
        alsoBooked = Object.values(freq).sort((a, b) => b.count - a.count).slice(0, 4).map(f => f.product);
      }
      return j({ similar: similar || [], also_bought: alsoBooked });
    }

    // ==================== SAVED SEARCHES ====================

    if (mt === "GET" && a === "saved-searches") {
      const { data } = await sb.from("marketplace_saved_searches").select("*").eq("user_cpf", cpf).order("created_at", { ascending: false });
      return j({ searches: data || [] });
    }

    if (mt === "POST" && a === "save-search") {
      const b = await req.json();
      const { data, error } = await sb.from("marketplace_saved_searches").insert({
        user_cpf: cpf, name: b.name || "Busca salva", filters: b.filters || {}, notify_new_listings: b.notify !== false,
      }).select().single();
      if (error) throw error;
      return j({ search: data });
    }

    if (mt === "DELETE" && a === "delete-saved-search") {
      const id = url.searchParams.get("id");
      if (!id) throw new Error("ID obrigatório");
      await sb.from("marketplace_saved_searches").delete().eq("id", id).eq("user_cpf", cpf);
      return j({ success: true });
    }

    // ==================== DROP REMINDERS ====================

    if (mt === "GET" && a === "drop-reminders") {
      const { data } = await sb.from("marketplace_drop_reminders").select("release_key, release_brand, release_model, release_date").eq("user_cpf", cpf);
      return j({ reminders: data || [] });
    }

    if (mt === "POST" && a === "toggle-drop-reminder") {
      const b = await req.json();
      const { release_key, release_brand, release_model, release_date } = b;
      if (!release_key) throw new Error("release_key obrigatório");
      const { data: existing } = await sb.from("marketplace_drop_reminders").select("id").eq("user_cpf", cpf).eq("release_key", release_key).maybeSingle();
      if (existing) {
        await sb.from("marketplace_drop_reminders").delete().eq("id", existing.id);
        return j({ active: false });
      }
      await sb.from("marketplace_drop_reminders").insert({
        user_cpf: cpf, release_key, release_brand: release_brand || "", release_model: release_model || "",
        release_date: release_date || new Date().toISOString().split("T")[0],
      });
      return j({ active: true });
    }

    // ==================== ADMIN MODERATION ====================

    if (mt === "GET" && a === "admin-pending-offers") {
      // Verify admin role
      const authHeader = req.headers.get("authorization");
      const token = authHeader?.replace("Bearer ", "") || "";
      const anonClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: userData } = await anonClient.auth.getUser(token);
      if (!userData?.user) return j({ error: "Não autenticado" }, 401);
      const { data: isAdmin } = await sb.rpc("is_admin", { _user_id: userData.user.id });
      if (!isAdmin) return j({ error: "Acesso negado" }, 403);

      const statusFilter = url.searchParams.get("status") || "pending_review";
      let q = sb.from("marketplace_offers").select(
        `id, price, size, condition, description, photos, status, created_at, views_count, has_receipt, defects,
         product:marketplace_products!inner(brand, model, images),
         seller:vault_seller_profiles!inner(id, plan_id, kyc_status, member:vault_members!inner(client_name, client_cpf))`
      );
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      q = q.order("created_at", { ascending: false }).limit(100);
      const { data, error } = await q;
      if (error) throw error;
      return j({ offers: data || [] });
    }

    if (mt === "PUT" && a === "admin-moderate-offer") {
      // Verify admin role
      const authHeader2 = req.headers.get("authorization");
      const token2 = authHeader2?.replace("Bearer ", "") || "";
      const anonClient2 = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: `Bearer ${token2}` } },
      });
      const { data: userData2 } = await anonClient2.auth.getUser(token2);
      if (!userData2?.user) return j({ error: "Não autenticado" }, 401);
      const { data: isAdmin2 } = await sb.rpc("is_admin", { _user_id: userData2.user.id });
      if (!isAdmin2) return j({ error: "Acesso negado" }, 403);

      const b = await req.json();
      const { offer_id, action: modAction, reason } = b;
      if (!offer_id || !modAction) throw new Error("offer_id e action obrigatórios");

      const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
      if (modAction === "approve") {
        updateData.status = "active";
        updateData.published_at = new Date().toISOString();
        updateData.activated_at = new Date().toISOString();
      } else if (modAction === "reject") {
        updateData.status = "rejected";
      } else if (modAction === "flag") {
        updateData.status = "flagged";
      } else {
        throw new Error("Ação inválida: use approve, reject ou flag");
      }

      const { error } = await sb.from("marketplace_offers").update(updateData).eq("id", offer_id);
      if (error) throw error;

      // Notify seller
      const { data: offer } = await sb.from("marketplace_offers").select(
        `product:marketplace_products(brand, model), seller:vault_seller_profiles!inner(member:vault_members!inner(client_cpf))`
      ).eq("id", offer_id).single();

      if (offer?.seller?.member?.client_cpf) {
        const productName = `${offer.product?.brand || ""} ${offer.product?.model || ""}`.trim();
        const msgs: Record<string, string> = {
          approve: `✅ Seu anúncio "${productName}" foi aprovado e já está ativo!`,
          reject: `❌ Seu anúncio "${productName}" foi rejeitado.${reason ? ` Motivo: ${reason}` : ""}`,
          flag: `⚠️ Seu anúncio "${productName}" foi sinalizado para revisão.`,
        };
        await nt(sb, "Moderação de Anúncio", msgs[modAction] || "", offer.seller.member.client_cpf, offer_id, "marketplace_moderation");
      }

      return j({ success: true });
    }

    // ==================== PRODUCT COUPONS (public) ====================
    if (mt === "GET" && a === "product-coupons") {
      const pid = url.searchParams.get("product_id");
      if (!pid) throw new Error("product_id obrigatório");
      // Get all active sellers for this product
      const { data: activeOffers } = await sb.from("marketplace_offers")
        .select("seller_id").eq("product_id", pid).eq("status", "active");
      const sellerIds = [...new Set((activeOffers || []).map((o: any) => o.seller_id))];
      if (sellerIds.length === 0) return j({ coupons: [] });
      // Get active coupons from those sellers
      const { data: coupons } = await sb.from("marketplace_coupons")
        .select("id, code, discount_type, discount_value, min_purchase, valid_until, seller_id")
        .in("seller_id", sellerIds).eq("is_active", true)
        .or(`valid_until.is.null,valid_until.gt.${new Date().toISOString()}`);
      return j({ coupons: (coupons || []).map((c: any) => ({
        code: c.code, discount_type: c.discount_type, discount_value: c.discount_value,
        min_purchase: c.min_purchase, valid_until: c.valid_until,
      })) });
    }

    return j({ error: "Ação não encontrada" }, 404);
  } catch (e: any) {
    console.error("mk-hub error:", e);
    return j({ error: e.message }, 500);
  }
});
