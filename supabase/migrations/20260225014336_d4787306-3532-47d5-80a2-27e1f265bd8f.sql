
-- Fix wallet_balances view security: use SECURITY INVOKER (default, safer)
DROP VIEW IF EXISTS public.wallet_balances;
CREATE VIEW public.wallet_balances WITH (security_invoker = true) AS
SELECT
  user_cpf,
  COALESCE(SUM(
    CASE
      WHEN type LIKE 'credit_%' THEN amount
      WHEN type LIKE 'debit_%' THEN -amount
      ELSE 0
    END
  ), 0) AS balance,
  MAX(created_at) AS last_transaction_at,
  COUNT(*) AS total_transactions
FROM public.wallet_transactions
GROUP BY user_cpf;
