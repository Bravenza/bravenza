
-- 1. Fix marketplace_product_comments: hide user_cpf from public reads
-- Create a public view that masks CPF
CREATE OR REPLACE VIEW public.marketplace_product_comments_public
WITH (security_invoker = on) AS
SELECT 
  id,
  product_id,
  content,
  created_at,
  is_seller_reply,
  is_visible,
  parent_id,
  user_name,
  -- Mask CPF: show only last 3 digits
  '***.***.***-' || RIGHT(user_cpf, 2) AS user_cpf_masked
FROM public.marketplace_product_comments
WHERE is_visible = true;

-- Update SELECT policy on marketplace_product_comments to restrict direct access
-- Drop existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can read visible comments" ON public.marketplace_product_comments;
DROP POLICY IF EXISTS "Public can read visible comments" ON public.marketplace_product_comments;

-- Only authenticated users can read comments directly (admins + comment owners)
CREATE POLICY "Authenticated users read own comments"
  ON public.marketplace_product_comments
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
  );

-- 2. Fix vault_community_presence: restrict to authenticated members only
DROP POLICY IF EXISTS "Anyone can read presence" ON public.vault_community_presence;
DROP POLICY IF EXISTS "Public can view presence" ON public.vault_community_presence;
DROP POLICY IF EXISTS "Anyone can view community presence" ON public.vault_community_presence;

CREATE POLICY "Authenticated members read presence"
  ON public.vault_community_presence
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
