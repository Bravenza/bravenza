-- Drop existing function first
DROP FUNCTION IF EXISTS public.get_vault_member(character varying);

-- Recreate with community_opt_in and client_name
CREATE OR REPLACE FUNCTION public.get_vault_member(p_cpf character varying)
RETURNS TABLE(
  id uuid, 
  tier vault_tier, 
  total_purchases integer, 
  active_hunts integer, 
  max_active_hunts integer, 
  max_wishlist_items integer, 
  invites_remaining integer, 
  preferred_sizes text[], 
  preferred_brands text[], 
  joined_via character varying, 
  created_at timestamp with time zone,
  community_opt_in boolean,
  client_name character varying
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    m.id,
    m.tier,
    m.total_purchases,
    m.active_hunts,
    m.max_active_hunts,
    m.max_wishlist_items,
    m.invites_remaining,
    m.preferred_sizes,
    m.preferred_brands,
    m.joined_via,
    m.created_at,
    COALESCE(m.community_opt_in, false),
    m.client_name
  FROM public.vault_members m
  WHERE m.client_cpf = p_cpf AND m.is_active = true;
$$;

-- Function to update community opt-in status
CREATE OR REPLACE FUNCTION public.update_vault_community_opt_in(p_cpf character varying, p_opt_in boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.vault_members
  SET community_opt_in = p_opt_in, updated_at = NOW()
  WHERE client_cpf = p_cpf AND is_active = true;
  
  RETURN FOUND;
END;
$$;