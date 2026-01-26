-- Create table for client authentication tokens (magic link style)
CREATE TABLE public.client_auth_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cpf VARCHAR NOT NULL,
  token VARCHAR NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for token lookup
CREATE INDEX idx_client_auth_tokens_token ON public.client_auth_tokens(token);
CREATE INDEX idx_client_auth_tokens_cpf ON public.client_auth_tokens(cpf);

-- Enable RLS
ALTER TABLE public.client_auth_tokens ENABLE ROW LEVEL SECURITY;

-- Only allow service role to manage tokens (via edge functions)
CREATE POLICY "Service role can manage tokens"
ON public.client_auth_tokens
FOR ALL
USING (false)
WITH CHECK (false);

-- Create table for client sessions
CREATE TABLE public.client_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cpf VARCHAR NOT NULL,
  session_token VARCHAR NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for session lookup
CREATE INDEX idx_client_sessions_token ON public.client_sessions(session_token);

-- Enable RLS
ALTER TABLE public.client_sessions ENABLE ROW LEVEL SECURITY;

-- Only allow service role to manage sessions (via edge functions)
CREATE POLICY "Service role can manage sessions"
ON public.client_sessions
FOR ALL
USING (false)
WITH CHECK (false);

-- Create function to get client orders by CPF (for client portal)
CREATE OR REPLACE FUNCTION public.get_client_orders(p_cpf VARCHAR)
RETURNS TABLE (
  order_id VARCHAR,
  order_type order_type,
  current_status order_status,
  product_name VARCHAR,
  product_brand VARCHAR,
  product_model VARCHAR,
  product_size VARCHAR,
  product_price NUMERIC,
  sinal_value NUMERIC,
  sinal_paid BOOLEAN,
  balance_value NUMERIC,
  balance_paid BOOLEAN,
  budget_status budget_status,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    o.order_id,
    o.order_type,
    o.current_status,
    o.product_name,
    o.product_brand,
    o.product_model,
    o.product_size,
    o.product_price,
    o.sinal_value,
    o.sinal_paid,
    o.balance_value,
    o.balance_paid,
    o.budget_status,
    o.created_at,
    o.updated_at
  FROM public.orders o
  WHERE o.client_cpf = p_cpf
  ORDER BY o.created_at DESC
$$;