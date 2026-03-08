
-- Idempotency keys table for deduplication of payments, webhooks, and critical operations
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'processing',
  cached_result jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires_at ON public.idempotency_keys(expires_at);

-- RLS: only service_role should access this table
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;
-- No RLS policies = only service_role can access (Edge Functions use service_role)

-- Add comment for documentation
COMMENT ON TABLE public.idempotency_keys IS 'Deduplication table for payments, webhooks, and critical operations. Auto-expires via TTL.';
