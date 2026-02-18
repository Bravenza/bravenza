
-- Fix get_vault_member: drop old signature and recreate with assert_caller_owns_cpf
DROP FUNCTION IF EXISTS public.get_vault_member(text);

CREATE OR REPLACE FUNCTION public.get_vault_member(p_cpf text)
RETURNS TABLE(
  id uuid, tier text, total_purchases integer, active_hunts integer,
  max_active_hunts integer, max_wishlist_items integer, invites_remaining integer,
  community_opt_in boolean, client_name text, joined_via text,
  preferred_sizes text[], preferred_brands text[],
  created_at timestamp with time zone,
  stats_purchases_count_12m integer, stats_spend_total_12m numeric,
  stats_decision_rate numeric, stats_converted_invites integer,
  following_count integer
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM assert_caller_owns_cpf(p_cpf);

  RETURN QUERY
  SELECT 
    m.id, m.tier::text, m.total_purchases, m.active_hunts,
    m.max_active_hunts, m.max_wishlist_items, m.invites_remaining,
    m.community_opt_in, m.client_name::text, m.joined_via::text,
    m.preferred_sizes, m.preferred_brands,
    m.created_at,
    m.stats_purchases_count_12m, m.stats_spend_total_12m,
    m.stats_decision_rate, m.stats_converted_invites,
    COALESCE((SELECT COUNT(*)::integer FROM vault_community_follows f WHERE f.follower_id = m.id), 0) as following_count
  FROM vault_members m
  WHERE m.client_cpf = p_cpf AND m.is_active = true;
END;
$function$;

-- Fix get_vault_member_wishlists: drop old varchar signature and recreate
DROP FUNCTION IF EXISTS public.get_vault_member_wishlists(character varying);

CREATE OR REPLACE FUNCTION public.get_vault_member_wishlists(p_cpf character varying)
RETURNS TABLE(
  id uuid, title character varying, product_brand character varying,
  product_model character varying, product_size character varying,
  product_color character varying, condition_pref character varying,
  urgency_level character varying, priority integer,
  min_price numeric, max_price numeric, notes text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM assert_caller_owns_cpf(p_cpf::text);

  RETURN QUERY
  SELECT 
    w.id, COALESCE(w.title, w.product_name)::varchar, w.product_brand, w.product_model,
    w.product_size, w.product_color, w.condition_pref::varchar, w.urgency_level::varchar,
    COALESCE(w.priority, 3), w.min_price, w.max_price, w.notes, w.created_at
  FROM public.vault_wishlists w
  INNER JOIN public.vault_members m ON m.id = w.member_id
  WHERE m.client_cpf = p_cpf
  ORDER BY w.priority DESC, w.created_at DESC;
END;
$function$;
