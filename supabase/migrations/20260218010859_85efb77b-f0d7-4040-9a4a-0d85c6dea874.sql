
-- Fee tiers table for volume-based discounts
CREATE TABLE public.marketplace_fee_tiers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id text NOT NULL REFERENCES marketplace_plans(id) ON DELETE CASCADE,
  min_sales integer NOT NULL DEFAULT 0,
  fee_discount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_fee_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plans fee tiers are publicly readable" ON public.marketplace_fee_tiers
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage fee tiers" ON public.marketplace_fee_tiers
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Unique constraint: one tier per plan per threshold
CREATE UNIQUE INDEX idx_fee_tiers_plan_sales ON public.marketplace_fee_tiers(plan_id, min_sales);

-- Insert default tiers (Free has no discounts; Pro/Elite get progressive)
INSERT INTO public.marketplace_fee_tiers (plan_id, min_sales, fee_discount) VALUES
  ('pro', 0, 0),
  ('pro', 10, 0.5),
  ('pro', 25, 1.0),
  ('pro', 50, 1.5),
  ('pro', 100, 2.0),
  ('elite', 0, 0),
  ('elite', 10, 0.5),
  ('elite', 25, 1.0),
  ('elite', 50, 1.5),
  ('elite', 100, 2.0);

-- Function to calculate effective fee for a seller
CREATE OR REPLACE FUNCTION public.calculate_seller_fee(p_plan_id text, p_total_sales integer)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base_fee numeric;
  v_discount numeric := 0;
BEGIN
  -- Get base fee from plan
  SELECT fee_percent INTO v_base_fee
  FROM marketplace_plans WHERE id = p_plan_id;

  IF v_base_fee IS NULL THEN
    RETURN 14; -- fallback
  END IF;

  -- Free plan: always fixed
  IF p_plan_id = 'free' THEN
    RETURN v_base_fee;
  END IF;

  -- Get the highest applicable discount tier
  SELECT fee_discount INTO v_discount
  FROM marketplace_fee_tiers
  WHERE plan_id = p_plan_id
    AND min_sales <= p_total_sales
  ORDER BY min_sales DESC
  LIMIT 1;

  RETURN GREATEST(v_base_fee - COALESCE(v_discount, 0), 0);
END;
$$;

-- Trigger: auto-recalculate fee when sales count changes
CREATE OR REPLACE FUNCTION public.recalculate_seller_fee()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.current_fee_percent := calculate_seller_fee(NEW.plan_id, NEW.total_sales_count);
  RETURN NEW;
END;
$$;

-- Drop old trigger if exists, create new
DROP TRIGGER IF EXISTS trg_recalculate_seller_fee ON vault_seller_profiles;

CREATE TRIGGER trg_recalculate_seller_fee
  BEFORE INSERT OR UPDATE OF total_sales_count, plan_id
  ON vault_seller_profiles
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_seller_fee();
