-- Fix get_vault_community_feed function - cast all varchar columns to text
DROP FUNCTION IF EXISTS get_vault_community_feed(text, integer, integer);

CREATE OR REPLACE FUNCTION get_vault_community_feed(p_cpf text, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
RETURNS TABLE(
  id uuid, 
  user_id uuid, 
  author_name text, 
  author_tier text, 
  author_avatar text, 
  type text, 
  title text, 
  content text, 
  attachments text[], 
  media_types text[], 
  reactions_summary jsonb, 
  user_reactions text[], 
  likes_count integer, 
  comments_count integer, 
  is_pinned boolean, 
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member_id UUID;
BEGIN
  -- Find member by client_cpf
  SELECT vm.id INTO v_member_id 
  FROM vault_members vm 
  WHERE vm.client_cpf = p_cpf AND vm.community_opt_in = true;
  
  IF v_member_id IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT 
    p.id, 
    p.user_id, 
    COALESCE(vm.display_name, vm.client_name)::TEXT as author_name, 
    vm.tier::TEXT as author_tier, 
    vm.avatar_url::TEXT as author_avatar,
    p.type::TEXT, 
    p.title::TEXT,  -- Cast varchar to text
    p.content::TEXT,  -- Cast varchar to text
    p.attachments, 
    p.media_types,
    COALESCE(p.reactions_summary, '{"like":0,"fire":0,"clap":0,"wow":0,"love":0}'::jsonb),
    ARRAY(SELECT r.reaction_type::TEXT FROM vault_community_reactions r WHERE r.post_id = p.id AND r.user_id = v_member_id),
    COALESCE(p.likes_count, 0)::INTEGER, 
    COALESCE(p.comments_count, 0)::INTEGER, 
    COALESCE(p.is_pinned, false), 
    p.created_at
  FROM vault_community_posts p
  JOIN vault_members vm ON vm.id = p.user_id
  WHERE p.status = 'PUBLISHED'
  ORDER BY p.is_pinned DESC NULLS LAST, p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Also fix get_following_feed function
DROP FUNCTION IF EXISTS get_following_feed(text, integer, integer);

CREATE OR REPLACE FUNCTION get_following_feed(p_cpf text, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
RETURNS TABLE(
  id uuid, 
  user_id uuid, 
  author_name text, 
  author_tier text, 
  author_avatar text, 
  type text, 
  title text, 
  content text, 
  attachments text[], 
  media_types text[], 
  reactions_summary jsonb, 
  user_reactions text[], 
  likes_count integer, 
  comments_count integer, 
  is_pinned boolean, 
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member_id UUID;
BEGIN
  -- Find member by client_cpf
  SELECT vm.id INTO v_member_id 
  FROM vault_members vm 
  WHERE vm.client_cpf = p_cpf AND vm.community_opt_in = true;
  
  IF v_member_id IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT 
    p.id, 
    p.user_id, 
    COALESCE(vm.display_name, vm.client_name)::TEXT as author_name, 
    vm.tier::TEXT as author_tier, 
    vm.avatar_url::TEXT as author_avatar,
    p.type::TEXT, 
    p.title::TEXT,
    p.content::TEXT,
    p.attachments, 
    p.media_types,
    COALESCE(p.reactions_summary, '{"like":0,"fire":0,"clap":0,"wow":0,"love":0}'::jsonb),
    ARRAY(SELECT r.reaction_type::TEXT FROM vault_community_reactions r WHERE r.post_id = p.id AND r.user_id = v_member_id),
    COALESCE(p.likes_count, 0)::INTEGER, 
    COALESCE(p.comments_count, 0)::INTEGER, 
    COALESCE(p.is_pinned, false), 
    p.created_at
  FROM vault_community_posts p
  JOIN vault_members vm ON vm.id = p.user_id
  JOIN vault_member_follows f ON f.following_id = p.user_id AND f.follower_id = v_member_id
  WHERE p.status = 'PUBLISHED'
  ORDER BY p.is_pinned DESC NULLS LAST, p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;