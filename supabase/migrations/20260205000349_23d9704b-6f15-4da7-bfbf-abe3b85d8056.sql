
-- Drop and recreate all community interaction functions with consistent behavior

-- 1. toggle_post_like - Fix to update state properly
CREATE OR REPLACE FUNCTION public.toggle_post_like(p_post_id UUID, p_cpf TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_member_id UUID;
  v_liked BOOLEAN;
  v_new_count INTEGER;
BEGIN
  SELECT id INTO v_member_id FROM vault_members WHERE client_cpf = p_cpf;
  
  IF v_member_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Member not found');
  END IF;
  
  IF EXISTS(SELECT 1 FROM vault_community_likes WHERE post_id = p_post_id AND user_id = v_member_id) THEN
    DELETE FROM vault_community_likes WHERE post_id = p_post_id AND user_id = v_member_id;
    UPDATE vault_community_posts 
    SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1) 
    WHERE id = p_post_id
    RETURNING likes_count INTO v_new_count;
    v_liked := false;
  ELSE
    INSERT INTO vault_community_likes (post_id, user_id) VALUES (p_post_id, v_member_id)
    ON CONFLICT DO NOTHING;
    UPDATE vault_community_posts 
    SET likes_count = COALESCE(likes_count, 0) + 1 
    WHERE id = p_post_id
    RETURNING likes_count INTO v_new_count;
    v_liked := true;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'liked', v_liked, 'likes_count', COALESCE(v_new_count, 0));
END;
$$;

-- 2. toggle_post_reaction - Keep consistent
CREATE OR REPLACE FUNCTION public.toggle_post_reaction(p_post_id UUID, p_cpf TEXT, p_reaction_type TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_member_id UUID;
  v_existing BOOLEAN;
  v_new_summary JSONB;
BEGIN
  SELECT id INTO v_member_id FROM vault_members WHERE client_cpf = p_cpf;
  
  IF v_member_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Member not found');
  END IF;
  
  SELECT EXISTS(
    SELECT 1 FROM vault_community_reactions 
    WHERE post_id = p_post_id AND user_id = v_member_id AND reaction_type = p_reaction_type
  ) INTO v_existing;
  
  IF v_existing THEN
    DELETE FROM vault_community_reactions 
    WHERE post_id = p_post_id AND user_id = v_member_id AND reaction_type = p_reaction_type;
    
    UPDATE vault_community_posts 
    SET reactions_summary = jsonb_set(
      COALESCE(reactions_summary, '{"like":0,"fire":0,"clap":0,"wow":0,"love":0}'::jsonb),
      ARRAY[p_reaction_type],
      to_jsonb(GREATEST(0, COALESCE((reactions_summary->>p_reaction_type)::int, 0) - 1))
    )
    WHERE id = p_post_id
    RETURNING reactions_summary INTO v_new_summary;
  ELSE
    INSERT INTO vault_community_reactions (post_id, user_id, reaction_type)
    VALUES (p_post_id, v_member_id, p_reaction_type)
    ON CONFLICT DO NOTHING;
    
    UPDATE vault_community_posts 
    SET reactions_summary = jsonb_set(
      COALESCE(reactions_summary, '{"like":0,"fire":0,"clap":0,"wow":0,"love":0}'::jsonb),
      ARRAY[p_reaction_type],
      to_jsonb(COALESCE((reactions_summary->>p_reaction_type)::int, 0) + 1)
    )
    WHERE id = p_post_id
    RETURNING reactions_summary INTO v_new_summary;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'added', NOT v_existing, 'summary', COALESCE(v_new_summary, '{}'::jsonb));
END;
$$;

-- 3. toggle_comment_like - Consistent return format
CREATE OR REPLACE FUNCTION public.toggle_comment_like(p_comment_id UUID, p_cpf TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_member_id UUID;
  v_liked BOOLEAN;
  v_new_count INTEGER;
BEGIN
  SELECT id INTO v_member_id FROM vault_members WHERE client_cpf = p_cpf;
  
  IF v_member_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Member not found');
  END IF;
  
  IF EXISTS(SELECT 1 FROM vault_community_comment_likes WHERE comment_id = p_comment_id AND user_id = v_member_id) THEN
    DELETE FROM vault_community_comment_likes WHERE comment_id = p_comment_id AND user_id = v_member_id;
    UPDATE vault_community_comments 
    SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1) 
    WHERE id = p_comment_id
    RETURNING likes_count INTO v_new_count;
    v_liked := false;
  ELSE
    INSERT INTO vault_community_comment_likes (comment_id, user_id) VALUES (p_comment_id, v_member_id)
    ON CONFLICT DO NOTHING;
    UPDATE vault_community_comments 
    SET likes_count = COALESCE(likes_count, 0) + 1 
    WHERE id = p_comment_id
    RETURNING likes_count INTO v_new_count;
    v_liked := true;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'liked', v_liked, 'likes_count', COALESCE(v_new_count, 0));
END;
$$;

-- 4. toggle_comment_reaction - Consistent return format
CREATE OR REPLACE FUNCTION public.toggle_comment_reaction(p_comment_id UUID, p_cpf TEXT, p_reaction_type TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_member_id UUID;
  v_existing BOOLEAN;
  v_new_summary JSONB;
BEGIN
  SELECT id INTO v_member_id FROM vault_members WHERE client_cpf = p_cpf;
  
  IF v_member_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Member not found');
  END IF;
  
  SELECT EXISTS(
    SELECT 1 FROM vault_community_comment_reactions 
    WHERE comment_id = p_comment_id AND user_id = v_member_id AND reaction_type = p_reaction_type
  ) INTO v_existing;
  
  IF v_existing THEN
    DELETE FROM vault_community_comment_reactions 
    WHERE comment_id = p_comment_id AND user_id = v_member_id AND reaction_type = p_reaction_type;
    
    UPDATE vault_community_comments 
    SET reactions_summary = jsonb_set(
      COALESCE(reactions_summary, '{"like":0,"fire":0,"clap":0,"wow":0,"love":0}'::jsonb),
      ARRAY[p_reaction_type],
      to_jsonb(GREATEST(0, COALESCE((reactions_summary->>p_reaction_type)::int, 0) - 1))
    )
    WHERE id = p_comment_id
    RETURNING reactions_summary INTO v_new_summary;
  ELSE
    INSERT INTO vault_community_comment_reactions (comment_id, user_id, reaction_type)
    VALUES (p_comment_id, v_member_id, p_reaction_type)
    ON CONFLICT DO NOTHING;
    
    UPDATE vault_community_comments 
    SET reactions_summary = jsonb_set(
      COALESCE(reactions_summary, '{"like":0,"fire":0,"clap":0,"wow":0,"love":0}'::jsonb),
      ARRAY[p_reaction_type],
      to_jsonb(COALESCE((reactions_summary->>p_reaction_type)::int, 0) + 1)
    )
    WHERE id = p_comment_id
    RETURNING reactions_summary INTO v_new_summary;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'added', NOT v_existing, 'summary', COALESCE(v_new_summary, '{}'::jsonb));
END;
$$;

-- 5. add_post_comment - Return full comment info
CREATE OR REPLACE FUNCTION public.add_post_comment(p_post_id UUID, p_cpf TEXT, p_content TEXT, p_parent_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_member_id UUID;
  v_comment_id UUID;
  v_author_name TEXT;
  v_author_tier TEXT;
BEGIN
  SELECT id, COALESCE(display_name, client_name), tier::TEXT 
  INTO v_member_id, v_author_name, v_author_tier 
  FROM vault_members WHERE client_cpf = p_cpf;
  
  IF v_member_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Member not found');
  END IF;
  
  INSERT INTO vault_community_comments (post_id, user_id, content, parent_id)
  VALUES (p_post_id, v_member_id, p_content, p_parent_id)
  RETURNING id INTO v_comment_id;
  
  UPDATE vault_community_posts 
  SET comments_count = COALESCE(comments_count, 0) + 1 
  WHERE id = p_post_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'comment_id', v_comment_id,
    'author_name', v_author_name,
    'author_tier', v_author_tier
  );
END;
$$;

-- 6. get_post_comments - Clean up duplicate function and ensure correct return
DROP FUNCTION IF EXISTS public.get_post_comments(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.get_post_comments(p_post_id UUID, p_cpf TEXT)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  author_name TEXT,
  author_tier TEXT,
  content TEXT,
  parent_id UUID,
  likes_count INTEGER,
  reactions_summary JSONB,
  created_at TIMESTAMPTZ,
  has_liked BOOLEAN,
  user_reactions TEXT[]
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
