
-- ============================================================
-- RPC: get_admin_finance_kpis
-- Returns aggregated KPIs for FinancePage given a date range and optional status filter
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_admin_finance_kpis(
  p_start timestamptz,
  p_end timestamptz,
  p_fee_pix numeric DEFAULT 0.0099,
  p_fee_card numeric DEFAULT 0.0499
)
RETURNS TABLE(
  total_revenue numeric,
  total_costs numeric,
  total_payment_fees numeric,
  gross_profit numeric,
  profit_margin numeric,
  average_ticket numeric,
  total_orders bigint,
  paid_orders bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH base AS (
    SELECT
      o.order_id,
      COALESCE(o.product_price, 0) AS price,
      COALESCE(o.product_cost, 0) AS product_cost,
      COALESCE(o.shipping_cost, 0) AS shipping_cost,
      COALESCE(o.other_costs, 0) AS other_costs,
      o.sinal_paid,
      o.balance_paid,
      COALESCE(o.sinal_value, 0) AS sinal_value,
      COALESCE(o.balance_value, 0) AS balance_value,
      o.sinal_payment_method,
      o.balance_payment_method
    FROM orders o
    WHERE o.created_at >= p_start AND o.created_at <= p_end
  ),
  with_fees AS (
    SELECT
      b.*,
      CASE WHEN b.sinal_paid THEN
        b.sinal_value * CASE WHEN b.sinal_payment_method = 'PIX' THEN p_fee_pix ELSE p_fee_card END
      ELSE 0 END
      +
      CASE WHEN b.balance_paid THEN
        b.balance_value * CASE WHEN b.balance_payment_method = 'PIX' THEN p_fee_pix ELSE p_fee_card END
      ELSE 0 END AS payment_fee,
      COALESCE((SELECT SUM(oc.amount) FROM order_costs oc WHERE oc.order_id = b.order_id), 0) AS additional_costs
    FROM base b
  ),
  agg AS (
    SELECT
      SUM(CASE WHEN sinal_paid OR balance_paid THEN price ELSE 0 END) AS rev,
      SUM(product_cost + shipping_cost + other_costs + additional_costs) AS costs,
      SUM(payment_fee) AS fees,
      COUNT(*) AS total,
      SUM(CASE WHEN sinal_paid OR balance_paid THEN 1 ELSE 0 END) AS paid
    FROM with_fees
  )
  SELECT
    COALESCE(a.rev, 0)::numeric,
    COALESCE(a.costs, 0)::numeric,
    COALESCE(a.fees, 0)::numeric,
    COALESCE(a.rev - a.costs - a.fees, 0)::numeric,
    CASE WHEN a.rev > 0 THEN ((a.rev - a.costs - a.fees) / a.rev * 100) ELSE 0 END::numeric,
    CASE WHEN a.paid > 0 THEN (a.rev / a.paid) ELSE 0 END::numeric,
    a.total,
    a.paid
  FROM agg a;
END;
$$;

-- ============================================================
-- RPC: get_admin_finance_chart
-- Returns monthly revenue/costs/profit for charts
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_admin_finance_chart(
  p_start timestamptz,
  p_end timestamptz,
  p_fee_pix numeric DEFAULT 0.0099,
  p_fee_card numeric DEFAULT 0.0499
)
RETURNS TABLE(
  month text,
  revenue numeric,
  costs numeric,
  profit numeric
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH base AS (
    SELECT
      to_char(o.created_at, 'YYYY-MM') AS m,
      COALESCE(o.product_price, 0) AS price,
      COALESCE(o.product_cost, 0) + COALESCE(o.shipping_cost, 0) + COALESCE(o.other_costs, 0) AS direct_costs,
      o.sinal_paid, o.balance_paid,
      COALESCE(o.sinal_value, 0) AS sv, COALESCE(o.balance_value, 0) AS bv,
      o.sinal_payment_method AS spm, o.balance_payment_method AS bpm,
      o.order_id
    FROM orders o
    WHERE o.created_at >= p_start AND o.created_at <= p_end
  ),
  with_extra AS (
    SELECT
      b.*,
      CASE WHEN b.sinal_paid THEN b.sv * CASE WHEN b.spm = 'PIX' THEN p_fee_pix ELSE p_fee_card END ELSE 0 END
      + CASE WHEN b.balance_paid THEN b.bv * CASE WHEN b.bpm = 'PIX' THEN p_fee_pix ELSE p_fee_card END ELSE 0 END AS fee,
      COALESCE((SELECT SUM(oc.amount) FROM order_costs oc WHERE oc.order_id = b.order_id), 0) AS add_costs
    FROM base b
  )
  SELECT
    w.m,
    SUM(CASE WHEN w.sinal_paid OR w.balance_paid THEN w.price ELSE 0 END)::numeric,
    SUM(w.direct_costs + w.add_costs + w.fee)::numeric,
    (SUM(CASE WHEN w.sinal_paid OR w.balance_paid THEN w.price ELSE 0 END) - SUM(w.direct_costs + w.add_costs + w.fee))::numeric
  FROM with_extra w
  GROUP BY w.m
  ORDER BY w.m;
END;
$$;

-- ============================================================
-- RPC: get_admin_finance_cost_breakdown
-- Returns cost breakdown by category
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_admin_finance_cost_breakdown(
  p_start timestamptz,
  p_end timestamptz,
  p_fee_pix numeric DEFAULT 0.0099,
  p_fee_card numeric DEFAULT 0.0499
)
RETURNS TABLE(
  category text,
  total numeric
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH base AS (
    SELECT
      COALESCE(o.product_cost, 0) AS pc,
      COALESCE(o.shipping_cost, 0) AS sc,
      COALESCE(o.other_costs, 0) AS oc_val,
      CASE WHEN o.sinal_paid THEN COALESCE(o.sinal_value,0) * CASE WHEN o.sinal_payment_method='PIX' THEN p_fee_pix ELSE p_fee_card END ELSE 0 END
      + CASE WHEN o.balance_paid THEN COALESCE(o.balance_value,0) * CASE WHEN o.balance_payment_method='PIX' THEN p_fee_pix ELSE p_fee_card END ELSE 0 END AS pf,
      o.order_id
    FROM orders o
    WHERE o.created_at >= p_start AND o.created_at <= p_end
  )
  SELECT 'Custo do Produto'::text, SUM(pc)::numeric FROM base WHERE pc > 0
  UNION ALL
  SELECT 'Frete Nacional'::text, SUM(sc)::numeric FROM base WHERE sc > 0
  UNION ALL
  SELECT 'Taxas de Pagamento'::text, SUM(pf)::numeric FROM base WHERE pf > 0
  UNION ALL
  SELECT 'Outros Custos'::text, (SUM(oc_val) + COALESCE((SELECT SUM(c.amount) FROM order_costs c INNER JOIN base b2 ON b2.order_id = c.order_id), 0))::numeric FROM base WHERE oc_val > 0 OR EXISTS (SELECT 1 FROM order_costs c2 WHERE c2.order_id = base.order_id);
END;
$$;

-- Fix: simpler cost breakdown
DROP FUNCTION IF EXISTS public.get_admin_finance_cost_breakdown(timestamptz, timestamptz, numeric, numeric);

CREATE OR REPLACE FUNCTION public.get_admin_finance_cost_breakdown(
  p_start timestamptz,
  p_end timestamptz,
  p_fee_pix numeric DEFAULT 0.0099,
  p_fee_card numeric DEFAULT 0.0499
)
RETURNS TABLE(category text, total numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_product numeric;
  v_shipping numeric;
  v_payment_fees numeric;
  v_other numeric;
BEGIN
  SELECT
    COALESCE(SUM(COALESCE(o.product_cost, 0)), 0),
    COALESCE(SUM(COALESCE(o.shipping_cost, 0)), 0),
    COALESCE(SUM(
      CASE WHEN o.sinal_paid THEN COALESCE(o.sinal_value,0) * CASE WHEN o.sinal_payment_method='PIX' THEN p_fee_pix ELSE p_fee_card END ELSE 0 END
      + CASE WHEN o.balance_paid THEN COALESCE(o.balance_value,0) * CASE WHEN o.balance_payment_method='PIX' THEN p_fee_pix ELSE p_fee_card END ELSE 0 END
    ), 0),
    COALESCE(SUM(COALESCE(o.other_costs, 0)), 0)
  INTO v_product, v_shipping, v_payment_fees, v_other
  FROM orders o
  WHERE o.created_at >= p_start AND o.created_at <= p_end;

  -- Add order_costs additional
  v_other := v_other + COALESCE((
    SELECT SUM(oc.amount) FROM order_costs oc
    INNER JOIN orders o2 ON o2.order_id = oc.order_id
    WHERE o2.created_at >= p_start AND o2.created_at <= p_end
  ), 0);

  IF v_product > 0 THEN
    category := 'Custo do Produto'; total := v_product; RETURN NEXT;
  END IF;
  IF v_shipping > 0 THEN
    category := 'Frete Nacional'; total := v_shipping; RETURN NEXT;
  END IF;
  IF v_payment_fees > 0 THEN
    category := 'Taxas de Pagamento'; total := v_payment_fees; RETURN NEXT;
  END IF;
  IF v_other > 0 THEN
    category := 'Outros Custos'; total := v_other; RETURN NEXT;
  END IF;
END;
$$;

-- ============================================================
-- RPC: get_admin_finance_orders  
-- Returns per-order financial detail with all costs pre-calculated (paginated)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_admin_finance_orders(
  p_start timestamptz,
  p_end timestamptz,
  p_status text DEFAULT 'all',
  p_fee_pix numeric DEFAULT 0.0099,
  p_fee_card numeric DEFAULT 0.0499
)
RETURNS TABLE(
  order_id varchar,
  client_name varchar,
  product_name varchar,
  current_status text,
  revenue numeric,
  product_cost numeric,
  shipping_cost numeric,
  payment_fees numeric,
  other_costs numeric,
  profit numeric,
  margin numeric,
  created_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.order_id,
    o.client_name,
    o.product_name,
    o.current_status::text,
    COALESCE(o.product_price, 0)::numeric AS revenue,
    COALESCE(o.product_cost, 0)::numeric,
    COALESCE(o.shipping_cost, 0)::numeric,
    (
      CASE WHEN o.sinal_paid THEN COALESCE(o.sinal_value,0) * CASE WHEN o.sinal_payment_method='PIX' THEN p_fee_pix ELSE p_fee_card END ELSE 0 END
      + CASE WHEN o.balance_paid THEN COALESCE(o.balance_value,0) * CASE WHEN o.balance_payment_method='PIX' THEN p_fee_pix ELSE p_fee_card END ELSE 0 END
    )::numeric,
    (COALESCE(o.other_costs, 0) + COALESCE((SELECT SUM(oc.amount) FROM order_costs oc WHERE oc.order_id = o.order_id), 0))::numeric,
    (
      COALESCE(o.product_price, 0)
      - COALESCE(o.product_cost, 0) - COALESCE(o.shipping_cost, 0) - COALESCE(o.other_costs, 0)
      - COALESCE((SELECT SUM(oc.amount) FROM order_costs oc WHERE oc.order_id = o.order_id), 0)
      - CASE WHEN o.sinal_paid THEN COALESCE(o.sinal_value,0) * CASE WHEN o.sinal_payment_method='PIX' THEN p_fee_pix ELSE p_fee_card END ELSE 0 END
      - CASE WHEN o.balance_paid THEN COALESCE(o.balance_value,0) * CASE WHEN o.balance_payment_method='PIX' THEN p_fee_pix ELSE p_fee_card END ELSE 0 END
    )::numeric,
    CASE WHEN COALESCE(o.product_price, 0) > 0 THEN
      ((COALESCE(o.product_price, 0)
        - COALESCE(o.product_cost, 0) - COALESCE(o.shipping_cost, 0) - COALESCE(o.other_costs, 0)
        - COALESCE((SELECT SUM(oc.amount) FROM order_costs oc WHERE oc.order_id = o.order_id), 0)
        - CASE WHEN o.sinal_paid THEN COALESCE(o.sinal_value,0) * CASE WHEN o.sinal_payment_method='PIX' THEN p_fee_pix ELSE p_fee_card END ELSE 0 END
        - CASE WHEN o.balance_paid THEN COALESCE(o.balance_value,0) * CASE WHEN o.balance_payment_method='PIX' THEN p_fee_pix ELSE p_fee_card END ELSE 0 END
      ) / COALESCE(o.product_price, 1) * 100)
    ELSE 0 END::numeric,
    o.created_at
  FROM orders o
  WHERE o.created_at >= p_start AND o.created_at <= p_end
    AND (p_status = 'all'
      OR (p_status = 'paid' AND (o.sinal_paid = true AND o.balance_paid = true))
      OR (p_status = 'pending' AND (o.sinal_paid = false OR o.balance_paid = false))
      OR (p_status = 'delivered' AND o.current_status = 'DELIVERED'))
  ORDER BY o.created_at DESC;
END;
$$;

-- ============================================================
-- RPC: get_admin_report_pdf_data
-- Returns all data needed for ReportPDFGenerator in one call
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_admin_report_pdf_data(
  p_month_start timestamptz,
  p_month_end timestamptz,
  p_last_month_start timestamptz,
  p_last_month_end timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_result jsonb;
  v_revenue numeric := 0;
  v_costs numeric := 0;
  v_last_revenue numeric := 0;
  v_order_count bigint := 0;
  v_last_order_count bigint := 0;
  v_paid_count bigint := 0;
  v_requests_total bigint := 0;
  v_requests_pending bigint := 0;
  v_members_count bigint := 0;
  v_orders jsonb;
  v_status_dist jsonb;
BEGIN
  -- Current month aggregates
  SELECT
    COALESCE(SUM(CASE WHEN sinal_paid OR balance_paid THEN COALESCE(product_price, 0) ELSE 0 END), 0),
    COALESCE(SUM(COALESCE(product_cost, 0) + COALESCE(shipping_cost, 0) + COALESCE(other_costs, 0)), 0),
    COUNT(*),
    SUM(CASE WHEN sinal_paid OR balance_paid THEN 1 ELSE 0 END)
  INTO v_revenue, v_costs, v_order_count, v_paid_count
  FROM orders
  WHERE created_at >= p_month_start AND created_at <= p_month_end;

  -- Last month revenue
  SELECT
    COALESCE(SUM(CASE WHEN sinal_paid OR balance_paid THEN COALESCE(product_price, 0) ELSE 0 END), 0),
    COUNT(*)
  INTO v_last_revenue, v_last_order_count
  FROM orders
  WHERE created_at >= p_last_month_start AND created_at <= p_last_month_end;

  -- Requests
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'pending')
  INTO v_requests_total, v_requests_pending
  FROM order_requests
  WHERE created_at >= p_month_start AND created_at <= p_month_end;

  -- Vault members
  SELECT COUNT(*) INTO v_members_count FROM vault_members WHERE is_active = true;

  -- Top 20 orders for table
  SELECT COALESCE(jsonb_agg(row_to_json(sub)), '[]'::jsonb)
  INTO v_orders
  FROM (
    SELECT order_id, client_name, product_name, current_status::text,
      COALESCE(product_price, 0) AS product_price, created_at
    FROM orders
    WHERE created_at >= p_month_start AND created_at <= p_month_end
    ORDER BY created_at DESC
    LIMIT 20
  ) sub;

  -- Status distribution
  SELECT COALESCE(jsonb_object_agg(status, cnt), '{}'::jsonb)
  INTO v_status_dist
  FROM (
    SELECT current_status::text AS status, COUNT(*) AS cnt
    FROM orders
    WHERE created_at >= p_month_start AND created_at <= p_month_end
    GROUP BY current_status
  ) sub;

  v_result := jsonb_build_object(
    'revenue', v_revenue,
    'costs', v_costs,
    'profit', v_revenue - v_costs,
    'margin', CASE WHEN v_revenue > 0 THEN ((v_revenue - v_costs) / v_revenue * 100) ELSE 0 END,
    'paid_count', v_paid_count,
    'avg_ticket', CASE WHEN v_paid_count > 0 THEN v_revenue / v_paid_count ELSE 0 END,
    'order_count', v_order_count,
    'last_order_count', v_last_order_count,
    'last_revenue', v_last_revenue,
    'revenue_change', CASE WHEN v_last_revenue > 0 THEN ((v_revenue - v_last_revenue) / v_last_revenue * 100) ELSE 0 END,
    'requests_total', v_requests_total,
    'requests_pending', v_requests_pending,
    'members_count', v_members_count,
    'orders', v_orders,
    'status_distribution', v_status_dist
  );

  RETURN v_result;
END;
$$;
