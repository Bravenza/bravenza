-- Drop all existing versions of the functions
DROP FUNCTION IF EXISTS public.get_vault_community_feed(TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.get_vault_community_feed(VARCHAR, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.get_following_feed(TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.get_following_feed(VARCHAR, INTEGER, INTEGER);

-- Create reports table for community posts
CREATE TABLE IF NOT EXISTS public.vault_community_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.vault_community_posts(id) ON DELETE CASCADE NOT NULL,
  reporter_id UUID REFERENCES public.vault_members(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'action_taken')),
  reviewed_by_admin_id UUID,
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, reporter_id)
);

-- Enable RLS
ALTER TABLE public.vault_community_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Members can report posts" ON public.vault_community_reports;
DROP POLICY IF EXISTS "Members can view own reports" ON public.vault_community_reports;
DROP POLICY IF EXISTS "Admins can update reports" ON public.vault_community_reports;

-- Members can create reports
CREATE POLICY "Members can report posts"
ON public.vault_community_reports
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM vault_members vm WHERE vm.id = reporter_id AND vm.community_opt_in = true)
);

-- Members can view their own reports
CREATE POLICY "Members can view own reports"
ON public.vault_community_reports
FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM vault_members vm WHERE vm.id = reporter_id)
  OR public.is_admin()
);

-- Admins can update reports
CREATE POLICY "Admins can update reports"
ON public.vault_community_reports
FOR UPDATE
TO authenticated
USING (public.is_admin());

-- Add report count to posts if not exists
ALTER TABLE public.vault_community_posts 
ADD COLUMN IF NOT EXISTS reports_count INTEGER DEFAULT 0;

-- Update default status to PUBLISHED so posts appear immediately
UPDATE public.vault_community_posts 
SET status = 'PUBLISHED' 
WHERE status = 'PENDING_REVIEW';

-- Function to report a post
CREATE OR REPLACE FUNCTION public.report_community_post(
  p_cpf TEXT,
  p_post_id UUID,
  p_reason TEXT,
  p_details TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id UUID;
  v_report_id UUID;
  v_post_title TEXT;
BEGIN
  SELECT id INTO v_member_id FROM vault_members WHERE cpf = p_cpf AND community_opt_in = true;
  
  IF v_member_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Member not found or not opted in');
  END IF;
  
  IF EXISTS (SELECT 1 FROM vault_community_reports WHERE post_id = p_post_id AND reporter_id = v_member_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You already reported this post');
  END IF;
  
  SELECT p.title INTO v_post_title
  FROM vault_community_posts p
  WHERE p.id = p_post_id;
  
  IF v_post_title IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Post not found');
  END IF;
  
  INSERT INTO vault_community_reports (post_id, reporter_id, reason, details)
  VALUES (p_post_id, v_member_id, p_reason, p_details)
  RETURNING id INTO v_report_id;
  
  UPDATE vault_community_posts 
  SET reports_count = COALESCE(reports_count, 0) + 1
  WHERE id = p_post_id;
  
  UPDATE vault_community_posts 
  SET status = 'PENDING_REVIEW'
  WHERE id = p_post_id AND reports_count >= 3 AND status = 'PUBLISHED';
  
  RETURN jsonb_build_object('success', true, 'report_id', v_report_id, 'post_title', v_post_title);
END;
$$;

-- Recreate get_vault_community_feed to show PUBLISHED posts
CREATE FUNCTION public.get_vault_community_feed(
  p_cpf TEXT,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  author_id UUID,
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
  likes_count INTEGER,
  comments_count INTEGER,
  is_pinned BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id UUID;
BEGIN
  SELECT vm.id INTO v_member_id FROM vault_members vm WHERE vm.cpf = p_cpf AND vm.community_opt_in = true;
  IF v_member_id IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT 
    p.id, p.user_id, vm.full_name, vm.tier::TEXT, vm.avatar_url,
    p.type::TEXT, p.title, p.content, p.attachments, p.media_types,
    COALESCE(p.reactions_summary, '{"like":0,"fire":0,"clap":0,"wow":0,"love":0}'::jsonb),
    ARRAY(SELECT r.reaction_type FROM vault_community_reactions r WHERE r.post_id = p.id AND r.user_id = v_member_id),
    COALESCE(p.likes_count, 0), COALESCE(p.comments_count, 0), COALESCE(p.is_pinned, false), p.created_at
  FROM vault_community_posts p
  JOIN vault_members vm ON vm.id = p.user_id
  WHERE p.status = 'PUBLISHED'
  ORDER BY p.is_pinned DESC NULLS LAST, p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Recreate get_following_feed
CREATE FUNCTION public.get_following_feed(
  p_cpf TEXT,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  author_id UUID,
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
  likes_count INTEGER,
  comments_count INTEGER,
  is_pinned BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id UUID;
BEGIN
  SELECT vm.id INTO v_member_id FROM vault_members vm WHERE vm.cpf = p_cpf AND vm.community_opt_in = true;
  IF v_member_id IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT 
    p.id, p.user_id, vm.full_name, vm.tier::TEXT, vm.avatar_url,
    p.type::TEXT, p.title, p.content, p.attachments, p.media_types,
    COALESCE(p.reactions_summary, '{"like":0,"fire":0,"clap":0,"wow":0,"love":0}'::jsonb),
    ARRAY(SELECT r.reaction_type FROM vault_community_reactions r WHERE r.post_id = p.id AND r.user_id = v_member_id),
    COALESCE(p.likes_count, 0), COALESCE(p.comments_count, 0), COALESCE(p.is_pinned, false), p.created_at
  FROM vault_community_posts p
  JOIN vault_members vm ON vm.id = p.user_id
  JOIN vault_community_follows f ON f.following_id = p.user_id AND f.follower_id = v_member_id
  WHERE p.status = 'PUBLISHED'
  ORDER BY p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.report_community_post TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_vault_community_feed TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_following_feed TO authenticated;