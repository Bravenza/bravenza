DROP FUNCTION IF EXISTS public.get_vault_member_searches(character varying);

CREATE OR REPLACE FUNCTION public.get_vault_member_searches(p_cpf character varying)
 RETURNS TABLE(
   search_id uuid,
   wishlist_title character varying,
   status search_status,
   is_active boolean,
   started_at timestamp with time zone,
   last_update_at timestamp with time zone,
   has_match_room boolean,
   match_room_id uuid,
   decision_status match_decision_status,
   progress_message text,
   progress_percentage integer
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    s.id as search_id,
    COALESCE(w.title, w.product_name) as wishlist_title,
    s.status,
    s.is_active,
    s.started_at,
    s.last_update_at,
    (s.match_room_id IS NOT NULL) as has_match_room,
    s.match_room_id,
    mr.decision_status,
    s.progress_message,
    s.progress_percentage
  FROM public.vault_searches s
  INNER JOIN public.vault_members m ON m.id = s.user_id
  LEFT JOIN public.vault_wishlists w ON w.id = s.wishlist_item_id
  LEFT JOIN public.vault_match_rooms mr ON mr.id = s.match_room_id
  WHERE m.client_cpf = p_cpf
  ORDER BY s.created_at DESC;
$function$;