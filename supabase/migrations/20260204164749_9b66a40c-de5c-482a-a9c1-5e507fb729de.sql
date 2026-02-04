-- Add missing policy to order_history
CREATE POLICY "Admins full access to order_history"
  ON public.order_history FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());