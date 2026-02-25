
-- Table for Bravenza Full (Level 3) consignment requests
CREATE TABLE public.marketplace_consignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.vault_seller_profiles(id),
  
  -- Product info (seller provides)
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  colorway TEXT,
  size TEXT NOT NULL,
  size_system TEXT NOT NULL DEFAULT 'BR',
  condition TEXT NOT NULL DEFAULT 'novo',
  suggested_price NUMERIC NOT NULL,
  description TEXT,
  seller_photos TEXT[] DEFAULT '{}',
  has_receipt BOOLEAN NOT NULL DEFAULT false,
  
  -- Hub processing
  product_id UUID REFERENCES public.marketplace_products(id),
  offer_id UUID REFERENCES public.marketplace_offers(id),
  hub_photos TEXT[] DEFAULT '{}',
  final_price NUMERIC,
  inspection_result TEXT,
  inspection_notes TEXT,
  laudo_id TEXT,
  
  -- Financial
  fee_percent NUMERIC NOT NULL DEFAULT 22,
  sale_amount NUMERIC,
  fee_amount NUMERIC,
  seller_payout NUMERIC,
  payout_at TIMESTAMPTZ,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'requested',
  
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  instructions_sent_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  inspected_at TIMESTAMPTZ,
  photographed_at TIMESTAMPTZ,
  listed_at TIMESTAMPTZ,
  sold_at TIMESTAMPTZ,
  payout_released_at TIMESTAMPTZ,
  
  rejection_reason TEXT,
  admin_notes TEXT,
  tracking_code TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_consignments ENABLE ROW LEVEL SECURITY;

-- RLS: Sellers access own consignments via member chain
CREATE POLICY "Sellers can view own consignments"
ON public.marketplace_consignments FOR SELECT
USING (
  seller_id IN (
    SELECT sp.id FROM public.vault_seller_profiles sp
    JOIN public.vault_members vm ON vm.id = sp.member_id
    JOIN public.client_profiles cp ON cp.cpf = vm.client_cpf
    WHERE cp.user_id = auth.uid()
  )
);

CREATE POLICY "Sellers can create consignments"
ON public.marketplace_consignments FOR INSERT
WITH CHECK (
  seller_id IN (
    SELECT sp.id FROM public.vault_seller_profiles sp
    JOIN public.vault_members vm ON vm.id = sp.member_id
    JOIN public.client_profiles cp ON cp.cpf = vm.client_cpf
    WHERE cp.user_id = auth.uid()
  )
);

CREATE POLICY "Sellers can update own consignments"
ON public.marketplace_consignments FOR UPDATE
USING (
  seller_id IN (
    SELECT sp.id FROM public.vault_seller_profiles sp
    JOIN public.vault_members vm ON vm.id = sp.member_id
    JOIN public.client_profiles cp ON cp.cpf = vm.client_cpf
    WHERE cp.user_id = auth.uid()
  )
);

CREATE TRIGGER update_marketplace_consignments_updated_at
BEFORE UPDATE ON public.marketplace_consignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_consignments_seller ON public.marketplace_consignments(seller_id);
CREATE INDEX idx_consignments_status ON public.marketplace_consignments(status);
