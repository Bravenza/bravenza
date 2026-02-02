-- Drop the incorrect policy and recreate with the correct role
DROP POLICY IF EXISTS "Anyone can submit order requests" ON public.order_requests;

-- Create policy specifically for anonymous users
CREATE POLICY "Anyone can submit order requests"
ON public.order_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);