
-- 1. Fix marketplace_cart_items: restrict SELECT to owner only
DROP POLICY IF EXISTS "Users can view their own cart" ON public.marketplace_cart_items;
CREATE POLICY "Users can view their own cart"
ON public.marketplace_cart_items FOR SELECT
TO authenticated
USING (
  user_cpf IN (
    SELECT cp.cpf FROM client_profiles cp WHERE cp.user_id = auth.uid()
  )
);

-- Also fix DELETE to be owner-only
DROP POLICY IF EXISTS "Users can remove from their own cart" ON public.marketplace_cart_items;
CREATE POLICY "Users can remove from their own cart"
ON public.marketplace_cart_items FOR DELETE
TO authenticated
USING (
  user_cpf IN (
    SELECT cp.cpf FROM client_profiles cp WHERE cp.user_id = auth.uid()
  )
);

-- Also fix INSERT to be owner-only
DROP POLICY IF EXISTS "Users can add to their own cart" ON public.marketplace_cart_items;
CREATE POLICY "Users can add to their own cart"
ON public.marketplace_cart_items FOR INSERT
TO authenticated
WITH CHECK (
  user_cpf IN (
    SELECT cp.cpf FROM client_profiles cp WHERE cp.user_id = auth.uid()
  )
);

-- 2. Fix reviews: create a public view that masks CPF
CREATE OR REPLACE VIEW public.reviews_public
WITH (security_invoker = on) AS
SELECT 
  id, rating, comment, client_name, 
  LEFT(client_cpf, 3) || '.***.***-**' AS client_cpf_masked,
  order_id, is_approved, is_featured,
  product_quality, delivery_speed, customer_service, would_recommend,
  admin_response, admin_response_at, created_at
FROM public.reviews
WHERE is_approved = true;

-- 3. Restrict reviews base table SELECT to owner + admin only
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
CREATE POLICY "Owner and admin can view reviews"
ON public.reviews FOR SELECT
TO authenticated
USING (
  client_cpf IN (
    SELECT cp.cpf FROM client_profiles cp WHERE cp.user_id = auth.uid()
  )
  OR is_admin(auth.uid())
);

-- Allow anon to read approved reviews without CPF (via the view)
CREATE POLICY "Anon can read approved reviews via view"
ON public.reviews FOR SELECT
TO anon
USING (is_approved = true);

-- 4. Add SELECT policy for order_requests so submitter can view own
CREATE POLICY "Users can view own requests"
ON public.order_requests FOR SELECT
TO authenticated
USING (
  client_cpf IN (
    SELECT cp.cpf FROM client_profiles cp WHERE cp.user_id = auth.uid()
  )
  OR is_admin(auth.uid())
);
