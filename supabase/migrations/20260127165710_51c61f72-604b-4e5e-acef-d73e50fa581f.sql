-- Drop and recreate get_order_by_token function to include client_cpf
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
   created_at timestamp with time zone
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
    o.created_at
  FROM public.orders o
  WHERE o.budget_approval_token = p_token
$function$;

-- Create function to get available cashback for a client
CREATE OR REPLACE FUNCTION public.get_client_available_cashback(p_cpf character varying)
RETURNS TABLE(
  total_percentage numeric,
  referral_ids uuid[]
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_total numeric := 0;
  v_ids uuid[] := '{}';
BEGIN
  -- Get all valid (non-expired, converted, not used) referrals
  SELECT 
    COALESCE(SUM(r.discount_percentage), 0),
    COALESCE(array_agg(r.id), '{}')
  INTO v_total, v_ids
  FROM public.referrals r
  WHERE r.referrer_cpf = p_cpf
    AND r.status = 'converted'
    AND r.discount_used = false
    AND (r.created_at + interval '90 days') > NOW();

  RETURN QUERY SELECT v_total, v_ids;
END;
$function$;

-- Create function to apply cashback to an order
CREATE OR REPLACE FUNCTION public.apply_cashback_to_order(
  p_cpf character varying,
  p_order_id character varying,
  p_discount_amount numeric,
  p_payment_type character varying
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_referral_id uuid;
  v_remaining_discount numeric := p_discount_amount;
  v_referral_discount numeric;
BEGIN
  -- Loop through available referrals and mark them as used
  FOR v_referral_id, v_referral_discount IN
    SELECT r.id, r.discount_percentage
    FROM public.referrals r
    WHERE r.referrer_cpf = p_cpf
      AND r.status = 'converted'
      AND r.discount_used = false
      AND (r.created_at + interval '90 days') > NOW()
    ORDER BY r.created_at ASC
  LOOP
    IF v_remaining_discount <= 0 THEN
      EXIT;
    END IF;
    
    UPDATE public.referrals
    SET 
      discount_used = true,
      discount_used_at = NOW(),
      discount_order_id = p_order_id,
      status = 'rewarded'
    WHERE id = v_referral_id;
    
    v_remaining_discount := v_remaining_discount - v_referral_discount;
  END LOOP;

  RETURN TRUE;
END;
$function$;