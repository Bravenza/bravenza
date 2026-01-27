-- =====================================================
-- TABELAS PARA ÁREA ADMINISTRATIVA
-- =====================================================

-- Tabela de Log de Atividades
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- 'order', 'payment', 'budget', 'user', 'system'
  entity_id VARCHAR(100),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity_type ON public.activity_logs(entity_type);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- RLS para activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all activity logs"
ON public.activity_logs FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can insert activity logs"
ON public.activity_logs FOR INSERT
WITH CHECK (is_admin());

-- Tabela de Fornecedores
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  country VARCHAR(100) NOT NULL,
  contact_name VARCHAR(200),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  contact_whatsapp VARCHAR(50),
  website TEXT,
  specialties TEXT[], -- ['Nike', 'Adidas', 'Jordan']
  payment_methods TEXT[], -- ['Wire Transfer', 'PayPal', 'Crypto']
  average_shipping_days INTEGER,
  rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS para suppliers
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all suppliers"
ON public.suppliers FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can insert suppliers"
ON public.suppliers FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update suppliers"
ON public.suppliers FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete suppliers"
ON public.suppliers FOR DELETE
USING (is_admin());

-- Tabela de Lembretes Programados
CREATE TABLE public.scheduled_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(50) REFERENCES public.orders(order_id) ON DELETE CASCADE,
  reminder_type VARCHAR(50) NOT NULL, -- 'payment_sinal', 'payment_balance', 'budget_approval'
  channel VARCHAR(20) NOT NULL, -- 'email', 'whatsapp', 'both'
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'cancelled', 'failed'
  attempt_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_scheduled_reminders_status ON public.scheduled_reminders(status);
CREATE INDEX idx_scheduled_reminders_scheduled_for ON public.scheduled_reminders(scheduled_for);

-- RLS para scheduled_reminders
ALTER TABLE public.scheduled_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all reminders"
ON public.scheduled_reminders FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can manage reminders"
ON public.scheduled_reminders FOR ALL
USING (is_admin());

-- =====================================================
-- TABELAS PARA ÁREA DO CLIENTE
-- =====================================================

-- Tabela de FAQs
CREATE TABLE public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL, -- 'importacao', 'pagamento', 'garantia', 'envio', 'geral'
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_faqs_category ON public.faqs(category);
CREATE INDEX idx_faqs_order_index ON public.faqs(order_index);

-- Trigger para updated_at
CREATE TRIGGER update_faqs_updated_at
BEFORE UPDATE ON public.faqs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS para faqs (público para leitura)
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active FAQs"
ON public.faqs FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage FAQs"
ON public.faqs FOR ALL
USING (is_admin());

-- Tabela de Avaliações
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(50) REFERENCES public.orders(order_id) ON DELETE CASCADE,
  client_cpf VARCHAR(14) NOT NULL,
  client_name VARCHAR(200) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  product_quality INTEGER CHECK (product_quality >= 1 AND product_quality <= 5),
  delivery_speed INTEGER CHECK (delivery_speed >= 1 AND delivery_speed <= 5),
  customer_service INTEGER CHECK (customer_service >= 1 AND customer_service <= 5),
  would_recommend BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  admin_response TEXT,
  admin_response_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviews_order_id ON public.reviews(order_id);
CREATE INDEX idx_reviews_is_approved ON public.reviews(is_approved);
CREATE INDEX idx_reviews_is_featured ON public.reviews(is_featured);
CREATE INDEX idx_reviews_rating ON public.reviews(rating);

-- RLS para reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved reviews"
ON public.reviews FOR SELECT
USING (is_approved = true);

CREATE POLICY "Admins can view all reviews"
ON public.reviews FOR SELECT
USING (is_admin());

CREATE POLICY "Service role can insert reviews"
ON public.reviews FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can update reviews"
ON public.reviews FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete reviews"
ON public.reviews FOR DELETE
USING (is_admin());

-- Tabela de Indicações (Programa de Referral)
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_cpf VARCHAR(14) NOT NULL,
  referrer_name VARCHAR(200) NOT NULL,
  referrer_email VARCHAR(255),
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  referred_cpf VARCHAR(14),
  referred_name VARCHAR(200),
  referred_order_id VARCHAR(50) REFERENCES public.orders(order_id) ON DELETE SET NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 5.00, -- 5% padrão
  discount_used BOOLEAN DEFAULT false,
  discount_used_at TIMESTAMP WITH TIME ZONE,
  discount_order_id VARCHAR(50) REFERENCES public.orders(order_id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'converted', 'rewarded', 'expired'
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '90 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_referrals_referrer_cpf ON public.referrals(referrer_cpf);
CREATE INDEX idx_referrals_referral_code ON public.referrals(referral_code);
CREATE INDEX idx_referrals_status ON public.referrals(status);

-- RLS para referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage referrals"
ON public.referrals FOR ALL
USING (false)
WITH CHECK (false);

CREATE POLICY "Admins can view all referrals"
ON public.referrals FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can manage referrals"
ON public.referrals FOR ALL
USING (is_admin());

-- Tabela de Documentos do Cliente
CREATE TABLE public.client_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(50) REFERENCES public.orders(order_id) ON DELETE CASCADE,
  client_cpf VARCHAR(14) NOT NULL,
  document_type VARCHAR(50) NOT NULL, -- 'budget', 'receipt_sinal', 'receipt_balance', 'invoice', 'tracking'
  document_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_client_documents_client_cpf ON public.client_documents(client_cpf);
CREATE INDEX idx_client_documents_order_id ON public.client_documents(order_id);
CREATE INDEX idx_client_documents_document_type ON public.client_documents(document_type);

-- RLS para client_documents
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage documents"
ON public.client_documents FOR ALL
USING (false)
WITH CHECK (false);

CREATE POLICY "Admins can view all documents"
ON public.client_documents FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can manage documents"
ON public.client_documents FOR ALL
USING (is_admin());

-- =====================================================
-- FUNÇÃO PARA GERAR CÓDIGO DE INDICAÇÃO
-- =====================================================
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS VARCHAR(20)
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code VARCHAR(20) := 'BRVZ';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN code;
END;
$$;

-- =====================================================
-- FUNÇÃO PARA OBTER DOCUMENTOS DO CLIENTE
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_client_documents(p_cpf VARCHAR)
RETURNS TABLE (
  id UUID,
  order_id VARCHAR,
  document_type VARCHAR,
  document_name VARCHAR,
  file_url TEXT,
  generated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    d.id,
    d.order_id,
    d.document_type,
    d.document_name,
    d.file_url,
    d.generated_at
  FROM public.client_documents d
  WHERE d.client_cpf = p_cpf
  ORDER BY d.generated_at DESC
$$;

-- =====================================================
-- FUNÇÃO PARA OBTER INDICAÇÕES DO CLIENTE
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_client_referrals(p_cpf VARCHAR)
RETURNS TABLE (
  id UUID,
  referral_code VARCHAR,
  referred_name VARCHAR,
  status VARCHAR,
  discount_percentage DECIMAL,
  discount_used BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    r.id,
    r.referral_code,
    r.referred_name,
    r.status,
    r.discount_percentage,
    r.discount_used,
    r.created_at
  FROM public.referrals r
  WHERE r.referrer_cpf = p_cpf
  ORDER BY r.created_at DESC
$$;