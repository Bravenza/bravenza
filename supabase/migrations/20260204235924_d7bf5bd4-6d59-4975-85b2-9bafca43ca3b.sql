-- Fix add_post_comment with null handling and search_path
DROP FUNCTION IF EXISTS add_post_comment(uuid, varchar, text, uuid);

CREATE OR REPLACE FUNCTION add_post_comment(p_post_id uuid, p_cpf varchar, p_content text, p_parent_id uuid DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_member_id UUID;
  v_comment_id UUID;
BEGIN
  SELECT id INTO v_member_id FROM vault_members WHERE client_cpf = p_cpf;
  
  IF v_member_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  INSERT INTO vault_community_comments (post_id, user_id, content, parent_id)
  VALUES (p_post_id, v_member_id, p_content, p_parent_id)
  RETURNING id INTO v_comment_id;
  
  UPDATE vault_community_posts SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = p_post_id;
  
  RETURN v_comment_id;
END;
$$;

-- Fix toggle_comment_like with null handling and search_path
DROP FUNCTION IF EXISTS toggle_comment_like(uuid, varchar);

CREATE OR REPLACE FUNCTION toggle_comment_like(p_comment_id uuid, p_cpf varchar)
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
  
  IF EXISTS(SELECT 1 FROM vault_community_comment_likes WHERE comment_id = p_comment_id AND user_id = v_member_id) THEN
    DELETE FROM vault_community_comment_likes WHERE comment_id = p_comment_id AND user_id = v_member_id;
    UPDATE vault_community_comments SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1) WHERE id = p_comment_id;
    v_liked := false;
  ELSE
    INSERT INTO vault_community_comment_likes (comment_id, user_id) VALUES (p_comment_id, v_member_id);
    UPDATE vault_community_comments SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = p_comment_id;
    v_liked := true;
  END IF;
  
  RETURN v_liked;
END;
$$;

-- Fix toggle_comment_reaction with null handling
DROP FUNCTION IF EXISTS toggle_comment_reaction(uuid, varchar, text);
DROP FUNCTION IF EXISTS toggle_comment_reaction(uuid, text, text);

CREATE OR REPLACE FUNCTION toggle_comment_reaction(p_comment_id uuid, p_cpf text, p_reaction_type text)
RETURNS jsonb
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
    RETURN jsonb_build_object('error', 'Not a community member');
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
      COALESCE(reactions_summary, '{}'::jsonb),
      ARRAY[p_reaction_type],
      to_jsonb(GREATEST(0, COALESCE((reactions_summary->>p_reaction_type)::int, 0) - 1))
    )
    WHERE id = p_comment_id
    RETURNING reactions_summary INTO v_new_summary;
  ELSE
    INSERT INTO vault_community_comment_reactions (comment_id, user_id, reaction_type)
    VALUES (p_comment_id, v_member_id, p_reaction_type);
    
    UPDATE vault_community_comments 
    SET reactions_summary = jsonb_set(
      COALESCE(reactions_summary, '{}'::jsonb),
      ARRAY[p_reaction_type],
      to_jsonb(COALESCE((reactions_summary->>p_reaction_type)::int, 0) + 1)
    )
    WHERE id = p_comment_id
    RETURNING reactions_summary INTO v_new_summary;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'added', NOT v_existing, 'summary', v_new_summary);
END;
$$;