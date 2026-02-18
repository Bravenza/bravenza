
-- =============================================
-- 1. REMOVER ÍNDICES DUPLICADOS (já cobertos por UNIQUE constraints ou outros índices)
-- =============================================

-- referrals: idx_referrals_referral_code duplica referrals_referral_code_key (UNIQUE)
DROP INDEX IF EXISTS idx_referrals_referral_code;

-- vault_invites: idx_vault_invites_invite_code duplica vault_invites_invite_code_key (UNIQUE)
DROP INDEX IF EXISTS idx_vault_invites_invite_code;

-- vault_items: idx_vault_items_vault_id duplica vault_items_vault_id_key (UNIQUE)
DROP INDEX IF EXISTS idx_vault_items_vault_id;

-- marketplace_products: idx_marketplace_products_slug duplica marketplace_products_slug_key (UNIQUE)
DROP INDEX IF EXISTS idx_marketplace_products_slug;

-- =============================================
-- 2. ÍNDICES COMPOSTOS PARA QUERIES FREQUENTES
-- =============================================

-- notifications: busca por CPF + não lidas (usado no sino de notificações do cliente)
CREATE INDEX IF NOT EXISTS idx_notifications_cpf_unread 
ON notifications (target_client_cpf, read) 
WHERE target = 'client' AND read = false;

-- orders: busca por CPF + status (dashboard do cliente)
CREATE INDEX IF NOT EXISTS idx_orders_cpf_status 
ON orders (client_cpf, current_status);

-- vault_wishlists: busca por member + status ativo
CREATE INDEX IF NOT EXISTS idx_vault_wishlists_member_active 
ON vault_wishlists (member_id, status) 
WHERE is_active = true;

-- marketplace_offers: busca por product + status ativo (página de produto)
CREATE INDEX IF NOT EXISTS idx_marketplace_offers_product_active 
ON marketplace_offers (product_id, status) 
WHERE status = 'active';

-- vault_marketplace_listings: busca por seller + status
CREATE INDEX IF NOT EXISTS idx_vault_listings_seller_status 
ON vault_marketplace_listings (seller_id, status);

-- order_history: busca por order_id + ordenação por data
CREATE INDEX IF NOT EXISTS idx_order_history_order_created 
ON order_history (order_id, created_at);

-- vault_community_posts (se existir) - coberto por outras tabelas
-- marketplace_products: busca por brand + ativo (filtros do marketplace)
CREATE INDEX IF NOT EXISTS idx_marketplace_products_brand_active 
ON marketplace_products (brand, is_active) 
WHERE is_active = true;
