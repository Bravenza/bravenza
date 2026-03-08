
-- Generic rate limiting table for edge functions
CREATE TABLE IF NOT EXISTS public.rate_limit_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  ip_address text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_rate_limit_key_ip_created ON public.rate_limit_entries (key, ip_address, created_at DESC);

-- Auto-cleanup: delete entries older than 1 hour
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_entries()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.rate_limit_entries WHERE created_at < now() - interval '1 hour';
$$;

-- RLS: only service_role can access
ALTER TABLE public.rate_limit_entries ENABLE ROW LEVEL SECURITY;

-- No public policies = only service_role can read/write
