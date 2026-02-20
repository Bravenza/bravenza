
-- Fix: change view to SECURITY INVOKER (default is DEFINER in some contexts)
DROP VIEW IF EXISTS public.vault_member_rankings;

CREATE VIEW public.vault_member_rankings
WITH (security_invoker = true)
AS
SELECT
  vm.id as member_id,
  vm.display_name,
  vm.avatar_url,
  vm.tier,
  vm.client_name,
  vm.total_purchases,
  vm.stats_purchases_count_12m,
  vm.stats_converted_invites,
  vm.posts_count,
  COALESCE(vls.current_streak, 0) as current_streak,
  COALESCE(vls.longest_streak, 0) as longest_streak,
  COALESCE(vls.total_logins, 0) as total_logins,
  (SELECT count(*) FROM vault_badges vb WHERE vb.member_id = vm.id) as badges_count,
  (
    COALESCE(vm.stats_purchases_count_12m, 0) * 30 +
    COALESCE(vls.current_streak, 0) * 5 +
    (SELECT count(*) FROM vault_badges vb WHERE vb.member_id = vm.id) * 20 +
    COALESCE(vm.stats_converted_invites, 0) * 15 +
    COALESCE(vm.posts_count, 0) * 10
  ) as total_score
FROM vault_members vm
LEFT JOIN vault_login_streaks vls ON vls.member_id = vm.id
WHERE vm.is_active = true AND vm.is_profile_public = true
ORDER BY total_score DESC;
