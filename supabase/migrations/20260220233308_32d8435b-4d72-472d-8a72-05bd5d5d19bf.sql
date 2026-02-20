
-- ============================================================
-- FIX 1: vault_marketplace_messages — admin policy on {public} role
-- Change to {authenticated} only
-- ============================================================
DROP POLICY IF EXISTS "Admin full access on marketplace messages" ON public.vault_marketplace_messages;
CREATE POLICY "Admin full access on marketplace messages"
  ON public.vault_marketplace_messages FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================
-- FIX 2: vault_marketplace_orders — admin policies on {public} role
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage all marketplace orders" ON public.vault_marketplace_orders;
DROP POLICY IF EXISTS "Admins full access to vault_marketplace_orders" ON public.vault_marketplace_orders;
CREATE POLICY "Admins full access to vault_marketplace_orders"
  ON public.vault_marketplace_orders FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================
-- FIX 3: vault_seller_profiles — admin policy on {public} role
-- ============================================================
DROP POLICY IF EXISTS "Admins full access to vault_seller_profiles" ON public.vault_seller_profiles;
CREATE POLICY "Admins full access to vault_seller_profiles"
  ON public.vault_seller_profiles FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================
-- FIX 4: marketplace_inspections — admin policy on {public} role
-- ============================================================
DROP POLICY IF EXISTS "Admins full access marketplace_inspections" ON public.marketplace_inspections;
CREATE POLICY "Admins full access marketplace_inspections"
  ON public.marketplace_inspections FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================
-- FIX 5: marketplace_fee_tiers — admin policy on {public} role
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage fee tiers" ON public.marketplace_fee_tiers;
CREATE POLICY "Admins can manage fee tiers"
  ON public.marketplace_fee_tiers FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================
-- FIX 6: marketplace_offers — admin policy on {public} role
-- ============================================================
DROP POLICY IF EXISTS "Admins full access marketplace_offers" ON public.marketplace_offers;
CREATE POLICY "Admins full access marketplace_offers"
  ON public.marketplace_offers FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- Also fix the public SELECT policies to use anon role properly
DROP POLICY IF EXISTS "Anyone can read active offers" ON public.marketplace_offers;
DROP POLICY IF EXISTS "Anyone can view active offers" ON public.marketplace_offers;
CREATE POLICY "Anyone can view active offers"
  ON public.marketplace_offers FOR SELECT TO anon, authenticated
  USING (status IN ('active', 'reserved', 'sold'));

-- ============================================================
-- FIX 7: marketplace_drop_reminders — USING(true) on {public}
-- Restrict to authenticated users checking ownership via client_profiles
-- ============================================================
DROP POLICY IF EXISTS "Users can view own reminders" ON public.marketplace_drop_reminders;
DROP POLICY IF EXISTS "Users can delete own reminders" ON public.marketplace_drop_reminders;
DROP POLICY IF EXISTS "Authenticated can insert reminders" ON public.marketplace_drop_reminders;

CREATE POLICY "Users can view own reminders"
  ON public.marketplace_drop_reminders FOR SELECT TO authenticated
  USING (user_cpf IN (SELECT cpf FROM client_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own reminders"
  ON public.marketplace_drop_reminders FOR DELETE TO authenticated
  USING (user_cpf IN (SELECT cpf FROM client_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own reminders"
  ON public.marketplace_drop_reminders FOR INSERT TO authenticated
  WITH CHECK (user_cpf IN (SELECT cpf FROM client_profiles WHERE user_id = auth.uid()));

-- ============================================================
-- FIX 8: marketplace_loyalty_points — SELECT USING(true) on {public}
-- ============================================================
DROP POLICY IF EXISTS "Anyone can view points" ON public.marketplace_loyalty_points;
DROP POLICY IF EXISTS "System can insert points" ON public.marketplace_loyalty_points;

CREATE POLICY "Users can view own points"
  ON public.marketplace_loyalty_points FOR SELECT TO authenticated
  USING (user_cpf IN (SELECT cpf FROM client_profiles WHERE user_id = auth.uid()) OR is_admin());

CREATE POLICY "Service can insert points"
  ON public.marketplace_loyalty_points FOR INSERT TO service_role
  WITH CHECK (true);

-- ============================================================
-- FIX 9: marketplace_negotiation_events — INSERT/SELECT on {public}
-- ============================================================
DROP POLICY IF EXISTS "Backend inserts negotiation events" ON public.marketplace_negotiation_events;
DROP POLICY IF EXISTS "Participants can view negotiation events" ON public.marketplace_negotiation_events;

CREATE POLICY "Service inserts negotiation events"
  ON public.marketplace_negotiation_events FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "Participants can view negotiation events"
  ON public.marketplace_negotiation_events FOR SELECT TO authenticated
  USING (
    actor_cpf IN (SELECT cpf FROM client_profiles WHERE user_id = auth.uid())
    OR is_admin()
  );

-- ============================================================
-- FIX 10: vault_waitlist — INSERT WITH CHECK(true) on {public}
-- Keep public insert but add basic protection (already has reCAPTCHA on frontend)
-- Just restrict to anon+authenticated instead of full {public}
-- ============================================================
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.vault_waitlist;
CREATE POLICY "Anyone can join waitlist"
  ON public.vault_waitlist FOR INSERT TO anon, authenticated
  WITH CHECK (true);
