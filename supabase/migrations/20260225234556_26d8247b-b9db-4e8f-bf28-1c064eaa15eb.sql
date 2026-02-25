
-- ============================================================
-- PII AUDIT FIX: Secure public/semi-public views
-- ============================================================

-- 1) Create a public-safe view for marketplace_product_reviews
--    that masks reviewer_cpf and excludes offer_id
CREATE OR REPLACE VIEW public.marketplace_product_reviews_public
WITH (security_invoker = on) AS
SELECT
  id,
  product_id,
  reviewer_name,
  ('***.***.***-' || right(reviewer_cpf::text, 2)) AS reviewer_cpf_masked,
  rating,
  comment,
  product_quality,
  authenticity_score,
  shipping_speed,
  is_verified_purchase,
  review_photos,
  created_at
FROM marketplace_product_reviews
WHERE is_visible = true;

-- 2) Fix wallet_balances view: it's only used by authenticated users 
--    querying their own CPF, but the view itself shouldn't be queryable 
--    for other users' CPFs. We keep it as-is since RLS on wallet_transactions
--    already restricts access. But we add security_invoker.
DROP VIEW IF EXISTS public.wallet_balances;
CREATE VIEW public.wallet_balances
WITH (security_invoker = on) AS
SELECT
  user_cpf,
  COALESCE(sum(
    CASE
      WHEN type LIKE 'credit_%' THEN amount
      WHEN type LIKE 'debit_%' THEN -amount
      ELSE 0
    END
  ), 0) AS balance,
  max(created_at) AS last_transaction_at,
  count(*) AS total_transactions
FROM wallet_transactions
GROUP BY user_cpf;

-- 3) Fix marketplace_cart_details view: add security_invoker 
--    (user_cpf is needed for RLS filtering but view should respect caller's permissions)
DROP VIEW IF EXISTS public.marketplace_cart_details;
CREATE VIEW public.marketplace_cart_details
WITH (security_invoker = on) AS
SELECT
  ci.id,
  ci.offer_id,
  ci.product_id,
  ci.user_cpf,
  ci.added_at,
  o.price AS offer_price,
  o.size AS offer_size,
  o.condition AS offer_condition,
  o.photos AS offer_photos,
  o.shipping_mode AS offer_shipping_mode,
  o.seller_id AS offer_seller_id,
  o.status AS offer_status,
  p.brand AS product_brand,
  p.model AS product_model,
  p.slug AS product_slug,
  p.images AS product_images,
  vm.client_name AS seller_name
FROM marketplace_cart_items ci
JOIN marketplace_offers o ON o.id = ci.offer_id
JOIN marketplace_products p ON p.id = ci.product_id
LEFT JOIN vault_seller_profiles vsp ON vsp.id = o.seller_id
LEFT JOIN vault_members vm ON vm.id = vsp.member_id;

-- 4) Create a helper function to mask emails (j***@gmail.com)
CREATE OR REPLACE FUNCTION public.mask_email(email text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN email IS NULL OR email = '' THEN NULL
    WHEN position('@' in email) > 1 THEN
      left(split_part(email, '@', 1), 1) ||
      repeat('*', greatest(length(split_part(email, '@', 1)) - 1, 2)) ||
      '@' || split_part(email, '@', 2)
    ELSE '***'
  END;
$$;
