-- Add unique constraint on sku for marketplace_products (needed for upsert sync)
ALTER TABLE public.marketplace_products ADD CONSTRAINT marketplace_products_sku_unique UNIQUE (sku);