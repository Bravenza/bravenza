-- Add engagement fields to existing posts table
ALTER TABLE vault_community_posts 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;

-- Create likes table
CREATE TABLE vault_community_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES vault_community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES vault_members(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create comments table
CREATE TABLE vault_community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES vault_community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES vault_members(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES vault_community_comments(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  edited_at TIMESTAMP WITH TIME ZONE
);

-- Create comment likes table
CREATE TABLE vault_community_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES vault_community_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES vault_members(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Create user activity/presence table
CREATE TABLE vault_community_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES vault_members(id) ON DELETE CASCADE UNIQUE,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status VARCHAR(20) DEFAULT 'online'
);

-- Enable RLS
ALTER TABLE vault_community_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_community_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_community_presence ENABLE ROW LEVEL SECURITY;

-- RLS Policies for likes
CREATE POLICY "Admins full access to vault_community_likes" ON vault_community_likes
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Service can manage vault_community_likes" ON vault_community_likes
  FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for comments
CREATE POLICY "Admins full access to vault_community_comments" ON vault_community_comments
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Service can manage vault_community_comments" ON vault_community_comments
  FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for comment likes
CREATE POLICY "Admins full access to vault_community_comment_likes" ON vault_community_comment_likes
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Service can manage vault_community_comment_likes" ON vault_community_comment_likes
  FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for presence
CREATE POLICY "Admins full access to vault_community_presence" ON vault_community_presence
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Service can manage vault_community_presence" ON vault_community_presence
  FOR ALL USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_community_likes_post ON vault_community_likes(post_id);
CREATE INDEX idx_community_likes_user ON vault_community_likes(user_id);
CREATE INDEX idx_community_comments_post ON vault_community_comments(post_id);
CREATE INDEX idx_community_comments_user ON vault_community_comments(user_id);
CREATE INDEX idx_community_presence_last_seen ON vault_community_presence(last_seen_at);

-- Function to get community feed
CREATE OR REPLACE FUNCTION get_vault_community_feed(p_cpf VARCHAR, p_limit INTEGER DEFAULT 20, p_offset INTEGER DEFAULT 0)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  author_name VARCHAR,
  author_tier VARCHAR,
  author_items_count BIGINT,
  type VARCHAR,
  title VARCHAR,
  content TEXT,
  attachments TEXT[],
  likes_count INTEGER,
  comments_count INTEGER,
  is_pinned BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  has_liked BOOLEAN
) AS $$
DECLARE
  v_member_id UUID;
BEGIN
  SELECT vm.id INTO v_member_id FROM vault_members vm WHERE vm.client_cpf = p_cpf;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    m.client_name::VARCHAR AS author_name,
    m.tier::VARCHAR AS author_tier,
    (SELECT COUNT(*) FROM vault_items vi WHERE vi.user_id = m.id) AS author_items_count,
    p.type::VARCHAR,
    p.title,
    p.content,
    p.attachments,
    COALESCE(p.likes_count, 0) AS likes_count,
    COALESCE(p.comments_count, 0) AS comments_count,
    COALESCE(p.is_pinned, false) AS is_pinned,
    p.created_at,
    EXISTS(SELECT 1 FROM vault_community_likes l WHERE l.post_id = p.id AND l.user_id = v_member_id) AS has_liked
  FROM vault_community_posts p
  JOIN vault_members m ON p.user_id = m.id
  WHERE p.status = 'APPROVED'
  ORDER BY p.is_pinned DESC NULLS LAST, p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get post comments
CREATE OR REPLACE FUNCTION get_post_comments(p_post_id UUID, p_cpf VARCHAR)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  author_name VARCHAR,
  author_tier VARCHAR,
  content TEXT,
  parent_id UUID,
  likes_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  has_liked BOOLEAN
) AS $$
DECLARE
  v_member_id UUID;
BEGIN
  SELECT vm.id INTO v_member_id FROM vault_members vm WHERE vm.client_cpf = p_cpf;
  
  RETURN QUERY
  SELECT 
    c.id,
    c.user_id,
    m.client_name::VARCHAR AS author_name,
    m.tier::VARCHAR AS author_tier,
    c.content,
    c.parent_id,
    COALESCE(c.likes_count, 0) AS likes_count,
    c.created_at,
    EXISTS(SELECT 1 FROM vault_community_comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = v_member_id) AS has_liked
  FROM vault_community_comments c
  JOIN vault_members m ON c.user_id = m.id
  WHERE c.post_id = p_post_id
  ORDER BY c.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle post like
CREATE OR REPLACE FUNCTION toggle_post_like(p_post_id UUID, p_cpf VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  v_member_id UUID;
  v_liked BOOLEAN;
BEGIN
  SELECT id INTO v_member_id FROM vault_members WHERE client_cpf = p_cpf;
  
  IF EXISTS(SELECT 1 FROM vault_community_likes WHERE post_id = p_post_id AND user_id = v_member_id) THEN
    DELETE FROM vault_community_likes WHERE post_id = p_post_id AND user_id = v_member_id;
    UPDATE vault_community_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = p_post_id;
    v_liked := false;
  ELSE
    INSERT INTO vault_community_likes (post_id, user_id) VALUES (p_post_id, v_member_id);
    UPDATE vault_community_posts SET likes_count = likes_count + 1 WHERE id = p_post_id;
    v_liked := true;
  END IF;
  
  RETURN v_liked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add comment
CREATE OR REPLACE FUNCTION add_post_comment(p_post_id UUID, p_cpf VARCHAR, p_content TEXT, p_parent_id UUID DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  v_member_id UUID;
  v_comment_id UUID;
BEGIN
  SELECT id INTO v_member_id FROM vault_members WHERE client_cpf = p_cpf;
  
  INSERT INTO vault_community_comments (post_id, user_id, content, parent_id)
  VALUES (p_post_id, v_member_id, p_content, p_parent_id)
  RETURNING id INTO v_comment_id;
  
  UPDATE vault_community_posts SET comments_count = comments_count + 1 WHERE id = p_post_id;
  
  RETURN v_comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle comment like
CREATE OR REPLACE FUNCTION toggle_comment_like(p_comment_id UUID, p_cpf VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  v_member_id UUID;
  v_liked BOOLEAN;
BEGIN
  SELECT id INTO v_member_id FROM vault_members WHERE client_cpf = p_cpf;
  
  IF EXISTS(SELECT 1 FROM vault_community_comment_likes WHERE comment_id = p_comment_id AND user_id = v_member_id) THEN
    DELETE FROM vault_community_comment_likes WHERE comment_id = p_comment_id AND user_id = v_member_id;
    UPDATE vault_community_comments SET likes_count = GREATEST(0, likes_count - 1) WHERE id = p_comment_id;
    v_liked := false;
  ELSE
    INSERT INTO vault_community_comment_likes (comment_id, user_id) VALUES (p_comment_id, v_member_id);
    UPDATE vault_community_comments SET likes_count = likes_count + 1 WHERE id = p_comment_id;
    v_liked := true;
  END IF;
  
  RETURN v_liked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update presence
CREATE OR REPLACE FUNCTION update_presence(p_cpf VARCHAR)
RETURNS void AS $$
DECLARE
  v_member_id UUID;
BEGIN
  SELECT id INTO v_member_id FROM vault_members WHERE client_cpf = p_cpf;
  
  INSERT INTO vault_community_presence (user_id, last_seen_at, status)
  VALUES (v_member_id, now(), 'online')
  ON CONFLICT (user_id) DO UPDATE SET last_seen_at = now(), status = 'online';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get online users
CREATE OR REPLACE FUNCTION get_online_community_users(p_minutes INTEGER DEFAULT 5)
RETURNS TABLE (
  user_id UUID,
  user_name VARCHAR,
  user_tier VARCHAR,
  items_count BIGINT,
  last_seen_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id AS user_id,
    m.client_name::VARCHAR AS user_name,
    m.tier::VARCHAR AS user_tier,
    (SELECT COUNT(*) FROM vault_items vi WHERE vi.user_id = m.id) AS items_count,
    p.last_seen_at
  FROM vault_community_presence p
  JOIN vault_members m ON p.user_id = m.id
  WHERE p.last_seen_at > now() - (p_minutes || ' minutes')::INTERVAL
    AND m.community_opt_in = true
  ORDER BY p.last_seen_at DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get trending posts (most liked in last 7 days)
CREATE OR REPLACE FUNCTION get_trending_posts(p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  author_name VARCHAR,
  likes_count INTEGER,
  comments_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    m.client_name::VARCHAR AS author_name,
    COALESCE(p.likes_count, 0) AS likes_count,
    COALESCE(p.comments_count, 0) AS comments_count
  FROM vault_community_posts p
  JOIN vault_members m ON p.user_id = m.id
  WHERE p.status = 'APPROVED'
    AND p.created_at > now() - '7 days'::INTERVAL
  ORDER BY p.likes_count DESC, p.comments_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for community tables
ALTER PUBLICATION supabase_realtime ADD TABLE vault_community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE vault_community_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE vault_community_presence;