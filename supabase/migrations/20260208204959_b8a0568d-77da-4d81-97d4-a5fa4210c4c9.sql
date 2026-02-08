
ALTER TABLE public.vault_seller_profiles
ADD COLUMN pix_beneficiary text,
ADD COLUMN account_type text DEFAULT 'pf';
