
-- Drop functions with mismatched return types
DROP FUNCTION IF EXISTS public.get_vault_member_wishlists(character varying);
DROP FUNCTION IF EXISTS public.ensure_vault_membership(character varying);

-- get_vault_member_wishlists — with auth check (title as varchar to match original)
CREATE OR REPLACE FUNCTION public.get_vault_member_wishlists(p_cpf character varying)
RETURNS TABLE(
  id uuid, title character varying, product_brand character varying, product_model character varying,
  product_size character varying, product_color character varying,
  condition_pref character varying, urgency_level character varying,
  priority integer, min_price numeric, max_price numeric, notes text, created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- ensure_vault_membership — with auth check (is_new_member to match original)
CREATE OR REPLACE FUNCTION public.ensure_vault_membership(p_cpf character varying)
RETURNS TABLE(
  id uuid, tier public.vault_tier, total_purchases integer, active_hunts integer,
  max_active_hunts integer, max_wishlist_items integer, invites_remaining integer,
  community_opt_in boolean, client_name text, joined_via text, is_new_member boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id uuid;
  v_client_name VARCHAR;
  v_client_email VARCHAR;
  v_is_new boolean := false;
BEGIN
  PERFORM assert_caller_owns_cpf(p_cpf::text);

  SELECT vm.id INTO v_member_id
  FROM vault_members vm WHERE vm.client_cpf = p_cpf AND vm.is_active = true;
  
  IF v_member_id IS NULL THEN
    SELECT o.client_name, o.client_email INTO v_client_name, v_client_email
    FROM orders o WHERE o.client_cpf = p_cpf ORDER BY o.created_at DESC LIMIT 1;
    
    IF v_client_name IS NOT NULL THEN
      v_member_id := auto_enroll_vault_member(p_cpf, v_client_name, v_client_email);
      v_is_new := true;
    END IF;
  END IF;
  
  RETURN QUERY
  SELECT vm.id, vm.tier, vm.total_purchases, vm.active_hunts,
    vm.max_active_hunts, vm.max_wishlist_items, vm.invites_remaining,
    vm.community_opt_in, vm.client_name::text, vm.joined_via::text, v_is_new
  FROM vault_members vm
  WHERE vm.id = v_member_id AND vm.is_active = true AND vm.status = 'ACTIVE';
END;
$$;

-- get_vault_intel_posts — with auth check
CREATE OR REPLACE FUNCTION public.get_vault_intel_posts(p_cpf text)
RETURNS TABLE(
  id uuid, type text, title text, content text, excerpt text, cover_image text,
  media_urls text[], video_url text, external_link text, read_time_min integer,
  is_featured boolean, visibility text, published_at timestamptz, likes_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier public.vault_tier;
BEGIN
  PERFORM assert_caller_owns_cpf(p_cpf);

  SELECT vm.tier INTO v_tier FROM public.vault_members vm WHERE vm.client_cpf = p_cpf;
  
  RETURN QUERY
  SELECT ip.id, ip.type::TEXT, ip.title::TEXT, ip.content::TEXT, ip.excerpt::TEXT,
    ip.cover_image::TEXT, ip.media_urls::TEXT[], ip.video_url::TEXT,
    ip.external_link::TEXT, ip.read_time_min, ip.is_featured, ip.visibility::TEXT,
    ip.published_at, ip.likes_count
  FROM public.vault_intel_posts ip
  WHERE ip.status = 'PUBLISHED' AND ip.published_at <= NOW()
    AND (ip.visibility = 'ALL'
      OR (ip.visibility = 'PRIVILEGE_PLUS' AND v_tier IN ('collector', 'elite'))
      OR (ip.visibility = 'BLACK_ONLY' AND v_tier = 'elite'))
  ORDER BY ip.published_at DESC;
END;
$$;

-- approve_vault_match — with auth check
CREATE OR REPLACE FUNCTION public.approve_vault_match(p_cpf character varying, p_match_room_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id uuid;
  v_search_id uuid;
BEGIN
  PERFORM assert_caller_owns_cpf(p_cpf::text);

  SELECT m.id, mr.search_id INTO v_member_id, v_search_id
  FROM public.vault_match_rooms mr
  INNER JOIN public.vault_members m ON m.id = mr.user_id
  WHERE m.client_cpf = p_cpf AND mr.id = p_match_room_id;
  
  IF v_member_id IS NULL THEN RAISE EXCEPTION 'Match room não encontrada'; END IF;
  
  UPDATE public.vault_match_rooms SET decision_status = 'APPROVED', decision_at = NOW() WHERE id = p_match_room_id;
  UPDATE public.vault_searches SET status = 'CLOSED_APPROVED', is_active = false, last_update_at = NOW() WHERE id = v_search_id;
  UPDATE public.vault_members SET 
    stats_matches_approved = stats_matches_approved + 1,
    stats_decision_rate = CASE WHEN stats_matches_total > 0 THEN (stats_matches_approved + 1)::numeric / stats_matches_total ELSE 1 END,
    flags_consecutive_declines = 0
  WHERE id = v_member_id;
  
  RETURN TRUE;
END;
$$;

-- decline_vault_match — with auth check
CREATE OR REPLACE FUNCTION public.decline_vault_match(p_cpf character varying, p_match_room_id uuid, p_reason text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id uuid;
  v_search_id uuid;
  v_consecutive_declines integer;
BEGIN
  PERFORM assert_caller_owns_cpf(p_cpf::text);

  SELECT m.id, mr.search_id, m.flags_consecutive_declines INTO v_member_id, v_search_id, v_consecutive_declines
  FROM public.vault_match_rooms mr
  INNER JOIN public.vault_members m ON m.id = mr.user_id
  WHERE m.client_cpf = p_cpf AND mr.id = p_match_room_id;
  
  IF v_member_id IS NULL THEN RAISE EXCEPTION 'Match room não encontrada'; END IF;
  
  UPDATE public.vault_match_rooms SET decision_status = 'DECLINED', decision_at = NOW(), decision_notes_from_customer = p_reason WHERE id = p_match_room_id;
  UPDATE public.vault_searches SET status = 'IN_CURATION', match_room_id = NULL, last_update_at = NOW() WHERE id = v_search_id;
  
  v_consecutive_declines := v_consecutive_declines + 1;
  UPDATE public.vault_members SET 
    stats_matches_declined = stats_matches_declined + 1,
    stats_decision_rate = CASE WHEN stats_matches_total > 0 THEN stats_matches_approved::numeric / stats_matches_total ELSE 0 END,
    flags_consecutive_declines = v_consecutive_declines,
    flags_review_mode_until = CASE WHEN v_consecutive_declines >= 5 THEN NOW() + INTERVAL '30 days' ELSE flags_review_mode_until END
  WHERE id = v_member_id;
  
  RETURN TRUE;
END;
$$;

-- add_post_comment — with auth check
CREATE OR REPLACE FUNCTION public.add_post_comment(p_post_id uuid, p_cpf text, p_content text, p_parent_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id UUID;
  v_comment_id UUID;
  v_author_name TEXT;
  v_author_tier TEXT;
BEGIN
  PERFORM assert_caller_owns_cpf(p_cpf);

  SELECT id, COALESCE(display_name, client_name), tier::TEXT 
  INTO v_member_id, v_author_name, v_author_tier 
  FROM vault_members WHERE client_cpf = p_cpf;
  
  IF v_member_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Member not found');
  END IF;
  
  INSERT INTO vault_community_comments (post_id, user_id, content, parent_id)
  VALUES (p_post_id, v_member_id, p_content, p_parent_id)
  RETURNING id INTO v_comment_id;
  
  UPDATE vault_community_posts SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = p_post_id;
  
  RETURN jsonb_build_object('success', true, 'comment_id', v_comment_id, 'author_name', v_author_name, 'author_tier', v_author_tier);
END;
$$;

-- toggle_post_reaction — with auth check
CREATE OR REPLACE FUNCTION public.toggle_post_reaction(p_post_id uuid, p_cpf text, p_reaction_type text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id UUID;
  v_existing BOOLEAN;
  v_new_summary JSONB;
BEGIN
  PERFORM assert_caller_owns_cpf(p_cpf);

  SELECT id INTO v_member_id FROM vault_members WHERE client_cpf = p_cpf;
  IF v_member_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Member not found'); END IF;
  
  SELECT EXISTS(SELECT 1 FROM vault_community_reactions WHERE post_id = p_post_id AND user_id = v_member_id AND reaction_type = p_reaction_type) INTO v_existing;
  
  IF v_existing THEN
    DELETE FROM vault_community_reactions WHERE post_id = p_post_id AND user_id = v_member_id AND reaction_type = p_reaction_type;
    UPDATE vault_community_posts SET reactions_summary = jsonb_set(
      COALESCE(reactions_summary, '{"like":0,"fire":0,"clap":0,"wow":0,"love":0}'::jsonb),
      ARRAY[p_reaction_type], to_jsonb(GREATEST(0, COALESCE((reactions_summary->>p_reaction_type)::int, 0) - 1))
    ) WHERE id = p_post_id RETURNING reactions_summary INTO v_new_summary;
  ELSE
    INSERT INTO vault_community_reactions (post_id, user_id, reaction_type) VALUES (p_post_id, v_member_id, p_reaction_type) ON CONFLICT (post_id, user_id, reaction_type) DO NOTHING;
    UPDATE vault_community_posts SET reactions_summary = jsonb_set(
      COALESCE(reactions_summary, '{"like":0,"fire":0,"clap":0,"wow":0,"love":0}'::jsonb),
      ARRAY[p_reaction_type], to_jsonb(COALESCE((reactions_summary->>p_reaction_type)::int, 0) + 1)
    ) WHERE id = p_post_id RETURNING reactions_summary INTO v_new_summary;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'added', NOT v_existing, 'summary', COALESCE(v_new_summary, '{}'::jsonb));
END;
$$;

-- toggle_comment_reaction — with auth check
CREATE OR REPLACE FUNCTION public.toggle_comment_reaction(p_comment_id uuid, p_cpf text, p_reaction_type text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id UUID;
  v_existing BOOLEAN;
  v_new_summary JSONB;
BEGIN
  PERFORM assert_caller_owns_cpf(p_cpf);

  SELECT id INTO v_member_id FROM vault_members WHERE client_cpf = p_cpf;
  IF v_member_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Member not found'); END IF;
  
  SELECT EXISTS(SELECT 1 FROM vault_community_comment_reactions WHERE comment_id = p_comment_id AND user_id = v_member_id AND reaction_type = p_reaction_type) INTO v_existing;
  
  IF v_existing THEN
    DELETE FROM vault_community_comment_reactions WHERE comment_id = p_comment_id AND user_id = v_member_id AND reaction_type = p_reaction_type;
    UPDATE vault_community_comments SET reactions_summary = jsonb_set(
      COALESCE(reactions_summary, '{"like":0,"fire":0,"clap":0,"wow":0,"love":0}'::jsonb),
      ARRAY[p_reaction_type], to_jsonb(GREATEST(0, COALESCE((reactions_summary->>p_reaction_type)::int, 0) - 1))
    ) WHERE id = p_comment_id RETURNING reactions_summary INTO v_new_summary;
  ELSE
    INSERT INTO vault_community_comment_reactions (comment_id, user_id, reaction_type) VALUES (p_comment_id, v_member_id, p_reaction_type) ON CONFLICT (comment_id, user_id, reaction_type) DO NOTHING;
    UPDATE vault_community_comments SET reactions_summary = jsonb_set(
      COALESCE(reactions_summary, '{"like":0,"fire":0,"clap":0,"wow":0,"love":0}'::jsonb),
      ARRAY[p_reaction_type], to_jsonb(COALESCE((reactions_summary->>p_reaction_type)::int, 0) + 1)
    ) WHERE id = p_comment_id RETURNING reactions_summary INTO v_new_summary;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'added', NOT v_existing, 'summary', COALESCE(v_new_summary, '{}'::jsonb));
END;
$$;
