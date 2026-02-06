-- Add contract acceptance tracking to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS contract_accepted_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS contract_accepted_ip TEXT DEFAULT NULL;

-- Update get_order_by_token to include client_address
CREATE OR REPLACE FUNCTION public.get_order_by_token(p_token TEXT)
RETURNS TABLE (
  order_id TEXT,
  order_type public.order_type,
  budget_status public.budget_status,
  client_name TEXT,
  client_cpf TEXT,
  client_address TEXT,
  product_name TEXT,
  product_brand TEXT,
  product_model TEXT,
  product_size TEXT,
  product_color TEXT,
  product_price NUMERIC,
  product_currency TEXT,
  sinal_value NUMERIC,
  sinal_paid BOOLEAN,
  balance_value NUMERIC,
  balance_paid BOOLEAN,
  budget_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  payment_mode TEXT,
  contract_accepted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.order_id,
    o.order_type,
    o.budget_status,
    o.client_name,
    o.client_cpf,
    o.client_address,
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
    o.created_at,
    o.payment_mode,
    o.contract_accepted_at
  FROM orders o
  WHERE o.budget_approval_token = p_token;
END;
$$;