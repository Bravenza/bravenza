
-- 1. Add review_photos to product reviews
ALTER TABLE public.marketplace_product_reviews
ADD COLUMN IF NOT EXISTS review_photos text[] DEFAULT '{}';

-- 2. Seller follows table
CREATE TABLE IF NOT EXISTS public.marketplace_seller_follows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_cpf text NOT NULL,
  seller_id uuid NOT NULL REFERENCES public.vault_seller_profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(follower_cpf, seller_id)
);

ALTER TABLE public.marketplace_seller_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view follows" ON public.marketplace_seller_follows
  FOR SELECT USING (true);

CREATE POLICY "Users can follow sellers" ON public.marketplace_seller_follows
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can unfollow" ON public.marketplace_seller_follows
  FOR DELETE USING (true);

-- 3. Loyalty points table
CREATE TABLE IF NOT EXISTS public.marketplace_loyalty_points (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_cpf text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  action text NOT NULL,
  description text,
  reference_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_loyalty_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view points" ON public.marketplace_loyalty_points
  FOR SELECT USING (true);

CREATE POLICY "System can insert points" ON public.marketplace_loyalty_points
  FOR INSERT WITH CHECK (true);

-- 4. Add followers_count to seller profiles
ALTER TABLE public.vault_seller_profiles
ADD COLUMN IF NOT EXISTS followers_count integer NOT NULL DEFAULT 0;

-- 5. Trigger to update followers_count
CREATE OR REPLACE FUNCTION public.update_seller_followers_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE vault_seller_profiles SET followers_count = followers_count + 1 WHERE id = NEW.seller_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE vault_seller_profiles SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = OLD.seller_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_update_seller_followers
AFTER INSERT OR DELETE ON public.marketplace_seller_follows
FOR EACH ROW EXECUTE FUNCTION public.update_seller_followers_count();

-- 6. Function to get user loyalty points balance
CREATE OR REPLACE FUNCTION public.get_loyalty_balance(p_cpf text)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(SUM(points), 0)::integer FROM marketplace_loyalty_points WHERE user_cpf = p_cpf;
$$;
