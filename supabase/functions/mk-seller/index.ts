// mk-seller: Seller Onboarding, Tier, Analytics, Price Drop Suggestions, Strikes
import {
  corsHeaders, jsonResponse, createSupabaseClient, resolveCpf,
  getMember, getSellerProfile, notify,
} from "../_shared/mk-helpers.ts";

const j = jsonResponse;
const gm = getMember;
const gs = getSellerProfile;
const nt = notify;

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
      if (!b.full_name || !b.cpf_cnpj || !b.phone || !b.seller_cep || !b.pix_key_type || !b.pix_key || !b.pix_beneficiary || !b.bank_name || !b.terms_accepted) throw new Error("Todos os campos obrigatórios devem ser preenchidos");
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
      if (hasDocuments) { onboardingData.id_front_url = b.id_front_url; onboardingData.id_back_url = b.id_back_url; onboardingData.id_selfie_url = b.id_selfie_url; }
      if (sl) { await sb.from("vault_seller_profiles").update(onboardingData).eq("id", sl.id); }
      else { const { error } = await sb.from("vault_seller_profiles").insert({ member_id: mb.id, ...onboardingData }); if (error) throw error; }
      if (hasDocuments) await sb.from("notifications").insert({ title: "Novo vendedor aguardando aprovação", message: `${b.full_name} enviou documentos para verificação de identidade.`, target: "admin", type: "info", reference_type: "seller_kyc" });
      return j({ success: true });
    }

    // ==================== SELLER TIER INFO ====================
    if (mt === "GET" && a === "seller-tier-info") {
      const sid = url.searchParams.get("seller_id");
      if (!sid) throw new Error("seller_id obrigatório");
      const { data } = await sb.from("vault_seller_profiles").select("tier, on_time_shipping_rate, cancellation_rate, dispute_rate, pro_approval_rate, payout_speed_days, current_fee_percent, total_sales_count, average_rating").eq("id", sid).single();
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
      if (total === 0) { await sb.from("vault_seller_profiles").update({ tier: "bronze", tier_updated_at: new Date().toISOString() }).eq("id", sid); return j({ tier: "bronze", metrics: {} }); }
      const completed = orders.filter((o: any) => ["completed", "delivered", "payout_released", "payout_pending"].includes(o.status));
      const cancelled = orders.filter((o: any) => o.status === "cancelled");
      const disputed = orders.filter((o: any) => o.dispute_status === "open" || o.dispute_status === "resolved_buyer");
      const proOrders = orders.filter((o: any) => o.inspection_result);
      const proApproved = proOrders.filter((o: any) => o.inspection_result === "approved");
      const shippedOrders = orders.filter((o: any) => o.shipped_at && o.paid_at);
      const onTime = shippedOrders.filter((o: any) => { const diff = (new Date(o.shipped_at).getTime() - new Date(o.paid_at).getTime()) / (1000 * 60 * 60 * 24); return diff <= 3; });
      const onTimeRate = shippedOrders.length > 0 ? Math.round((onTime.length / shippedOrders.length) * 100) : 100;
      const cancellationRate = total > 0 ? Math.round((cancelled.length / total) * 100) : 0;
      const disputeRate = total > 0 ? Math.round((disputed.length / total) * 100) : 0;
      const proApprovalRate = proOrders.length > 0 ? Math.round((proApproved.length / proOrders.length) * 100) : 100;
      let tier = "bronze", payoutDays = 10, feePercent = 14;
      if (completed.length >= 50 && onTimeRate >= 95 && disputeRate <= 2 && cancellationRate <= 3 && proApprovalRate >= 98) { tier = "elite"; payoutDays = 3; feePercent = 8; }
      else if (completed.length >= 20 && onTimeRate >= 90 && disputeRate <= 5 && cancellationRate <= 5 && proApprovalRate >= 95) { tier = "ouro"; payoutDays = 5; feePercent = 10; }
      else if (completed.length >= 5 && onTimeRate >= 80 && disputeRate <= 10 && cancellationRate <= 10) { tier = "prata"; payoutDays = 7; feePercent = 12; }
      await sb.from("vault_seller_profiles").update({ tier, tier_updated_at: new Date().toISOString(), on_time_shipping_rate: onTimeRate, cancellation_rate: cancellationRate, dispute_rate: disputeRate, pro_approval_rate: proApprovalRate, payout_speed_days: payoutDays, current_fee_percent: feePercent }).eq("id", sid);
      return j({ tier, metrics: { total_orders: total, completed: completed.length, onTimeRate, cancellationRate, disputeRate, proApprovalRate }, benefits: { payout_days: payoutDays, fee_percent: feePercent } });
    }

    // ==================== SELLER ANALYTICS ====================
    if (mt === "GET" && a === "seller-analytics") {
      const mb = await gm(sb, cpf);
      if (!mb) return j({ analytics: null });
      const sl = await gs(sb, mb.id);
      if (!sl) return j({ analytics: null });
      const periodParam = url.searchParams.get("period") || "30d";
      const now = new Date();
      let periodStart: Date;
      if (periodParam === "7d") periodStart = new Date(now.getTime() - 7 * 86400000);
      else if (periodParam === "30d") periodStart = new Date(now.getTime() - 30 * 86400000);
      else if (periodParam === "90d") periodStart = new Date(now.getTime() - 90 * 86400000);
      else periodStart = new Date("2020-01-01");
      const periodISO = periodStart.toISOString();
      const periodMs = now.getTime() - periodStart.getTime();
      const prevStart = new Date(periodStart.getTime() - periodMs).toISOString();
      const { data: listings } = await sb.from("vault_marketplace_listings").select("id, views_count, price, status, created_at, published_at, condition, brand, size, model").eq("seller_id", sl.id);
      const totalViews = (listings || []).reduce((s: number, l: any) => s + (l.views_count || 0), 0);
      const activeListings = (listings || []).filter((l: any) => l.status === "active").length;
      const { data: orders } = await sb.from("vault_marketplace_orders").select("id, status, sale_price, fee_amount, seller_payout, created_at, paid_at, payout_released_at, brand, model, size").eq("seller_id", sl.id);
      const completedStatuses = ["delivered", "payout_released", "payout_pending", "completed"];
      const allCompleted = (orders || []).filter((o: any) => completedStatuses.includes(o.status));
      const periodOrders = allCompleted.filter((o: any) => o.created_at >= periodISO);
      const prevOrders = allCompleted.filter((o: any) => o.created_at >= prevStart && o.created_at < periodISO);
      const totalRevenue = periodOrders.reduce((s: number, o: any) => s + (o.seller_payout || 0), 0);
      const totalFees = periodOrders.reduce((s: number, o: any) => s + (o.fee_amount || 0), 0);
      const prevRevenue = prevOrders.reduce((s: number, o: any) => s + (o.seller_payout || 0), 0);
      const revenueGrowth = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 1000) / 10 : (totalRevenue > 0 ? 100 : 0);
      const salesGrowth = prevOrders.length > 0 ? Math.round(((periodOrders.length - prevOrders.length) / prevOrders.length) * 1000) / 10 : (periodOrders.length > 0 ? 100 : 0);
      const conversionRate = totalViews > 0 ? Math.round((periodOrders.length / totalViews) * 10000) / 100 : 0;
      const allPeriodOrders = (orders || []).filter((o: any) => o.created_at >= periodISO);
      const checkoutStarts = allPeriodOrders.length;
      const paidOrders = allPeriodOrders.filter((o: any) => o.paid_at).length;
      const monthlyData: Record<string, { revenue: number; sales: number; views: number }> = {};
      for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; monthlyData[key] = { revenue: 0, sales: 0, views: 0 }; }
      for (const o of allCompleted) { const key = o.created_at.slice(0, 7); if (monthlyData[key]) { monthlyData[key].revenue += o.seller_payout || 0; monthlyData[key].sales += 1; } }
      const activeItems = (listings || []).filter((l: any) => l.status === "active");
      const inventoryValue = activeItems.reduce((s: number, l: any) => s + (l.price || 0), 0);
      const avgPrice = activeItems.length > 0 ? Math.round(inventoryValue / activeItems.length) : 0;
      const conditionMap: Record<string, number> = {};
      activeItems.forEach((l: any) => { const c = l.condition || "unknown"; conditionMap[c] = (conditionMap[c] || 0) + 1; });
      const inventoryByCondition = Object.entries(conditionMap).map(([condition, count]) => ({ condition, count })).sort((a, b) => b.count - a.count);
      const brandMap: Record<string, number> = {};
      activeItems.forEach((l: any) => { const b = l.brand || "Outro"; brandMap[b] = (brandMap[b] || 0) + 1; });
      const inventoryByBrand = Object.entries(brandMap).map(([brand, count]) => ({ brand, count })).sort((a, b) => b.count - a.count).slice(0, 8);
      const sizeMap: Record<string, number> = {};
      activeItems.forEach((l: any) => { const s = l.size || "?"; sizeMap[s] = (sizeMap[s] || 0) + 1; });
      const inventoryBySize = Object.entries(sizeMap).map(([size, count]) => ({ size, count })).sort((a, b) => b.count - a.count).slice(0, 10);
      const brandSalesMap: Record<string, { count: number; revenue: number }> = {};
      periodOrders.forEach((o: any) => { const b = o.brand || "Outro"; if (!brandSalesMap[b]) brandSalesMap[b] = { count: 0, revenue: 0 }; brandSalesMap[b].count += 1; brandSalesMap[b].revenue += o.seller_payout || 0; });
      const topSellingBrands = Object.entries(brandSalesMap).map(([brand, d]) => ({ brand, sales: d.count, revenue: Math.round(d.revenue * 100) / 100 })).sort((a, b) => b.sales - a.sales).slice(0, 5);
      const modelSalesMap: Record<string, { count: number; revenue: number; brand: string }> = {};
      periodOrders.forEach((o: any) => { const m = o.model || "Desconhecido"; if (!modelSalesMap[m]) modelSalesMap[m] = { count: 0, revenue: 0, brand: o.brand || "" }; modelSalesMap[m].count += 1; modelSalesMap[m].revenue += o.seller_payout || 0; });
      const topSellingModels = Object.entries(modelSalesMap).map(([model, d]) => ({ model, brand: d.brand, sales: d.count, revenue: Math.round(d.revenue * 100) / 100 })).sort((a, b) => b.sales - a.sales).slice(0, 5);
      const sizeSalesMap: Record<string, number> = {};
      periodOrders.forEach((o: any) => { const s = o.size || "?"; sizeSalesMap[s] = (sizeSalesMap[s] || 0) + 1; });
      const topSizes = Object.entries(sizeSalesMap).map(([size, count]) => ({ size, count })).sort((a, b) => b.count - a.count).slice(0, 5);
      const totalInventory = activeItems.length + periodOrders.length;
      const sellThroughRate = totalInventory > 0 ? Math.round((periodOrders.length / totalInventory) * 10000) / 100 : 0;
      const soldListings = (listings || []).filter((l: any) => l.status === "sold" && l.published_at);
      let avgDaysToSell = 0;
      if (soldListings.length > 0) { const totalDays = soldListings.reduce((s: number, l: any) => { const pub = new Date(l.published_at).getTime(); const created = new Date(l.created_at).getTime(); return s + Math.max(1, Math.round((created - pub) / 86400000)); }, 0); avgDaysToSell = Math.round(totalDays / soldListings.length); }
      const { data: sub } = await sb.from("marketplace_subscriptions").select("plan_id, status").eq("seller_id", sl.id).eq("status", "active").maybeSingle();
      const { data: globalOrders } = await sb.from("vault_marketplace_orders").select("brand, model").in("status", completedStatuses).gte("created_at", periodISO).limit(500);
      const globalBrandMap: Record<string, number> = {};
      (globalOrders || []).forEach((o: any) => { const b = o.brand || "Outro"; globalBrandMap[b] = (globalBrandMap[b] || 0) + 1; });
      const marketTopBrands = Object.entries(globalBrandMap).map(([brand, count]) => ({ brand, count })).sort((a, b) => b.count - a.count).slice(0, 8);
      return j({
        analytics: {
          total_views: totalViews, active_listings: activeListings,
          total_sales: periodOrders.length, total_revenue: Math.round(totalRevenue * 100) / 100,
          total_fees: Math.round(totalFees * 100) / 100, conversion_rate: conversionRate,
          average_order_value: periodOrders.length > 0 ? Math.round(totalRevenue / periodOrders.length) : 0,
          monthly: Object.entries(monthlyData).map(([month, data]) => ({ month, ...data })),
          tier: sl.tier || "bronze", fee_percent: sl.current_fee_percent || 14,
          rating: sl.average_rating, ratings_count: sl.ratings_count || 0,
          revenue_growth: revenueGrowth, sales_growth: salesGrowth,
          funnel: { views: totalViews, checkout_starts: checkoutStarts, paid: paidOrders, completed: periodOrders.length },
          plan_id: sub?.plan_id || "free",
          inventory: { total_items: activeItems.length, total_value: Math.round(inventoryValue * 100) / 100, avg_price: avgPrice, by_condition: inventoryByCondition, by_brand: inventoryByBrand, by_size: inventoryBySize },
          insights: { top_selling_brands: topSellingBrands, top_selling_models: topSellingModels, top_sizes: topSizes, sell_through_rate: sellThroughRate, avg_days_to_sell: avgDaysToSell, market_top_brands: marketTopBrands },
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
      const { data: staleListings } = await sb.from("vault_marketplace_listings").select("id, title, price, views_count, created_at, published_at").eq("seller_id", sl.id).eq("status", "active").lt("published_at", sevenDaysAgo).order("published_at", { ascending: true });
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

    // ==================== SELLER LEADERBOARD ====================
    if (mt === "GET" && a === "seller-leaderboard") {
      let q = sb.from("vault_seller_profiles").select(`id, total_sales_count, total_sales_value, average_rating, ratings_count, plan_id, verified_badge, followers_count, member:vault_members!inner(client_name, tier)`).gt("total_sales_count", 0).order("total_sales_value", { ascending: false }).limit(20);
      const { data } = await q;
      const sellers = [];
      for (const s of (data || [])) { const { data: badges } = await sb.from("marketplace_seller_badges").select("badge_name, badge_icon, badge_type").eq("seller_id", s.id); sellers.push({ ...s, badges: badges || [] }); }
      return j({ leaderboard: sellers });
    }

    // ==================== MY STRIKES ====================
    if (mt === "GET" && a === "my-strikes") {
      const mb = await gm(sb, cpf);
      if (!mb) return j({ strikes: [], active_count: 0, suspended_until: null });
      const sl = await gs(sb, mb.id);
      if (!sl) return j({ strikes: [], active_count: 0, suspended_until: null });
      const { data: strikes } = await sb.from("seller_strikes").select("*").eq("seller_id", sl.id).order("created_at", { ascending: false });
      return j({ strikes: strikes || [], active_count: sl.active_strikes_count || 0, suspended_until: sl.suspended_until || null });
    }

    // ==================== APPEAL STRIKE ====================
    if (mt === "POST" && a === "appeal-strike") {
      const b = await req.json();
      if (!b.strike_id || !b.message) return j({ error: "strike_id e message obrigatórios" }, 400);
      const mb = await gm(sb, cpf);
      if (!mb) return j({ error: "Membro não encontrado" }, 404);
      const sl = await gs(sb, mb.id);
      if (!sl) return j({ error: "Perfil de vendedor não encontrado" }, 404);
      const { data: strike } = await sb.from("seller_strikes").select("id, seller_id, appeal_status").eq("id", b.strike_id).eq("seller_id", sl.id).single();
      if (!strike) return j({ error: "Aviso não encontrado" }, 404);
      if (strike.appeal_status) return j({ error: "Já existe um recurso para este aviso" }, 400);
      const { error: upErr } = await sb.from("seller_strikes").update({ appeal_status: "pending", appeal_message: b.message }).eq("id", b.strike_id);
      if (upErr) throw upErr;
      return j({ success: true });
    }

    return j({ error: "Ação não encontrada" }, 404);
  } catch (e: any) {
    console.error("mk-seller error:", e);
    return j({ error: e.message }, 500);
  }
});
