-- Add anon policy for orders that denies all access 
-- (access is through SECURITY DEFINER RPC functions only)
CREATE POLICY "Anon access denied - use RPC functions"
  ON public.orders FOR SELECT TO anon
  USING (false);