
-- Index for cursor-based catalog pagination (created_at DESC, id DESC)
CREATE INDEX IF NOT EXISTS idx_mp_products_cursor
  ON public.marketplace_products (created_at DESC, id DESC)
  WHERE is_active = true;
