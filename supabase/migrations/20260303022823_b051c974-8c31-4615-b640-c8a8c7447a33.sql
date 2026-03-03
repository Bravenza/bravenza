
-- ============================================================
-- SECURITY FIX: Add missing RLS policies
-- ============================================================

-- 1. marketplace_seller_payouts - RLS enabled but NO policies
-- Sellers can only view their own payouts
CREATE POLICY "Sellers can view own payouts"
ON public.marketplace_seller_payouts
FOR SELECT
TO authenticated
USING (
  seller_id IN (
    SELECT sp.id FROM vault_seller_profiles sp
    JOIN vault_members vm ON vm.id = sp.member_id
    JOIN client_profiles cp ON cp.cpf::text = vm.client_cpf::text
    WHERE cp.user_id = auth.uid()
  )
);

-- Admins have full access to payouts
CREATE POLICY "Admins full access to payouts"
ON public.marketplace_seller_payouts
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Service role for backend operations
CREATE POLICY "Service can manage payouts"
ON public.marketplace_seller_payouts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. marketplace_seller_pix_accounts - RLS enabled but NO policies
-- Sellers can only view their own PIX accounts
CREATE POLICY "Sellers can view own pix accounts"
ON public.marketplace_seller_pix_accounts
FOR SELECT
TO authenticated
USING (
  seller_id IN (
    SELECT sp.id FROM vault_seller_profiles sp
    JOIN vault_members vm ON vm.id = sp.member_id
    JOIN client_profiles cp ON cp.cpf::text = vm.client_cpf::text
    WHERE cp.user_id = auth.uid()
  )
);

-- Sellers can insert their own PIX accounts
CREATE POLICY "Sellers can insert own pix accounts"
ON public.marketplace_seller_pix_accounts
FOR INSERT
TO authenticated
WITH CHECK (
  seller_id IN (
    SELECT sp.id FROM vault_seller_profiles sp
    JOIN vault_members vm ON vm.id = sp.member_id
    JOIN client_profiles cp ON cp.cpf::text = vm.client_cpf::text
    WHERE cp.user_id = auth.uid()
  )
);

-- Sellers can update their own PIX accounts
CREATE POLICY "Sellers can update own pix accounts"
ON public.marketplace_seller_pix_accounts
FOR UPDATE
TO authenticated
USING (
  seller_id IN (
    SELECT sp.id FROM vault_seller_profiles sp
    JOIN vault_members vm ON vm.id = sp.member_id
    JOIN client_profiles cp ON cp.cpf::text = vm.client_cpf::text
    WHERE cp.user_id = auth.uid()
  )
);

-- Sellers can delete their own PIX accounts
CREATE POLICY "Sellers can delete own pix accounts"
ON public.marketplace_seller_pix_accounts
FOR DELETE
TO authenticated
USING (
  seller_id IN (
    SELECT sp.id FROM vault_seller_profiles sp
    JOIN vault_members vm ON vm.id = sp.member_id
    JOIN client_profiles cp ON cp.cpf::text = vm.client_cpf::text
    WHERE cp.user_id = auth.uid()
  )
);

-- Admins full access to PIX accounts
CREATE POLICY "Admins full access to pix accounts"
ON public.marketplace_seller_pix_accounts
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Service role for backend operations
CREATE POLICY "Service can manage pix accounts"
ON public.marketplace_seller_pix_accounts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Restrict vault_waitlist INSERT to authenticated users only (remove anon)
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.vault_waitlist;
CREATE POLICY "Authenticated users can join waitlist"
ON public.vault_waitlist
FOR INSERT
TO authenticated
WITH CHECK (true);
