-- Add financial columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipping_cost numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS other_costs numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS other_costs_description text;

-- Create order_costs table for detailed cost breakdown
CREATE TABLE public.order_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id character varying NOT NULL REFERENCES public.orders(order_id) ON DELETE CASCADE,
  cost_type character varying NOT NULL,
  description text,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.order_costs ENABLE ROW LEVEL SECURITY;

-- RLS policies for order_costs
CREATE POLICY "Admins can view all order costs"
ON public.order_costs
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can insert order costs"
ON public.order_costs
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update order costs"
ON public.order_costs
FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Admins can delete order costs"
ON public.order_costs
FOR DELETE
USING (public.is_admin());

-- Create index for faster queries
CREATE INDEX idx_order_costs_order_id ON public.order_costs(order_id);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);