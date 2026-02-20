
-- Negotiation events timeline table
CREATE TABLE public.marketplace_negotiation_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id UUID NOT NULL REFERENCES public.vault_marketplace_offers(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'offer_made', 'counter_sent', 'counter_accepted', 'accepted', 'rejected', 'expired', 'message'
  actor_cpf TEXT NOT NULL,
  actor_name TEXT,
  price NUMERIC,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast timeline queries
CREATE INDEX idx_negotiation_events_offer ON public.marketplace_negotiation_events(offer_id, created_at);

-- Enable RLS
ALTER TABLE public.marketplace_negotiation_events ENABLE ROW LEVEL SECURITY;

-- Participants can view negotiation events
CREATE POLICY "Participants can view negotiation events"
ON public.marketplace_negotiation_events FOR SELECT
USING (true);

-- Only authenticated users can insert via backend
CREATE POLICY "Backend inserts negotiation events"
ON public.marketplace_negotiation_events FOR INSERT
WITH CHECK (true);

-- Add bundle_id to offers for grouping bundle offers
ALTER TABLE public.vault_marketplace_offers
ADD COLUMN IF NOT EXISTS bundle_id UUID,
ADD COLUMN IF NOT EXISTS bundle_discount_percent NUMERIC DEFAULT 0;

-- Create index for bundle queries
CREATE INDEX IF NOT EXISTS idx_offers_bundle ON public.vault_marketplace_offers(bundle_id) WHERE bundle_id IS NOT NULL;

-- Function to auto-expire pending offers past expires_at
CREATE OR REPLACE FUNCTION public.auto_expire_marketplace_offers()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $func$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE vault_marketplace_offers
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$func$;
