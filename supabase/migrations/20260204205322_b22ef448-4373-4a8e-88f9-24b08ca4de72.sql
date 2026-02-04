-- Drop existing function with conflicting signature
DROP FUNCTION IF EXISTS update_member_profile(text,text,text,text,text,text,text,text,text,text,boolean);

-- Add missing profile columns to vault_members (if not already added)
ALTER TABLE vault_members 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS is_profile_public BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS posts_count INTEGER DEFAULT 0;

-- Update joined_at for existing members
UPDATE vault_members SET joined_at = created_at WHERE joined_at IS NULL;

-- Create follows table if not exists
CREATE TABLE IF NOT EXISTS vault_member_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES vault_members(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES vault_members(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Enable RLS on follows
ALTER TABLE vault_member_follows ENABLE ROW LEVEL SECURITY;

-- RLS policies for follows
DROP POLICY IF EXISTS "Members can view follows" ON vault_member_follows;
CREATE POLICY "Members can view follows" ON vault_member_follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "Members can manage own follows" ON vault_member_follows;
CREATE POLICY "Members can manage own follows" ON vault_member_follows 
FOR ALL USING (true);

-- Create or replace get_member_public_profile RPC
CREATE OR REPLACE FUNCTION get_member_public_profile(p_cpf TEXT, p_member_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_viewer_id UUID;
  v_profile JSON;
  v_items JSON;
  v_is_following BOOLEAN := false;
  v_is_own_profile BOOLEAN := false;
  v_posts_count INTEGER := 0;
BEGIN
  SELECT id INTO v_viewer_id
  FROM vault_members
  WHERE client_cpf = p_cpf AND is_active = true;

  v_is_own_profile := (v_viewer_id = p_member_id);

  IF v_viewer_id IS NOT NULL AND NOT v_is_own_profile THEN
    SELECT EXISTS(
      SELECT 1 FROM vault_member_follows
      WHERE follower_id = v_viewer_id AND following_id = p_member_id
    ) INTO v_is_following;
  END IF;

  SELECT COUNT(*) INTO v_posts_count
  FROM vault_community_posts
  WHERE user_id = p_member_id AND status = 'PUBLISHED';

  SELECT json_build_object(
    'id', vm.id,
    'display_name', COALESCE(vm.display_name, vm.client_name),
    'avatar_url', vm.avatar_url,
    'city', vm.city,
    'state', vm.state,
    'bio', vm.bio,
    'tier', vm.tier,
    'instagram_url', vm.instagram_url,
    'facebook_url', vm.facebook_url,
    'linkedin_url', vm.linkedin_url,
    'twitter_url', vm.twitter_url,
    'is_profile_public', COALESCE(vm.is_profile_public, true),
    'followers_count', COALESCE(vm.followers_count, 0),
    'following_count', COALESCE(vm.following_count, 0),
    'posts_count', v_posts_count,
    'joined_at', COALESCE(vm.joined_at, vm.created_at),
    'total_purchases', vm.total_purchases,
    'is_following', v_is_following,
    'is_own_profile', v_is_own_profile
  ) INTO v_profile
  FROM vault_members vm
  WHERE vm.id = p_member_id AND vm.is_active = true;

  IF v_profile IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Perfil não encontrado');
  END IF;

  SELECT COALESCE(json_agg(item_data), '[]'::json) INTO v_items
  FROM (
    SELECT json_build_object(
      'id', vi.id,
      'title', vi.title,
      'brand', vi.brand,
      'model', vi.model,
      'colorway', vi.colorway,
      'size', vi.size,
      'inspection_photos', vi.inspection_photos,
      'verified_status', vi.verified_status,
      'purchase_date', vi.purchase_date
    ) as item_data
    FROM vault_items vi
    WHERE vi.user_id = p_member_id
    AND vi.verified_status = 'VERIFIED'
    ORDER BY vi.purchase_date DESC NULLS LAST
    LIMIT 9
  ) sub;

  RETURN json_build_object(
    'success', true,
    'profile', v_profile,
    'items', v_items
  );
END;
$$;

-- Create toggle_follow function
CREATE OR REPLACE FUNCTION toggle_follow(p_cpf TEXT, p_target_member_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_follower_id UUID;
  v_exists BOOLEAN;
  v_is_following BOOLEAN;
BEGIN
  SELECT id INTO v_follower_id
  FROM vault_members
  WHERE client_cpf = p_cpf AND is_active = true;

  IF v_follower_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Membro não encontrado');
  END IF;

  IF v_follower_id = p_target_member_id THEN
    RETURN json_build_object('success', false, 'error', 'Não é possível seguir você mesmo');
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM vault_member_follows
    WHERE follower_id = v_follower_id AND following_id = p_target_member_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM vault_member_follows
    WHERE follower_id = v_follower_id AND following_id = p_target_member_id;

    UPDATE vault_members SET followers_count = GREATEST(COALESCE(followers_count, 0) - 1, 0)
    WHERE id = p_target_member_id;
    
    UPDATE vault_members SET following_count = GREATEST(COALESCE(following_count, 0) - 1, 0)
    WHERE id = v_follower_id;

    v_is_following := false;
  ELSE
    INSERT INTO vault_member_follows (follower_id, following_id)
    VALUES (v_follower_id, p_target_member_id);

    UPDATE vault_members SET followers_count = COALESCE(followers_count, 0) + 1
    WHERE id = p_target_member_id;
    
    UPDATE vault_members SET following_count = COALESCE(following_count, 0) + 1
    WHERE id = v_follower_id;

    v_is_following := true;
  END IF;

  RETURN json_build_object(
    'success', true,
    'is_following', v_is_following
  );
END;
$$;

-- Update get_own_community_profile
CREATE OR REPLACE FUNCTION get_own_community_profile(p_cpf TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id UUID;
  v_profile JSON;
  v_posts_count INTEGER := 0;
BEGIN
  SELECT vm.id INTO v_member_id
  FROM vault_members vm
  WHERE vm.client_cpf = p_cpf AND vm.is_active = true;

  IF v_member_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Membro não encontrado');
  END IF;

  SELECT COUNT(*) INTO v_posts_count
  FROM vault_community_posts
  WHERE user_id = v_member_id AND status = 'PUBLISHED';

  SELECT json_build_object(
    'id', vm.id,
    'display_name', COALESCE(vm.display_name, vm.client_name),
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
    'posts_count', v_posts_count,
    'joined_at', COALESCE(vm.joined_at, vm.created_at)
  ) INTO v_profile
  FROM vault_members vm
  WHERE vm.id = v_member_id;

  RETURN json_build_object(
    'success', true,
    'profile', v_profile
  );
END;
$$;

-- Recreate update_member_profile
CREATE OR REPLACE FUNCTION update_member_profile(
  p_cpf TEXT,
  p_display_name TEXT DEFAULT NULL,
  p_bio TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL,
  p_instagram_url TEXT DEFAULT NULL,
  p_facebook_url TEXT DEFAULT NULL,
  p_linkedin_url TEXT DEFAULT NULL,
  p_twitter_url TEXT DEFAULT NULL,
  p_is_profile_public BOOLEAN DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id UUID;
BEGIN
  SELECT id INTO v_member_id
  FROM vault_members
  WHERE client_cpf = p_cpf AND is_active = true;

  IF v_member_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Membro não encontrado');
  END IF;

  UPDATE vault_members SET
    display_name = COALESCE(p_display_name, display_name),
    bio = COALESCE(p_bio, bio),
    city = COALESCE(p_city, city),
    state = COALESCE(p_state, state),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    instagram_url = COALESCE(p_instagram_url, instagram_url),
    facebook_url = COALESCE(p_facebook_url, facebook_url),
    linkedin_url = COALESCE(p_linkedin_url, linkedin_url),
    twitter_url = COALESCE(p_twitter_url, twitter_url),
    is_profile_public = COALESCE(p_is_profile_public, is_profile_public),
    updated_at = now()
  WHERE id = v_member_id;

  RETURN json_build_object('success', true);
END;
$$;

-- Get member connections
CREATE OR REPLACE FUNCTION get_member_connections(
  p_cpf TEXT, 
  p_member_id UUID, 
  p_type TEXT,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_viewer_id UUID;
  v_connections JSON;
  v_total INTEGER;
BEGIN
  SELECT id INTO v_viewer_id
  FROM vault_members
  WHERE client_cpf = p_cpf AND is_active = true;

  IF p_type = 'followers' THEN
    SELECT COUNT(*) INTO v_total
    FROM vault_member_follows WHERE following_id = p_member_id;

    SELECT COALESCE(json_agg(conn), '[]'::json) INTO v_connections
    FROM (
      SELECT json_build_object(
        'id', vm.id,
        'display_name', COALESCE(vm.display_name, vm.client_name),
        'avatar_url', vm.avatar_url,
        'tier', vm.tier,
        'is_following', EXISTS(
          SELECT 1 FROM vault_member_follows
          WHERE follower_id = v_viewer_id AND following_id = vm.id
        )
      ) as conn
      FROM vault_member_follows f
      JOIN vault_members vm ON vm.id = f.follower_id
      WHERE f.following_id = p_member_id AND vm.is_active = true
      ORDER BY f.created_at DESC
      LIMIT p_limit OFFSET p_offset
    ) sub;
  ELSE
    SELECT COUNT(*) INTO v_total
    FROM vault_member_follows WHERE follower_id = p_member_id;

    SELECT COALESCE(json_agg(conn), '[]'::json) INTO v_connections
    FROM (
      SELECT json_build_object(
        'id', vm.id,
        'display_name', COALESCE(vm.display_name, vm.client_name),
        'avatar_url', vm.avatar_url,
        'tier', vm.tier,
        'is_following', EXISTS(
          SELECT 1 FROM vault_member_follows
          WHERE follower_id = v_viewer_id AND following_id = vm.id
        )
      ) as conn
      FROM vault_member_follows f
      JOIN vault_members vm ON vm.id = f.following_id
      WHERE f.follower_id = p_member_id AND vm.is_active = true
      ORDER BY f.created_at DESC
      LIMIT p_limit OFFSET p_offset
    ) sub;
  END IF;

  RETURN json_build_object(
    'success', true,
    'connections', v_connections,
    'total', v_total
  );
END;
$$;