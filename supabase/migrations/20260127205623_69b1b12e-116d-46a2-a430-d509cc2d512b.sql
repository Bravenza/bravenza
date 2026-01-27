-- Create table for featured sneaker models
CREATE TABLE public.featured_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  brand VARCHAR NOT NULL,
  image_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.featured_models ENABLE ROW LEVEL SECURITY;

-- Admins can manage featured models
CREATE POLICY "Admins can manage featured models"
ON public.featured_models
FOR ALL
USING (is_admin());

-- Anyone can view active featured models
CREATE POLICY "Anyone can view active featured models"
ON public.featured_models
FOR SELECT
USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_featured_models_updated_at
BEFORE UPDATE ON public.featured_models
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();