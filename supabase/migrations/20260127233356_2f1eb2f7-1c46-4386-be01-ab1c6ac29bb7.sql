-- Create client_preferences table for storing user preferences
CREATE TABLE public.client_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_cpf VARCHAR NOT NULL UNIQUE,
  preferred_sizes TEXT[] DEFAULT '{}',
  favorite_brands TEXT[] DEFAULT '{}',
  preferred_colors TEXT[] DEFAULT '{}',
  notification_email BOOLEAN DEFAULT true,
  notification_whatsapp BOOLEAN DEFAULT true,
  notification_push BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role can manage preferences"
ON public.client_preferences
FOR ALL
USING (false)
WITH CHECK (false);

-- Create function to get/update client preferences
CREATE OR REPLACE FUNCTION public.get_client_preferences(p_cpf VARCHAR)
RETURNS TABLE (
  preferred_sizes TEXT[],
  favorite_brands TEXT[],
  preferred_colors TEXT[],
  notification_email BOOLEAN,
  notification_whatsapp BOOLEAN,
  notification_push BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    cp.preferred_sizes,
    cp.favorite_brands,
    cp.preferred_colors,
    cp.notification_email,
    cp.notification_whatsapp,
    cp.notification_push
  FROM public.client_preferences cp
  WHERE cp.client_cpf = p_cpf;
$$;

-- Create function to update client preferences
CREATE OR REPLACE FUNCTION public.upsert_client_preferences(
  p_cpf VARCHAR,
  p_preferred_sizes TEXT[] DEFAULT NULL,
  p_favorite_brands TEXT[] DEFAULT NULL,
  p_preferred_colors TEXT[] DEFAULT NULL,
  p_notification_email BOOLEAN DEFAULT NULL,
  p_notification_whatsapp BOOLEAN DEFAULT NULL,
  p_notification_push BOOLEAN DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.client_preferences (
    client_cpf,
    preferred_sizes,
    favorite_brands,
    preferred_colors,
    notification_email,
    notification_whatsapp,
    notification_push
  ) VALUES (
    p_cpf,
    COALESCE(p_preferred_sizes, '{}'),
    COALESCE(p_favorite_brands, '{}'),
    COALESCE(p_preferred_colors, '{}'),
    COALESCE(p_notification_email, true),
    COALESCE(p_notification_whatsapp, true),
    COALESCE(p_notification_push, true)
  )
  ON CONFLICT (client_cpf) DO UPDATE SET
    preferred_sizes = COALESCE(p_preferred_sizes, client_preferences.preferred_sizes),
    favorite_brands = COALESCE(p_favorite_brands, client_preferences.favorite_brands),
    preferred_colors = COALESCE(p_preferred_colors, client_preferences.preferred_colors),
    notification_email = COALESCE(p_notification_email, client_preferences.notification_email),
    notification_whatsapp = COALESCE(p_notification_whatsapp, client_preferences.notification_whatsapp),
    notification_push = COALESCE(p_notification_push, client_preferences.notification_push),
    updated_at = now();
  
  RETURN TRUE;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_client_preferences_updated_at
BEFORE UPDATE ON public.client_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();