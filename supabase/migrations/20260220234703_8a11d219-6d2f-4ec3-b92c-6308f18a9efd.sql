
-- 1. cron_execution_logs: restrict to service_role only
DROP POLICY IF EXISTS "Service role can insert cron logs" ON public.cron_execution_logs;
DROP POLICY IF EXISTS "Service role can update cron logs" ON public.cron_execution_logs;

CREATE POLICY "Service role inserts cron logs"
ON public.cron_execution_logs FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role updates cron logs"
ON public.cron_execution_logs FOR UPDATE
TO service_role
USING (true);

-- 2. marketplace_saved_searches: restrict to authenticated users owning the search
DROP POLICY IF EXISTS "Service role manages saved searches" ON public.marketplace_saved_searches;
DROP POLICY IF EXISTS "Service role updates saved searches" ON public.marketplace_saved_searches;
DROP POLICY IF EXISTS "Service role deletes saved searches" ON public.marketplace_saved_searches;

CREATE POLICY "Users can insert own saved searches"
ON public.marketplace_saved_searches FOR INSERT
TO authenticated
WITH CHECK (
  user_cpf IN (SELECT cpf FROM public.client_profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update own saved searches"
ON public.marketplace_saved_searches FOR UPDATE
TO authenticated
USING (
  user_cpf IN (SELECT cpf FROM public.client_profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can delete own saved searches"
ON public.marketplace_saved_searches FOR DELETE
TO authenticated
USING (
  user_cpf IN (SELECT cpf FROM public.client_profiles WHERE user_id = auth.uid())
);

-- 3. marketplace_seller_follows: restrict to authenticated users
DROP POLICY IF EXISTS "Users can follow sellers" ON public.marketplace_seller_follows;
DROP POLICY IF EXISTS "Users can unfollow" ON public.marketplace_seller_follows;

CREATE POLICY "Authenticated users can follow sellers"
ON public.marketplace_seller_follows FOR INSERT
TO authenticated
WITH CHECK (
  follower_cpf IN (SELECT cpf FROM public.client_profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Authenticated users can unfollow"
ON public.marketplace_seller_follows FOR DELETE
TO authenticated
USING (
  follower_cpf IN (SELECT cpf FROM public.client_profiles WHERE user_id = auth.uid())
);
