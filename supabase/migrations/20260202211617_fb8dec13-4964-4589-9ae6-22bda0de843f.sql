-- Grant INSERT permission to anon and authenticated roles for order_requests table
GRANT INSERT ON public.order_requests TO anon;
GRANT INSERT ON public.order_requests TO authenticated;

-- Also ensure SELECT is granted for the insert to return data
GRANT SELECT ON public.order_requests TO anon;
GRANT SELECT ON public.order_requests TO authenticated;