
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
    COUNT(*) FILTER (WHERE o.budget_status = 'APPROVED') AS approved_budgets,
    COUNT(*) FILTER (WHERE o.budget_status = 'REJECTED') AS rejected_budgets,
    COUNT(*) FILTER (WHERE o.budget_status = 'PENDING' OR o.budget_status = 'SENT') AS pending_budgets,
    COUNT(*) FILTER (WHERE o.budget_sent_at IS NOT NULL) AS total_budgets_sent,
    COUNT(*) FILTER (WHERE o.sinal_paid = true) AS sinal_paid_count,
    COUNT(*) FILTER (WHERE o.current_status = 'DELIVERED') AS delivered_count,
    COALESCE(AVG(EXTRACT(EPOCH FROM (o.budget_approved_at - o.budget_sent_at)) / 3600) FILTER (WHERE o.budget_approved_at IS NOT NULL AND o.budget_sent_at IS NOT NULL), 0) AS avg_time_to_approval_hours,
    COALESCE(AVG(EXTRACT(EPOCH FROM (o.sinal_paid_at - o.created_at)) / 86400) FILTER (WHERE o.sinal_paid_at IS NOT NULL), 0) AS avg_time_to_close_days
  FROM public.orders o;
END;
$$;
