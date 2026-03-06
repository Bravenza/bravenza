DROP VIEW IF EXISTS public.marketplace_product_comments_public;
CREATE VIEW public.marketplace_product_comments_public AS
SELECT
  id,
  product_id,
  LEFT(user_cpf, 3) || '.***.***-**' AS user_cpf_masked,
  user_name,
  content,
  parent_id,
  review_id,
  is_seller_reply,
  is_visible,
  created_at
FROM public.marketplace_product_comments;