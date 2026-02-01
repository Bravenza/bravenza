
-- Drop and recreate get_vault_member with all required fields
DROP FUNCTION IF EXISTS get_vault_member(text);

CREATE OR REPLACE FUNCTION get_vault_member(p_cpf TEXT)
RETURNS TABLE(
  id UUID,
  tier vault_tier,
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
  -- Stats fields for progress tracking
  stats_purchases_count_12m INTEGER,
  stats_spend_total_12m NUMERIC,
  stats_decision_rate NUMERIC,
  stats_converted_invites INTEGER
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
    vm.active_hunts,
    vm.max_active_hunts,
    vm.max_wishlist_items,
    vm.invites_remaining,
    vm.community_opt_in,
    vm.client_name::TEXT,
    vm.joined_via::TEXT,
    vm.preferred_sizes,
    vm.preferred_brands,
    vm.created_at,
    -- Stats fields
    vm.stats_purchases_count_12m,
    vm.stats_spend_total_12m,
    vm.stats_decision_rate,
    vm.stats_converted_invites
  FROM vault_members vm
  WHERE vm.client_cpf = p_cpf
    AND vm.is_active = true
    AND vm.status = 'ACTIVE';
END;
$$;
