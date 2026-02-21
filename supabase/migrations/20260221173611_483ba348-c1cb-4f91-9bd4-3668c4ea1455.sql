-- Add avatar_url column to vault_seller_profiles
ALTER TABLE public.vault_seller_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL;