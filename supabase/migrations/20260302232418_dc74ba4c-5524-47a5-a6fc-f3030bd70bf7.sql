
-- 1. Add confirmed_at to vault_marketplace_orders for escrow release tracking
ALTER TABLE public.vault_marketplace_orders 
ADD COLUMN IF NOT EXISTS confirmed_at timestamptz DEFAULT NULL;

-- 2. Seller PIX accounts
CREATE TABLE public.marketplace_seller_pix_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.vault_seller_profiles(id) ON DELETE CASCADE,
  pix_key_type text NOT NULL, -- cpf, cnpj, email, phone, random
  pix_key text NOT NULL,
  beneficiary_name text NOT NULL,
  bank_name text NOT NULL,
  is_default boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_seller_pix_accounts ENABLE ROW LEVEL SECURITY;

-- Sellers can manage their own PIX accounts (via edge function with service role)
-- No direct client access needed

-- 3. Seller payout requests
CREATE TABLE public.marketplace_seller_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.vault_seller_profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'requested', -- requested, processing, completed, rejected
  pix_account_id uuid REFERENCES public.marketplace_seller_pix_accounts(id),
  pix_key text,
  pix_key_type text,
  beneficiary_name text,
  bank_name text,
  admin_notes text,
  processed_at timestamptz,
  completed_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  proof_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_seller_payouts ENABLE ROW LEVEL SECURITY;

-- Index for common queries
CREATE INDEX idx_seller_payouts_seller ON public.marketplace_seller_payouts(seller_id);
CREATE INDEX idx_seller_payouts_status ON public.marketplace_seller_payouts(status);
CREATE INDEX idx_seller_pix_seller ON public.marketplace_seller_pix_accounts(seller_id);
CREATE INDEX idx_orders_confirmed_at ON public.vault_marketplace_orders(confirmed_at) WHERE confirmed_at IS NOT NULL;
