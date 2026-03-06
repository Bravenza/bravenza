-- Fix: abandoned_carts "Service role full access" should be scoped to service_role, not public
DROP POLICY IF EXISTS "Service role full access on abandoned_carts" ON public.abandoned_carts;
CREATE POLICY "Service role full access on abandoned_carts"
  ON public.abandoned_carts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fix: push_subscriptions "Service role full access" should be scoped to service_role, not public
DROP POLICY IF EXISTS "Service role full access on push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "Service role full access on push_subscriptions"
  ON public.push_subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);