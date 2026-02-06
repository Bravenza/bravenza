
-- Chat messages table for marketplace
CREATE TABLE public.vault_marketplace_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.vault_marketplace_orders(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.vault_marketplace_listings(id) ON DELETE CASCADE,
  sender_cpf TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vault_marketplace_messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admin full access on marketplace messages"
  ON public.vault_marketplace_messages FOR ALL
  USING (public.is_admin());

CREATE POLICY "Users can read their own messages"
  ON public.vault_marketplace_messages FOR SELECT
  USING (sender_cpf = current_setting('request.headers')::json->>'x-client-cpf');

-- Allow edge function (service role) full access - no additional policy needed

-- Add dispute columns to orders if not present
ALTER TABLE public.vault_marketplace_orders
  ADD COLUMN IF NOT EXISTS dispute_reason TEXT,
  ADD COLUMN IF NOT EXISTS dispute_opened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dispute_resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dispute_resolution TEXT,
  ADD COLUMN IF NOT EXISTS dispute_refund_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Add search index for listings
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_search
  ON public.vault_marketplace_listings USING gin(to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(brand, '') || ' ' || coalesce(model, '') || ' ' || coalesce(colorway, '')));

-- Add condition filter index
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_condition
  ON public.vault_marketplace_listings(condition) WHERE status = 'active';

-- Add price index
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_price
  ON public.vault_marketplace_listings(price) WHERE status = 'active';

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.vault_marketplace_messages;

-- Grant anon access for edge function operations
GRANT SELECT, INSERT ON public.vault_marketplace_messages TO anon;
GRANT SELECT, INSERT ON public.vault_marketplace_messages TO authenticated;
