-- Drop existing functions first
DROP FUNCTION IF EXISTS public.get_vault_community_feed(TEXT, INT, INT);
DROP FUNCTION IF EXISTS public.get_following_feed(TEXT, INT, INT);

-- Recreate get_vault_community_feed with correct column names
CREATE OR REPLACE FUNCTION public.get_vault_community_feed(
  p_cpf TEXT,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  author_name TEXT,
  author_tier TEXT,
  author_avatar TEXT,
  type TEXT,
  title TEXT,
  content TEXT,
  attachments TEXT[],
  media_types TEXT[],
  reactions_summary JSONB,
  user_reactions TEXT[],
  likes_count INT,
  comments_count INT,
  is_pinned BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_member_id UUID;
BEGIN
  -- Find member by client_cpf (correct column name)
  SELECT vm.id INTO v_member_id 
  FROM vault_members vm 
  WHERE vm.client_cpf = p_cpf AND vm.community_opt_in = true;
  
  IF v_member_id IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT 
    p.id, 
    p.user_id, 
    COALESCE(vm.display_name, vm.client_name)::TEXT, 
    vm.tier::TEXT, 
    vm.avatar_url,
    p.type::TEXT, 
    p.title, 
    p.content, 
    p.attachments, 
    p.media_types,
    COALESCE(p.reactions_summary, '{"like":0,"fire":0,"clap":0,"wow":0,"love":0}'::jsonb),
    ARRAY(SELECT r.reaction_type FROM vault_community_reactions r WHERE r.post_id = p.id AND r.user_id = v_member_id),
    COALESCE(p.likes_count, 0), 
    COALESCE(p.comments_count, 0), 
    COALESCE(p.is_pinned, false), 
    p.created_at
  FROM vault_community_posts p
  JOIN vault_members vm ON vm.id = p.user_id
  WHERE p.status = 'PUBLISHED'
  ORDER BY p.is_pinned DESC NULLS LAST, p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Recreate get_following_feed with correct column names
CREATE OR REPLACE FUNCTION public.get_following_feed(
  p_cpf TEXT,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  author_name TEXT,
  author_tier TEXT,
  author_avatar TEXT,
  type TEXT,
  title TEXT,
  content TEXT,
  attachments TEXT[],
  media_types TEXT[],
  reactions_summary JSONB,
  user_reactions TEXT[],
  likes_count INT,
  comments_count INT,
  is_pinned BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_member_id UUID;
BEGIN
  -- Find member by client_cpf (correct column name)
  SELECT vm.id INTO v_member_id 
  FROM vault_members vm 
  WHERE vm.client_cpf = p_cpf AND vm.community_opt_in = true;
  
  IF v_member_id IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT 
    p.id, 
    p.user_id, 
    COALESCE(vm.display_name, vm.client_name)::TEXT, 
    vm.tier::TEXT, 
    vm.avatar_url,
    p.type::TEXT, 
    p.title, 
    p.content, 
    p.attachments, 
    p.media_types,
    COALESCE(p.reactions_summary, '{"like":0,"fire":0,"clap":0,"wow":0,"love":0}'::jsonb),
    ARRAY(SELECT r.reaction_type FROM vault_community_reactions r WHERE r.post_id = p.id AND r.user_id = v_member_id),
    COALESCE(p.likes_count, 0), 
    COALESCE(p.comments_count, 0), 
    COALESCE(p.is_pinned, false), 
    p.created_at
  FROM vault_community_posts p
  JOIN vault_members vm ON vm.id = p.user_id
  JOIN vault_community_follows f ON f.following_id = p.user_id AND f.follower_id = v_member_id
  WHERE p.status = 'PUBLISHED'
  ORDER BY p.is_pinned DESC NULLS LAST, p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;