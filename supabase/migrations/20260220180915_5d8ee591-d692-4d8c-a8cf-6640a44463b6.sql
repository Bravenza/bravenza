
-- RPC for dashboard overview stats (replaces client-side count of ALL orders)
CREATE OR REPLACE FUNCTION get_admin_dashboard_overview()
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
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

-- RPC for CSV export of orders (bypasses 1000-row limit)
CREATE OR REPLACE FUNCTION get_admin_orders_csv(
  p_status TEXT DEFAULT 'all',
  p_search TEXT DEFAULT '',
  p_date_from TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(
  order_id TEXT,
  client_name TEXT,
  client_cpf TEXT,
  product_name TEXT,
  product_price NUMERIC,
  current_status TEXT,
  sla_vault_due_date TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    o.order_id::TEXT,
    o.client_name::TEXT,
    o.client_cpf::TEXT,
    o.product_name::TEXT,
    COALESCE(o.product_price, 0),
    o.current_status::TEXT,
    o.sla_vault_due_date::TEXT,
    o.created_at
  FROM public.orders o
  WHERE
    (p_status = 'all' OR o.current_status::TEXT = p_status)
    AND (p_search = '' OR o.order_id ILIKE '%' || p_search || '%' OR o.client_name ILIKE '%' || p_search || '%' OR o.product_name ILIKE '%' || p_search || '%')
    AND (p_date_from IS NULL OR o.created_at >= p_date_from)
  ORDER BY o.created_at DESC;
$$;

-- RPC for order requests with pagination
CREATE OR REPLACE FUNCTION get_admin_order_requests(
  p_search TEXT DEFAULT '',
  p_offset INT DEFAULT 0,
  p_limit INT DEFAULT 25
)
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT json_build_object(
    'total', (
      SELECT COUNT(*) FROM public.order_requests
      WHERE status != 'converted'
        AND (p_search = '' OR client_name ILIKE '%' || p_search || '%' OR client_cpf ILIKE '%' || p_search || '%' OR client_email ILIKE '%' || p_search || '%')
    ),
    'pending_count', (SELECT COUNT(*) FROM public.order_requests WHERE status = 'pending'),
    'requests', COALESCE((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT *
        FROM public.order_requests
        WHERE status != 'converted'
          AND (p_search = '' OR client_name ILIKE '%' || p_search || '%' OR client_cpf ILIKE '%' || p_search || '%' OR client_email ILIKE '%' || p_search || '%')
        ORDER BY created_at DESC
        LIMIT p_limit OFFSET p_offset
      ) t
    ), '[]'::json)
  );
$$;
