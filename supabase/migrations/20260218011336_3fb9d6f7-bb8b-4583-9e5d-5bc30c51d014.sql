-- Remove old duplicate trigger that was conflicting
DROP TRIGGER IF EXISTS trg_update_seller_fee ON public.vault_seller_profiles;
