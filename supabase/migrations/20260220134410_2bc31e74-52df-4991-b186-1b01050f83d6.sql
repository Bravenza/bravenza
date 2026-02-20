-- Enable realtime for admin-critical tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vault_waitlist;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vault_marketplace_orders;