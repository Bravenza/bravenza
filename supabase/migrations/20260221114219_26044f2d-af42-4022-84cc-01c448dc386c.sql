
-- =============================================
-- RPC: get_admin_dashboard_metrics
-- =============================================
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_metrics()
RETURNS TABLE (
  total_revenue numeric,
  pending_revenue numeric,
  sinal_received numeric,
  balance_received numeric,
  approved_budgets bigint,
  rejected_budgets bigint,
  pending_budgets bigint,
  total_budgets_sent bigint,
  sinal_paid_count bigint,
  delivered_count bigint,
  avg_time_to_approval_hours numeric,
  avg_time_to_close_days numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN o.sinal_paid THEN COALESCE(o.sinal_value, 0) ELSE 0 END)
           + SUM(CASE WHEN o.balance_paid THEN COALESCE(o.balance_value, 0) ELSE 0 END), 0) AS total_revenue,
    COALESCE(SUM(CASE WHEN NOT COALESCE(o.sinal_paid, false) THEN COALESCE(o.sinal_value, 0) ELSE 0 END)
           + SUM(CASE WHEN NOT COALESCE(o.balance_paid, false) THEN COALESCE(o.balance_value, 0) ELSE 0 END), 0) AS pending_revenue,
    COALESCE(SUM(CASE WHEN o.sinal_paid THEN COALESCE(o.sinal_value, 0) ELSE 0 END), 0) AS sinal_received,
    COALESCE(SUM(CASE WHEN o.balance_paid THEN COALESCE(o.balance_value, 0) ELSE 0 END), 0) AS balance_received,
    COUNT(*) FILTER (WHERE o.budget_status = 'approved') AS approved_budgets,
    COUNT(*) FILTER (WHERE o.budget_status = 'rejected') AS rejected_budgets,
    COUNT(*) FILTER (WHERE o.budget_status = 'pending' OR o.budget_status = 'sent') AS pending_budgets,
    COUNT(*) FILTER (WHERE o.budget_sent_at IS NOT NULL) AS total_budgets_sent,
    COUNT(*) FILTER (WHERE o.sinal_paid = true) AS sinal_paid_count,
    COUNT(*) FILTER (WHERE o.current_status = 'DELIVERED') AS delivered_count,
    COALESCE(AVG(EXTRACT(EPOCH FROM (o.budget_approved_at - o.budget_sent_at)) / 3600) FILTER (WHERE o.budget_approved_at IS NOT NULL AND o.budget_sent_at IS NOT NULL), 0) AS avg_time_to_approval_hours,
    COALESCE(AVG(EXTRACT(EPOCH FROM (o.sinal_paid_at - o.created_at)) / 86400) FILTER (WHERE o.sinal_paid_at IS NOT NULL), 0) AS avg_time_to_close_days
  FROM public.orders o;
END;
$$;

-- =============================================
-- RPC: get_admin_orders_by_month
-- =============================================
CREATE OR REPLACE FUNCTION public.get_admin_orders_by_month()
RETURNS TABLE (
  month_key text,
  pedidos bigint,
  faturamento numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(o.created_at, 'MM/YYYY') AS month_key,
    COUNT(*) AS pedidos,
    COALESCE(SUM(CASE WHEN o.sinal_paid THEN COALESCE(o.sinal_value, 0) ELSE 0 END)
           + SUM(CASE WHEN o.balance_paid THEN COALESCE(o.balance_value, 0) ELSE 0 END), 0) AS faturamento
  FROM public.orders o
  WHERE o.created_at >= NOW() - INTERVAL '6 months'
  GROUP BY TO_CHAR(o.created_at, 'MM/YYYY'), DATE_TRUNC('month', o.created_at)
  ORDER BY DATE_TRUNC('month', o.created_at) ASC;
END;
$$;

-- =============================================
-- RPC: get_admin_orders_by_status
-- =============================================
CREATE OR REPLACE FUNCTION public.get_admin_orders_by_status()
RETURNS TABLE (
  status_group text,
  count bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN o.current_status IN ('REQUEST_RECEIVED','BUDGET_SENT','DEPOSIT_CONFIRMED','ORDER_CONFIRMED') THEN 'Aguardando Pagamento'
      WHEN o.current_status IN ('SEARCH_SELECTION','PRODUCT_FOUND','PREPARING_INTERNATIONAL','SOURCING','NEGOTIATING','PURCHASE_COMPLETED') THEN 'Em Processamento'
      WHEN o.current_status IN ('INTERNATIONAL_TRANSIT','ARRIVED_BRAZIL','PRODUCT_INSPECTED','BALANCE_PENDING','FULLY_PAID','SHIPPED_TO_CLIENT','PACKAGE_EN_ROUTE','ARRIVED','INSPECTION_APPROVED','BALANCE_DUE','INTERNATIONAL_DISPATCH','CUSTOMS','NATIONAL_TRANSIT','DISPATCHED') THEN 'Em Trânsito'
      WHEN o.current_status = 'DELIVERED' THEN 'Entregue'
      ELSE 'Outros'
    END AS status_group,
    COUNT(*) AS count
  FROM public.orders o
  GROUP BY 1
  ORDER BY count DESC;
END;
$$;

-- =============================================
-- RPC: get_admin_finance_monthly
-- =============================================
CREATE OR REPLACE FUNCTION public.get_admin_finance_monthly()
RETURNS TABLE (
  month_key text,
  revenue numeric,
  costs numeric,
  profit numeric,
  margin numeric,
  orders_count bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(o.created_at, 'MM/YYYY') AS month_key,
    COALESCE(SUM(CASE WHEN o.sinal_paid THEN COALESCE(o.sinal_value, 0) ELSE 0 END)
           + SUM(CASE WHEN o.balance_paid THEN COALESCE(o.balance_value, 0) ELSE 0 END), 0) AS revenue,
    COALESCE(SUM(COALESCE(o.product_cost, 0) + COALESCE(o.shipping_cost, 0) + COALESCE(o.other_costs, 0)), 0) AS costs,
    COALESCE(SUM(CASE WHEN o.sinal_paid THEN COALESCE(o.sinal_value, 0) ELSE 0 END)
           + SUM(CASE WHEN o.balance_paid THEN COALESCE(o.balance_value, 0) ELSE 0 END), 0)
    - COALESCE(SUM(COALESCE(o.product_cost, 0) + COALESCE(o.shipping_cost, 0) + COALESCE(o.other_costs, 0)), 0) AS profit,
    CASE
      WHEN COALESCE(SUM(CASE WHEN o.sinal_paid THEN COALESCE(o.sinal_value, 0) ELSE 0 END)
                   + SUM(CASE WHEN o.balance_paid THEN COALESCE(o.balance_value, 0) ELSE 0 END), 0) > 0
      THEN (
        (COALESCE(SUM(CASE WHEN o.sinal_paid THEN COALESCE(o.sinal_value, 0) ELSE 0 END)
                + SUM(CASE WHEN o.balance_paid THEN COALESCE(o.balance_value, 0) ELSE 0 END), 0)
        - COALESCE(SUM(COALESCE(o.product_cost, 0) + COALESCE(o.shipping_cost, 0) + COALESCE(o.other_costs, 0)), 0))
        / NULLIF(COALESCE(SUM(CASE WHEN o.sinal_paid THEN COALESCE(o.sinal_value, 0) ELSE 0 END)
                        + SUM(CASE WHEN o.balance_paid THEN COALESCE(o.balance_value, 0) ELSE 0 END), 0), 0)
      ) * 100
      ELSE 0
    END AS margin,
    COUNT(*) AS orders_count
  FROM public.orders o
  WHERE o.created_at >= NOW() - INTERVAL '6 months'
  GROUP BY TO_CHAR(o.created_at, 'MM/YYYY'), DATE_TRUNC('month', o.created_at)
  ORDER BY DATE_TRUNC('month', o.created_at) ASC;
END;
$$;
