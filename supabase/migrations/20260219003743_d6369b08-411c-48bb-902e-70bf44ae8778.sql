
-- Fix: Remove anon SELECT on marketplace_product_comments (unmasked CPF exposure)
-- Public comments should only be read via the masked view
REVOKE SELECT ON public.marketplace_product_comments FROM anon;

-- Drop the overly permissive "Anyone can view" policy - use the view instead
DROP POLICY IF EXISTS "Anyone can view visible comments" ON public.marketplace_product_comments;

-- Drop redundant "Authenticated users read own comments" 
DROP POLICY IF EXISTS "Authenticated users read own comments" ON public.marketplace_product_comments;

-- Add proper policy: authenticated users can only read their own comments
CREATE POLICY "Users can read own comments"
  ON public.marketplace_product_comments
  FOR SELECT
  TO authenticated
  USING (
    user_cpf = (SELECT cpf FROM public.client_profiles WHERE user_id = auth.uid())
    OR is_admin(auth.uid())
  );

-- Ensure the public view is accessible to anon for reading masked data
GRANT SELECT ON public.marketplace_product_comments_public TO anon;
GRANT SELECT ON public.marketplace_product_comments_public TO authenticated;
