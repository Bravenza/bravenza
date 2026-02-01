-- Function to get wishlist items for a member
CREATE OR REPLACE FUNCTION public.get_vault_member_wishlists(p_cpf character varying)
RETURNS TABLE(
  id uuid,
  title character varying,
  product_brand character varying,
  product_model character varying,
  product_size character varying,
  product_color character varying,
  condition_pref character varying,
  urgency_level character varying,
  priority integer,
  min_price numeric,
  max_price numeric,
  notes text,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    w.id,
    COALESCE(w.title, w.product_name) as title,
    w.product_brand,
    w.product_model,
    w.product_size,
    w.product_color,
    w.condition_pref::varchar,
    w.urgency_level::varchar,
    COALESCE(w.priority, 3),
    w.min_price,
    w.max_price,
    w.notes,
    w.created_at
  FROM public.vault_wishlists w
  INNER JOIN public.vault_members m ON m.id = w.member_id
  WHERE m.client_cpf = p_cpf
  ORDER BY w.priority DESC, w.created_at DESC;
$$;

-- Function to create a wishlist item
CREATE OR REPLACE FUNCTION public.create_vault_wishlist_item(
  p_cpf character varying,
  p_title character varying,
  p_brand character varying DEFAULT NULL,
  p_model character varying DEFAULT NULL,
  p_size character varying DEFAULT NULL,
  p_color character varying DEFAULT NULL,
  p_condition character varying DEFAULT 'DS',
  p_urgency character varying DEFAULT 'FLEXIBLE',
  p_priority integer DEFAULT 3,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_member_id uuid;
  v_max_items integer;
  v_current_count integer;
  v_new_id uuid;
BEGIN
  -- Get member info
  SELECT id, max_wishlist_items INTO v_member_id, v_max_items
  FROM public.vault_members
  WHERE client_cpf = p_cpf AND is_active = true;
  
  IF v_member_id IS NULL THEN
    RAISE EXCEPTION 'Membro não encontrado';
  END IF;
  
  -- Check limit
  SELECT COUNT(*) INTO v_current_count FROM public.vault_wishlists WHERE member_id = v_member_id;
  
  IF v_current_count >= v_max_items THEN
    RAISE EXCEPTION 'Limite de wishlist atingido';
  END IF;
  
  -- Insert item
  INSERT INTO public.vault_wishlists (
    member_id,
    product_name,
    title,
    product_brand,
    product_model,
    product_size,
    product_color,
    condition_pref,
    urgency_level,
    priority,
    min_price,
    max_price,
    notes
  ) VALUES (
    v_member_id,
    p_title,
    p_title,
    p_brand,
    p_model,
    p_size,
    p_color,
    p_condition::condition_preference,
    p_urgency::urgency_level,
    p_priority,
    p_min_price,
    p_max_price,
    p_notes
  ) RETURNING id INTO v_new_id;
  
  RETURN v_new_id;
END;
$$;

-- Function to start a search
CREATE OR REPLACE FUNCTION public.start_vault_search(p_cpf character varying, p_wishlist_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_member_id uuid;
  v_active_hunts integer;
  v_max_hunts integer;
  v_review_mode_until timestamptz;
  v_new_search_id uuid;
BEGIN
  -- Get member info
  SELECT id, active_hunts, max_active_hunts, flags_review_mode_until 
  INTO v_member_id, v_active_hunts, v_max_hunts, v_review_mode_until
  FROM public.vault_members
  WHERE client_cpf = p_cpf AND is_active = true;
  
  IF v_member_id IS NULL THEN
    RAISE EXCEPTION 'Membro não encontrado';
  END IF;
  
  -- Check active searches limit
  IF v_active_hunts >= v_max_hunts THEN
    RAISE EXCEPTION 'Limite de buscas ativas atingido';
  END IF;
  
  -- Check review mode
  IF v_review_mode_until IS NOT NULL AND v_review_mode_until > NOW() THEN
    RAISE EXCEPTION 'Modo revisão ativo';
  END IF;
  
  -- Create search
  INSERT INTO public.vault_searches (
    user_id,
    wishlist_item_id,
    status,
    is_active
  ) VALUES (
    v_member_id,
    p_wishlist_id,
    'RECEIVED',
    true
  ) RETURNING id INTO v_new_search_id;
  
  -- Update member active hunts
  UPDATE public.vault_members
  SET active_hunts = active_hunts + 1, updated_at = NOW()
  WHERE id = v_member_id;
  
  RETURN v_new_search_id;
END;
$$;