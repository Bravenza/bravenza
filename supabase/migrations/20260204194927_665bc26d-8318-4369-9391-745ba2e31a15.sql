-- Drop and recreate get_vault_community_posts
DROP FUNCTION IF EXISTS get_vault_community_posts(VARCHAR);

CREATE OR REPLACE FUNCTION get_vault_community_posts(p_cpf VARCHAR)
RETURNS TABLE (
  id UUID,
  author_name VARCHAR,
  author_tier VARCHAR,
  type VARCHAR,
  title VARCHAR,
  content TEXT,
  attachments TEXT[],
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    m.client_name::VARCHAR AS author_name,
    m.tier::VARCHAR AS author_tier,
    p.type::VARCHAR,
    p.title,
    p.content,
    p.attachments,
    p.created_at
  FROM vault_community_posts p
  JOIN vault_members m ON p.user_id = m.id
  WHERE p.status = 'PUBLISHED'
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;