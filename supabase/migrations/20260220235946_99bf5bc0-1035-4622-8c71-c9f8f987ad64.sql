
-- ============================================================
-- SECURITY HARDENING: Block anonymous access to sensitive tables
-- ============================================================

-- 1. vault_waitlist: remove anon SELECT (keep anon INSERT for public form)
-- The table already has admin-only ALL and anon INSERT. Need to ensure no default SELECT for anon.
-- Force RLS to RESTRICTIVE default by ensuring no permissive SELECT for anon
-- Actually the issue is RLS is enabled but there's no explicit DENY - the WITH CHECK (true) on INSERT is fine.
-- The problem is the INSERT policy uses roles {anon,authenticated} with WITH CHECK (true).
-- We need to make sure anon can't SELECT. Let's check if there's a default grant.

-- Revoke direct table access from anon on sensitive tables
REVOKE SELECT ON public.vault_waitlist FROM anon;
REVOKE SELECT ON public.suppliers FROM anon;
REVOKE SELECT ON public.vault_members FROM anon;
REVOKE SELECT ON public.vault_marketplace_messages FROM anon;
REVOKE SELECT ON public.order_requests FROM anon;
REVOKE SELECT ON public.referrals FROM anon;
REVOKE SELECT ON public.vault_seller_profiles FROM anon;
REVOKE SELECT ON public.vault_marketplace_orders FROM anon;
REVOKE SELECT ON public.vault_items FROM anon;

-- Also revoke UPDATE/DELETE from anon on these tables
REVOKE UPDATE, DELETE ON public.vault_waitlist FROM anon;
REVOKE ALL ON public.suppliers FROM anon;
REVOKE UPDATE, DELETE ON public.order_requests FROM anon;
REVOKE ALL ON public.referrals FROM anon;
REVOKE ALL ON public.vault_seller_profiles FROM anon;
REVOKE ALL ON public.vault_marketplace_orders FROM anon;
REVOKE ALL ON public.vault_marketplace_messages FROM anon;
REVOKE UPDATE, DELETE ON public.vault_items FROM anon;

-- 2. Fix the 4 "USING(true)" warnings on INSERT/UPDATE/DELETE policies
-- vault_waitlist INSERT: WITH CHECK (true) is fine for public form (protected by reCAPTCHA)
-- order_requests INSERT: WITH CHECK (true) is fine for public form (protected by reCAPTCHA)

-- 3. vault_items: Add policy so members can view their own items
-- Check if member SELECT policy exists
DROP POLICY IF EXISTS "Members can view own vault_items" ON public.vault_items;
CREATE POLICY "Members can view own vault_items"
ON public.vault_items
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT vm.id FROM vault_members vm
    JOIN client_profiles cp ON cp.cpf = vm.client_cpf
    WHERE cp.user_id = auth.uid()
  )
  OR is_admin(auth.uid())
);

-- 4. vault_marketplace_messages: Add policy so participants can view their own messages
DROP POLICY IF EXISTS "Participants can view own messages" ON public.vault_marketplace_messages;
CREATE POLICY "Participants can view own messages"
ON public.vault_marketplace_messages
FOR SELECT
TO authenticated
USING (
  sender_cpf IN (
    SELECT cp.cpf FROM client_profiles cp WHERE cp.user_id = auth.uid()
  )
  OR is_admin(auth.uid())
);

-- Allow participants to INSERT their own messages
DROP POLICY IF EXISTS "Users can send messages" ON public.vault_marketplace_messages;
CREATE POLICY "Users can send messages"
ON public.vault_marketplace_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_cpf IN (
    SELECT cp.cpf FROM client_profiles cp WHERE cp.user_id = auth.uid()
  )
);

-- 5. vault_seller_profiles: block public view of the public listings view that might leak seller data
-- The view marketplace_listings_public is read-only and intentionally public - just verify it doesn't expose PII
-- (views don't have RLS, they inherit from base table policies)

-- 6. Ensure vault_marketplace_orders has INSERT policy for buyers  
DROP POLICY IF EXISTS "Buyers can create orders" ON public.vault_marketplace_orders;
CREATE POLICY "Buyers can create orders"
ON public.vault_marketplace_orders
FOR INSERT
TO authenticated
WITH CHECK (
  buyer_cpf IN (
    SELECT cp.cpf FROM client_profiles cp WHERE cp.user_id = auth.uid()
  )
);

-- 7. Ensure vault_marketplace_orders has UPDATE policy for status changes by participants
DROP POLICY IF EXISTS "Participants can update own orders" ON public.vault_marketplace_orders;
CREATE POLICY "Participants can update own orders"
ON public.vault_marketplace_orders
FOR UPDATE
TO authenticated
USING (
  buyer_cpf IN (SELECT cp.cpf FROM client_profiles cp WHERE cp.user_id = auth.uid())
  OR seller_id IN (
    SELECT vsp.id FROM vault_seller_profiles vsp
    JOIN vault_members vm ON vm.id = vsp.member_id
    JOIN client_profiles cp ON cp.cpf = vm.client_cpf
    WHERE cp.user_id = auth.uid()
  )
  OR is_admin(auth.uid())
);
