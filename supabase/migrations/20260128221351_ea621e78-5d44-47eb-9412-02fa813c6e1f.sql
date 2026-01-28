-- Add payment mode column to orders table
-- 'full' = 100% payment (default), 'split' = 50/50 payment
ALTER TABLE public.orders 
ADD COLUMN payment_mode VARCHAR(10) DEFAULT 'full' CHECK (payment_mode IN ('full', 'split'));

-- Add comment for clarity
COMMENT ON COLUMN public.orders.payment_mode IS 'Payment mode: full = 100% single payment, split = 50/50 deposit + balance';