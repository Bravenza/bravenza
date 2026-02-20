
-- Auto-award points on marketplace purchase completion
CREATE OR REPLACE FUNCTION public.auto_award_purchase_points()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_buyer_cpf TEXT;
  v_points INTEGER;
  v_multiplier NUMERIC := 1;
  v_is_vault BOOLEAN;
BEGIN
  IF NEW.status IN ('completed', 'payout_released') 
     AND (OLD.status IS NULL OR OLD.status NOT IN ('completed', 'payout_released')) THEN
    
    v_buyer_cpf := NEW.buyer_cpf;
    IF v_buyer_cpf IS NULL THEN RETURN NEW; END IF;
    
    v_points := GREATEST(FLOOR(COALESCE(NEW.sale_price, 0)), 1);
    
    SELECT EXISTS(SELECT 1 FROM vault_members WHERE client_cpf = v_buyer_cpf AND is_active = true)
    INTO v_is_vault;
    
    IF v_is_vault THEN
      v_multiplier := 1.5;
    END IF;
    
    v_points := FLOOR(v_points * v_multiplier);
    
    PERFORM award_loyalty_points(
      v_buyer_cpf,
      v_points,
      'purchase',
      'Compra no marketplace' || CASE WHEN v_is_vault THEN ' (bônus Vault 1.5x)' ELSE '' END,
      NEW.order_code
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_award_purchase_points
  AFTER UPDATE ON public.vault_marketplace_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_award_purchase_points();

-- Seller reputation badges table
CREATE TABLE public.marketplace_seller_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.vault_seller_profiles(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_icon TEXT NOT NULL DEFAULT '⭐',
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(seller_id, badge_type)
);

ALTER TABLE public.marketplace_seller_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view seller badges"
  ON public.marketplace_seller_badges FOR SELECT
  USING (true);

CREATE POLICY "Admin manage seller badges"
  ON public.marketplace_seller_badges FOR ALL
  USING (public.is_admin(auth.uid()));
