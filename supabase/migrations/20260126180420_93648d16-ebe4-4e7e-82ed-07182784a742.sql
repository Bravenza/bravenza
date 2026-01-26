-- Drop and recreate the track_order function with budget information
DROP FUNCTION IF EXISTS public.track_order(character varying, character varying);

CREATE FUNCTION public.track_order(p_order_id character varying, p_cpf character varying)
 RETURNS TABLE(
   order_id character varying, 
   order_type order_type, 
   current_status order_status, 
   client_name character varying, 
   product_name character varying, 
   product_reference character varying, 
   sla_vault_due_date date, 
   balance_due_date timestamp with time zone, 
   international_tracking character varying, 
   national_tracking character varying, 
   national_carrier character varying, 
   created_at timestamp with time zone,
   budget_status budget_status,
   budget_approval_token uuid,
   sinal_paid boolean,
   sinal_value numeric,
   balance_paid boolean,
   balance_value numeric,
   product_price numeric,
   product_currency character varying
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    o.order_id,
    o.order_type,
    o.current_status,
    o.client_name,
    o.product_name,
    o.product_reference,
    o.sla_vault_due_date,
    o.balance_due_date,
    o.international_tracking,
    o.national_tracking,
    o.national_carrier,
    o.created_at,
    o.budget_status,
    o.budget_approval_token,
    o.sinal_paid,
    o.sinal_value,
    o.balance_paid,
    o.balance_value,
    o.product_price,
    o.product_currency
  FROM public.orders o
  WHERE o.order_id = p_order_id
    AND o.client_cpf = p_cpf
$function$;