-- Add last_error and updated_at columns to idempotency_keys for failure tracking
ALTER TABLE public.idempotency_keys 
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Backfill updated_at from created_at for existing rows
UPDATE public.idempotency_keys SET updated_at = created_at WHERE updated_at = now();

-- Index for stale processing detection
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_status_updated 
  ON public.idempotency_keys (status, updated_at) 
  WHERE status = 'processing';