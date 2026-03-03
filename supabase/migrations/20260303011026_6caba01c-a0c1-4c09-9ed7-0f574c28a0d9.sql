
-- ========================
-- CATÁLOGO OFICIAL v1 — Schema
-- ========================

-- A) brands
CREATE TABLE IF NOT EXISTS public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brands_public_read" ON public.brands FOR SELECT USING (true);

-- B) silhouettes
CREATE TABLE IF NOT EXISTS public.silhouettes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(brand_id, name)
);
ALTER TABLE public.silhouettes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "silhouettes_public_read" ON public.silhouettes FOR SELECT USING (true);

-- C) silhouette_taxonomy
CREATE TABLE IF NOT EXISTS public.silhouette_taxonomy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name text NOT NULL,
  silhouette_name text NOT NULL,
  match_keywords text[] NOT NULL,
  priority int NOT NULL DEFAULT 100,
  UNIQUE(brand_name, silhouette_name)
);
ALTER TABLE public.silhouette_taxonomy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "taxonomy_public_read" ON public.silhouette_taxonomy FOR SELECT USING (true);

-- D) sneaker_models
CREATE TABLE IF NOT EXISTS public.sneaker_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE RESTRICT,
  silhouette_id uuid REFERENCES public.silhouettes(id) ON DELETE SET NULL,
  sku text NOT NULL UNIQUE,
  colorway text,
  release_date date,
  msrp numeric,
  model_name_en text,
  description_en text,
  model_name_pt text,
  description_pt text,
  translation_status text NOT NULL DEFAULT 'pending',
  translation_error text,
  needs_official_image boolean NOT NULL DEFAULT true,
  image_status text NOT NULL DEFAULT 'placeholder',
  placeholder_image_url text NOT NULL DEFAULT '/img/shoe-placeholder-white.png',
  source_primary text NOT NULL DEFAULT 'tsdb',
  source_secondary text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sneaker_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sneaker_models_public_read" ON public.sneaker_models FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_sneaker_models_sku ON public.sneaker_models(sku);
CREATE INDEX IF NOT EXISTS idx_sneaker_models_brand ON public.sneaker_models(brand_id);
CREATE INDEX IF NOT EXISTS idx_sneaker_models_silhouette ON public.sneaker_models(silhouette_id);
CREATE INDEX IF NOT EXISTS idx_sneaker_models_translation ON public.sneaker_models(translation_status);
CREATE INDEX IF NOT EXISTS idx_sneaker_models_image ON public.sneaker_models(image_status);

-- E) sneaker_images
CREATE TABLE IF NOT EXISTS public.sneaker_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sneaker_id uuid NOT NULL REFERENCES public.sneaker_models(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  source text NOT NULL,
  is_primary boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sneaker_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sneaker_images_public_read" ON public.sneaker_images FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_sneaker_images_sneaker ON public.sneaker_images(sneaker_id);
CREATE INDEX IF NOT EXISTS idx_sneaker_images_primary ON public.sneaker_images(sneaker_id, is_primary) WHERE is_primary = true;
