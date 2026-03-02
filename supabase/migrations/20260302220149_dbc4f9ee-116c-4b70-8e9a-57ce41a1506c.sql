
-- Fix 1: Restrict order_requests INSERT to authenticated users only
DROP POLICY IF EXISTS "Anyone can submit order requests" ON public.order_requests;
CREATE POLICY "Authenticated users can submit order requests"
ON public.order_requests FOR INSERT
TO authenticated
WITH CHECK (true);

-- Fix 2: Fix search_path on admin functions (set to 'public' instead of '')
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_overview()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'total', (SELECT COUNT(*) FROM public.orders),
    'pending', (SELECT COUNT(*) FROM public.orders WHERE current_status != 'DELIVERED'),
    'delivered', (SELECT COUNT(*) FROM public.orders WHERE current_status = 'DELIVERED'),
    'near_deadline', (
      SELECT COUNT(*) FROM public.orders
      WHERE sla_vault_due_date IS NOT NULL
        AND current_status != 'DELIVERED'
        AND sla_vault_due_date::date <= (CURRENT_DATE + INTERVAL '3 days')
        AND sla_vault_due_date::date >= CURRENT_DATE
    ),
    'pending_requests', (SELECT COUNT(*) FROM public.order_requests WHERE status = 'pending'),
    'overdue_orders', COALESCE((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT order_id, current_status, client_name, product_name, created_at, sla_vault_due_date
        FROM public.orders
        WHERE sla_vault_due_date IS NOT NULL
          AND current_status != 'DELIVERED'
          AND sla_vault_due_date::date < CURRENT_DATE
        ORDER BY sla_vault_due_date ASC
        LIMIT 5
      ) t
    ), '[]'::json),
    'recent_orders', COALESCE((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT order_id, current_status, client_name, product_name, created_at, sla_vault_due_date
        FROM public.orders
        ORDER BY created_at DESC
        LIMIT 5
      ) t
    ), '[]'::json)
  );
$$;

CREATE OR REPLACE FUNCTION public.get_admin_orders_csv()
RETURNS TABLE(
  order_id text, current_status text, client_name text, client_cpf text,
  product_name text, product_price numeric, created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT order_id, current_status::text, client_name, client_cpf,
    product_name, product_price, created_at
  FROM public.orders
  ORDER BY created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_order_requests()
RETURNS TABLE(
  id uuid, status text, client_name text, client_cpf text,
  client_email text, client_phone text, product_brand text,
  product_model text, product_color text, shoe_size text,
  product_link text, reference_image_url text, additional_notes text,
  address_street text, address_number text, address_complement text,
  address_neighborhood text, address_city text, address_state text,
  address_cep text, admin_notes text, created_at timestamptz,
  reviewed_at timestamptz, reviewed_by uuid, converted_order_id text,
  referral_code text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, status, client_name, client_cpf, client_email, client_phone,
    product_brand, product_model, product_color, shoe_size, product_link,
    reference_image_url, additional_notes, address_street, address_number,
    address_complement, address_neighborhood, address_city, address_state,
    address_cep, admin_notes, created_at, reviewed_at, reviewed_by,
    converted_order_id, referral_code
  FROM public.order_requests
  ORDER BY created_at DESC;
$$;
