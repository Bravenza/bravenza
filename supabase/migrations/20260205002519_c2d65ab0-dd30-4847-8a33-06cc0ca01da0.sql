
-- Drop old function versions with varchar that return boolean/uuid
DROP FUNCTION IF EXISTS toggle_post_like(uuid, character varying);
DROP FUNCTION IF EXISTS toggle_comment_like(uuid, character varying);
DROP FUNCTION IF EXISTS add_post_comment(uuid, character varying, text, uuid);

-- Add unique constraints to prevent duplicate likes/reactions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vault_community_likes_post_user_unique'
  ) THEN
    ALTER TABLE vault_community_likes 
    ADD CONSTRAINT vault_community_likes_post_user_unique 
    UNIQUE (post_id, user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vault_community_reactions_unique'
  ) THEN
    ALTER TABLE vault_community_reactions 
    ADD CONSTRAINT vault_community_reactions_unique 
    UNIQUE (post_id, user_id, reaction_type);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vault_community_comment_likes_unique'
  ) THEN
    ALTER TABLE vault_community_comment_likes 
    ADD CONSTRAINT vault_community_comment_likes_unique 
    UNIQUE (comment_id, user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vault_community_comment_reactions_unique'
  ) THEN
    ALTER TABLE vault_community_comment_reactions 
    ADD CONSTRAINT vault_community_comment_reactions_unique 
    UNIQUE (comment_id, user_id, reaction_type);
  END IF;
END $$;

-- Recreate toggle_post_like with proper ON CONFLICT handling
CREATE OR REPLACE FUNCTION toggle_post_like(p_post_id UUID, p_cpf TEXT)
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
    INSERT INTO vault_community_likes (post_id, user_id) 
    VALUES (p_post_id, v_member_id)
    ON CONFLICT (post_id, user_id) DO NOTHING;
    
    UPDATE vault_community_posts 
    SET likes_count = COALESCE(likes_count, 0) + 1 
    WHERE id = p_post_id
    RETURNING likes_count INTO v_new_count;
    v_liked := true;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'liked', v_liked, 'likes_count', COALESCE(v_new_count, 0));
END;
$$;

-- Recreate toggle_comment_like with proper handling
CREATE OR REPLACE FUNCTION toggle_comment_like(p_comment_id UUID, p_cpf TEXT)
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
    INSERT INTO vault_community_comment_likes (comment_id, user_id) 
    VALUES (p_comment_id, v_member_id)
    ON CONFLICT (comment_id, user_id) DO NOTHING;
    
    UPDATE vault_community_comments 
    SET likes_count = COALESCE(likes_count, 0) + 1 
    WHERE id = p_comment_id
    RETURNING likes_count INTO v_new_count;
    v_liked := true;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'liked', v_liked, 'likes_count', COALESCE(v_new_count, 0));
END;
$$;

-- Recreate toggle_post_reaction with proper ON CONFLICT
CREATE OR REPLACE FUNCTION toggle_post_reaction(p_post_id UUID, p_cpf TEXT, p_reaction_type TEXT)
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
    ON CONFLICT (post_id, user_id, reaction_type) DO NOTHING;
    
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

-- Recreate toggle_comment_reaction with proper handling
CREATE OR REPLACE FUNCTION toggle_comment_reaction(p_comment_id UUID, p_cpf TEXT, p_reaction_type TEXT)
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
    ON CONFLICT (comment_id, user_id, reaction_type) DO NOTHING;
    
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

-- Recreate add_post_comment with proper return type
CREATE OR REPLACE FUNCTION add_post_comment(p_post_id UUID, p_cpf TEXT, p_content TEXT, p_parent_id UUID DEFAULT NULL)
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
