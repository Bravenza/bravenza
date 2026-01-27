-- Create system_settings table for storing app-wide configurations
CREATE TABLE public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (needed for edge functions and client)
CREATE POLICY "Anyone can view settings"
ON public.system_settings
FOR SELECT
TO authenticated
USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can insert settings"
ON public.system_settings
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update settings"
ON public.system_settings
FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete settings"
ON public.system_settings
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Insert default referral cashback percentage
INSERT INTO public.system_settings (key, value, description)
VALUES ('referral_cashback_percentage', '5', 'Porcentagem padrão de cashback para indicações');