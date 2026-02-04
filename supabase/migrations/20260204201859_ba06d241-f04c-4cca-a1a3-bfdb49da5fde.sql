-- Create a function to ensure member profile has default values and can be edited
CREATE OR REPLACE FUNCTION public.get_own_community_profile(p_cpf text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id uuid;
  v_profile json;
BEGIN
  -- Get member id from CPF
  SELECT vm.id INTO v_member_id
  FROM vault_members vm
  JOIN client_profiles cp ON cp.cpf = vm.client_cpf
  WHERE vm.client_cpf = p_cpf;

  IF v_member_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Membro não encontrado');
  END IF;

  -- Get profile data
  SELECT json_build_object(
    'id', vm.id,
    'display_name', COALESCE(vm.display_name, cp.full_name),
    'avatar_url', vm.avatar_url,
    'city', vm.city,
    'state', vm.state,
    'bio', vm.bio,
    'instagram_url', vm.instagram_url,
    'facebook_url', vm.facebook_url,
    'linkedin_url', vm.linkedin_url,
    'twitter_url', vm.twitter_url,
    'is_profile_public', COALESCE(vm.is_profile_public, true),
    'tier', vm.tier,
    'followers_count', COALESCE(vm.followers_count, 0),
    'following_count', COALESCE(vm.following_count, 0),
    'joined_at', vm.joined_at,
    'email', cp.full_name
  ) INTO v_profile
  FROM vault_members vm
  JOIN client_profiles cp ON cp.cpf = vm.client_cpf
  WHERE vm.id = v_member_id;

  RETURN json_build_object(
    'success', true,
    'profile', v_profile
  );
END;
$$;

-- Update the update_member_profile function to use CPF correctly
CREATE OR REPLACE FUNCTION public.update_member_profile(
  p_cpf text,
  p_display_name text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_state text DEFAULT NULL,
  p_bio text DEFAULT NULL,
  p_instagram_url text DEFAULT NULL,
  p_facebook_url text DEFAULT NULL,
  p_linkedin_url text DEFAULT NULL,
  p_twitter_url text DEFAULT NULL,
  p_is_profile_public boolean DEFAULT true
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id uuid;
BEGIN
  -- Get member id from CPF
  SELECT id INTO v_member_id
  FROM vault_members
  WHERE client_cpf = p_cpf;

  IF v_member_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Membro não encontrado');
  END IF;

  -- Update profile
  UPDATE vault_members
  SET
    display_name = COALESCE(p_display_name, display_name),
    avatar_url = p_avatar_url,
    city = p_city,
    state = p_state,
    bio = p_bio,
    instagram_url = p_instagram_url,
    facebook_url = p_facebook_url,
    linkedin_url = p_linkedin_url,
    twitter_url = p_twitter_url,
    is_profile_public = p_is_profile_public
  WHERE id = v_member_id;

  RETURN json_build_object('success', true);
END;
$$;