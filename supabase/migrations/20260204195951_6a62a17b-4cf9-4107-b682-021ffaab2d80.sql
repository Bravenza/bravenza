-- Create reactions table for posts (multiple emoji reactions)
CREATE TABLE IF NOT EXISTS public.vault_community_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.vault_community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.vault_members(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'fire', 'clap', 'wow', 'love')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id, reaction_type)
);

-- Create reactions table for comments
CREATE TABLE IF NOT EXISTS public.vault_community_comment_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.vault_community_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.vault_members(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'fire', 'clap', 'wow', 'love')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comment_id, user_id, reaction_type)
);

-- Add reactions_summary JSONB column to posts for caching reaction counts
ALTER TABLE public.vault_community_posts 
ADD COLUMN IF NOT EXISTS reactions_summary JSONB DEFAULT '{"like":0,"fire":0,"clap":0,"wow":0,"love":0}'::jsonb;

-- Add reactions_summary to comments
ALTER TABLE public.vault_community_comments 
ADD COLUMN IF NOT EXISTS reactions_summary JSONB DEFAULT '{"like":0,"fire":0,"clap":0,"wow":0,"love":0}'::jsonb;

-- Add media_type column to track video vs image attachments
ALTER TABLE public.vault_community_posts 
ADD COLUMN IF NOT EXISTS media_types TEXT[] DEFAULT '{}';

-- Enable RLS
ALTER TABLE public.vault_community_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_community_comment_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reactions
CREATE POLICY "Community members can view reactions"
  ON public.vault_community_reactions FOR SELECT
  USING (true);

CREATE POLICY "Community members can add reactions"
  ON public.vault_community_reactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vault_members 
      WHERE id = user_id AND community_opt_in = true
    )
  );

CREATE POLICY "Users can delete own reactions"
  ON public.vault_community_reactions FOR DELETE
  USING (user_id IN (SELECT id FROM vault_members WHERE client_cpf = current_setting('app.current_cpf', true)));

-- RLS for comment reactions
CREATE POLICY "Community members can view comment reactions"
  ON public.vault_community_comment_reactions FOR SELECT
  USING (true);

CREATE POLICY "Community members can add comment reactions"
  ON public.vault_community_comment_reactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vault_members 
      WHERE id = user_id AND community_opt_in = true
    )
  );

CREATE POLICY "Users can delete own comment reactions"
  ON public.vault_community_comment_reactions FOR DELETE
  USING (user_id IN (SELECT id FROM vault_members WHERE client_cpf = current_setting('app.current_cpf', true)));

-- Function to toggle reaction on post
CREATE OR REPLACE FUNCTION public.toggle_post_reaction(
  p_post_id UUID,
  p_cpf TEXT,
  p_reaction_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id UUID;
  v_existing BOOLEAN;
  v_new_summary JSONB;
BEGIN
  SELECT id INTO v_member_id FROM vault_members WHERE client_cpf = p_cpf AND community_opt_in = true;
  IF v_member_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not a community member');
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
      COALESCE(reactions_summary, '{}'::jsonb),
      ARRAY[p_reaction_type],
      to_jsonb(GREATEST(0, COALESCE((reactions_summary->>p_reaction_type)::int, 0) - 1))
    )
    WHERE id = p_post_id
    RETURNING reactions_summary INTO v_new_summary;
  ELSE
    INSERT INTO vault_community_reactions (post_id, user_id, reaction_type)
    VALUES (p_post_id, v_member_id, p_reaction_type);
    
    UPDATE vault_community_posts 
    SET reactions_summary = jsonb_set(
      COALESCE(reactions_summary, '{}'::jsonb),
      ARRAY[p_reaction_type],
      to_jsonb(COALESCE((reactions_summary->>p_reaction_type)::int, 0) + 1)
    )
    WHERE id = p_post_id
    RETURNING reactions_summary INTO v_new_summary;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'added', NOT v_existing, 'summary', v_new_summary);
END;
$$;

-- Function to toggle reaction on comment
CREATE OR REPLACE FUNCTION public.toggle_comment_reaction(
  p_comment_id UUID,
  p_cpf TEXT,
  p_reaction_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id UUID;
  v_existing BOOLEAN;
  v_new_summary JSONB;
BEGIN
  SELECT id INTO v_member_id FROM vault_members WHERE client_cpf = p_cpf AND community_opt_in = true;
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

-- Update get_post_comments to include user reactions
DROP FUNCTION IF EXISTS public.get_post_comments(UUID, TEXT);
CREATE OR REPLACE FUNCTION public.get_post_comments(
  p_post_id UUID,
  p_cpf TEXT
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  author_name TEXT,
  author_tier TEXT,
  content TEXT,
  parent_id UUID,
  likes_count INT,
  reactions_summary JSONB,
  created_at TIMESTAMPTZ,
  has_liked BOOLEAN,
  user_reactions TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id UUID;
BEGIN
  SELECT vm.id INTO v_member_id FROM vault_members vm WHERE vm.client_cpf = p_cpf;
  
  RETURN QUERY
  SELECT 
    c.id,
    c.user_id,
    m.display_name AS author_name,
    m.tier::TEXT AS author_tier,
    c.content,
    c.parent_id,
    COALESCE(c.likes_count, 0)::INT AS likes_count,
    COALESCE(c.reactions_summary, '{"like":0,"fire":0,"clap":0,"wow":0,"love":0}'::jsonb) AS reactions_summary,
    c.created_at,
    EXISTS(
      SELECT 1 FROM vault_community_comment_likes cl 
      WHERE cl.comment_id = c.id AND cl.user_id = v_member_id
    ) AS has_liked,
    ARRAY(
      SELECT cr.reaction_type FROM vault_community_comment_reactions cr
      WHERE cr.comment_id = c.id AND cr.user_id = v_member_id
    ) AS user_reactions
  FROM vault_community_comments c
  JOIN vault_members m ON m.id = c.user_id
  WHERE c.post_id = p_post_id
  ORDER BY c.created_at ASC;
END;
$$;

-- Update get_vault_community_feed to include reactions
DROP FUNCTION IF EXISTS public.get_vault_community_feed(TEXT, INT, INT);
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
  author_items_count BIGINT,
  type TEXT,
  title TEXT,
  content TEXT,
  attachments TEXT[],
  media_types TEXT[],
  likes_count INT,
  comments_count INT,
  reactions_summary JSONB,
  is_pinned BOOLEAN,
  created_at TIMESTAMPTZ,
  has_liked BOOLEAN,
  user_reactions TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id UUID;
BEGIN
  SELECT vm.id INTO v_member_id FROM vault_members vm WHERE vm.client_cpf = p_cpf;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    m.display_name AS author_name,
    m.tier::TEXT AS author_tier,
    (SELECT COUNT(*) FROM vault_items vi WHERE vi.user_id = m.id)::BIGINT AS author_items_count,
    p.type::TEXT,
    p.title,
    p.content,
    COALESCE(p.attachments, '{}') AS attachments,
    COALESCE(p.media_types, '{}') AS media_types,
    COALESCE(p.likes_count, 0)::INT AS likes_count,
    COALESCE(p.comments_count, 0)::INT AS comments_count,
    COALESCE(p.reactions_summary, '{"like":0,"fire":0,"clap":0,"wow":0,"love":0}'::jsonb) AS reactions_summary,
    COALESCE(p.is_pinned, false) AS is_pinned,
    p.created_at,
    EXISTS(
      SELECT 1 FROM vault_community_likes l 
      WHERE l.post_id = p.id AND l.user_id = v_member_id
    ) AS has_liked,
    ARRAY(
      SELECT r.reaction_type FROM vault_community_reactions r
      WHERE r.post_id = p.id AND r.user_id = v_member_id
    ) AS user_reactions
  FROM vault_community_posts p
  JOIN vault_members m ON m.id = p.user_id
  WHERE p.status = 'PUBLISHED'
  ORDER BY p.is_pinned DESC, p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.vault_community_reactions;