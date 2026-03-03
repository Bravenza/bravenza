
-- ============================================================
-- FIX 1: marketplace_cart_details - Add security_invoker
-- This was the Security Definer View flagged by the linter
-- ============================================================
DROP VIEW IF EXISTS public.marketplace_cart_details;
CREATE VIEW public.marketplace_cart_details
WITH (security_invoker = on) AS
SELECT 
  ci.id,
  ci.offer_id,
  ci.product_id,
  ci.user_cpf,
  ci.added_at,
  o.price AS offer_price,
  o.size AS offer_size,
  o.condition AS offer_condition,
  o.photos AS offer_photos,
  o.shipping_mode AS offer_shipping_mode,
  o.seller_id AS offer_seller_id,
  o.status AS offer_status,
  p.brand AS product_brand,
  p.model AS product_model,
  p.slug AS product_slug,
  p.images AS product_images,
  vm.client_name AS seller_name,
  COALESCE(o.interest_free_installments, 0) AS offer_interest_free_installments
FROM marketplace_cart_items ci
JOIN marketplace_offers o ON o.id = ci.offer_id
JOIN marketplace_products p ON p.id = ci.product_id
LEFT JOIN vault_seller_profiles vsp ON vsp.id = o.seller_id
LEFT JOIN vault_members vm ON vm.id = vsp.member_id;

-- ============================================================
-- FIX 2: Remove duplicate/conflicting vault_items policies
-- "Service role manages vault items" with USING(false) blocks access
-- "Admins can manage vault_items" duplicates "Admins full access"
-- ============================================================
DROP POLICY IF EXISTS "Service role manages vault items" ON public.vault_items;
DROP POLICY IF EXISTS "Admins can manage vault_items" ON public.vault_items;

-- ============================================================
-- FIX 3: Restrict certificate URLs - create a secure view
-- that hides sensitive URLs from vault_items for non-owners
-- ============================================================
-- Add function to generate safe item data without raw URLs
CREATE OR REPLACE FUNCTION public.get_vault_item_certificate_url(p_item_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_item_user_id uuid;
  v_cert_url text;
  v_qr_url text;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check ownership: vault_items.user_id references vault_members.id
  SELECT vi.user_id, vi.certificate_pdf_url, vi.qr_private_url
  INTO v_item_user_id, v_cert_url, v_qr_url
  FROM vault_items vi
  WHERE vi.id = p_item_id;

  IF v_item_user_id IS NULL THEN
    RAISE EXCEPTION 'Item not found';
  END IF;

  -- Verify the caller owns this item (via vault_members -> client_profiles chain)
  IF NOT EXISTS (
    SELECT 1 FROM vault_members vm
    JOIN client_profiles cp ON cp.cpf::text = vm.client_cpf::text
    WHERE vm.id = v_item_user_id AND cp.user_id = v_user_id
  ) AND NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN jsonb_build_object(
    'certificate_pdf_url', v_cert_url,
    'qr_private_url', v_qr_url
  );
END;
$$;

-- Restrict function to authenticated users only
REVOKE EXECUTE ON FUNCTION public.get_vault_item_certificate_url FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_vault_item_certificate_url TO authenticated;
