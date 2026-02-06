
-- Seller profiles: tracks reputation and commission tier
CREATE TABLE public.vault_seller_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.vault_members(id) ON DELETE CASCADE,
  total_sales_count INTEGER NOT NULL DEFAULT 0,
  total_sales_value NUMERIC NOT NULL DEFAULT 0,
  current_fee_percent NUMERIC NOT NULL DEFAULT 14,
  average_rating NUMERIC DEFAULT NULL,
  ratings_count INTEGER NOT NULL DEFAULT 0,
  bio TEXT DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(member_id)
);

-- Marketplace listings
CREATE TABLE public.vault_marketplace_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.vault_seller_profiles(id) ON DELETE CASCADE,
  vault_item_id UUID REFERENCES public.vault_items(id) ON DELETE SET NULL,
  title VARCHAR NOT NULL,
  description TEXT,
  brand VARCHAR,
  model VARCHAR,
  colorway VARCHAR,
  size VARCHAR,
  condition VARCHAR NOT NULL DEFAULT 'usado_bom',
  photos TEXT[] NOT NULL DEFAULT '{}'::text[],
  price NUMERIC NOT NULL,
  original_purchase_price NUMERIC,
  shipping_mode VARCHAR NOT NULL DEFAULT 'direct',
  shipping_cost_estimate NUMERIC DEFAULT 0,
  is_vault_certified BOOLEAN NOT NULL DEFAULT false,
  status VARCHAR NOT NULL DEFAULT 'draft',
  views_count INTEGER NOT NULL DEFAULT 0,
  favorites_count INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE,
  sold_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Marketplace orders (transactions)
CREATE TABLE public.vault_marketplace_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.vault_marketplace_listings(id),
  buyer_cpf VARCHAR NOT NULL,
  buyer_name VARCHAR NOT NULL,
  buyer_email VARCHAR,
  buyer_phone VARCHAR,
  buyer_address TEXT,
  seller_id UUID NOT NULL REFERENCES public.vault_seller_profiles(id),
  sale_price NUMERIC NOT NULL,
  fee_percent NUMERIC NOT NULL,
  fee_amount NUMERIC NOT NULL,
  seller_payout NUMERIC NOT NULL,
  shipping_mode VARCHAR NOT NULL DEFAULT 'direct',
  shipping_cost NUMERIC DEFAULT 0,
  tracking_code VARCHAR,
  status VARCHAR NOT NULL DEFAULT 'pending_payment',
  payment_method VARCHAR,
  payment_id VARCHAR,
  paid_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  buyer_rating INTEGER,
  buyer_review TEXT,
  buyer_rated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Marketplace favorites
CREATE TABLE public.vault_marketplace_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.vault_marketplace_listings(id) ON DELETE CASCADE,
  user_cpf VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(listing_id, user_cpf)
);

-- Enable RLS
ALTER TABLE public.vault_seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_marketplace_favorites ENABLE ROW LEVEL SECURITY;

-- RLS: vault_seller_profiles
CREATE POLICY "Admins full access to vault_seller_profiles"
  ON public.vault_seller_profiles FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Service can manage vault_seller_profiles"
  ON public.vault_seller_profiles FOR ALL
  USING (true) WITH CHECK (true);

-- RLS: vault_marketplace_listings
CREATE POLICY "Admins full access to vault_marketplace_listings"
  ON public.vault_marketplace_listings FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Service can manage vault_marketplace_listings"
  ON public.vault_marketplace_listings FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can view active listings"
  ON public.vault_marketplace_listings FOR SELECT
  USING (status = 'active');

-- RLS: vault_marketplace_orders
CREATE POLICY "Admins full access to vault_marketplace_orders"
  ON public.vault_marketplace_orders FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Service can manage vault_marketplace_orders"
  ON public.vault_marketplace_orders FOR ALL
  USING (true) WITH CHECK (true);

-- RLS: vault_marketplace_favorites
CREATE POLICY "Admins full access to vault_marketplace_favorites"
  ON public.vault_marketplace_favorites FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Service can manage vault_marketplace_favorites"
  ON public.vault_marketplace_favorites FOR ALL
  USING (true) WITH CHECK (true);

-- Function to calculate fee percent based on sales count
CREATE OR REPLACE FUNCTION public.get_marketplace_fee_percent(sales_count INTEGER)
RETURNS NUMERIC AS $$
BEGIN
  IF sales_count >= 11 THEN RETURN 9;
  ELSIF sales_count >= 6 THEN RETURN 10;
  ELSIF sales_count >= 3 THEN RETURN 12;
  ELSE RETURN 14;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- Trigger to update seller fee on sale count change
CREATE OR REPLACE FUNCTION public.update_seller_fee()
RETURNS TRIGGER AS $$
BEGIN
  NEW.current_fee_percent := get_marketplace_fee_percent(NEW.total_sales_count);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_update_seller_fee
  BEFORE UPDATE ON public.vault_seller_profiles
  FOR EACH ROW
  WHEN (OLD.total_sales_count IS DISTINCT FROM NEW.total_sales_count)
  EXECUTE FUNCTION public.update_seller_fee();

-- Trigger to update listing updated_at
CREATE OR REPLACE FUNCTION public.update_marketplace_listing_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_update_marketplace_listing_ts
  BEFORE UPDATE ON public.vault_marketplace_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_marketplace_listing_timestamp();

-- Trigger to update order updated_at
CREATE TRIGGER trg_update_marketplace_order_ts
  BEFORE UPDATE ON public.vault_marketplace_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_marketplace_listing_timestamp();
