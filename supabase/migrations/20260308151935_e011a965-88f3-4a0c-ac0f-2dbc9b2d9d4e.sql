CREATE TABLE public.sneaker_releases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  colorway TEXT,
  release_date DATE NOT NULL,
  image_url TEXT,
  hype_level TEXT NOT NULL DEFAULT 'medium',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sneaker_releases ENABLE ROW LEVEL SECURITY;

-- Public read access (drops page is public)
CREATE POLICY "Anyone can view active releases"
  ON public.sneaker_releases
  FOR SELECT
  USING (is_active = true);

-- Admin full access via admin_profiles check
CREATE POLICY "Admins can manage releases"
  ON public.sneaker_releases
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_profiles WHERE user_id = auth.uid())
  );