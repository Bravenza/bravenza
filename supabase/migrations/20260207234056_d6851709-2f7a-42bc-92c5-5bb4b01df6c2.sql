
-- Marketplace coupons table
CREATE TABLE IF NOT EXISTS public.marketplace_coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.vault_seller_profiles(id),
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percent',
  discount_value NUMERIC NOT NULL,
  min_purchase NUMERIC DEFAULT 0,
  max_uses INTEGER DEFAULT NULL,
  uses_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,
  listing_ids UUID[] DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(seller_id, code)
);

ALTER TABLE public.marketplace_coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to marketplace_coupons" ON public.marketplace_coupons FOR ALL USING (true) WITH CHECK (true);

-- Marketplace activity feed table
CREATE TABLE IF NOT EXISTS public.marketplace_activity_feed (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  listing_id UUID,
  product_id UUID,
  seller_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_activity_feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read activity feed" ON public.marketplace_activity_feed FOR SELECT USING (true);
CREATE POLICY "Service role can insert activity feed" ON public.marketplace_activity_feed FOR INSERT WITH CHECK (true);

-- Enable realtime for activity feed only (messages already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_activity_feed;
