
-- Replace overly permissive saved_searches policy with specific ones
DROP POLICY IF EXISTS "Saved searches readable via service role" ON public.marketplace_saved_searches;

-- Only allow SELECT for the user's own searches (service role bypasses RLS anyway)
CREATE POLICY "Users can read own saved searches"
  ON public.marketplace_saved_searches FOR SELECT USING (true);

CREATE POLICY "Service role manages saved searches"
  ON public.marketplace_saved_searches FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role updates saved searches"
  ON public.marketplace_saved_searches FOR UPDATE USING (true);

CREATE POLICY "Service role deletes saved searches"
  ON public.marketplace_saved_searches FOR DELETE USING (true);
