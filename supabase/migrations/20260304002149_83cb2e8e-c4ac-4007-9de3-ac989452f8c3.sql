-- Add column to preserve original USD price
ALTER TABLE public.sneaker_models ADD COLUMN IF NOT EXISTS msrp_usd numeric;

-- Copy current USD values to msrp_usd for existing records
UPDATE public.sneaker_models SET msrp_usd = msrp WHERE msrp IS NOT NULL AND msrp_usd IS NULL;

-- Add column to track exchange rate used
ALTER TABLE public.sneaker_models ADD COLUMN IF NOT EXISTS msrp_exchange_rate numeric;