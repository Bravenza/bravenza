
-- ============================================================
-- COMPREHENSIVE SECURITY HARDENING: Revoke excessive privileges
-- ============================================================

-- 1. ORDER_REQUESTS: anon should only INSERT (public form), nothing else
REVOKE SELECT, UPDATE, DELETE ON public.order_requests FROM anon;
-- authenticated should only read via admin policy
REVOKE UPDATE, DELETE ON public.order_requests FROM authenticated;

-- 2. SUPPLIERS: admin-only table, no anon access at all
REVOKE ALL ON public.suppliers FROM anon;

-- 3. VAULT_MEMBERS: no anon access; authenticated via RLS only
REVOKE ALL ON public.vault_members FROM anon;

-- Add policy for authenticated users to read their own vault membership
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'vault_members' AND policyname = 'Members can view own profile'
  ) THEN
    EXECUTE 'CREATE POLICY "Members can view own profile" ON public.vault_members FOR SELECT TO authenticated USING (
      client_cpf IN (SELECT cpf FROM public.client_profiles WHERE user_id = auth.uid())
      OR is_admin(auth.uid())
    )';
  END IF;
END$$;

-- 4. VAULT_MARKETPLACE_MESSAGES: revoke remaining anon privileges
REVOKE ALL ON public.vault_marketplace_messages FROM anon;
REVOKE ALL ON public.vault_marketplace_messages FROM authenticated;
-- Re-grant minimal for RLS-controlled access (policy already blocks with USING(false))
GRANT SELECT, INSERT ON public.vault_marketplace_messages TO authenticated;

-- 5. VAULT_SELLER_PROFILES: no anon access
REVOKE ALL ON public.vault_seller_profiles FROM anon;

-- 6. REFERRALS: no anon access at all
REVOKE ALL ON public.referrals FROM anon;
-- Authenticated users: read-only for own referrals via RLS
-- Check if policy exists, if not create one
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'referrals' AND policyname = 'Users can view own referrals'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT TO authenticated USING (
      referrer_cpf IN (SELECT cpf FROM public.client_profiles WHERE user_id = auth.uid())
      OR is_admin(auth.uid())
    )';
  END IF;
END$$;

-- 7. VAULT_WAITLIST: authenticated should not UPDATE or DELETE
REVOKE UPDATE, DELETE ON public.vault_waitlist FROM authenticated;
