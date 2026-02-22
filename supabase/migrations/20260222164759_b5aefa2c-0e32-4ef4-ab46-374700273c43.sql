-- Make listing_id nullable to support direct offer purchases (no listing)
ALTER TABLE public.vault_marketplace_orders ALTER COLUMN listing_id DROP NOT NULL;