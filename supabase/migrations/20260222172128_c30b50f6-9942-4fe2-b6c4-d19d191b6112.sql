
-- AutoCut rules: sellers configure automatic price reduction for their offers
CREATE TABLE public.marketplace_autocut_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.vault_seller_profiles(id) ON DELETE CASCADE,
  offer_id UUID NOT NULL REFERENCES public.marketplace_offers(id) ON DELETE CASCADE,
  min_price NUMERIC NOT NULL,
  reduction_amount NUMERIC NOT NULL DEFAULT 5,
  reduction_type TEXT NOT NULL DEFAULT 'fixed',
  interval_hours INT NOT NULL DEFAULT 24,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_cut_at TIMESTAMPTZ,
  cuts_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(offer_id)
);

-- Enable RLS
ALTER TABLE public.marketplace_autocut_rules ENABLE ROW LEVEL SECURITY;

-- Sellers can manage their own autocut rules via member_id -> vault_members -> client_cpf -> client_profiles -> user_id
CREATE POLICY "Sellers can view own autocut rules"
  ON public.marketplace_autocut_rules FOR SELECT
  USING (
    seller_id IN (
      SELECT sp.id FROM public.vault_seller_profiles sp
      JOIN public.vault_members vm ON vm.id = sp.member_id
      JOIN public.client_profiles cp ON cp.cpf = vm.client_cpf
      WHERE cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can insert own autocut rules"
  ON public.marketplace_autocut_rules FOR INSERT
  WITH CHECK (
    seller_id IN (
      SELECT sp.id FROM public.vault_seller_profiles sp
      JOIN public.vault_members vm ON vm.id = sp.member_id
      JOIN public.client_profiles cp ON cp.cpf = vm.client_cpf
      WHERE cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can update own autocut rules"
  ON public.marketplace_autocut_rules FOR UPDATE
  USING (
    seller_id IN (
      SELECT sp.id FROM public.vault_seller_profiles sp
      JOIN public.vault_members vm ON vm.id = sp.member_id
      JOIN public.client_profiles cp ON cp.cpf = vm.client_cpf
      WHERE cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can delete own autocut rules"
  ON public.marketplace_autocut_rules FOR DELETE
  USING (
    seller_id IN (
      SELECT sp.id FROM public.vault_seller_profiles sp
      JOIN public.vault_members vm ON vm.id = sp.member_id
      JOIN public.client_profiles cp ON cp.cpf = vm.client_cpf
      WHERE cp.user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_autocut_rules_updated_at
  BEFORE UPDATE ON public.marketplace_autocut_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
