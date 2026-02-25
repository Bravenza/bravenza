
-- =============================================
-- OTIMIZAÇÃO DE PERFORMANCE: Índices compostos
-- =============================================

-- 1. Offers: seller + status (dashboard vendedor)
CREATE INDEX IF NOT EXISTS idx_mo_seller_status 
  ON public.marketplace_offers (seller_id, status);

-- 2. Offers: ativas por preço (PDP)
CREATE INDEX IF NOT EXISTS idx_mo_product_status_price 
  ON public.marketplace_offers (product_id, status, price ASC)
  WHERE status = 'active';

-- 3. Offers: boost expiry (cron)
CREATE INDEX IF NOT EXISTS idx_mo_boost_expiry 
  ON public.marketplace_offers (boost_active_until)
  WHERE boost_active_until IS NOT NULL;

-- 4. Orders: status (admin)
CREATE INDEX IF NOT EXISTS idx_orders_status 
  ON public.orders (current_status);

-- 5. Orders: created_at DESC
CREATE INDEX IF NOT EXISTS idx_orders_created_desc 
  ON public.orders (created_at DESC);

-- 6. Notifications: created_at DESC
CREATE INDEX IF NOT EXISTS idx_notifications_created_desc 
  ON public.notifications (created_at DESC);

-- 7. Notifications: admin unread
CREATE INDEX IF NOT EXISTS idx_notifications_admin_unread 
  ON public.notifications (target_user_id, read, created_at DESC)
  WHERE target = 'admin' AND read = false;

-- 8. Products: slug (PDP)
CREATE INDEX IF NOT EXISTS idx_products_slug 
  ON public.marketplace_products (slug)
  WHERE slug IS NOT NULL;

-- 9. Products: brand + ativo
CREATE INDEX IF NOT EXISTS idx_products_brand_active 
  ON public.marketplace_products (brand, is_active)
  WHERE is_active = true;

-- 10. Addresses: user + default (checkout)
CREATE INDEX IF NOT EXISTS idx_addresses_user_default 
  ON public.client_addresses (user_id, is_default DESC);

-- 11. Vault searches: user + status
CREATE INDEX IF NOT EXISTS idx_vault_searches_user_status 
  ON public.vault_searches (user_id, status);

-- 12. Consignments: seller + status
CREATE INDEX IF NOT EXISTS idx_consignments_seller_status 
  ON public.marketplace_consignments (seller_id, status);

-- 13. Community posts: published + recent
CREATE INDEX IF NOT EXISTS idx_community_posts_published 
  ON public.vault_community_posts (status, created_at DESC)
  WHERE status = 'PUBLISHED';

-- 14. Activity feed: recent events
CREATE INDEX IF NOT EXISTS idx_activity_feed_recent 
  ON public.marketplace_activity_feed (created_at DESC);

-- 15. Price history: product + date
CREATE INDEX IF NOT EXISTS idx_price_history_product_date 
  ON public.marketplace_price_history (product_id, recorded_date DESC);
