
-- =====================================================
-- SECURITY FIX: Corrigir policies com role "public" → service_role
-- e adicionar policies adequadas para acesso autenticado
-- =====================================================

-- 1. CRITICAL: vault_seller_profiles
DROP POLICY IF EXISTS "Service can manage vault_seller_profiles" ON public.vault_seller_profiles;
CREATE POLICY "Service can manage vault_seller_profiles"
  ON public.vault_seller_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Sellers can view own profile"
  ON public.vault_seller_profiles FOR SELECT TO authenticated
  USING (member_id IN (SELECT vm.id FROM vault_members vm INNER JOIN client_profiles cp ON cp.cpf = vm.client_cpf WHERE cp.user_id = auth.uid()));
CREATE POLICY "Sellers can update own profile"
  ON public.vault_seller_profiles FOR UPDATE TO authenticated
  USING (member_id IN (SELECT vm.id FROM vault_members vm INNER JOIN client_profiles cp ON cp.cpf = vm.client_cpf WHERE cp.user_id = auth.uid()));

-- 2. CRITICAL: vault_marketplace_orders
DROP POLICY IF EXISTS "Service can manage vault_marketplace_orders" ON public.vault_marketplace_orders;
DROP POLICY IF EXISTS "Buyers can view their own orders" ON public.vault_marketplace_orders;
CREATE POLICY "Service can manage vault_marketplace_orders"
  ON public.vault_marketplace_orders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Buyers can view own orders"
  ON public.vault_marketplace_orders FOR SELECT TO authenticated
  USING (buyer_cpf IN (SELECT cp.cpf FROM client_profiles cp WHERE cp.user_id = auth.uid()));
CREATE POLICY "Sellers can view their sales"
  ON public.vault_marketplace_orders FOR SELECT TO authenticated
  USING (seller_id IN (SELECT vsp.id FROM vault_seller_profiles vsp INNER JOIN vault_members vm ON vm.id = vsp.member_id INNER JOIN client_profiles cp ON cp.cpf = vm.client_cpf WHERE cp.user_id = auth.uid()));

-- 3. marketplace_coupons
DROP POLICY IF EXISTS "Allow all access to marketplace_coupons" ON public.marketplace_coupons;
CREATE POLICY "Service can manage marketplace_coupons"
  ON public.marketplace_coupons FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can read active coupons"
  ON public.marketplace_coupons FOR SELECT USING (is_active = true);

-- 4. marketplace_inspections
DROP POLICY IF EXISTS "Service can manage marketplace_inspections" ON public.marketplace_inspections;
CREATE POLICY "Service can manage marketplace_inspections"
  ON public.marketplace_inspections FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5. marketplace_offers
DROP POLICY IF EXISTS "Service can manage marketplace_offers" ON public.marketplace_offers;
CREATE POLICY "Service can manage marketplace_offers"
  ON public.marketplace_offers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can read active offers"
  ON public.marketplace_offers FOR SELECT USING (status = 'active');
CREATE POLICY "Sellers can manage own offers"
  ON public.marketplace_offers FOR ALL TO authenticated
  USING (seller_id IN (SELECT vsp.id FROM vault_seller_profiles vsp INNER JOIN vault_members vm ON vm.id = vsp.member_id INNER JOIN client_profiles cp ON cp.cpf = vm.client_cpf WHERE cp.user_id = auth.uid()))
  WITH CHECK (seller_id IN (SELECT vsp.id FROM vault_seller_profiles vsp INNER JOIN vault_members vm ON vm.id = vsp.member_id INNER JOIN client_profiles cp ON cp.cpf = vm.client_cpf WHERE cp.user_id = auth.uid()));

-- 6. marketplace_product_comments
DROP POLICY IF EXISTS "Service can manage marketplace_product_comments" ON public.marketplace_product_comments;
CREATE POLICY "Service can manage marketplace_product_comments"
  ON public.marketplace_product_comments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can read visible comments"
  ON public.marketplace_product_comments FOR SELECT USING (is_visible = true);
CREATE POLICY "Auth users can insert comments"
  ON public.marketplace_product_comments FOR INSERT TO authenticated
  WITH CHECK (user_cpf IN (SELECT cp.cpf FROM client_profiles cp WHERE cp.user_id = auth.uid()));

-- 7. marketplace_products
DROP POLICY IF EXISTS "Service can manage marketplace_products" ON public.marketplace_products;
CREATE POLICY "Service can manage marketplace_products"
  ON public.marketplace_products FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can read active products"
  ON public.marketplace_products FOR SELECT USING (is_active = true);

-- 8. marketplace_watchlist
DROP POLICY IF EXISTS "Service can manage marketplace_watchlist" ON public.marketplace_watchlist;
CREATE POLICY "Service can manage marketplace_watchlist"
  ON public.marketplace_watchlist FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage own watchlist"
  ON public.marketplace_watchlist FOR ALL TO authenticated
  USING (user_cpf IN (SELECT cp.cpf FROM client_profiles cp WHERE cp.user_id = auth.uid()))
  WITH CHECK (user_cpf IN (SELECT cp.cpf FROM client_profiles cp WHERE cp.user_id = auth.uid()));

-- 9. vault_community_comment_likes
DROP POLICY IF EXISTS "Service can manage vault_community_comment_likes" ON public.vault_community_comment_likes;
CREATE POLICY "Service can manage vault_community_comment_likes"
  ON public.vault_community_comment_likes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Members can manage own comment likes"
  ON public.vault_community_comment_likes FOR ALL TO authenticated
  USING (user_id IN (SELECT vm.id FROM vault_members vm INNER JOIN client_profiles cp ON cp.cpf = vm.client_cpf WHERE cp.user_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT vm.id FROM vault_members vm INNER JOIN client_profiles cp ON cp.cpf = vm.client_cpf WHERE cp.user_id = auth.uid()));

-- 10. vault_community_comments (user_id, not author_id)
DROP POLICY IF EXISTS "Service can manage vault_community_comments" ON public.vault_community_comments;
CREATE POLICY "Service can manage vault_community_comments"
  ON public.vault_community_comments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can read community comments"
  ON public.vault_community_comments FOR SELECT USING (true);
CREATE POLICY "Members can insert community comments"
  ON public.vault_community_comments FOR INSERT TO authenticated
  WITH CHECK (user_id IN (SELECT vm.id FROM vault_members vm INNER JOIN client_profiles cp ON cp.cpf = vm.client_cpf WHERE cp.user_id = auth.uid()));
CREATE POLICY "Members can delete own comments"
  ON public.vault_community_comments FOR DELETE TO authenticated
  USING (user_id IN (SELECT vm.id FROM vault_members vm INNER JOIN client_profiles cp ON cp.cpf = vm.client_cpf WHERE cp.user_id = auth.uid()));

-- 11. vault_community_likes
DROP POLICY IF EXISTS "Service can manage vault_community_likes" ON public.vault_community_likes;
CREATE POLICY "Service can manage vault_community_likes"
  ON public.vault_community_likes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Members can manage own likes"
  ON public.vault_community_likes FOR ALL TO authenticated
  USING (user_id IN (SELECT vm.id FROM vault_members vm INNER JOIN client_profiles cp ON cp.cpf = vm.client_cpf WHERE cp.user_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT vm.id FROM vault_members vm INNER JOIN client_profiles cp ON cp.cpf = vm.client_cpf WHERE cp.user_id = auth.uid()));

-- 12. vault_community_presence
DROP POLICY IF EXISTS "Service can manage vault_community_presence" ON public.vault_community_presence;
CREATE POLICY "Service can manage vault_community_presence"
  ON public.vault_community_presence FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can read presence"
  ON public.vault_community_presence FOR SELECT USING (true);

-- 13. vault_marketplace_favorites
DROP POLICY IF EXISTS "Service can manage vault_marketplace_favorites" ON public.vault_marketplace_favorites;
CREATE POLICY "Service can manage vault_marketplace_favorites"
  ON public.vault_marketplace_favorites FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage own favorites"
  ON public.vault_marketplace_favorites FOR ALL TO authenticated
  USING (user_cpf IN (SELECT cp.cpf FROM client_profiles cp WHERE cp.user_id = auth.uid()))
  WITH CHECK (user_cpf IN (SELECT cp.cpf FROM client_profiles cp WHERE cp.user_id = auth.uid()));

-- 14. vault_marketplace_listings
DROP POLICY IF EXISTS "Service can manage vault_marketplace_listings" ON public.vault_marketplace_listings;
CREATE POLICY "Service can manage vault_marketplace_listings"
  ON public.vault_marketplace_listings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can read active listings"
  ON public.vault_marketplace_listings FOR SELECT USING (status IN ('active', 'sold'));
CREATE POLICY "Sellers can manage own listings"
  ON public.vault_marketplace_listings FOR ALL TO authenticated
  USING (seller_id IN (SELECT vsp.id FROM vault_seller_profiles vsp INNER JOIN vault_members vm ON vm.id = vsp.member_id INNER JOIN client_profiles cp ON cp.cpf = vm.client_cpf WHERE cp.user_id = auth.uid()))
  WITH CHECK (seller_id IN (SELECT vsp.id FROM vault_seller_profiles vsp INNER JOIN vault_members vm ON vm.id = vsp.member_id INNER JOIN client_profiles cp ON cp.cpf = vm.client_cpf WHERE cp.user_id = auth.uid()));

-- 15. vault_marketplace_offers
DROP POLICY IF EXISTS "Anyone can insert offers" ON public.vault_marketplace_offers;
DROP POLICY IF EXISTS "Anyone can update offers" ON public.vault_marketplace_offers;
CREATE POLICY "Auth users can insert offers"
  ON public.vault_marketplace_offers FOR INSERT TO authenticated
  WITH CHECK (buyer_cpf IN (SELECT cp.cpf FROM client_profiles cp WHERE cp.user_id = auth.uid()));
CREATE POLICY "Users can view own offers"
  ON public.vault_marketplace_offers FOR SELECT TO authenticated
  USING (
    buyer_cpf IN (SELECT cp.cpf FROM client_profiles cp WHERE cp.user_id = auth.uid())
    OR listing_id IN (SELECT vml.id FROM vault_marketplace_listings vml INNER JOIN vault_seller_profiles vsp ON vsp.id = vml.seller_id INNER JOIN vault_members vm ON vm.id = vsp.member_id INNER JOIN client_profiles cp ON cp.cpf = vm.client_cpf WHERE cp.user_id = auth.uid())
  );
CREATE POLICY "Users can update relevant offers"
  ON public.vault_marketplace_offers FOR UPDATE TO authenticated
  USING (
    buyer_cpf IN (SELECT cp.cpf FROM client_profiles cp WHERE cp.user_id = auth.uid())
    OR listing_id IN (SELECT vml.id FROM vault_marketplace_listings vml INNER JOIN vault_seller_profiles vsp ON vsp.id = vml.seller_id INNER JOIN vault_members vm ON vm.id = vsp.member_id INNER JOIN client_profiles cp ON cp.cpf = vm.client_cpf WHERE cp.user_id = auth.uid())
  );

-- 16. vault_member_follows
DROP POLICY IF EXISTS "Members can manage own follows" ON public.vault_member_follows;
CREATE POLICY "Members can manage own follows"
  ON public.vault_member_follows FOR ALL TO authenticated
  USING (follower_id IN (SELECT vm.id FROM vault_members vm INNER JOIN client_profiles cp ON cp.cpf = vm.client_cpf WHERE cp.user_id = auth.uid()))
  WITH CHECK (follower_id IN (SELECT vm.id FROM vault_members vm INNER JOIN client_profiles cp ON cp.cpf = vm.client_cpf WHERE cp.user_id = auth.uid()));
CREATE POLICY "Anyone can read follows"
  ON public.vault_member_follows FOR SELECT USING (true);

-- 17. marketplace_activity_feed INSERT
DROP POLICY IF EXISTS "Service role can insert activity feed" ON public.marketplace_activity_feed;
CREATE POLICY "Service can insert activity feed"
  ON public.marketplace_activity_feed FOR INSERT TO service_role WITH CHECK (true);

-- 18. marketplace_product_reviews INSERT
DROP POLICY IF EXISTS "Users can insert own reviews" ON public.marketplace_product_reviews;
CREATE POLICY "Auth users can insert reviews"
  ON public.marketplace_product_reviews FOR INSERT TO authenticated
  WITH CHECK (reviewer_cpf IN (SELECT cp.cpf FROM client_profiles cp WHERE cp.user_id = auth.uid()));

-- 19. Fix functions missing search_path
CREATE OR REPLACE FUNCTION public.update_presence(p_cpf character varying)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $function$
DECLARE v_member_id UUID;
BEGIN
  SELECT id INTO v_member_id FROM vault_members WHERE client_cpf = p_cpf;
  INSERT INTO vault_community_presence (user_id, last_seen_at, status)
  VALUES (v_member_id, now(), 'online')
  ON CONFLICT (user_id) DO UPDATE SET last_seen_at = now(), status = 'online';
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_online_community_users(p_minutes integer DEFAULT 5)
RETURNS TABLE(user_id uuid, user_name character varying, user_tier character varying, items_count bigint, last_seen_at timestamp with time zone)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT m.id AS user_id, m.client_name::VARCHAR AS user_name, m.tier::VARCHAR AS user_tier,
    (SELECT COUNT(*) FROM vault_items vi WHERE vi.user_id = m.id) AS items_count, p.last_seen_at
  FROM vault_community_presence p
  JOIN vault_members m ON p.user_id = m.id
  WHERE p.last_seen_at > now() - (p_minutes || ' minutes')::INTERVAL AND m.community_opt_in = true
  ORDER BY p.last_seen_at DESC LIMIT 20;
END;
$function$;
