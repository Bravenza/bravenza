
-- Helper: resolve current user's vault_member_id from auth.uid()
CREATE OR REPLACE FUNCTION public.get_my_vault_member_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT vm.id FROM vault_members vm
  JOIN client_profiles cp ON cp.cpf::text = vm.client_cpf::text
  WHERE cp.user_id = auth.uid()
  LIMIT 1
$$;

-- FIX 1: reviews — drop anon SELECT that exposes client_cpf
DROP POLICY IF EXISTS "Anon can read approved reviews via view" ON reviews;

-- FIX 2: marketplace_seller_follows — follower_cpf exposed to public
DROP POLICY IF EXISTS "Anyone can view follows" ON marketplace_seller_follows;
CREATE POLICY "Users can view own follows"
  ON marketplace_seller_follows FOR SELECT TO authenticated
  USING (
    follower_cpf IN (SELECT cpf FROM client_profiles WHERE user_id = auth.uid())
    OR is_admin()
  );

-- FIX 3: vault_community_reports — logic bug: any member sees all reports
DROP POLICY IF EXISTS "Members can view own reports" ON vault_community_reports;
CREATE POLICY "Members can view own reports"
  ON vault_community_reports FOR SELECT TO authenticated
  USING (reporter_id = get_my_vault_member_id() OR is_admin());

-- FIX 4: vault_community_follows — missing ownership on INSERT/DELETE
DROP POLICY IF EXISTS "Anyone can view follows" ON vault_community_follows;
DROP POLICY IF EXISTS "Members can follow" ON vault_community_follows;
DROP POLICY IF EXISTS "Members can unfollow" ON vault_community_follows;
CREATE POLICY "Authenticated can view community follows"
  ON vault_community_follows FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can follow own"
  ON vault_community_follows FOR INSERT TO authenticated
  WITH CHECK (follower_id = get_my_vault_member_id());
CREATE POLICY "Members can unfollow own"
  ON vault_community_follows FOR DELETE TO authenticated
  USING (follower_id = get_my_vault_member_id());

-- FIX 5: vault_community_reactions — missing ownership on INSERT/DELETE
DROP POLICY IF EXISTS "Community members can view reactions" ON vault_community_reactions;
DROP POLICY IF EXISTS "Community members can add reactions" ON vault_community_reactions;
DROP POLICY IF EXISTS "Users can delete own reactions" ON vault_community_reactions;
CREATE POLICY "Authenticated can view reactions"
  ON vault_community_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can add own reactions"
  ON vault_community_reactions FOR INSERT TO authenticated
  WITH CHECK (user_id = get_my_vault_member_id());
CREATE POLICY "Members can delete own reactions"
  ON vault_community_reactions FOR DELETE TO authenticated
  USING (user_id = get_my_vault_member_id());

-- FIX 8 & 9: idempotency_keys and rate_limit_entries — no policies defined
CREATE POLICY "Service role only on idempotency_keys"
  ON idempotency_keys FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role only on rate_limit_entries"
  ON rate_limit_entries FOR ALL TO service_role USING (true) WITH CHECK (true);
