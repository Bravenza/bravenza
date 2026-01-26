-- Add international_carrier column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS international_carrier character varying;