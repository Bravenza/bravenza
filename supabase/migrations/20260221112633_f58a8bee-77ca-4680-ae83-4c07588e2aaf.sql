
-- Add rejection_reason enum-style column and re-search tracking to match rooms
ALTER TABLE public.vault_match_rooms 
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS rejection_category text,
  ADD COLUMN IF NOT EXISTS auto_research_search_id uuid REFERENCES public.vault_searches(id);

-- Add progress stage and sub-status to vault_searches for client-facing progress
ALTER TABLE public.vault_searches
  ADD COLUMN IF NOT EXISTS progress_message text,
  ADD COLUMN IF NOT EXISTS progress_percentage integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS decline_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_decline_reason text,
  ADD COLUMN IF NOT EXISTS last_decline_category text,
  ADD COLUMN IF NOT EXISTS original_search_id uuid REFERENCES public.vault_searches(id);
