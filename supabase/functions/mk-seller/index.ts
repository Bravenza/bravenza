// mk-seller: Seller Onboarding, Analytics, Tier, Coupons, Collections, Boosts, Social, Badges, Storefront
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

const PUBLIC_ACTIONS = new Set(["seller-tier-info", "seller-leaderboard"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const sb = createSupabaseClient();
  const url = new URL(req.url);
  const a = url.searchParams.get("action");
  const mt = req.method;

  console.log("mk-seller", a, mt);

  const auth = await resolveCpf(req, sb, PUBLIC_ACTIONS, a);
  if (auth.errorResponse) return auth.errorResponse;
  const cpf = auth.cpf;

  try {
    // ==================== SELLER ONBOARDING STATUS ====================
    if (mt === "GET" && a === "seller-onboarding-status") {
      const mb = await gm(sb, cpf);
      if (!mb) return j({ onboarded: false, seller: null });
      const sl = await gs(sb, mb.id);
      if (!sl) return j({ onboarded: false, seller: null });
      return j({
        onboarded: !!sl.onboarding_completed_at,
        seller: {
          id: sl.id, full_name: sl.full_name,
          cpf_cnpj: sl.cpf_cnpj ? `***${sl.cpf_cnpj.slice(-4)}` : null,
          phone: sl.phone ? `***${sl.phone.slice(-4)}` : null,
          pix_key_type: sl.pix_key_type,
          pix_key: sl.pix_key ? `${sl.pix_key.slice(0, 3)}***` : null,
          pix_beneficiary: sl.pix_beneficiary, bank_name: sl.bank_name,
          account_type: sl.account_type || "pf", kyc_status: sl.kyc_status,
          terms_accepted_at: sl.terms_accepted_at, onboarding_completed_at: sl.onboarding_completed_at,
        },
      });
    }

    // ==================== SELLER ONBOARDING ====================
    if (mt === "POST" && a === "seller-onboarding") {
      const b = await req.json();
      const mb = await gm(sb, cpf);
      if (!mb) throw new Error("Membro não encontrado");
      if (!b.full_name || !b.cpf_cnpj || !b.phone || !b.seller_cep || !b.pix_key_type || !b.pix_key || !b.pix_beneficiary || !b.bank_name || !b.terms_accepted) {
        throw new Error("Todos os campos obrigatórios devem ser preenchidos");
      }
      const hasDocuments = b.id_front_url && b.id_back_url && b.id_selfie_url;
      let sl = await gs(sb, mb.id);
      const isCnpj = b.cpf_cnpj.length > 11;
      const onboardingData: Record<string, unknown> = {
        full_name: b.full_name, cpf_cnpj: b.cpf_cnpj, phone: b.phone, seller_cep: b.seller_cep,
        pix_key_type: b.pix_key_type, pix_key: b.pix_key, pix_beneficiary: b.pix_beneficiary,
        bank_name: b.bank_name, account_type: isCnpj ? "pj" : "pf",
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
      if (hasDocuments) {
        await sb.from("notifications").insert({ title: "Novo vendedor aguardando aprovação", message: `${b.full_name} enviou documentos para verificação de identidade.`, target: "admin", type: "info", reference_type: "seller_kyc" });
      }
      return j({ success: true });
    }

    // ==================== SELLER TIER INFO ====================
    if (mt === "GET" && a === "seller-tier-info") {
      const sid = url.searchParams.get("seller_id");
      if (!sid) throw new Error("seller_id obrigatório");
      const { data } = await sb.from("vault_seller_profiles").select(
        "tier, on_time_shipping_rate, cancellation_rate, dispute_rate, pro_approval_rate, payout_speed_days, current_fee_percent, total_sales_count, average_rating"
      ).eq("id", sid).single();
      if (!data) throw new Error("Vendedor não encontrado");
      const tierConfig: Record<string, any> = {
        bronze: { label: "Bronze", color: "#CD7F32", nextTier: "prata", nextReqs: "5 vendas, 80% no prazo" },
        prata: { label: "Prata", color: "#C0C0C0", nextTier: "ouro", nextReqs: "20 vendas, 90% no prazo, <5% disputas" },
        ouro: { label: "Ouro", color: "#D4AF37", nextTier: "elite", nextReqs: "50 vendas, 95% no prazo, <2% disputas" },
        elite: { label: "Elite", color: "#B9F2FF", nextTier: null, nextReqs: "Nível máximo alcançado!" },
      };
      return j({ ...data, tierInfo: tierConfig[data.tier] || tierConfig.bronze });
    }

    // ==================== RECALC SELLER TIER ====================
    if (mt === "POST" && a === "recalc-seller-tier") {
      const b = await req.json();
      const sid = b.seller_id;
      if (!sid) throw new Error("seller_id obrigatório");
      const { data: allOrders } = await sb.from("vault_marketplace_orders").select("status, shipped_at, paid_at, dispute_status, inspection_result, created_at").eq("seller_id", sid);
      const orders = allOrders || [];
      const total = orders.length;
      if (total === 0) {
        await sb.from("vault_seller_profiles").update({ tier: "bronze", tier_updated_at: new Date().toISOString() }).eq("id", sid);
        return j({ tier: "bronze", metrics: {} });
      }
      const completed = orders.filter((o: any) => ["completed", "delivered", "payout_released", "payout_pending"].includes(o.status));
      const cancelled = orders.filter((o: any) => o.status === "cancelled");
      const disputed = orders.filter((o: any) => o.dispute_status === "open" || o.dispute_status === "resolved_buyer");
      const proOrders = orders.filter((o: any) => o.inspection_result);
      const proApproved = proOrders.filter((o: any) => o.inspection_result === "approved");
      const shippedOrders = orders.filter((o: any) => o.shipped_at && o.paid_at);
      const onTime = shippedOrders.filter((o: any) => {
        const diff = (new Date(o.shipped_at).getTime() - new Date(o.paid_at).getTime()) / (1000 * 60 * 60 * 24);
        return diff <= 3;
      });
      const onTimeRate = shippedOrders.length > 0 ? Math.round((onTime.length / shippedOrders.length) * 100) : 100;
      const cancellationRate = total > 0 ? Math.round((cancelled.length / total) * 100) : 0;
      const disputeRate = total > 0 ? Math.round((disputed.length / total) * 100) : 0;
      const proApprovalRate = proOrders.length > 0 ? Math.round((proApproved.length / proOrders.length) * 100) : 100;
      let tier = "bronze", payoutDays = 10, feePercent = 14;
      if (completed.length >= 50 && onTimeRate >= 95 && disputeRate <= 2 && cancellationRate <= 3 && proApprovalRate >= 98) { tier = "elite"; payoutDays = 3; feePercent = 8; }
      else if (completed.length >= 20 && onTimeRate >= 90 && disputeRate <= 5 && cancellationRate <= 5 && proApprovalRate >= 95) { tier = "ouro"; payoutDays = 5; feePercent = 10; }
      else if (completed.length >= 5 && onTimeRate >= 80 && disputeRate <= 10 && cancellationRate <= 10) { tier = "prata"; payoutDays = 7; feePercent = 12; }
      await sb.from("vault_seller_profiles").update({
        tier, tier_updated_at: new Date().toISOString(), on_time_shipping_rate: onTimeRate,
        cancellation_rate: cancellationRate, dispute_rate: disputeRate, pro_approval_rate: proApprovalRate,
        payout_speed_days: payoutDays, current_fee_percent: feePercent,
      }).eq("id", sid);
      return j({ tier, metrics: { total_orders: total, completed: completed.length, onTimeRate, cancellationRate, disputeRate, proApprovalRate }, benefits: { payout_days: payoutDays, fee_percent: feePercent } });
    }

    // ==================== SELLER ANALYTICS ====================
    if (mt === "GET" && a === "seller-analytics") {
      const mb = await gm(sb, cpf);
      if (!mb) return j({ analytics: null });
      const sl = await gs(sb, mb.id);
      if (!sl) return j({ analytics: null });
      const { data: listings } = await sb.from("vault_marketplace_listings").select("id, views_count, price, status, created_at, published_at").eq("seller_id", sl.id);
      const totalViews = (listings || []).reduce((s: number, l: any) => s + (l.views_count || 0), 0);
      const activeListings = (listings || []).filter((l: any) => l.status === "active").length;
      const { data: orders } = await sb.from("vault_marketplace_orders").select("id, status, sale_price, fee_amount, seller_payout, created_at, paid_at, payout_released_at").eq("seller_id", sl.id);
      const completedOrders = (orders || []).filter((o: any) => ["delivered", "payout_released", "payout_pending", "completed"].includes(o.status));
      const totalRevenue = completedOrders.reduce((s: number, o: any) => s + (o.seller_payout || 0), 0);
      const totalFees = completedOrders.reduce((s: number, o: any) => s + (o.fee_amount || 0), 0);
      const conversionRate = totalViews > 0 ? Math.round((completedOrders.length / totalViews) * 10000) / 100 : 0;
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

    // ==================== PRICE DROP SUGGESTIONS ====================
    if (mt === "GET" && a === "price-drop-suggestions") {
      const mb = await gm(sb, cpf);
      if (!mb) return j({ suggestions: [] });
      const sl = await gs(sb, mb.id);
      if (!sl) return j({ suggestions: [] });
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: staleListings } = await sb.from("vault_marketplace_listings").select("id, title, price, views_count, created_at, published_at")
        .eq("seller_id", sl.id).eq("status", "active").lt("published_at", sevenDaysAgo).order("published_at", { ascending: true });
      if (!staleListings || staleListings.length === 0) return j({ suggestions: [] });
      const suggestions = staleListings.map((l: any) => {
        const daysListed = Math.floor((Date.now() - new Date(l.published_at || l.created_at).getTime()) / (1000 * 60 * 60 * 24));
        let dropPercent = 5, reason = "Sem vendas há mais de 7 dias";
        if (daysListed > 30) { dropPercent = 15; reason = "Anúncio parado há mais de 30 dias — redução agressiva recomendada"; }
        else if (daysListed > 14) { dropPercent = 10; reason = "Sem interesse há 2+ semanas — considere reduzir o preço"; }
        if (l.views_count < 5) { dropPercent += 3; reason += ". Poucas visualizações"; }
        return { listing_id: l.id, title: l.title, current_price: l.price, suggested_price: Math.round(l.price * (1 - dropPercent / 100)), days_listed: daysListed, views: l.views_count || 0, reason };
      });
      return j({ suggestions });
    }

    // ==================== COUPONS ====================
    if (mt === "POST" && a === "create-coupon") {
      const b = await req.json();
      const mb = await gm(sb, cpf); if (!mb) throw new Error("Membro não encontrado");
      const sl = await gs(sb, mb.id); if (!sl) throw new Error("Vendedor não encontrado");
      if (!b.code || !b.discount_value) throw new Error("code e discount_value obrigatórios");
      const { data: coupon, error } = await sb.from("marketplace_coupons").insert({
        seller_id: sl.id, code: b.code.toUpperCase().trim(), discount_type: b.discount_type || "percent",
        discount_value: b.discount_value, min_purchase: b.min_purchase || 0, max_uses: b.max_uses || null,
        valid_until: b.valid_until || null, listing_ids: b.listing_ids || null,
      }).select().single();
      if (error) throw error;
      return j({ success: true, coupon });
    }

    if (mt === "GET" && a === "my-coupons") {
      const mb = await gm(sb, cpf); if (!mb) return j({ coupons: [] });
      const sl = await gs(sb, mb.id); if (!sl) return j({ coupons: [] });
      const { data } = await sb.from("marketplace_coupons").select("*").eq("seller_id", sl.id).order("created_at", { ascending: false });
      return j({ coupons: data || [] });
    }

    if (mt === "PUT" && a === "update-coupon") {
      const b = await req.json();
      const mb = await gm(sb, cpf); if (!mb) throw new Error("Membro não encontrado");
      const sl = await gs(sb, mb.id); if (!sl) throw new Error("Vendedor não encontrado");
      const { error } = await sb.from("marketplace_coupons").update({
        is_active: b.is_active, max_uses: b.max_uses, valid_until: b.valid_until,
        discount_value: b.discount_value, min_purchase: b.min_purchase,
      }).eq("id", b.coupon_id).eq("seller_id", sl.id);
      if (error) throw error;
      return j({ success: true });
    }

    if (mt === "DELETE" && a === "delete-coupon") {
      const id = url.searchParams.get("id"); if (!id) throw new Error("ID obrigatório");
      const mb = await gm(sb, cpf); if (!mb) throw new Error("Membro não encontrado");
      const sl = await gs(sb, mb.id); if (!sl) throw new Error("Vendedor não encontrado");
      await sb.from("marketplace_coupons").delete().eq("id", id).eq("seller_id", sl.id);
      return j({ success: true });
    }

    if (mt === "POST" && a === "validate-coupon") {
      const b = await req.json();
      if (!b.code || !b.listing_id) throw new Error("code e listing_id obrigatórios");
      const { data: listing } = await sb.from("vault_marketplace_listings").select("seller_id, price").eq("id", b.listing_id).single();
      if (!listing) throw new Error("Anúncio não encontrado");
      const { data: coupon } = await sb.from("marketplace_coupons").select("*").eq("seller_id", listing.seller_id).eq("code", b.code.toUpperCase().trim()).eq("is_active", true).maybeSingle();
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
      const { data: c } = await sb.from("marketplace_coupons").select("uses_count").eq("id", b.coupon_id).single();
      if (c) await sb.from("marketplace_coupons").update({ uses_count: (c.uses_count || 0) + 1 }).eq("id", b.coupon_id);
      return j({ success: true });
    }

    // ==================== BOOSTS ====================
    if (mt === "POST" && a === "boost-activate") {
      const b = await req.json();
      const { offer_id } = b; if (!offer_id) throw new Error("offer_id obrigatório");
      const mb = await gm(sb, cpf); if (!mb) throw new Error("Membro não encontrado");
      const sl = await gs(sb, mb.id); if (!sl) throw new Error("Vendedor não encontrado");
      const { data: plan } = await sb.from("marketplace_plans").select("boost_slots").eq("id", sl.plan_id || "free").single();
      const maxBoosts = plan?.boost_slots || 1;
      const { data: activeBoosts } = await sb.from("marketplace_offers").select("id").eq("seller_id", sl.id).not("boost_level", "is", null).gt("boost_active_until", new Date().toISOString());
      if ((activeBoosts?.length || 0) >= maxBoosts) throw new Error(`Limite de ${maxBoosts} boost(s) do seu plano atingido.`);
      const boostUntil = new Date(); boostUntil.setDate(boostUntil.getDate() + 7);
      const boostLevel = sl.plan_id === "elite" ? "premium" : sl.plan_id === "pro" ? "standard" : "basic";
      const { error } = await sb.from("marketplace_offers").update({ boost_level: boostLevel, boost_active_until: boostUntil.toISOString() }).eq("id", offer_id).eq("seller_id", sl.id);
      if (error) throw error;
      const { data: offer } = await sb.from("marketplace_offers").select("listing_id").eq("id", offer_id).single();
      if (offer?.listing_id) await sb.from("vault_marketplace_listings").update({ pro_recommendation: "boosted" }).eq("id", offer.listing_id);
      return j({ success: true, boost_level: boostLevel, boost_until: boostUntil.toISOString() });
    }

    if (mt === "POST" && a === "boost-deactivate") {
      const b = await req.json();
      const mb = await gm(sb, cpf); if (!mb) throw new Error("Membro não encontrado");
      const sl = await gs(sb, mb.id); if (!sl) throw new Error("Vendedor não encontrado");
      await sb.from("marketplace_offers").update({ boost_level: null, boost_active_until: null }).eq("id", b.offer_id).eq("seller_id", sl.id);
      return j({ success: true });
    }

    if (mt === "GET" && a === "my-boosts") {
      const mb = await gm(sb, cpf); if (!mb) return j({ boosts: [], max_slots: 1 });
      const sl = await gs(sb, mb.id); if (!sl) return j({ boosts: [], max_slots: 1 });
      const { data: plan } = await sb.from("marketplace_plans").select("boost_slots").eq("id", sl.plan_id || "free").single();
      const { data: boosts } = await sb.from("marketplace_offers").select("id, boost_level, boost_active_until, product_id, size, price")
        .eq("seller_id", sl.id).not("boost_level", "is", null).gt("boost_active_until", new Date().toISOString());
      return j({ boosts: boosts || [], max_slots: plan?.boost_slots || 1, used: (boosts?.length || 0) });
    }

    // ==================== COLLECTIONS ====================
    if (mt === "GET" && a === "my-collections") {
      const mb = await gm(sb, cpf); if (!mb) return j({ collections: [] });
      const sl = await gs(sb, mb.id); if (!sl) return j({ collections: [] });
      const { data } = await sb.from("seller_collections").select("*").eq("seller_id", sl.id).order("sort_order", { ascending: true });
      return j({ collections: data || [] });
    }

    if (mt === "POST" && a === "create-collection") {
      const b = await req.json();
      const mb = await gm(sb, cpf); if (!mb) throw new Error("Membro não encontrado");
      const sl = await gs(sb, mb.id); if (!sl) throw new Error("Vendedor não encontrado");
      if (sl.plan_id !== "elite") throw new Error("Coleções disponíveis apenas no plano Elite.");
      const { data, error } = await sb.from("seller_collections").insert({ seller_id: sl.id, name: b.name, description: b.description || null, cover_image: b.cover_image || null, listing_ids: b.listing_ids || [] }).select().single();
      if (error) throw error;
      return j({ collection: data });
    }

    if (mt === "PUT" && a === "update-collection") {
      const b = await req.json();
      const mb = await gm(sb, cpf); if (!mb) throw new Error("Membro não encontrado");
      const sl = await gs(sb, mb.id); if (!sl) throw new Error("Vendedor não encontrado");
      const { error } = await sb.from("seller_collections").update({ name: b.name, description: b.description, cover_image: b.cover_image, listing_ids: b.listing_ids, is_active: b.is_active, updated_at: new Date().toISOString() }).eq("id", b.id).eq("seller_id", sl.id);
      if (error) throw error;
      return j({ success: true });
    }

    if (mt === "DELETE" && a === "delete-collection") {
      const id = url.searchParams.get("id"); if (!id) throw new Error("ID obrigatório");
      const mb = await gm(sb, cpf); if (!mb) throw new Error("Membro não encontrado");
      const sl = await gs(sb, mb.id); if (!sl) throw new Error("Vendedor não encontrado");
      await sb.from("seller_collections").delete().eq("id", id).eq("seller_id", sl.id);
      return j({ success: true });
    }

    // ==================== SOCIAL ====================
    if (mt === "POST" && a === "toggle-follow") {
      const { seller_id } = await req.json(); if (!seller_id) throw new Error("seller_id obrigatório");
      const { data: ex } = await sb.from("marketplace_seller_follows").select("id").eq("follower_cpf", cpf).eq("seller_id", seller_id).maybeSingle();
      if (ex) { await sb.from("marketplace_seller_follows").delete().eq("id", ex.id); return j({ following: false }); }
      await sb.from("marketplace_seller_follows").insert({ follower_cpf: cpf, seller_id });
      const { data: sl } = await sb.from("vault_seller_profiles").select("member_id").eq("id", seller_id).maybeSingle();
      if (sl?.member_id) {
        const { data: mem } = await sb.from("vault_members").select("client_cpf").eq("id", sl.member_id).maybeSingle();
        if (mem) await nt(sb, "👤 Novo seguidor!", "Alguém começou a seguir sua loja!", mem.client_cpf, seller_id, "marketplace_follow");
      }
      return j({ following: true });
    }

    if (mt === "GET" && a === "is-following") {
      const sid = url.searchParams.get("seller_id"); if (!sid) return j({ following: false });
      const { data } = await sb.from("marketplace_seller_follows").select("id").eq("follower_cpf", cpf).eq("seller_id", sid).maybeSingle();
      return j({ following: !!data });
    }

    if (mt === "GET" && a === "my-follows") {
      const { data } = await sb.from("marketplace_seller_follows").select("seller_id, created_at").eq("follower_cpf", cpf);
      return j({ follows: data || [] });
    }

    if (mt === "GET" && a === "loyalty-balance") {
      const { data } = await sb.rpc("get_loyalty_balance", { p_cpf: cpf });
      const { data: history } = await sb.from("marketplace_loyalty_points").select("*").eq("user_cpf", cpf).order("created_at", { ascending: false }).limit(20);
      return j({ balance: data || 0, history: history || [] });
    }

    if (mt === "GET" && a === "seller-leaderboard") {
      let q = sb.from("vault_seller_profiles").select(
        `id, total_sales_count, total_sales_value, average_rating, ratings_count, plan_id, verified_badge, followers_count, member:vault_members!inner(client_name, tier)`
      ).gt("total_sales_count", 0).order("total_sales_value", { ascending: false }).limit(20);
      const { data } = await q;
      const sellers = [];
      for (const s of (data || [])) {
        const { data: badges } = await sb.from("marketplace_seller_badges").select("badge_name, badge_icon, badge_type").eq("seller_id", s.id);
        sellers.push({ ...s, badges: badges || [] });
      }
      return j({ leaderboard: sellers });
    }

    if (mt === "POST" && a === "check-badges") {
      const mb = await gm(sb, cpf); if (!mb) return j({ badges: [] });
      const sl = await gs(sb, mb.id); if (!sl) return j({ badges: [] });
      const { data: existing } = await sb.from("marketplace_seller_badges").select("badge_type").eq("seller_id", sl.id);
      const hasBadge = (type: string) => (existing || []).some((b: any) => b.badge_type === type);
      const newBadges: any[] = [];
      if (sl.total_sales_count >= 1 && !hasBadge("first_sale")) newBadges.push({ seller_id: sl.id, badge_type: "first_sale", badge_name: "Primeira Venda", badge_icon: "🎉" });
      if (sl.total_sales_count >= 10 && !hasBadge("ten_sales")) newBadges.push({ seller_id: sl.id, badge_type: "ten_sales", badge_name: "10 Vendas", badge_icon: "🔥" });
      if (sl.total_sales_count >= 50 && !hasBadge("fifty_sales")) newBadges.push({ seller_id: sl.id, badge_type: "fifty_sales", badge_name: "50 Vendas", badge_icon: "💎" });
      if (sl.total_sales_count >= 5 && (sl.dispute_rate || 0) === 0 && !hasBadge("zero_disputes")) newBadges.push({ seller_id: sl.id, badge_type: "zero_disputes", badge_name: "Zero Disputas", badge_icon: "🛡️" });
      if ((sl.average_rating || 0) >= 4.8 && (sl.ratings_count || 0) >= 5 && !hasBadge("top_rated")) newBadges.push({ seller_id: sl.id, badge_type: "top_rated", badge_name: "Top Avaliado", badge_icon: "⭐" });
      if (sl.verified_badge && !hasBadge("verified")) newBadges.push({ seller_id: sl.id, badge_type: "verified", badge_name: "Verificado", badge_icon: "✅" });
      if (newBadges.length > 0) {
        await sb.from("marketplace_seller_badges").insert(newBadges);
        const { data: mem } = await sb.from("vault_members").select("client_cpf").eq("id", mb.id).maybeSingle();
        if (mem) { for (const badge of newBadges) await nt(sb, `🏅 Nova conquista: ${badge.badge_name}!`, `Você desbloqueou o badge "${badge.badge_name}" ${badge.badge_icon}`, mem.client_cpf, sl.id, "marketplace_badge"); }
      }
      const { data: allBadges } = await sb.from("marketplace_seller_badges").select("*").eq("seller_id", sl.id).order("earned_at", { ascending: false });
      return j({ badges: allBadges || [], new_badges: newBadges });
    }

    // ==================== STOREFRONT ====================
    if (mt === "PUT" && a === "update-storefront") {
      const b = await req.json();
      const mb = await gm(sb, cpf); if (!mb) throw new Error("Membro não encontrado");
      const sl = await gs(sb, mb.id); if (!sl) throw new Error("Vendedor não encontrado");
      const updateData: Record<string, unknown> = {};
      if (b.bio !== undefined) updateData.bio = b.bio;
      if (b.banner !== undefined) updateData.storefront_banner = b.banner;
      if (b.tagline !== undefined) updateData.storefront_tagline = b.tagline;
      if (b.theme !== undefined) updateData.storefront_theme = b.theme;
      if (b.avatar_url !== undefined) updateData.avatar_url = b.avatar_url;
      const { error } = await sb.from("vault_seller_profiles").update(updateData).eq("id", sl.id);
      if (error) throw error;
      return j({ success: true });
    }

    if (mt === "GET" && a === "my-storefront") {
      const mb = await gm(sb, cpf); if (!mb) return j({ storefront: null });
      const sl = await gs(sb, mb.id); if (!sl) return j({ storefront: null });
      return j({ storefront: { bio: sl.bio, banner: sl.storefront_banner, tagline: sl.storefront_tagline, theme: sl.storefront_theme, avatar_url: sl.avatar_url, seller_id: sl.id } });
    }

    // ==================== KYC REVIEW (admin) ====================
    if (mt === "PUT" && a === "review-kyc") {
      const b = await req.json();
      if (!b.seller_id || !b.decision) throw new Error("seller_id e decision obrigatórios");
      const updateData: Record<string, unknown> = {
        kyc_status: b.decision, // "approved" or "rejected"
        kyc_reviewed_at: new Date().toISOString(),
        kyc_reviewed_by: cpf,
      };
      if (b.decision === "rejected" && b.reason) updateData.kyc_rejection_reason = b.reason;
      const { error } = await sb.from("vault_seller_profiles").update(updateData).eq("id", b.seller_id);
      if (error) throw error;
      // Notify seller
      const { data: sl } = await sb.from("vault_seller_profiles").select("member:vault_members!inner(client_cpf, client_name, client_email, client_phone)").eq("id", b.seller_id).single();
      if (sl?.member) {
        const emailType = b.decision === "approved" ? "mk_kyc_approved" : "mk_kyc_rejected";
        const waType = emailType;
        const notifTitle = b.decision === "approved" ? "✅ Cadastro aprovado!" : "⚠️ Documentos não aprovados";
        const notifMsg = b.decision === "approved" ? "Parabéns! Você já pode vender no marketplace." : `Seus documentos não foram aprovados. ${b.reason || "Veja detalhes na plataforma."}`;
        await nt(sb, notifTitle, notifMsg, sl.member.client_cpf, b.seller_id, "marketplace_kyc");
        if (sl.member.client_email) em(emailType, { recipient_name: sl.member.client_name, recipient_email: sl.member.client_email, kyc_rejection_reason: b.reason || null });
        if (sl.member.client_phone) wa(waType, { recipient_phone: sl.member.client_phone, recipient_name: sl.member.client_name, kyc_rejection_reason: b.reason || null });
      }
      return j({ success: true });
    }

    // ==================== SNAPSHOT PRICES (cron) ====================
    if (mt === "POST" && a === "snapshot-prices") {
      const { data: products } = await sb.from("marketplace_products").select("id").eq("is_active", true).gt("total_offers", 0);
      let count = 0;
      for (const p of (products || [])) {
        const { data: offers } = await sb.from("marketplace_offers").select("price").eq("product_id", p.id).eq("status", "active");
        if (!offers || offers.length === 0) continue;
        const prices = offers.map((o: any) => o.price);
        await sb.from("marketplace_price_history").upsert({
          product_id: p.id, recorded_date: new Date().toISOString().split("T")[0],
          min_price: Math.min(...prices), avg_price: Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length),
          max_price: Math.max(...prices), offers_count: offers.length,
        }, { onConflict: "product_id,recorded_date" });
        count++;
      }
      return j({ success: true, products_snapshotted: count });
    }

    return j({ error: "Ação não encontrada" }, 404);
  } catch (e: any) {
    console.error("mk-seller error:", e);
    return j({ error: e.message }, 500);
  }
});
