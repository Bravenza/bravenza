-- Fix get_post_comments to use fallback for display_name
DROP FUNCTION IF EXISTS get_post_comments(uuid, text);

CREATE OR REPLACE FUNCTION get_post_comments(p_post_id uuid, p_cpf text)
RETURNS TABLE(
  id uuid, 
  user_id uuid, 
  author_name text, 
  author_tier text, 
  content text, 
  parent_id uuid, 
  likes_count integer, 
  reactions_summary jsonb, 
  created_at timestamp with time zone, 
  has_liked boolean, 
  user_reactions text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_member_id UUID;
BEGIN
  SELECT vm.id INTO v_member_id FROM vault_members vm WHERE vm.client_cpf = p_cpf;
  
  RETURN QUERY
  SELECT 
    c.id,
    c.user_id,
    COALESCE(m.display_name, m.client_name)::TEXT AS author_name,
    m.tier::TEXT AS author_tier,
    c.content::TEXT,
    c.parent_id,
    COALESCE(c.likes_count, 0)::INTEGER AS likes_count,
    COALESCE(c.reactions_summary, '{"like":0,"fire":0,"clap":0,"wow":0,"love":0}'::jsonb) AS reactions_summary,
    c.created_at,
    EXISTS(
      SELECT 1 FROM vault_community_comment_likes cl 
      WHERE cl.comment_id = c.id AND cl.user_id = v_member_id
    ) AS has_liked,
    ARRAY(
      SELECT cr.reaction_type::TEXT FROM vault_community_comment_reactions cr
      WHERE cr.comment_id = c.id AND cr.user_id = v_member_id
    ) AS user_reactions
  FROM vault_community_comments c
  JOIN vault_members m ON m.id = c.user_id
  WHERE c.post_id = p_post_id
  ORDER BY c.created_at ASC;
END;
$$;

-- Fix toggle_post_like with search_path
DROP FUNCTION IF EXISTS toggle_post_like(uuid, varchar);

CREATE OR REPLACE FUNCTION toggle_post_like(p_post_id uuid, p_cpf varchar)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_member_id UUID;
  v_liked BOOLEAN;
BEGIN
  SELECT id INTO v_member_id FROM vault_members WHERE client_cpf = p_cpf;
  
  IF v_member_id IS NULL THEN
    RETURN false;
  END IF;
  
  IF EXISTS(SELECT 1 FROM vault_community_likes WHERE post_id = p_post_id AND user_id = v_member_id) THEN
    DELETE FROM vault_community_likes WHERE post_id = p_post_id AND user_id = v_member_id;
    UPDATE vault_community_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = p_post_id;
    v_liked := false;
  ELSE
    INSERT INTO vault_community_likes (post_id, user_id) VALUES (p_post_id, v_member_id);
    UPDATE vault_community_posts SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = p_post_id;
    v_liked := true;
  END IF;
  
  RETURN v_liked;
END;
$$;