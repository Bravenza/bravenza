
-- PR3: Fix critical findings from security scan

-- 1. vault_waitlist: Restrict INSERT so users cannot self-approve
DROP POLICY IF EXISTS "Authenticated users can join waitlist" ON public.vault_waitlist;
CREATE POLICY "Authenticated users can join waitlist"
ON public.vault_waitlist FOR INSERT TO authenticated
WITH CHECK (
  status = 'pending'
  AND reviewed_by IS NULL
  AND admin_notes IS NULL
);

-- 2. marketplace_activity_feed: Restrict public read to hide buyer PII
DROP POLICY IF EXISTS "Anyone can read activity feed" ON public.marketplace_activity_feed;
CREATE POLICY "Authenticated can read activity feed"
ON public.marketplace_activity_feed FOR SELECT TO authenticated
USING (true);

-- 3. wallet_balances view: Recreate with security_invoker
DROP VIEW IF EXISTS public.wallet_balances;
CREATE VIEW public.wallet_balances WITH (security_invoker = true) AS
SELECT
  user_cpf,
  COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE -amount END), 0) AS balance
FROM public.wallet_transactions
GROUP BY user_cpf;

-- 4. marketplace_cart_details view: Recreate with security_invoker
DROP VIEW IF EXISTS public.marketplace_cart_details;
CREATE VIEW public.marketplace_cart_details WITH (security_invoker = true) AS
SELECT
  ci.id, ci.user_cpf, ci.offer_id, ci.product_id, ci.added_at,
  mo.price AS offer_price, mo.size AS offer_size, mo.condition AS offer_condition,
  mo.photos AS offer_photos, mo.shipping_mode, mo.seller_id,
  mp.brand, mp.model, mp.colorway, mp.images AS product_images, mp.slug AS product_slug
FROM public.marketplace_cart_items ci
LEFT JOIN public.marketplace_offers mo ON ci.offer_id = mo.id
LEFT JOIN public.marketplace_products mp ON ci.product_id = mp.id;

-- 5. vault_community_reports: Enforce reporter_id = own member ID on INSERT
DROP POLICY IF EXISTS "Community members can create reports" ON public.vault_community_reports;
CREATE POLICY "Community members can create reports"
ON public.vault_community_reports FOR INSERT TO authenticated
WITH CHECK (
  reporter_id = public.get_my_vault_member_id()
);

-- 6. vault_community_presence: Only see own presence or others who allow it
DROP POLICY IF EXISTS "Authenticated users can view presence" ON public.vault_community_presence;
CREATE POLICY "Authenticated users can view presence"
ON public.vault_community_presence FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR NOT EXISTS (
    SELECT 1 FROM public.client_profiles cp
    JOIN public.vault_members vm ON vm.client_cpf = cp.cpf
    WHERE cp.user_id = vault_community_presence.user_id
      AND vm.hide_online_status = true
  )
);
