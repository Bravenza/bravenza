// mk-hub: Listings CRUD, Favorites, Seller Profiles, Offers/Negotiation
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
        em("mk_offer_received", { recipient_name: sellerOfferEmail.name, recipient_email: sellerOfferEmail.email, listing_title: li.title, offer_price: b.offer_price, buyer_name: b.buyer_name || "Comprador" });
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

    return j({ error: "Ação não encontrada" }, 404);
  } catch (e: any) {
    console.error("mk-hub error:", e);
    return j({ error: e.message }, 500);
  }
});
