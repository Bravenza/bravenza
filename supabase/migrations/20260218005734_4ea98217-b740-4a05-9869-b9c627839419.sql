
-- Seller collections for Elite storefront/vitrine
CREATE TABLE public.seller_collections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id uuid NOT NULL REFERENCES vault_seller_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  cover_image text,
  listing_ids uuid[] DEFAULT '{}',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.seller_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active collections" ON public.seller_collections
FOR SELECT USING (is_active = true);

CREATE POLICY "Sellers can manage own collections" ON public.seller_collections
FOR ALL USING (
  seller_id IN (
    SELECT vsp.id FROM vault_seller_profiles vsp
    JOIN vault_members vm ON vm.id = vsp.member_id
    JOIN client_profiles cp ON cp.cpf::text = vm.client_cpf::text
    WHERE cp.user_id = auth.uid()
  )
) WITH CHECK (
  seller_id IN (
    SELECT vsp.id FROM vault_seller_profiles vsp
    JOIN vault_members vm ON vm.id = vsp.member_id
    JOIN client_profiles cp ON cp.cpf::text = vm.client_cpf::text
    WHERE cp.user_id = auth.uid()
  )
);

CREATE POLICY "Admins full access seller_collections" ON public.seller_collections
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Service can manage seller_collections" ON public.seller_collections
FOR ALL USING (true) WITH CHECK (true);

-- Auto-detect business seller trigger
CREATE OR REPLACE FUNCTION public.auto_detect_business_seller()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.total_sales_count >= 10 OR (NEW.cnpj IS NOT NULL AND NEW.cnpj != '') THEN
    NEW.is_business := true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_detect_business_on_update
BEFORE UPDATE ON public.vault_seller_profiles
FOR EACH ROW EXECUTE FUNCTION public.auto_detect_business_seller();

-- Function to check verified badge eligibility
CREATE OR REPLACE FUNCTION public.check_verified_badge_eligibility(p_seller_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_seller RECORD;
  v_member RECORD;
BEGIN
  SELECT * INTO v_seller FROM vault_seller_profiles WHERE id = p_seller_id;
  IF NOT FOUND THEN RETURN false; END IF;
  IF v_seller.plan_id != 'elite' THEN RETURN false; END IF;
  IF v_seller.kyc_status != 'approved' THEN RETURN false; END IF;
  IF v_seller.total_sales_count < 5 THEN RETURN false; END IF;
  IF v_seller.dispute_rate > 5 THEN RETURN false; END IF;
  SELECT * INTO v_member FROM vault_members WHERE id = v_seller.member_id;
  IF v_member.client_email IS NULL OR v_member.client_email = '' THEN RETURN false; END IF;
  RETURN true;
END;
$$;

-- Auto-update verified badge on seller profile changes
CREATE OR REPLACE FUNCTION public.auto_update_verified_badge()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  NEW.verified_badge := check_verified_badge_eligibility(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_update_verified_badge_on_update
BEFORE UPDATE ON public.vault_seller_profiles
FOR EACH ROW EXECUTE FUNCTION public.auto_update_verified_badge();

-- Add boost expiry tracking to offers
ALTER TABLE public.marketplace_offers ADD COLUMN IF NOT EXISTS boost_active_until timestamptz;
