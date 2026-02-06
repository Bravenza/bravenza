-- Drop and recreate function for order_code generation
DROP FUNCTION IF EXISTS public.generate_marketplace_order_code() CASCADE;

CREATE FUNCTION public.generate_marketplace_order_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_code IS NULL OR NEW.order_code = '' THEN
    NEW.order_code := 'MKT-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_marketplace_order_code
BEFORE INSERT ON public.vault_marketplace_orders
FOR EACH ROW
EXECUTE FUNCTION public.generate_marketplace_order_code();

-- Backfill any existing orders missing order_code
UPDATE public.vault_marketplace_orders
SET order_code = 'MKT-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0')
WHERE order_code IS NULL;