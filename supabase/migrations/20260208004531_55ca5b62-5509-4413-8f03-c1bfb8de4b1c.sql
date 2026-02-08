
-- Create marketplace product reviews table
CREATE TABLE public.marketplace_product_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES public.marketplace_offers(id) ON DELETE SET NULL,
  reviewer_cpf TEXT NOT NULL,
  reviewer_name TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  product_quality INTEGER CHECK (product_quality >= 1 AND product_quality <= 5),
  authenticity_score INTEGER CHECK (authenticity_score >= 1 AND authenticity_score <= 5),
  shipping_speed INTEGER CHECK (shipping_speed >= 1 AND shipping_speed <= 5),
  is_verified_purchase BOOLEAN DEFAULT false,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketplace_product_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read visible reviews
CREATE POLICY "Anyone can view visible reviews"
  ON public.marketplace_product_reviews FOR SELECT
  USING (is_visible = true);

-- Users can insert their own reviews
CREATE POLICY "Users can insert own reviews"
  ON public.marketplace_product_reviews FOR INSERT
  WITH CHECK (true);

-- Create index for fast lookups
CREATE INDEX idx_marketplace_reviews_product ON public.marketplace_product_reviews(product_id);
CREATE INDEX idx_marketplace_reviews_rating ON public.marketplace_product_reviews(product_id, rating);
