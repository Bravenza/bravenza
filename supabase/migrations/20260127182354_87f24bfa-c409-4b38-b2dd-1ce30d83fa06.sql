-- Add reference_image_url column to orders table to store the client's reference image
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS reference_image_url text DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.orders.reference_image_url IS 'URL of the reference image uploaded by the client during order request';