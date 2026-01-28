-- Drop and recreate get_order_by_token function with payment_mode
DROP FUNCTION IF EXISTS public.get_order_by_token(uuid);

CREATE FUNCTION public.get_order_by_token(p_token uuid)
 RETURNS TABLE(
   order_id character varying, 
   order_type order_type, 
   budget_status budget_status, 
   client_name character varying, 
   client_cpf character varying, 
   product_name character varying, 
   product_brand character varying, 
   product_model character varying, 
   product_size character varying, 
   product_color character varying, 
   product_price numeric, 
   product_currency character varying, 
   sinal_value numeric, 
   sinal_paid boolean, 
   balance_value numeric, 
   balance_paid boolean, 
   budget_expires_at timestamp with time zone, 
   created_at timestamp with time zone,
   payment_mode character varying
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    o.order_id,
    o.order_type,
    o.budget_status,
    o.client_name,
    o.client_cpf,
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
    o.payment_mode
  FROM public.orders o
  WHERE o.budget_approval_token = p_token
$function$;