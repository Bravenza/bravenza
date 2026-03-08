ALTER TABLE public.client_profiles
  ADD COLUMN IF NOT EXISTS privacy_consent_version text,
  ADD COLUMN IF NOT EXISTS privacy_consent_at timestamptz;