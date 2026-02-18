
-- 1. Plan definitions (configurable by admin)
CREATE TABLE public.marketplace_plans (
  id TEXT PRIMARY KEY, -- 'free', 'pro', 'elite'
  name TEXT NOT NULL,
  price_monthly NUMERIC NOT NULL DEFAULT 0,
  fee_percent NUMERIC NOT NULL DEFAULT 14,
  max_active_listings INTEGER, -- NULL = unlimited
  max_new_listings_month INTEGER, -- NULL = unlimited
  boost_slots INTEGER NOT NULL DEFAULT 1,
  support_sla_hours INTEGER NOT NULL DEFAULT 72,
  has_storefront BOOLEAN NOT NULL DEFAULT false,
  has_verified_badge BOOLEAN NOT NULL DEFAULT false,
  has_batch_tools BOOLEAN NOT NULL DEFAULT false,
  has_priority_search BOOLEAN NOT NULL DEFAULT false,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default plans
INSERT INTO public.marketplace_plans (id, name, price_monthly, fee_percent, max_active_listings, max_new_listings_month, boost_slots, support_sla_hours, has_storefront, has_verified_badge, has_batch_tools, has_priority_search, features) VALUES
  ('free', 'Vault Free', 0, 14, 5, 5, 1, 72, false, false, false, false, '["Acesso ao marketplace","Comunidade","Reputação","Suporte padrão (48-72h)","1 boost/mês"]'::jsonb),
  ('pro', 'Seller Pro', 79, 12, 25, 25, 3, 48, false, false, true, false, '["3 boosts rotativos","Ferramentas de lote","Suporte priorizado (24-48h)","Relatórios de anúncios"]'::jsonb),
  ('elite', 'Seller Elite', 149, 10, NULL, NULL, 10, 24, true, true, true, true, '["Anúncios ilimitados","Vitrine e coleções","Selo Loja Verificada","Prioridade em busca","Suporte rápido (até 24h)","Curadoria Bravenza"]'::jsonb);

-- 2. Subscriptions table
CREATE TABLE public.marketplace_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.vault_seller_profiles(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.marketplace_plans(id) DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active', -- active, past_due, canceled, expired
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ,
  grace_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  payment_provider TEXT, -- 'stripe', 'mercadopago'
  provider_subscription_id TEXT,
  last_payment_status TEXT,
  last_payment_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(seller_id)
);

-- 3. Add plan fields to seller profiles
ALTER TABLE public.vault_seller_profiles
  ADD COLUMN IF NOT EXISTS plan_id TEXT REFERENCES public.marketplace_plans(id) DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS is_business BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cnpj TEXT,
  ADD COLUMN IF NOT EXISTS monthly_new_listings_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_new_listings_reset_at TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', now()),
  ADD COLUMN IF NOT EXISTS support_priority INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verified_badge BOOLEAN NOT NULL DEFAULT false;

-- 4. Add boost/auth fields to offers
ALTER TABLE public.marketplace_offers
  ADD COLUMN IF NOT EXISTS boost_level TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;

-- 5. Add auth fields to marketplace orders
ALTER TABLE public.vault_marketplace_orders
  ADD COLUMN IF NOT EXISTS requires_authentication BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS authentication_requested BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS authentication_fee NUMERIC DEFAULT 0;

-- 6. RLS policies
ALTER TABLE public.marketplace_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_subscriptions ENABLE ROW LEVEL SECURITY;

-- Plans are readable by everyone
CREATE POLICY "Plans are publicly readable"
  ON public.marketplace_plans FOR SELECT
  USING (true);

-- Only admins can manage plans
CREATE POLICY "Admins can manage plans"
  ON public.marketplace_plans FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Subscriptions readable by admin
CREATE POLICY "Admins can manage subscriptions"
  ON public.marketplace_subscriptions FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Grant anon read on plans
GRANT SELECT ON public.marketplace_plans TO anon;

-- 7. Function to check listing limits
CREATE OR REPLACE FUNCTION public.check_seller_listing_limits(p_seller_id UUID)
RETURNS TABLE(
  can_publish BOOLEAN,
  active_count INTEGER,
  max_active INTEGER,
  monthly_new_count INTEGER,
  max_monthly_new INTEGER,
  plan_id TEXT,
  block_reason TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller RECORD;
  v_plan RECORD;
  v_active INTEGER;
  v_block TEXT := NULL;
  v_can BOOLEAN := true;
BEGIN
  SELECT * INTO v_seller FROM vault_seller_profiles WHERE id = p_seller_id;
  SELECT * INTO v_plan FROM marketplace_plans WHERE id = COALESCE(v_seller.plan_id, 'free');

  -- Reset monthly counter if needed
  IF v_seller.monthly_new_listings_reset_at < date_trunc('month', now()) THEN
    UPDATE vault_seller_profiles
    SET monthly_new_listings_count = 0, monthly_new_listings_reset_at = date_trunc('month', now())
    WHERE id = p_seller_id;
    v_seller.monthly_new_listings_count := 0;
  END IF;

  -- Count active listings
  SELECT COUNT(*) INTO v_active
  FROM marketplace_offers
  WHERE seller_id = p_seller_id AND status = 'active';

  -- Check active limit
  IF v_plan.max_active_listings IS NOT NULL AND v_active >= v_plan.max_active_listings THEN
    v_can := false;
    v_block := 'active_limit';
  END IF;

  -- Check monthly new limit
  IF v_can AND v_plan.max_new_listings_month IS NOT NULL AND v_seller.monthly_new_listings_count >= v_plan.max_new_listings_month THEN
    v_can := false;
    v_block := 'monthly_limit';
  END IF;

  RETURN QUERY SELECT v_can, v_active, v_plan.max_active_listings, v_seller.monthly_new_listings_count, v_plan.max_new_listings_month, v_plan.id, v_block;
END;
$$;

-- 8. Function to handle downgrade
CREATE OR REPLACE FUNCTION public.downgrade_seller_to_free(p_seller_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_free_limit INTEGER;
  v_excess_ids UUID[];
BEGIN
  SELECT max_active_listings INTO v_free_limit FROM marketplace_plans WHERE id = 'free';

  -- Get IDs of offers to pause (keep most recent active)
  SELECT array_agg(id) INTO v_excess_ids
  FROM (
    SELECT id FROM marketplace_offers
    WHERE seller_id = p_seller_id AND status = 'active'
    ORDER BY created_at DESC
    OFFSET v_free_limit
  ) sub;

  -- Pause excess offers
  IF v_excess_ids IS NOT NULL THEN
    UPDATE marketplace_offers
    SET status = 'paused'
    WHERE id = ANY(v_excess_ids);
  END IF;

  -- Update seller plan
  UPDATE vault_seller_profiles
  SET plan_id = 'free', support_priority = 0, verified_badge = false
  WHERE id = p_seller_id;
END;
$$;
