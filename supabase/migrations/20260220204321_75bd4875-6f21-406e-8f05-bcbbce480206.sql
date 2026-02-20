
-- Table to track cron job execution history
CREATE TABLE public.cron_execution_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running', -- running, success, error
  result JSONB,
  error_message TEXT,
  duration_ms INTEGER
);

-- Index for quick lookups
CREATE INDEX idx_cron_logs_job_name ON public.cron_execution_logs(job_name, started_at DESC);
CREATE INDEX idx_cron_logs_status ON public.cron_execution_logs(status);

-- Enable RLS
ALTER TABLE public.cron_execution_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read
CREATE POLICY "Admins can read cron logs"
  ON public.cron_execution_logs FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Service role inserts (edge functions use service role)
CREATE POLICY "Service role can insert cron logs"
  ON public.cron_execution_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update cron logs"
  ON public.cron_execution_logs FOR UPDATE
  USING (true);

-- Auto-cleanup: keep only last 30 days
CREATE OR REPLACE FUNCTION public.cleanup_old_cron_logs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.cron_execution_logs
  WHERE started_at < NOW() - INTERVAL '30 days';
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cleanup_cron_logs
  AFTER INSERT ON public.cron_execution_logs
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.cleanup_old_cron_logs();
