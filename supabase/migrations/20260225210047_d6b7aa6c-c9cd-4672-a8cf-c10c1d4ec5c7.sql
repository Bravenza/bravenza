
-- View that joins cart items with offers, products, and seller info in a single query
CREATE OR REPLACE VIEW public.marketplace_cart_details AS
SELECT
  ci.id,
  ci.offer_id,
  ci.product_id,
  ci.user_cpf,
  ci.added_at,
  -- Offer fields
  o.price AS offer_price,
  o.size AS offer_size,
  o.condition AS offer_condition,
  o.photos AS offer_photos,
  o.shipping_mode AS offer_shipping_mode,
  o.seller_id AS offer_seller_id,
  o.status AS offer_status,
  -- Product fields
  p.brand AS product_brand,
  p.model AS product_model,
  p.slug AS product_slug,
  p.images AS product_images,
  -- Seller name
  vm.client_name AS seller_name
FROM marketplace_cart_items ci
JOIN marketplace_offers o ON o.id = ci.offer_id
JOIN marketplace_products p ON p.id = ci.product_id
LEFT JOIN vault_seller_profiles vsp ON vsp.id = o.seller_id
LEFT JOIN vault_members vm ON vm.id = vsp.member_id;

-- RLS: users can only see their own cart
ALTER VIEW public.marketplace_cart_details SET (security_invoker = true);
