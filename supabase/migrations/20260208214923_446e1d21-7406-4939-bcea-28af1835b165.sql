
CREATE OR REPLACE FUNCTION public.get_trending_posts(p_limit integer DEFAULT 5)
RETURNS TABLE(id uuid, title character varying, author_name character varying, likes_count integer, comments_count integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $function$
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
$function$;
