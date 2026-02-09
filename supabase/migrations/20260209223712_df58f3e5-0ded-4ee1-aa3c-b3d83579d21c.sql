-- Drop both functions first
DROP FUNCTION IF EXISTS public.get_trending_posts(INTEGER);
DROP FUNCTION IF EXISTS public.get_vault_member(TEXT);

-- Recreate get_trending_posts with correct 'PUBLISHED' enum
CREATE FUNCTION public.get_trending_posts(p_limit INTEGER DEFAULT 5)
RETURNS TABLE(
  id UUID,
  title TEXT,
  author_name VARCHAR,
  likes_count INTEGER,
  comments_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  WHERE p.status = 'PUBLISHED'
    AND p.created_at > now() - '7 days'::INTERVAL
  ORDER BY p.likes_count DESC, p.comments_count DESC
  LIMIT p_limit;
END;
$$;

-- Recreate get_vault_member with correct hunt_status filter
CREATE FUNCTION public.get_vault_member(p_cpf TEXT)
RETURNS TABLE(
  id UUID,
  tier TEXT,
  total_purchases INTEGER,
  active_hunts INTEGER,
  max_active_hunts INTEGER,
  max_wishlist_items INTEGER,
  invites_remaining INTEGER,
  community_opt_in BOOLEAN,
  client_name TEXT,
  joined_via TEXT,
  preferred_sizes TEXT[],
  preferred_brands TEXT[],
  created_at TIMESTAMPTZ,
  stats_purchases_count_12m INTEGER,
  stats_spend_total_12m NUMERIC,
  stats_decision_rate NUMERIC,
  stats_converted_invites INTEGER,
  following_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vm.id,
    vm.tier,
    vm.total_purchases,
    (SELECT COUNT(*)::INTEGER FROM vault_wishlists w WHERE w.member_id = vm.id AND w.status NOT IN ('confirmed', 'converted', 'cancelled')),
    vm.max_active_hunts,
    vm.max_wishlist_items,
    vm.invites_remaining,
    COALESCE(vm.community_opt_in, false),
    vm.client_name,
    vm.joined_via,
    vm.preferred_sizes,
    vm.preferred_brands,
    vm.created_at,
    vm.stats_purchases_count_12m,
    vm.stats_spend_total_12m,
    vm.stats_decision_rate,
    vm.stats_converted_invites,
    COALESCE((SELECT COUNT(*)::INTEGER FROM vault_community_follows f WHERE f.follower_id = vm.id), 0)
  FROM vault_members vm
  WHERE vm.client_cpf = p_cpf;
END;
$$;