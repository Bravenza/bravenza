-- Fix permissive INSERT policy on order_requests
-- Restrict so users can only insert rows where client_cpf matches their profile
DROP POLICY IF EXISTS "Authenticated users can submit order requests" ON public.order_requests;

CREATE POLICY "Authenticated users can submit order requests"
ON public.order_requests
FOR INSERT
TO authenticated
WITH CHECK (
  client_cpf IN (
    SELECT cp.cpf FROM public.client_profiles cp WHERE cp.user_id = auth.uid()
  )
);