
-- =============================================
-- CATÁLOGO CENTRALIZADO DROPER-LIKE
-- =============================================

-- 1) Tabela de produtos do catálogo (modelo centralizado)
CREATE TABLE public.marketplace_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(255) UNIQUE,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(200) NOT NULL,
  colorway VARCHAR(200),
  sku VARCHAR(100),
  release_date DATE,
  retail_price NUMERIC,
  description TEXT,
  category VARCHAR(50) NOT NULL DEFAULT 'sneakers',
  images TEXT[] DEFAULT '{}'::TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_high_risk BOOLEAN NOT NULL DEFAULT false,
  total_offers INTEGER NOT NULL DEFAULT 0,
  lowest_price NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by_admin_id UUID,
  created_by_seller_id UUID
);

-- Índices para busca
CREATE INDEX idx_mp_brand ON public.marketplace_products(brand);
CREATE INDEX idx_mp_model ON public.marketplace_products(model);
CREATE INDEX idx_mp_slug ON public.marketplace_products(slug);
CREATE INDEX idx_mp_category ON public.marketplace_products(category);
CREATE INDEX idx_mp_active ON public.marketplace_products(is_active) WHERE is_active = true;
CREATE INDEX idx_mp_search ON public.marketplace_products USING GIN (to_tsvector('portuguese', brand || ' ' || model || ' ' || COALESCE(colorway, '')));

-- RLS
ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products"
  ON public.marketplace_products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins full access marketplace_products"
  ON public.marketplace_products FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Service can manage marketplace_products"
  ON public.marketplace_products FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2) Ofertas dos vendedores (substitui o conceito de listing como unidade principal)
CREATE TABLE public.marketplace_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.vault_seller_profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.vault_marketplace_listings(id) ON DELETE SET NULL,
  size VARCHAR(20) NOT NULL,
  size_system VARCHAR(10) NOT NULL DEFAULT 'BR',
  condition VARCHAR(30) NOT NULL DEFAULT 'novo',
  price NUMERIC NOT NULL,
  original_purchase_price NUMERIC,
  description TEXT,
  defects TEXT,
  photos TEXT[] DEFAULT '{}'::TEXT[],
  proof_photos TEXT[] DEFAULT '{}'::TEXT[],
  has_receipt BOOLEAN NOT NULL DEFAULT false,
  shipping_mode VARCHAR(20) NOT NULL DEFAULT 'direct',
  shipping_cost_estimate NUMERIC DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  pro_recommendation VARCHAR(30) DEFAULT 'direct_allowed',
  published_at TIMESTAMPTZ,
  sold_at TIMESTAMPTZ,
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_condition CHECK (condition IN ('novo', 'usado_excelente', 'usado_bom', 'usado_regular')),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'pending_review', 'active', 'reserved', 'sold', 'paused', 'cancelled', 'removed')),
  CONSTRAINT valid_pro_rec CHECK (pro_recommendation IN ('pro_mandatory', 'pro_recommended', 'direct_allowed')),
  CONSTRAINT positive_price CHECK (price > 0)
);

CREATE INDEX idx_mo_product ON public.marketplace_offers(product_id);
CREATE INDEX idx_mo_seller ON public.marketplace_offers(seller_id);
CREATE INDEX idx_mo_size ON public.marketplace_offers(size);
CREATE INDEX idx_mo_status ON public.marketplace_offers(status) WHERE status = 'active';
CREATE INDEX idx_mo_price ON public.marketplace_offers(price);
CREATE INDEX idx_mo_product_size ON public.marketplace_offers(product_id, size, status);

-- RLS
ALTER TABLE public.marketplace_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active offers"
  ON public.marketplace_offers FOR SELECT
  USING (status = 'active' OR status = 'reserved' OR status = 'sold');

CREATE POLICY "Admins full access marketplace_offers"
  ON public.marketplace_offers FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Service can manage marketplace_offers"
  ON public.marketplace_offers FOR ALL
  USING (true)
  WITH CHECK (true);

-- 3) Comentários públicos nos produtos (Q&A pré-compra)
CREATE TABLE public.marketplace_product_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  user_cpf VARCHAR(20) NOT NULL,
  user_name VARCHAR(200),
  parent_id UUID REFERENCES public.marketplace_product_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_seller_reply BOOLEAN NOT NULL DEFAULT false,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mpc_product ON public.marketplace_product_comments(product_id);

ALTER TABLE public.marketplace_product_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible comments"
  ON public.marketplace_product_comments FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Admins full access marketplace_product_comments"
  ON public.marketplace_product_comments FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Service can manage marketplace_product_comments"
  ON public.marketplace_product_comments FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4) Watchlist por produto+tamanho (alertas)
CREATE TABLE public.marketplace_watchlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_cpf VARCHAR(20) NOT NULL,
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  size VARCHAR(20) NOT NULL,
  max_price NUMERIC,
  notify_email BOOLEAN NOT NULL DEFAULT true,
  notify_push BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_cpf, product_id, size)
);

CREATE INDEX idx_mw_user ON public.marketplace_watchlist(user_cpf);
CREATE INDEX idx_mw_product_size ON public.marketplace_watchlist(product_id, size) WHERE is_active = true;

ALTER TABLE public.marketplace_watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access marketplace_watchlist"
  ON public.marketplace_watchlist FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Service can manage marketplace_watchlist"
  ON public.marketplace_watchlist FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5) Inspeção PRO (laudo digital no hub)
CREATE TABLE public.marketplace_inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id VARCHAR(30),
  offer_id UUID REFERENCES public.marketplace_offers(id) ON DELETE SET NULL,
  inspector_admin_id UUID,
  status VARCHAR(30) NOT NULL DEFAULT 'pending_receipt',
  received_at TIMESTAMPTZ,
  inspected_at TIMESTAMPTZ,
  result VARCHAR(30),
  laudo_id VARCHAR(50) UNIQUE,
  laudo_qr_url TEXT,
  checklist JSONB DEFAULT '[]'::JSONB,
  inspection_photos TEXT[] DEFAULT '{}'::TEXT[],
  notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_insp_status CHECK (status IN ('pending_receipt', 'received', 'inspection_pending', 'inspection_approved', 'inspection_rejected', 'needs_more_info')),
  CONSTRAINT valid_result CHECK (result IS NULL OR result IN ('approved', 'rejected', 'inconclusive'))
);

CREATE INDEX idx_mi_order ON public.marketplace_inspections(order_id);
CREATE INDEX idx_mi_status ON public.marketplace_inspections(status);

ALTER TABLE public.marketplace_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access marketplace_inspections"
  ON public.marketplace_inspections FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Service can manage marketplace_inspections"
  ON public.marketplace_inspections FOR ALL
  USING (true)
  WITH CHECK (true);

-- 6) Adicionar campos de pro_recommendation e product_id aos listings existentes
ALTER TABLE public.vault_marketplace_listings
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.marketplace_products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pro_recommendation VARCHAR(30) DEFAULT 'direct_allowed';

-- 7) Adicionar campo payout_status aos marketplace_orders
ALTER TABLE public.vault_marketplace_orders
  ADD COLUMN IF NOT EXISTS payout_status VARCHAR(30) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payout_released_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payout_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS contest_window_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS inspection_id UUID REFERENCES public.marketplace_inspections(id) ON DELETE SET NULL;

-- 8) Trigger para atualizar total_offers e lowest_price no produto
CREATE OR REPLACE FUNCTION public.update_product_offer_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update stats for the affected product
  UPDATE public.marketplace_products SET
    total_offers = (
      SELECT COUNT(*) FROM public.marketplace_offers
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) AND status = 'active'
    ),
    lowest_price = (
      SELECT MIN(price) FROM public.marketplace_offers
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) AND status = 'active'
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_update_product_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.marketplace_offers
  FOR EACH ROW EXECUTE FUNCTION public.update_product_offer_stats();

-- 9) Trigger para auto-set pro_recommendation baseado no preço
CREATE OR REPLACE FUNCTION public.set_offer_pro_recommendation()
RETURNS TRIGGER AS $$
BEGIN
  -- R$2000+ = PRO obrigatório
  IF NEW.price >= 2000 THEN
    NEW.pro_recommendation := 'pro_mandatory';
    NEW.shipping_mode := 'bravenza';
  -- Produto high risk = PRO obrigatório
  ELSIF EXISTS (SELECT 1 FROM public.marketplace_products WHERE id = NEW.product_id AND is_high_risk = true) THEN
    NEW.pro_recommendation := 'pro_mandatory';
    NEW.shipping_mode := 'bravenza';
  -- Usado acima de R$800 = PRO recomendado
  ELSIF NEW.condition != 'novo' AND NEW.price >= 800 THEN
    NEW.pro_recommendation := 'pro_recommended';
  ELSE
    NEW.pro_recommendation := 'direct_allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_set_pro_recommendation
  BEFORE INSERT OR UPDATE OF price, condition, product_id ON public.marketplace_offers
  FOR EACH ROW EXECUTE FUNCTION public.set_offer_pro_recommendation();

-- 10) Function para gerar slug único
CREATE OR REPLACE FUNCTION public.generate_product_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := lower(regexp_replace(
      unaccent(NEW.brand || '-' || NEW.model || COALESCE('-' || NEW.colorway, '')),
      '[^a-z0-9]+', '-', 'g'
    ));
    base_slug := trim(both '-' from base_slug);
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM public.marketplace_products WHERE slug = final_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_generate_slug
  BEFORE INSERT OR UPDATE OF brand, model, colorway ON public.marketplace_products
  FOR EACH ROW EXECUTE FUNCTION public.generate_product_slug();
