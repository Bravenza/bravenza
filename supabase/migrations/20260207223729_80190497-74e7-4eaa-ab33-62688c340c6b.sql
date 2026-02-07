
-- Add PRO hub columns to vault_marketplace_orders
ALTER TABLE public.vault_marketplace_orders
  ADD COLUMN IF NOT EXISTS hub_tracking_code text,
  ADD COLUMN IF NOT EXISTS hub_received_at timestamptz,
  ADD COLUMN IF NOT EXISTS hub_shipped_at timestamptz,
  ADD COLUMN IF NOT EXISTS hub_tracking_to_buyer text,
  ADD COLUMN IF NOT EXISTS inspection_id uuid REFERENCES public.marketplace_inspections(id),
  ADD COLUMN IF NOT EXISTS inspection_result text,
  ADD COLUMN IF NOT EXISTS refund_amount numeric,
  ADD COLUMN IF NOT EXISTS refund_at timestamptz;

-- Add order_id index on marketplace_inspections for faster lookups
CREATE INDEX IF NOT EXISTS idx_marketplace_inspections_order_id ON public.marketplace_inspections(order_id);

-- Add index for PRO hub states
CREATE INDEX IF NOT EXISTS idx_mkt_orders_status ON public.vault_marketplace_orders(status);
