-- Function to create a vault invite
CREATE OR REPLACE FUNCTION public.create_vault_invite(p_cpf character varying)
RETURNS TABLE(invite_code character varying, success boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_member_id uuid;
  v_tier vault_tier;
  v_invites_remaining integer;
  v_code varchar;
BEGIN
  -- Get member info
  SELECT id, tier, invites_remaining INTO v_member_id, v_tier, v_invites_remaining
  FROM public.vault_members
  WHERE client_cpf = p_cpf AND is_active = true;
  
  IF v_member_id IS NULL THEN
    RETURN QUERY SELECT ''::varchar, false;
    RETURN;
  END IF;
  
  IF v_invites_remaining <= 0 THEN
    RETURN QUERY SELECT ''::varchar, false;
    RETURN;
  END IF;
  
  -- Generate unique code
  v_code := generate_vault_invite_code();
  
  -- Create invite
  INSERT INTO public.vault_invites (
    inviter_id,
    invite_code,
    token,
    created_by_tier_at_time,
    status,
    expires_at
  ) VALUES (
    v_member_id,
    v_code,
    v_code,
    v_tier,
    'pending',
    NOW() + INTERVAL '7 days'
  );
  
  -- Decrement invites
  UPDATE public.vault_members
  SET invites_remaining = invites_remaining - 1, updated_at = NOW()
  WHERE id = v_member_id;
  
  RETURN QUERY SELECT v_code, true;
END;
$$;

-- Function to validate an invite token
CREATE OR REPLACE FUNCTION public.validate_vault_invite(p_code character varying)
RETURNS TABLE(
  invite_id uuid,
  status character varying,
  inviter_name character varying,
  expires_at timestamp with time zone,
  is_valid boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_invite RECORD;
  v_inviter_name varchar;
BEGIN
  -- Find invite
  SELECT i.id, i.status::varchar, i.expires_at, i.inviter_id
  INTO v_invite
  FROM public.vault_invites i
  WHERE UPPER(i.invite_code) = UPPER(p_code) OR UPPER(i.token) = UPPER(p_code);
  
  IF v_invite.id IS NULL THEN
    RETURN QUERY SELECT NULL::uuid, NULL::varchar, NULL::varchar, NULL::timestamptz, false;
    RETURN;
  END IF;
  
  -- Get inviter name
  SELECT m.client_name INTO v_inviter_name
  FROM public.vault_members m
  WHERE m.id = v_invite.inviter_id;
  
  -- Check validity
  IF v_invite.status = 'used' THEN
    RETURN QUERY SELECT v_invite.id, 'used'::varchar, v_inviter_name, v_invite.expires_at, false;
    RETURN;
  END IF;
  
  IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < NOW() THEN
    RETURN QUERY SELECT v_invite.id, 'expired'::varchar, v_inviter_name, v_invite.expires_at, false;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT v_invite.id, v_invite.status, v_inviter_name, v_invite.expires_at, true;
END;
$$;