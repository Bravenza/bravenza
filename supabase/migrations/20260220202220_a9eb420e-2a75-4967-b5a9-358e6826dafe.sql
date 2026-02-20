
-- Table for drop reminders (notify users when a drop goes live)
CREATE TABLE public.marketplace_drop_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_cpf TEXT NOT NULL,
  release_key TEXT NOT NULL, -- brand+model+date combo
  release_brand TEXT NOT NULL,
  release_model TEXT NOT NULL,
  release_date DATE NOT NULL,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint: one reminder per user per release
ALTER TABLE public.marketplace_drop_reminders
  ADD CONSTRAINT uq_drop_reminder_user_release UNIQUE (user_cpf, release_key);

-- Enable RLS
ALTER TABLE public.marketplace_drop_reminders ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own reminders"
  ON public.marketplace_drop_reminders FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can insert reminders"
  ON public.marketplace_drop_reminders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete own reminders"
  ON public.marketplace_drop_reminders FOR DELETE
  USING (true);

-- Index for lookup
CREATE INDEX idx_drop_reminders_user ON public.marketplace_drop_reminders(user_cpf);
CREATE INDEX idx_drop_reminders_date ON public.marketplace_drop_reminders(release_date);
