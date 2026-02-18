
-- 1. Replace the old update_seller_fee trigger function with one that uses calculate_seller_fee
CREATE OR REPLACE FUNCTION public.update_seller_fee()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  NEW.current_fee_percent := calculate_seller_fee(NEW.plan_id, NEW.total_sales_count);
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

-- 2. Create the trigger on vault_seller_profiles (it was missing!)
DROP TRIGGER IF EXISTS trg_recalculate_seller_fee ON public.vault_seller_profiles;
CREATE TRIGGER trg_recalculate_seller_fee
  BEFORE UPDATE OF plan_id, total_sales_count ON public.vault_seller_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_seller_fee();

-- 3. Fix the update_seller_on_sale trigger function to fire on correct statuses
CREATE OR REPLACE FUNCTION public.update_seller_on_sale()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  -- Fire when order reaches 'completed' OR 'payout_released'
  IF (NEW.status IN ('completed', 'payout_released')) 
     AND (OLD.status IS NULL OR OLD.status NOT IN ('completed', 'payout_released')) THEN
    -- Update seller profile stats (this will fire trg_recalculate_seller_fee)
    UPDATE vault_seller_profiles
    SET 
      total_sales_count = total_sales_count + 1,
      total_sales_value = total_sales_value + COALESCE(NEW.sale_price, 0)
    WHERE id = NEW.seller_id;
    
    -- Mark listing as sold
    IF NEW.listing_id IS NOT NULL THEN
      UPDATE vault_marketplace_listings
      SET status = 'sold'
      WHERE id = NEW.listing_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- 4. Create the trigger on vault_marketplace_orders (it was missing!)
DROP TRIGGER IF EXISTS trg_update_seller_on_sale ON public.vault_marketplace_orders;
CREATE TRIGGER trg_update_seller_on_sale
  AFTER UPDATE ON public.vault_marketplace_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_seller_on_sale();
