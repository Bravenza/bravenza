DROP VIEW IF EXISTS marketplace_cart_details;

CREATE VIEW marketplace_cart_details AS
SELECT ci.id,
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
    vm.client_name AS seller_name,
    COALESCE(o.interest_free_installments, 0) AS offer_interest_free_installments
FROM marketplace_cart_items ci
    JOIN marketplace_offers o ON o.id = ci.offer_id
    JOIN marketplace_products p ON p.id = ci.product_id
    LEFT JOIN vault_seller_profiles vsp ON vsp.id = o.seller_id
    LEFT JOIN vault_members vm ON vm.id = vsp.member_id;