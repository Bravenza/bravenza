
-- Table to track abandoned carts for recovery emails
CREATE TABLE public.abandoned_carts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_cpf TEXT NOT NULL,
  checkout_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Snapshot of cart items at time of abandonment
  cart_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Total value of the cart
  cart_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  -- Number of items
  item_count INT NOT NULL DEFAULT 0,
  -- Recovery tracking
  recovery_email_sent_at TIMESTAMPTZ,
  recovery_email_opened_at TIMESTAMPTZ,
  recovered_at TIMESTAMPTZ,
  -- Status: pending, email_sent, recovered, expired
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

-- Service role access only (managed via edge functions)
CREATE POLICY "Service role full access on abandoned_carts"
  ON public.abandoned_carts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX idx_abandoned_carts_cpf ON public.abandoned_carts(user_cpf);
CREATE INDEX idx_abandoned_carts_status ON public.abandoned_carts(status) WHERE status = 'pending';
CREATE INDEX idx_abandoned_carts_checkout_time ON public.abandoned_carts(checkout_started_at);

-- Unique constraint: only one pending abandonment per user at a time
CREATE UNIQUE INDEX idx_abandoned_carts_unique_pending 
  ON public.abandoned_carts(user_cpf) WHERE status = 'pending';
