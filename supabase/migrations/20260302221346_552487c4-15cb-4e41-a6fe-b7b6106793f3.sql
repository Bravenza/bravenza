
-- Add interest-free installment support to marketplace_offers
ALTER TABLE public.marketplace_offers 
ADD COLUMN IF NOT EXISTS interest_free_installments integer DEFAULT 0;

-- Also add to vault_marketplace_listings for display
ALTER TABLE public.vault_marketplace_listings 
ADD COLUMN IF NOT EXISTS interest_free_installments integer DEFAULT 0;

-- Create installment surcharge config table
CREATE TABLE IF NOT EXISTS public.marketplace_installment_surcharges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  max_installments integer NOT NULL UNIQUE,
  surcharge_percent numeric NOT NULL,
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_installment_surcharges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Installment surcharges are publicly readable"
ON public.marketplace_installment_surcharges FOR SELECT
USING (true);

-- Seed the surcharge tiers
INSERT INTO public.marketplace_installment_surcharges (max_installments, surcharge_percent, label) VALUES
(3, 5, 'até 3x sem juros'),
(6, 10, 'até 6x sem juros'),
(10, 14, 'até 10x sem juros'),
(12, 18, 'até 12x sem juros')
ON CONFLICT (max_installments) DO NOTHING;

NOTIFY pgrst, 'reload schema';
