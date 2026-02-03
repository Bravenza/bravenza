
-- Create function to auto-enroll clients as vault members when they have orders
CREATE OR REPLACE FUNCTION public.auto_enroll_vault_member(
  p_cpf VARCHAR,
  p_name VARCHAR,
  p_email VARCHAR DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id uuid;
BEGIN
  -- Check if already a member
  SELECT id INTO v_member_id
  FROM vault_members
  WHERE client_cpf = p_cpf AND is_active = true;
  
  -- If not a member, create one
  IF v_member_id IS NULL THEN
    INSERT INTO vault_members (
      client_cpf,
      client_name,
      client_email,
      tier,
      status,
      is_active,
      joined_via,
      total_purchases,
      max_active_hunts,
      max_wishlist_items,
      invites_remaining
    ) VALUES (
      p_cpf,
      p_name,
      p_email,
      'member',
      'ACTIVE',
      true,
      'purchase',
      0,
      1,
      3,
      2
    )
    RETURNING id INTO v_member_id;
  END IF;
  
  RETURN v_member_id;
END;
$$;

-- Create function to convert delivered order to vault item
CREATE OR REPLACE FUNCTION public.create_vault_item_from_order(
  p_order_id VARCHAR,
  p_member_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_vault_id VARCHAR;
  v_item_id uuid;
  v_year VARCHAR;
  v_seq INTEGER;
BEGIN
  -- Get order data
  SELECT * INTO v_order
  FROM orders
  WHERE order_id = p_order_id;
  
  IF v_order IS NULL THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;
  
  -- Check if vault item already exists for this order (using authenticity_code)
  IF v_order.authenticity_code IS NOT NULL THEN
    SELECT id INTO v_item_id
    FROM vault_items
    WHERE vault_id = v_order.authenticity_code;
    
    IF v_item_id IS NOT NULL THEN
      RETURN v_item_id; -- Already exists
    END IF;
  END IF;
  
  -- Generate vault ID
  v_year := EXTRACT(YEAR FROM NOW())::VARCHAR;
  SELECT COUNT(*) + 1 INTO v_seq
  FROM vault_items
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  
  v_vault_id := 'BRVZ-' || v_year || '-' || LPAD(v_seq::VARCHAR, 6, '0');
  
  -- Create vault item
  INSERT INTO vault_items (
    user_id,
    vault_id,
    title,
    brand,
    model,
    colorway,
    size,
    purchase_value,
    purchase_date,
    verified_status,
    inspection_photos,
    qr_private_url
  ) VALUES (
    p_member_id,
    v_vault_id,
    v_order.product_name,
    v_order.product_brand,
    v_order.product_model,
    v_order.product_color,
    v_order.product_size,
    v_order.product_price,
    v_order.created_at,
    'PENDING',
    v_order.inspection_photos,
    'https://bravenza.lovable.app/autenticidade/' || v_vault_id
  )
  RETURNING id INTO v_item_id;
  
  -- Update order with vault ID as authenticity code if not set
  IF v_order.authenticity_code IS NULL THEN
    UPDATE orders
    SET authenticity_code = v_vault_id
    WHERE order_id = p_order_id;
  END IF;
  
  -- Update member stats
  UPDATE vault_members
  SET 
    total_purchases = total_purchases + 1,
    total_spent = total_spent + COALESCE(v_order.product_price, 0)
  WHERE id = p_member_id;
  
  RETURN v_item_id;
END;
$$;

-- Create RPC function to ensure vault membership for client
CREATE OR REPLACE FUNCTION public.ensure_vault_membership(p_cpf VARCHAR)
RETURNS TABLE(
  id uuid,
  tier vault_tier,
  total_purchases integer,
  active_hunts integer,
  max_active_hunts integer,
  max_wishlist_items integer,
  invites_remaining integer,
  community_opt_in boolean,
  client_name text,
  joined_via text,
  is_new_member boolean
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
  -- Check if already a member
  SELECT vm.id INTO v_member_id
  FROM vault_members vm
  WHERE vm.client_cpf = p_cpf AND vm.is_active = true;
  
  -- If not a member, check if has orders
  IF v_member_id IS NULL THEN
    SELECT o.client_name, o.client_email 
    INTO v_client_name, v_client_email
    FROM orders o
    WHERE o.client_cpf = p_cpf
    ORDER BY o.created_at DESC
    LIMIT 1;
    
    -- Auto-enroll if has orders
    IF v_client_name IS NOT NULL THEN
      v_member_id := auto_enroll_vault_member(p_cpf, v_client_name, v_client_email);
      v_is_new := true;
    END IF;
  END IF;
  
  -- Return member data
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
    vm.client_name::text,
    vm.joined_via::text,
    v_is_new
  FROM vault_members vm
  WHERE vm.id = v_member_id
    AND vm.is_active = true
    AND vm.status = 'ACTIVE';
END;
$$;
