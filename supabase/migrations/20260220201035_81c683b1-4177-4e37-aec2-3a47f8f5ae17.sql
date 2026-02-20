
-- Price History snapshots (populated by cron/edge function)
CREATE TABLE public.marketplace_price_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  min_price NUMERIC NOT NULL,
  avg_price NUMERIC NOT NULL,
  max_price NUMERIC NOT NULL,
  offers_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint: one snapshot per product per day
CREATE UNIQUE INDEX idx_price_history_product_date ON public.marketplace_price_history(product_id, recorded_date);
CREATE INDEX idx_price_history_product ON public.marketplace_price_history(product_id);

ALTER TABLE public.marketplace_price_history ENABLE ROW LEVEL SECURITY;

-- Public read access (price history is public data)
CREATE POLICY "Price history is publicly readable"
  ON public.marketplace_price_history FOR SELECT USING (true);

-- Saved Searches
CREATE TABLE public.marketplace_saved_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_cpf TEXT NOT NULL,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  notify_new_listings BOOLEAN NOT NULL DEFAULT true,
  last_notified_at TIMESTAMPTZ,
  results_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_saved_searches_user ON public.marketplace_saved_searches(user_cpf);

ALTER TABLE public.marketplace_saved_searches ENABLE ROW LEVEL SECURITY;

-- Users can manage their own saved searches (via edge function with service role)
CREATE POLICY "Saved searches readable via service role"
  ON public.marketplace_saved_searches FOR ALL USING (true);

-- Seller Storefront customization columns
ALTER TABLE public.vault_seller_profiles
  ADD COLUMN IF NOT EXISTS storefront_banner TEXT,
  ADD COLUMN IF NOT EXISTS storefront_tagline TEXT,
  ADD COLUMN IF NOT EXISTS storefront_theme TEXT DEFAULT 'default';
