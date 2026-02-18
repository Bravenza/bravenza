-- Add hide_online_status column to vault_members
ALTER TABLE public.vault_members 
ADD COLUMN IF NOT EXISTS hide_online_status boolean NOT NULL DEFAULT false;

-- Update the presence query function to respect privacy
CREATE OR REPLACE FUNCTION public.get_online_community_users(p_minutes integer DEFAULT 5)
 RETURNS TABLE(user_id uuid, user_name character varying, user_tier character varying, items_count bigint, last_seen_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT m.id AS user_id, m.client_name::VARCHAR AS user_name, m.tier::VARCHAR AS user_tier,
    (SELECT COUNT(*) FROM vault_items vi WHERE vi.user_id = m.id) AS items_count, p.last_seen_at
  FROM vault_community_presence p
  JOIN vault_members m ON p.user_id = m.id
  WHERE p.last_seen_at > now() - (p_minutes || ' minutes')::INTERVAL 
    AND m.community_opt_in = true
    AND m.hide_online_status = false
  ORDER BY p.last_seen_at DESC LIMIT 20;
END;
$$;