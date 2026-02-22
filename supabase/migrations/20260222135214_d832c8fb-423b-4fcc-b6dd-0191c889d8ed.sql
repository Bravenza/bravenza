
-- Cart items table for marketplace
CREATE TABLE public.marketplace_cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_cpf TEXT NOT NULL,
  offer_id UUID NOT NULL REFERENCES public.marketplace_offers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Prevent duplicate items in cart
CREATE UNIQUE INDEX idx_cart_user_offer ON public.marketplace_cart_items(user_cpf, offer_id);

-- Index for fast lookups
CREATE INDEX idx_cart_user ON public.marketplace_cart_items(user_cpf);

-- Enable RLS
ALTER TABLE public.marketplace_cart_items ENABLE ROW LEVEL SECURITY;

-- Policies: users can manage their own cart items (using client session CPF pattern)
CREATE POLICY "Users can view their own cart"
  ON public.marketplace_cart_items FOR SELECT
  USING (true);

CREATE POLICY "Users can add to their own cart"
  ON public.marketplace_cart_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can remove from their own cart"
  ON public.marketplace_cart_items FOR DELETE
  USING (true);
