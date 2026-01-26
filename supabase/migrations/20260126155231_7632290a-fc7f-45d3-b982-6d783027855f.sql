-- Create enum for budget status
CREATE TYPE public.budget_status AS ENUM (
  'PENDING',           -- Aguardando orçamento
  'SENT',              -- Orçamento enviado ao cliente
  'APPROVED',          -- Cliente aprovou
  'REJECTED',          -- Cliente recusou
  'EXPIRED'            -- Orçamento expirou
);

-- Create enum for payment method
CREATE TYPE public.payment_method AS ENUM (
  'PIX',
  'CREDIT_CARD'
);

-- Add new columns to orders table for budget workflow
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS budget_status public.budget_status DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS budget_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS budget_approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS budget_rejected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS budget_rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS budget_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS budget_approval_token UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS sinal_payment_method public.payment_method,
ADD COLUMN IF NOT EXISTS sinal_paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sinal_pix_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS sinal_stripe_payment_id TEXT,
ADD COLUMN IF NOT EXISTS balance_payment_method public.payment_method,
ADD COLUMN IF NOT EXISTS balance_paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS balance_pix_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS balance_stripe_payment_id TEXT,
ADD COLUMN IF NOT EXISTS pix_qr_code TEXT,
ADD COLUMN IF NOT EXISTS pix_copy_paste TEXT;

-- Create index for quick lookup by approval token
CREATE INDEX IF NOT EXISTS idx_orders_budget_approval_token ON public.orders(budget_approval_token);

-- Create a function to get order by approval token (for public access)
CREATE OR REPLACE FUNCTION public.get_order_by_token(p_token UUID)
RETURNS TABLE (
  order_id VARCHAR,
  order_type public.order_type,
  budget_status public.budget_status,
  client_name VARCHAR,
  product_name VARCHAR,
  product_brand VARCHAR,
  product_model VARCHAR,
  product_size VARCHAR,
  product_color VARCHAR,
  product_price NUMERIC,
  product_currency VARCHAR,
  sinal_value NUMERIC,
  sinal_paid BOOLEAN,
  balance_value NUMERIC,
  balance_paid BOOLEAN,
  budget_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    o.order_id,
    o.order_type,
    o.budget_status,
    o.client_name,
    o.product_name,
    o.product_brand,
    o.product_model,
    o.product_size,
    o.product_color,
    o.product_price,
    o.product_currency,
    o.sinal_value,
    o.sinal_paid,
    o.balance_value,
    o.balance_paid,
    o.budget_expires_at,
    o.created_at
  FROM public.orders o
  WHERE o.budget_approval_token = p_token
$$;

-- Create a function to approve budget (for public access)
CREATE OR REPLACE FUNCTION public.approve_budget(p_token UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id VARCHAR;
  v_budget_status public.budget_status;
  v_budget_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get order details
  SELECT order_id, budget_status, budget_expires_at
  INTO v_order_id, v_budget_status, v_budget_expires_at
  FROM public.orders
  WHERE budget_approval_token = p_token;
  
  -- Check if order exists
  IF v_order_id IS NULL THEN
    RAISE EXCEPTION 'Pedido não encontrado';
  END IF;
  
  -- Check if budget was already approved or rejected
  IF v_budget_status = 'APPROVED' THEN
    RAISE EXCEPTION 'Orçamento já foi aprovado';
  END IF;
  
  IF v_budget_status = 'REJECTED' THEN
    RAISE EXCEPTION 'Orçamento foi recusado';
  END IF;
  
  -- Check if budget is expired
  IF v_budget_expires_at IS NOT NULL AND v_budget_expires_at < NOW() THEN
    UPDATE public.orders SET budget_status = 'EXPIRED' WHERE budget_approval_token = p_token;
    RAISE EXCEPTION 'Orçamento expirado';
  END IF;
  
  -- Approve the budget
  UPDATE public.orders
  SET 
    budget_status = 'APPROVED',
    budget_approved_at = NOW()
  WHERE budget_approval_token = p_token;
  
  -- Add to order history
  INSERT INTO public.order_history (order_id, status, notes)
  VALUES (v_order_id, 'ORDER_CONFIRMED', 'Cliente aprovou o orçamento');
  
  RETURN TRUE;
END;
$$;

-- Create a function to reject budget (for public access)
CREATE OR REPLACE FUNCTION public.reject_budget(p_token UUID, p_reason TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id VARCHAR;
  v_budget_status public.budget_status;
BEGIN
  -- Get order details
  SELECT order_id, budget_status
  INTO v_order_id, v_budget_status
  FROM public.orders
  WHERE budget_approval_token = p_token;
  
  -- Check if order exists
  IF v_order_id IS NULL THEN
    RAISE EXCEPTION 'Pedido não encontrado';
  END IF;
  
  -- Check if budget was already approved or rejected
  IF v_budget_status = 'APPROVED' THEN
    RAISE EXCEPTION 'Orçamento já foi aprovado';
  END IF;
  
  IF v_budget_status = 'REJECTED' THEN
    RAISE EXCEPTION 'Orçamento já foi recusado';
  END IF;
  
  -- Reject the budget
  UPDATE public.orders
  SET 
    budget_status = 'REJECTED',
    budget_rejected_at = NOW(),
    budget_rejection_reason = p_reason
  WHERE budget_approval_token = p_token;
  
  -- Add to order history
  INSERT INTO public.order_history (order_id, status, notes)
  VALUES (v_order_id, 'ORDER_CONFIRMED', 'Cliente recusou o orçamento: ' || COALESCE(p_reason, 'Sem motivo informado'));
  
  RETURN TRUE;
END;
$$;