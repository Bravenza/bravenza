-- Add authenticity verification columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS authenticity_code VARCHAR(20) UNIQUE,
ADD COLUMN IF NOT EXISTS authenticity_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS authenticity_verification_count INTEGER DEFAULT 0;

-- Create function to generate unique authenticity code
CREATE OR REPLACE FUNCTION public.generate_authenticity_code()
RETURNS VARCHAR(20)
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code VARCHAR(20) := 'BRV-';
  i INTEGER;
  exists_count INTEGER;
BEGIN
  LOOP
    code := 'BRV-';
    -- Generate 12 random characters
    FOR i IN 1..12 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Check if code already exists
    SELECT COUNT(*) INTO exists_count FROM public.orders WHERE authenticity_code = code;
    IF exists_count = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Create function to verify authenticity and increment counter
CREATE OR REPLACE FUNCTION public.verify_authenticity(p_code VARCHAR)
RETURNS TABLE(
  order_id VARCHAR,
  product_name VARCHAR,
  product_brand VARCHAR,
  product_model VARCHAR,
  product_size VARCHAR,
  product_color VARCHAR,
  client_name VARCHAR,
  inspection_photos TEXT[],
  created_at TIMESTAMP WITH TIME ZONE,
  verification_count INTEGER,
  is_valid BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_order_id VARCHAR;
BEGIN
  -- Get order ID
  SELECT o.order_id INTO v_order_id
  FROM public.orders o
  WHERE o.authenticity_code = p_code;
  
  IF v_order_id IS NULL THEN
    RETURN QUERY SELECT 
      NULL::VARCHAR, NULL::VARCHAR, NULL::VARCHAR, NULL::VARCHAR, 
      NULL::VARCHAR, NULL::VARCHAR, NULL::VARCHAR, NULL::TEXT[],
      NULL::TIMESTAMP WITH TIME ZONE, 0, FALSE;
    RETURN;
  END IF;
  
  -- Update verification timestamp and counter
  UPDATE public.orders
  SET 
    authenticity_verified_at = COALESCE(authenticity_verified_at, NOW()),
    authenticity_verification_count = COALESCE(authenticity_verification_count, 0) + 1
  WHERE authenticity_code = p_code;
  
  -- Return order details
  RETURN QUERY
  SELECT 
    o.order_id,
    o.product_name,
    o.product_brand,
    o.product_model,
    o.product_size,
    o.product_color,
    o.client_name,
    o.inspection_photos,
    o.created_at,
    o.authenticity_verification_count,
    TRUE
  FROM public.orders o
  WHERE o.authenticity_code = p_code;
END;
$$;