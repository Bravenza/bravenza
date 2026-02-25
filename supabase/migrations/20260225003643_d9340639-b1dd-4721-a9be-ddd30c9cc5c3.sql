
-- Add marketplace integration columns to vault_items
ALTER TABLE public.vault_items 
ADD COLUMN IF NOT EXISTS marketplace_product_id UUID REFERENCES public.marketplace_products(id),
ADD COLUMN IF NOT EXISTS purchase_price NUMERIC;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_vault_items_marketplace_product_id ON public.vault_items(marketplace_product_id);
