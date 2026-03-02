
-- =============================================
-- ETAPA 1: Tabelas v2 (aditivas, sem quebrar nada)
-- =============================================

-- 1) favorite_lists
CREATE TABLE IF NOT EXISTS public.favorite_lists (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL,
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.favorite_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_only_favorite_lists"
ON public.favorite_lists
FOR ALL TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE INDEX idx_favorite_lists_owner_id ON public.favorite_lists(owner_id);

-- 2) favorite_list_items
CREATE TABLE IF NOT EXISTS public.favorite_list_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id uuid NOT NULL REFERENCES public.favorite_lists(id) ON DELETE CASCADE,
    listing_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT unique_list_item UNIQUE (list_id, listing_id)
);

ALTER TABLE public.favorite_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_only_favorite_list_items"
ON public.favorite_list_items
FOR ALL TO authenticated
USING (list_id IN (SELECT id FROM public.favorite_lists WHERE owner_id = auth.uid()))
WITH CHECK (list_id IN (SELECT id FROM public.favorite_lists WHERE owner_id = auth.uid()));

CREATE INDEX idx_favorite_list_items_list_id ON public.favorite_list_items(list_id);
CREATE INDEX idx_favorite_list_items_listing_id ON public.favorite_list_items(listing_id);

-- 3) closet_items (nova tabela v2, não conflita com nada existente)
CREATE TABLE IF NOT EXISTS public.closet_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL,
    product_id uuid NOT NULL,
    size text,
    condition text,
    buy_price numeric NULL,
    buy_date date NULL,
    acquired_from text NOT NULL DEFAULT 'manual',
    market_value_current numeric NULL,
    market_value_last_update_at timestamptz NULL,
    source_order_id uuid NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.closet_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_only_closet_items"
ON public.closet_items
FOR ALL TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE INDEX idx_closet_items_owner_id ON public.closet_items(owner_id);
CREATE INDEX idx_closet_items_product_id ON public.closet_items(product_id);

-- 4) alerts (v2, separada da marketplace_watchlist existente)
CREATE TABLE IF NOT EXISTS public.alerts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL,
    product_id uuid NOT NULL,
    target_price numeric NULL,
    target_size text NULL,
    channels text NOT NULL DEFAULT 'push',
    is_active boolean NOT NULL DEFAULT true,
    cooldown_until timestamptz NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_only_alerts"
ON public.alerts
FOR ALL TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE INDEX idx_alerts_owner_id ON public.alerts(owner_id);
CREATE INDEX idx_alerts_product_id ON public.alerts(product_id);
CREATE INDEX idx_alerts_is_active ON public.alerts(is_active);
