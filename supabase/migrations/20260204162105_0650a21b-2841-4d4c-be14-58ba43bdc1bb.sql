-- Function to automatically create vault item when order is delivered
CREATE OR REPLACE FUNCTION public.auto_create_vault_item_on_delivery()
RETURNS TRIGGER AS $$
DECLARE
  v_member_id UUID;
  v_vault_id TEXT;
  v_year TEXT;
  v_sequence INT;
BEGIN
  -- Only proceed if status changed to DELIVERED
  IF NEW.current_status = 'DELIVERED' AND (OLD.current_status IS NULL OR OLD.current_status != 'DELIVERED') THEN
    
    -- Check if client is a vault member
    SELECT id INTO v_member_id
    FROM public.vault_members
    WHERE client_cpf = NEW.client_cpf
    AND is_active = true;
    
    -- If not a member, skip
    IF v_member_id IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Check if vault item already exists for this order
    IF EXISTS (
      SELECT 1 FROM public.vault_items 
      WHERE title = NEW.product_name 
      AND user_id = v_member_id
      AND purchase_date::date = NEW.created_at::date
    ) THEN
      RETURN NEW;
    END IF;
    
    -- Generate sequential Vault ID (BRVZ-YYYY-XXXXXX)
    v_year := EXTRACT(YEAR FROM NOW())::TEXT;
    
    SELECT COALESCE(MAX(
      CASE 
        WHEN vault_id ~ ('^BRVZ-' || v_year || '-[0-9]{6}$')
        THEN SUBSTRING(vault_id FROM 11 FOR 6)::INT
        ELSE 0
      END
    ), 0) + 1
    INTO v_sequence
    FROM public.vault_items;
    
    v_vault_id := 'BRVZ-' || v_year || '-' || LPAD(v_sequence::TEXT, 6, '0');
    
    -- Create the vault item
    INSERT INTO public.vault_items (
      user_id,
      vault_id,
      title,
      brand,
      model,
      colorway,
      size,
      purchase_value,
      purchase_date,
      inspection_photos,
      verified_status,
      verified_at,
      origin_country
    ) VALUES (
      v_member_id,
      v_vault_id,
      NEW.product_name,
      NEW.product_brand,
      NEW.product_model,
      NEW.product_color,
      NEW.product_size,
      COALESCE(NEW.product_price, 0),
      NEW.created_at::date,
      NEW.inspection_photos,
      'VERIFIED',
      NOW(),
      'Internacional'
    );
    
    -- Update member stats
    UPDATE public.vault_members
    SET 
      total_purchases = COALESCE(total_purchases, 0) + 1,
      total_spent = COALESCE(total_spent, 0) + COALESCE(NEW.product_price, 0),
      updated_at = NOW()
    WHERE id = v_member_id;
    
    -- Create notification for the member
    INSERT INTO public.notifications (
      target,
      target_client_cpf,
      type,
      title,
      message,
      reference_type,
      reference_id
    ) VALUES (
      'client',
      NEW.client_cpf,
      'info',
      '🏆 Novo item no seu Vault!',
      'Seu ' || NEW.product_name || ' foi adicionado ao Vault com o ID ' || v_vault_id || '. Acesse seu certificado de autenticidade!',
      'vault_item',
      v_vault_id
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on orders table
DROP TRIGGER IF EXISTS trigger_auto_vault_item_on_delivery ON public.orders;

CREATE TRIGGER trigger_auto_vault_item_on_delivery
  AFTER UPDATE OF current_status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_vault_item_on_delivery();