-- Drop existing function to allow return type change
DROP FUNCTION IF EXISTS public.get_vault_community_feed(TEXT, INTEGER, INTEGER);

-- Update get_vault_community_feed to include author_avatar
CREATE OR REPLACE FUNCTION public.get_vault_community_feed(p_cpf TEXT, p_limit INTEGER DEFAULT 20, p_offset INTEGER DEFAULT 0)
RETURNS TABLE (
  id UUID,
  author_id UUID,
  author_name TEXT,
  author_tier vault_tier,
  author_avatar TEXT,
  type community_post_type,
  title TEXT,
  content TEXT,
  attachments TEXT[],
  media_types TEXT[],
  created_at TIMESTAMPTZ,
  likes_count INTEGER,
  comments_count INTEGER,
  is_pinned BOOLEAN,
  reactions_summary JSONB,
  user_reactions TEXT[],
  is_liked BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id UUID;
BEGIN
  -- Get member id
  SELECT vm.id INTO v_member_id
  FROM vault_members vm
  WHERE vm.client_cpf = p_cpf AND vm.status = 'ACTIVE' AND vm.community_opt_in = true;
  
  IF v_member_id IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id AS author_id,
    COALESCE(vm.display_name, vm.client_name) AS author_name,
    vm.tier AS author_tier,
    vm.avatar_url AS author_avatar,
    p.type,
    p.title,
    p.content,
    p.attachments,
    p.media_types,
    p.created_at,
    COALESCE(p.likes_count, 0) AS likes_count,
    COALESCE(p.comments_count, 0) AS comments_count,
    COALESCE(p.is_pinned, false) AS is_pinned,
    COALESCE(p.reactions_summary, '{"like":0,"fire":0,"clap":0,"wow":0,"love":0}'::jsonb) AS reactions_summary,
    ARRAY(
      SELECT r.reaction_type FROM vault_community_reactions r
      WHERE r.post_id = p.id AND r.user_id = v_member_id
    ) AS user_reactions,
    EXISTS (
      SELECT 1 FROM vault_community_likes l 
      WHERE l.post_id = p.id AND l.user_id = v_member_id
    ) AS is_liked
  FROM vault_community_posts p
  JOIN vault_members vm ON vm.id = p.user_id
  WHERE p.status = 'APPROVED'
  ORDER BY p.is_pinned DESC NULLS LAST, p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;