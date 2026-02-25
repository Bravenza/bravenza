
-- ============================================
-- 1. CANCELLATION WINDOW (30 min self-service)
-- ============================================
ALTER TABLE public.vault_marketplace_orders
ADD COLUMN IF NOT EXISTS cancellation_window_ends_at timestamptz;

CREATE OR REPLACE FUNCTION public.set_cancellation_window()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    NEW.cancellation_window_ends_at := now() + interval '30 minutes';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_set_cancellation_window ON public.vault_marketplace_orders;
CREATE TRIGGER trg_set_cancellation_window
BEFORE UPDATE ON public.vault_marketplace_orders
FOR EACH ROW
EXECUTE FUNCTION public.set_cancellation_window();

-- ============================================
-- 2. SELLER STRIKES (Progressive warning system)
-- ============================================
CREATE TABLE IF NOT EXISTS public.seller_strikes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.vault_seller_profiles(id) ON DELETE CASCADE,
  strike_type text NOT NULL,
  severity text NOT NULL DEFAULT 'warning',
  reason text NOT NULL,
  order_id uuid,
  issued_by uuid,
  appeal_status text DEFAULT 'none',
  appeal_message text,
  appeal_reviewed_by uuid,
  appeal_reviewed_at timestamptz,
  suspension_starts_at timestamptz,
  suspension_ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_strikes ENABLE ROW LEVEL SECURITY;

-- Helper: get seller_id for current user (vault_members uses client_cpf)
CREATE OR REPLACE FUNCTION public.get_current_seller_id()
RETURNS uuid AS $$
  SELECT sp.id
  FROM public.vault_seller_profiles sp
  JOIN public.vault_members vm ON vm.id = sp.member_id
  JOIN public.client_profiles cp ON cp.cpf = vm.client_cpf
  WHERE cp.user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE POLICY "Sellers view own strikes"
ON public.seller_strikes FOR SELECT
TO authenticated
USING (seller_id = public.get_current_seller_id() OR public.is_admin(auth.uid()));

CREATE POLICY "Sellers appeal own strikes"
ON public.seller_strikes FOR UPDATE
TO authenticated
USING (seller_id = public.get_current_seller_id())
WITH CHECK (seller_id = public.get_current_seller_id());

CREATE POLICY "Admins manage strikes"
ON public.seller_strikes FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.calculate_strike_severity(p_seller_id uuid)
RETURNS text AS $$
DECLARE
  active_count integer;
BEGIN
  SELECT count(*) INTO active_count
  FROM public.seller_strikes
  WHERE seller_id = p_seller_id AND is_active = true;
  RETURN CASE
    WHEN active_count = 0 THEN 'warning'
    WHEN active_count = 1 THEN 'suspension_7d'
    WHEN active_count >= 2 THEN 'suspension_30d'
    ELSE 'ban'
  END;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;

ALTER TABLE public.vault_seller_profiles
ADD COLUMN IF NOT EXISTS active_strikes_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS suspended_until timestamptz;

-- ============================================
-- 3. WALLET (Digital wallet)
-- ============================================
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_cpf text NOT NULL,
  type text NOT NULL,
  amount numeric(10,2) NOT NULL,
  description text NOT NULL,
  reference_type text,
  reference_id text,
  balance_after numeric(10,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own wallet"
ON public.wallet_transactions FOR SELECT
TO authenticated
USING (
  user_cpf IN (SELECT cpf FROM public.client_profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Service role manages wallet"
ON public.wallet_transactions FOR INSERT
TO service_role
WITH CHECK (true);

CREATE OR REPLACE VIEW public.wallet_balances AS
SELECT
  user_cpf,
  COALESCE(SUM(
    CASE
      WHEN type LIKE 'credit_%' THEN amount
      WHEN type LIKE 'debit_%' THEN -amount
      ELSE 0
    END
  ), 0) AS balance,
  MAX(created_at) AS last_transaction_at,
  COUNT(*) AS total_transactions
FROM public.wallet_transactions
GROUP BY user_cpf;

-- ============================================
-- 4. ENHANCED FAQ (search)
-- ============================================
ALTER TABLE public.faqs
ADD COLUMN IF NOT EXISTS persona text DEFAULT 'all',
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS idx_faqs_search ON public.faqs USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_faqs_persona ON public.faqs(persona);

CREATE OR REPLACE FUNCTION public.update_faq_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('portuguese', COALESCE(NEW.question, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.answer, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.category, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_faq_search_vector ON public.faqs;
CREATE TRIGGER trg_faq_search_vector
BEFORE INSERT OR UPDATE ON public.faqs
FOR EACH ROW
EXECUTE FUNCTION public.update_faq_search_vector();

UPDATE public.faqs SET search_vector = 
  setweight(to_tsvector('portuguese', COALESCE(question, '')), 'A') ||
  setweight(to_tsvector('portuguese', COALESCE(answer, '')), 'B') ||
  setweight(to_tsvector('portuguese', COALESCE(category, '')), 'C');

CREATE OR REPLACE FUNCTION public.search_faqs(p_query text, p_persona text DEFAULT 'all')
RETURNS TABLE(
  id uuid,
  question text,
  answer text,
  category text,
  persona text,
  rank real
) AS $$
  SELECT
    f.id,
    f.question,
    f.answer,
    f.category,
    f.persona,
    ts_rank(f.search_vector, plainto_tsquery('portuguese', p_query)) AS rank
  FROM public.faqs f
  WHERE f.is_active = true
    AND (p_persona = 'all' OR f.persona = p_persona OR f.persona = 'all')
    AND (
      p_query = '' 
      OR f.search_vector @@ plainto_tsquery('portuguese', p_query)
      OR f.question ILIKE '%' || p_query || '%'
      OR f.answer ILIKE '%' || p_query || '%'
    )
  ORDER BY rank DESC, f.order_index ASC;
$$ LANGUAGE sql STABLE SET search_path = public;
