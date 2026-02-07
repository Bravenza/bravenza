
-- Add seller tier columns to vault_seller_profiles
ALTER TABLE public.vault_seller_profiles
  ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'bronze',
  ADD COLUMN IF NOT EXISTS on_time_shipping_rate numeric DEFAULT 100,
  ADD COLUMN IF NOT EXISTS cancellation_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dispute_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pro_approval_rate numeric DEFAULT 100,
  ADD COLUMN IF NOT EXISTS tier_updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS payout_speed_days integer DEFAULT 10;

-- Add comment for tier values
COMMENT ON COLUMN public.vault_seller_profiles.tier IS 'bronze, prata, ouro, elite';
