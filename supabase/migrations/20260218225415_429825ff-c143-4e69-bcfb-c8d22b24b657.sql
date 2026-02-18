
-- Table to log all verification attempts (for auditing and rate limiting)
CREATE TABLE public.verification_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address text NOT NULL,
  code_attempted text NOT NULL,
  is_valid boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for rate limiting queries (IP + time window)
CREATE INDEX idx_verification_attempts_ip_time ON public.verification_attempts (ip_address, created_at DESC);

-- Index for code-based lookups
CREATE INDEX idx_verification_attempts_code ON public.verification_attempts (code_attempted, created_at DESC);

-- Enable RLS
ALTER TABLE public.verification_attempts ENABLE ROW LEVEL SECURITY;

-- Only service_role can insert/read (edge function uses service role)
CREATE POLICY "Service role full access on verification_attempts"
  ON public.verification_attempts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Revoke all from anon and authenticated
REVOKE ALL ON public.verification_attempts FROM anon;
REVOKE ALL ON public.verification_attempts FROM authenticated;

-- Auto-cleanup: delete attempts older than 30 days (via scheduled function)
-- For now, we handle cleanup in the edge function itself
