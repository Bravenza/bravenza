// mk-store: Coupons, Boosts, Collections, Social (Follow), Badges, Storefront, KYC Review, Snapshot Prices, Loyalty
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

const PUBLIC_ACTIONS = new Set<string>([]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const sb = createSupabaseClient();
  const url = new URL(req.url);
  const a = url.searchParams.get("action");
  const mt = req.method;

  console.log("mk-store", a, mt);

  const auth = await resolveCpf(req, sb, PUBLIC_ACTIONS, a);
  if (auth.errorResponse) return auth.errorResponse;
  const cpf = auth.cpf;

  try {
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
      const { error } = await sb.from("marketplace_coupons").update({ is_active: b.is_active, max_uses: b.max_uses, valid_until: b.valid_until, discount_value: b.discount_value, min_purchase: b.min_purchase }).eq("id", b.coupon_id).eq("seller_id", sl.id);
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
      const { data: boosts } = await sb.from("marketplace_offers").select("id, boost_level, boost_active_until, product_id, size, price").eq("seller_id", sl.id).not("boost_level", "is", null).gt("boost_active_until", new Date().toISOString());
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
      if (sl?.member_id) { const { data: mem } = await sb.from("vault_members").select("client_cpf").eq("id", sl.member_id).maybeSingle(); if (mem) await nt(sb, "👤 Novo seguidor!", "Alguém começou a seguir sua loja!", mem.client_cpf, seller_id, "marketplace_follow"); }
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

    // ==================== BADGES ====================
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
      const updateData: Record<string, unknown> = { kyc_status: b.decision, kyc_reviewed_at: new Date().toISOString(), kyc_reviewed_by: cpf };
      if (b.decision === "rejected" && b.reason) updateData.kyc_rejection_reason = b.reason;
      const { error } = await sb.from("vault_seller_profiles").update(updateData).eq("id", b.seller_id);
      if (error) throw error;
      const { data: sl } = await sb.from("vault_seller_profiles").select("member:vault_members!inner(client_cpf, client_name, client_email, client_phone)").eq("id", b.seller_id).single();
      if (sl?.member) {
        const emailType = b.decision === "approved" ? "mk_kyc_approved" : "mk_kyc_rejected";
        const notifTitle = b.decision === "approved" ? "✅ Cadastro aprovado!" : "⚠️ Documentos não aprovados";
        const notifMsg = b.decision === "approved" ? "Parabéns! Você já pode vender no marketplace." : `Seus documentos não foram aprovados. ${b.reason || "Veja detalhes na plataforma."}`;
        await nt(sb, notifTitle, notifMsg, sl.member.client_cpf, b.seller_id, "marketplace_kyc");
        if (sl.member.client_email) em(emailType, { recipient_name: sl.member.client_name, recipient_email: sl.member.client_email, kyc_rejection_reason: b.reason || null });
        if (sl.member.client_phone) wa(emailType, { recipient_phone: sl.member.client_phone, recipient_name: sl.member.client_name, kyc_rejection_reason: b.reason || null });
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
        await sb.from("marketplace_price_history").upsert({ product_id: p.id, recorded_date: new Date().toISOString().split("T")[0], min_price: Math.min(...prices), avg_price: Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length), max_price: Math.max(...prices), offers_count: offers.length }, { onConflict: "product_id,recorded_date" });
        count++;
      }
      return j({ success: true, products_snapshotted: count });
    }

    return j({ error: "Ação não encontrada" }, 404);
  } catch (e: any) {
    console.error("mk-store error:", e);
    return j({ error: e.message }, 500);
  }
});
