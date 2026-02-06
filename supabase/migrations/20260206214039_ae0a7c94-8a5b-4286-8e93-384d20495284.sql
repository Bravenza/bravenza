
-- Add payout and protection columns to marketplace orders
ALTER TABLE public.vault_marketplace_orders
ADD COLUMN IF NOT EXISTS order_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS protection_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payout_released_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payout_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS payout_proof_url TEXT,
ADD COLUMN IF NOT EXISTS dispute_status VARCHAR(30),
ADD COLUMN IF NOT EXISTS dispute_reason TEXT,
ADD COLUMN IF NOT EXISTS dispute_opened_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS dispute_resolved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS pix_transaction_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS mp_payment_id VARCHAR(100);

-- Function to generate marketplace order codes
CREATE OR REPLACE FUNCTION public.generate_marketplace_order_code()
RETURNS VARCHAR
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code VARCHAR(20) := 'MKT-';
  i INTEGER;
  exists_count INTEGER;
BEGIN
  LOOP
    code := 'MKT-';
    FOR i IN 1..8 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    SELECT COUNT(*) INTO exists_count FROM public.vault_marketplace_orders WHERE order_code = code;
    IF exists_count = 0 THEN EXIT; END IF;
  END LOOP;
  RETURN code;
END;
$$;

-- Trigger to auto-generate order code
CREATE OR REPLACE FUNCTION public.set_marketplace_order_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.order_code IS NULL THEN
    NEW.order_code := generate_marketplace_order_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_marketplace_order_code ON public.vault_marketplace_orders;
CREATE TRIGGER trg_set_marketplace_order_code
BEFORE INSERT ON public.vault_marketplace_orders
FOR EACH ROW EXECUTE FUNCTION set_marketplace_order_code();

-- Function to calculate protection end date (7 business days after delivery)
CREATE OR REPLACE FUNCTION public.calculate_protection_end(delivery_date TIMESTAMPTZ)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE
  result_date DATE;
  business_days INTEGER := 0;
BEGIN
  result_date := delivery_date::DATE;
  WHILE business_days < 7 LOOP
    result_date := result_date + 1;
    IF EXTRACT(DOW FROM result_date) NOT IN (0, 6) THEN
      business_days := business_days + 1;
    END IF;
  END LOOP;
  RETURN result_date::TIMESTAMPTZ;
END;
$$;

-- Update timestamp trigger for orders
DROP TRIGGER IF EXISTS trg_update_marketplace_order_timestamp ON public.vault_marketplace_orders;
CREATE TRIGGER trg_update_marketplace_order_timestamp
BEFORE UPDATE ON public.vault_marketplace_orders
FOR EACH ROW EXECUTE FUNCTION update_marketplace_listing_timestamp();

-- Update seller stats when order is completed (payout released)
CREATE OR REPLACE FUNCTION public.update_seller_on_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Update seller profile stats
    UPDATE vault_seller_profiles
    SET 
      total_sales_count = total_sales_count + 1,
      total_sales_value = total_sales_value + NEW.sale_price
    WHERE id = NEW.seller_id;
    
    -- Mark listing as sold
    UPDATE vault_marketplace_listings
    SET status = 'sold'
    WHERE id = NEW.listing_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_seller_on_sale ON public.vault_marketplace_orders;
CREATE TRIGGER trg_update_seller_on_sale
AFTER UPDATE ON public.vault_marketplace_orders
FOR EACH ROW EXECUTE FUNCTION update_seller_on_sale();

-- RLS policies for marketplace orders
ALTER TABLE public.vault_marketplace_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all marketplace orders"
ON public.vault_marketplace_orders
FOR ALL
USING (public.is_admin());

CREATE POLICY "Buyers can view their own orders"
ON public.vault_marketplace_orders
FOR SELECT
USING (true);
