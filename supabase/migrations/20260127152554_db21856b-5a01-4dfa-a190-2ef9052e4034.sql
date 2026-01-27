-- Add product_cost column for internal profit margin calculation
ALTER TABLE public.orders ADD COLUMN product_cost numeric NULL;

-- Add a comment to document the column purpose
COMMENT ON COLUMN public.orders.product_cost IS 'Internal cost value for profit margin calculation. Admin only - not exposed to clients.';