
-- ============================================================
-- 1. COMMUNITY POSTS: Add SELECT policy filtering by status
-- ============================================================
CREATE POLICY "Authenticated can view published posts"
  ON public.vault_community_posts
  FOR SELECT
  TO authenticated
  USING (
    status = 'PUBLISHED'
    OR user_id IN (
      SELECT vm.id FROM vault_members vm
      JOIN client_profiles cp ON cp.cpf::text = vm.client_cpf::text
      WHERE cp.user_id = auth.uid()
    )
    OR public.is_admin(auth.uid())
  );

-- ============================================================
-- 2. INTEL POSTS: Add SELECT policy filtering by status
-- ============================================================
CREATE POLICY "Authenticated can view published intel"
  ON public.vault_intel_posts
  FOR SELECT
  TO authenticated
  USING (
    status = 'published'
    OR public.is_admin(auth.uid())
  );

-- ============================================================
-- 3. MARKETPLACE_OFFERS: Hide original_purchase_price from public
--    Create a secure view that excludes sensitive pricing
-- ============================================================
CREATE OR REPLACE VIEW public.marketplace_offers_public
WITH (security_invoker = on) AS
  SELECT 
    id, product_id, seller_id, listing_id, size, size_system,
    condition, price, description, defects, has_receipt,
    photos, proof_photos, shipping_mode, shipping_cost_estimate,
    status, views_count, pro_recommendation,
    boost_level, boost_active_until,
    activated_at, published_at, sold_at,
    created_at, updated_at
    -- EXCLUDED: original_purchase_price (seller margin data)
  FROM public.marketplace_offers;

-- ============================================================
-- 4. VAULT_MARKETPLACE_LISTINGS: Hide original_purchase_price
--    Create a secure view excluding pricing strategy data
-- ============================================================
CREATE OR REPLACE VIEW public.marketplace_listings_public
WITH (security_invoker = on) AS
  SELECT 
    id, seller_id, vault_item_id, product_id,
    title, description, brand, model, colorway, size, condition,
    price, shipping_cost_estimate, shipping_mode,
    photos, is_vault_certified, pro_recommendation,
    status, views_count, favorites_count,
    published_at, sold_at, created_at, updated_at
    -- EXCLUDED: original_purchase_price (seller margin data)
  FROM public.vault_marketplace_listings;
