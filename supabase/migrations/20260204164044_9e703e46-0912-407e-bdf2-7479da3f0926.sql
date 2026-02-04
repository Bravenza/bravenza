
-- =====================================================
-- Token-based access for payment pages (UUID column)
-- =====================================================

CREATE POLICY "Public can view order by token" ON public.orders FOR SELECT TO anon
USING (budget_approval_token IS NOT NULL);

CREATE POLICY "Public can update order by token" ON public.orders FOR UPDATE TO anon
USING (budget_approval_token IS NOT NULL)
WITH CHECK (budget_approval_token IS NOT NULL);
