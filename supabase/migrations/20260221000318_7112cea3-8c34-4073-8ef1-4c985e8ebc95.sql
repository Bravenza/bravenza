
-- ============================================================
-- ADMIN SECURITY HARDENING: Fix {public} role policies → {authenticated}
-- and critical data exposures
-- ============================================================

-- 1. verification_attempts: CRITICAL - full CRUD access to anyone
DROP POLICY IF EXISTS "Service role full access on verification_attempts" ON public.verification_attempts;
CREATE POLICY "Service can manage verification_attempts"
ON public.verification_attempts FOR ALL TO service_role USING (true) WITH CHECK (true);
-- Allow anon INSERT only (for the verify endpoint)
CREATE POLICY "Anon can insert verification attempts"
ON public.verification_attempts FOR INSERT TO anon WITH CHECK (true);
-- Admin can read
CREATE POLICY "Admins can read verification_attempts"
ON public.verification_attempts FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- 2. marketplace_saved_searches: SELECT USING(true) on {public} exposes all searches
DROP POLICY IF EXISTS "Users can read own saved searches" ON public.marketplace_saved_searches;
CREATE POLICY "Users can read own saved searches"
ON public.marketplace_saved_searches FOR SELECT TO authenticated
USING (
  user_cpf IN (SELECT cp.cpf FROM client_profiles cp WHERE cp.user_id = auth.uid())
  OR is_admin(auth.uid())
);

-- 3. cron_execution_logs: admin SELECT on {public} → {authenticated}
DROP POLICY IF EXISTS "Admins can read cron logs" ON public.cron_execution_logs;
CREATE POLICY "Admins can read cron logs"
ON public.cron_execution_logs FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- 4. marketplace_product_comments: admin ALL on {public} → {authenticated}
DROP POLICY IF EXISTS "Admins full access marketplace_product_comments" ON public.marketplace_product_comments;
CREATE POLICY "Admins full access marketplace_product_comments"
ON public.marketplace_product_comments FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- 5. marketplace_products: admin ALL on {public} → {authenticated}
DROP POLICY IF EXISTS "Admins full access marketplace_products" ON public.marketplace_products;
CREATE POLICY "Admins full access marketplace_products"
ON public.marketplace_products FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- 6. marketplace_watchlist: admin ALL on {public} → {authenticated}
DROP POLICY IF EXISTS "Admins full access marketplace_watchlist" ON public.marketplace_watchlist;
CREATE POLICY "Admins full access marketplace_watchlist"
ON public.marketplace_watchlist FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- 7. marketplace_seller_badges: admin ALL on {public} → {authenticated}
DROP POLICY IF EXISTS "Admin manage seller badges" ON public.marketplace_seller_badges;
CREATE POLICY "Admin manage seller badges"
ON public.marketplace_seller_badges FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- 8. vault_community_comment_likes: admin ALL on {public} → {authenticated}
DROP POLICY IF EXISTS "Admins full access to vault_community_comment_likes" ON public.vault_community_comment_likes;
CREATE POLICY "Admins full access to vault_community_comment_likes"
ON public.vault_community_comment_likes FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- 9. vault_community_comments: admin ALL on {public} → {authenticated}
DROP POLICY IF EXISTS "Admins full access to vault_community_comments" ON public.vault_community_comments;
CREATE POLICY "Admins full access to vault_community_comments"
ON public.vault_community_comments FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- 10. vault_community_likes: admin ALL on {public} → {authenticated}
DROP POLICY IF EXISTS "Admins full access to vault_community_likes" ON public.vault_community_likes;
CREATE POLICY "Admins full access to vault_community_likes"
ON public.vault_community_likes FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- 11. vault_community_presence: admin ALL on {public} → {authenticated}
DROP POLICY IF EXISTS "Admins full access to vault_community_presence" ON public.vault_community_presence;
CREATE POLICY "Admins full access to vault_community_presence"
ON public.vault_community_presence FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
-- Fix presence SELECT from {public} to {authenticated}
DROP POLICY IF EXISTS "Authenticated members read presence" ON public.vault_community_presence;
CREATE POLICY "Authenticated members read presence"
ON public.vault_community_presence FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- 12. vault_marketplace_favorites: admin ALL on {public} → {authenticated}
DROP POLICY IF EXISTS "Admins full access to vault_marketplace_favorites" ON public.vault_marketplace_favorites;
CREATE POLICY "Admins full access to vault_marketplace_favorites"
ON public.vault_marketplace_favorites FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- 13. vault_marketplace_listings: admin ALL on {public} → {authenticated}
DROP POLICY IF EXISTS "Admins full access to vault_marketplace_listings" ON public.vault_marketplace_listings;
CREATE POLICY "Admins full access to vault_marketplace_listings"
ON public.vault_marketplace_listings FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- 14. seller_collections: "Sellers can manage own" on {public} → {authenticated}
DROP POLICY IF EXISTS "Sellers can manage own collections" ON public.seller_collections;
CREATE POLICY "Sellers can manage own collections"
ON public.seller_collections FOR ALL TO authenticated
USING (seller_id IN (
  SELECT vsp.id FROM vault_seller_profiles vsp
  JOIN vault_members vm ON vm.id = vsp.member_id
  JOIN client_profiles cp ON cp.cpf = vm.client_cpf
  WHERE cp.user_id = auth.uid()
))
WITH CHECK (seller_id IN (
  SELECT vsp.id FROM vault_seller_profiles vsp
  JOIN vault_members vm ON vm.id = vsp.member_id
  JOIN client_profiles cp ON cp.cpf = vm.client_cpf
  WHERE cp.user_id = auth.uid()
));

-- 15. vault_community_comment_reactions: INSERT/DELETE on {public} → {authenticated}
DROP POLICY IF EXISTS "Community members can add comment reactions" ON public.vault_community_comment_reactions;
CREATE POLICY "Community members can add comment reactions"
ON public.vault_community_comment_reactions FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM vault_members vm
  JOIN client_profiles cp ON cp.cpf = vm.client_cpf
  WHERE vm.id = vault_community_comment_reactions.user_id
  AND cp.user_id = auth.uid()
  AND vm.community_opt_in = true
));

DROP POLICY IF EXISTS "Users can delete own comment reactions" ON public.vault_community_comment_reactions;
CREATE POLICY "Users can delete own comment reactions"
ON public.vault_community_comment_reactions FOR DELETE TO authenticated
USING (user_id IN (
  SELECT vm.id FROM vault_members vm
  JOIN client_profiles cp ON cp.cpf = vm.client_cpf
  WHERE cp.user_id = auth.uid()
));

-- Fix SELECT on {public} → {authenticated}
DROP POLICY IF EXISTS "Community members can view comment reactions" ON public.vault_community_comment_reactions;
CREATE POLICY "Community members can view comment reactions"
ON public.vault_community_comment_reactions FOR SELECT TO authenticated USING (true);

-- 16. profiles: policies on {public} → {authenticated}
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 17. user_roles: SELECT on {public} → {authenticated}
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role"
ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 18. Revoke anon access on remaining sensitive tables
REVOKE ALL ON public.verification_attempts FROM anon;
-- Re-grant INSERT only for verify endpoint
GRANT INSERT ON public.verification_attempts TO anon;

REVOKE ALL ON public.cron_execution_logs FROM anon;
REVOKE ALL ON public.marketplace_saved_searches FROM anon;
REVOKE ALL ON public.vault_community_comment_reactions FROM anon;
REVOKE ALL ON public.vault_community_presence FROM anon;
REVOKE SELECT, UPDATE, DELETE ON public.profiles FROM anon;
REVOKE ALL ON public.user_roles FROM anon;
