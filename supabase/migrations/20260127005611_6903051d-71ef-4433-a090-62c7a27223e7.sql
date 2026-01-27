-- Add referral_code field to order_requests table
ALTER TABLE public.order_requests 
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) DEFAULT NULL;

-- Add an index for faster referral code lookups
CREATE INDEX IF NOT EXISTS idx_order_requests_referral_code ON public.order_requests(referral_code);

-- Add index on orders for referral tracking
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_cpf ON public.referrals(referrer_cpf);