-- Enable realtime for vault_searches so client can receive live status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.vault_searches;