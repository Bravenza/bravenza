-- Fix the orders public policy vulnerability
-- The old policy exposed ALL orders with tokens to everyone
-- New approach: remove public SELECT and rely on edge functions + service role

-- Drop the vulnerable policies
DROP POLICY IF EXISTS "Public can view order by token" ON public.orders;
DROP POLICY IF EXISTS "Public can update order by token" ON public.orders;

-- The admins policy already handles all admin access
-- For budget approval page, we'll rely on the client-orders edge function
-- which uses service role and validates the token server-side

-- Orders with ALL admin policy already exists, so we're good