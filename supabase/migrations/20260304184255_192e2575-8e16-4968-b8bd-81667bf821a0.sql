CREATE TABLE IF NOT EXISTS public.app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can access app_config" ON public.app_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert the cron key (same value will be set in edge function secret)
INSERT INTO public.app_config (key, value) 
VALUES ('catalog_sync_cron_key', 'brvnz-csync-' || encode(gen_random_bytes(16), 'hex'))
ON CONFLICT (key) DO NOTHING;