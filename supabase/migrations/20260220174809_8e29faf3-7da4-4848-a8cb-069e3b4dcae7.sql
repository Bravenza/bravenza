
-- RPC 5: Client Heatmap by State (fixed - no set-returning in CASE)
CREATE OR REPLACE FUNCTION public.get_admin_client_heatmap()
RETURNS TABLE (
  state_code TEXT,
  client_count BIGINT,
  revenue NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH state_from_requests AS (
    SELECT DISTINCT
      UPPER(TRIM(address_state)) AS st,
      client_cpf
    FROM public.order_requests
    WHERE address_state IS NOT NULL AND TRIM(address_state) != ''
  ),
  state_from_orders AS (
    SELECT
      UPPER(TRIM(regexp_replace(client_address, '.*\y([A-Za-z]{2})\s*$', '\1'))) AS st,
      client_cpf,
      CASE WHEN COALESCE(sinal_paid, false) OR COALESCE(balance_paid, false)
        THEN COALESCE(product_price, 0) ELSE 0 END AS rev
    FROM public.orders
    WHERE client_address IS NOT NULL
      AND client_address ~ '\y[A-Za-z]{2}\s*$'
  ),
  valid_states AS (
    SELECT unnest(ARRAY[
      'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
      'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
    ]) AS code
  ),
  combined AS (
    SELECT st, client_cpf, 0::NUMERIC AS rev FROM state_from_requests
    WHERE st IN (SELECT code FROM valid_states)
    UNION ALL
    SELECT st, client_cpf, rev FROM state_from_orders
    WHERE st IN (SELECT code FROM valid_states)
  )
  SELECT
    c.st AS state_code,
    COUNT(DISTINCT c.client_cpf) AS client_count,
    COALESCE(SUM(c.rev), 0) AS revenue
  FROM combined c
  GROUP BY c.st
  ORDER BY client_count DESC;
END;
$$;
