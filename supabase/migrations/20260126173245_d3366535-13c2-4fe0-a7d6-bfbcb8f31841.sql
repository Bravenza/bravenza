-- Update default value for current_status column to use new enum value
ALTER TABLE public.orders ALTER COLUMN current_status SET DEFAULT 'REQUEST_RECEIVED'::order_status;

-- Update existing orders that use legacy statuses to new equivalents (optional - only if desired)
-- This preserves data integrity by mapping old statuses to new ones
UPDATE public.orders SET current_status = 'REQUEST_RECEIVED' WHERE current_status = 'ORDER_CONFIRMED';
UPDATE public.orders SET current_status = 'SEARCH_SELECTION' WHERE current_status IN ('SOURCING', 'NEGOTIATING');
UPDATE public.orders SET current_status = 'PRODUCT_FOUND' WHERE current_status = 'PURCHASE_COMPLETED';
UPDATE public.orders SET current_status = 'PREPARING_INTERNATIONAL' WHERE current_status = 'INTERNATIONAL_DISPATCH';
UPDATE public.orders SET current_status = 'INTERNATIONAL_TRANSIT' WHERE current_status = 'PACKAGE_EN_ROUTE';
UPDATE public.orders SET current_status = 'ARRIVED_BRAZIL' WHERE current_status IN ('ARRIVED', 'CUSTOMS');
UPDATE public.orders SET current_status = 'PRODUCT_INSPECTED' WHERE current_status = 'INSPECTION_APPROVED';
UPDATE public.orders SET current_status = 'BALANCE_PENDING' WHERE current_status = 'BALANCE_DUE';
UPDATE public.orders SET current_status = 'SHIPPED_TO_CLIENT' WHERE current_status IN ('NATIONAL_TRANSIT', 'DISPATCHED');

-- Also update order_history entries
UPDATE public.order_history SET status = 'REQUEST_RECEIVED' WHERE status = 'ORDER_CONFIRMED';
UPDATE public.order_history SET status = 'SEARCH_SELECTION' WHERE status IN ('SOURCING', 'NEGOTIATING');
UPDATE public.order_history SET status = 'PRODUCT_FOUND' WHERE status = 'PURCHASE_COMPLETED';
UPDATE public.order_history SET status = 'PREPARING_INTERNATIONAL' WHERE status = 'INTERNATIONAL_DISPATCH';
UPDATE public.order_history SET status = 'INTERNATIONAL_TRANSIT' WHERE status = 'PACKAGE_EN_ROUTE';
UPDATE public.order_history SET status = 'ARRIVED_BRAZIL' WHERE status IN ('ARRIVED', 'CUSTOMS');
UPDATE public.order_history SET status = 'PRODUCT_INSPECTED' WHERE status = 'INSPECTION_APPROVED';
UPDATE public.order_history SET status = 'BALANCE_PENDING' WHERE status = 'BALANCE_DUE';
UPDATE public.order_history SET status = 'SHIPPED_TO_CLIENT' WHERE status IN ('NATIONAL_TRANSIT', 'DISPATCHED');