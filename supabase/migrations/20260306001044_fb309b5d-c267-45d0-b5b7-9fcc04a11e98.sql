CREATE UNIQUE INDEX IF NOT EXISTS idx_one_pending_payout
ON marketplace_seller_payouts (seller_id)
WHERE status = 'requested';