DROP FUNCTION IF EXISTS public.get_client_profile();

CREATE FUNCTION public.get_client_profile()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  cpf character varying,
  full_name text,
  phone character varying,
  vault_member_id uuid,
  vault_tier text,
  vault_status text,
  avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.id,
    cp.user_id,
    cp.cpf,
    cp.full_name,
    cp.phone,
    vm.id as vault_member_id,
    vm.tier::TEXT as vault_tier,
    vm.status::TEXT as vault_status,
    cp.avatar_url
  FROM client_profiles cp
  LEFT JOIN vault_members vm ON vm.client_cpf = cp.cpf
  WHERE cp.user_id = auth.uid();
END;
$$;