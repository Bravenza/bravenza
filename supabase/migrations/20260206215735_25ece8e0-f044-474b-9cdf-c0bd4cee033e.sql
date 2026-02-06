
-- Storage bucket for marketplace photos
INSERT INTO storage.buckets (id, name, public) VALUES ('marketplace', 'marketplace', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view marketplace images" ON storage.objects FOR SELECT USING (bucket_id = 'marketplace');
CREATE POLICY "Authenticated users can upload marketplace images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'marketplace');
CREATE POLICY "Users can delete own marketplace images" ON storage.objects FOR DELETE USING (bucket_id = 'marketplace');

-- Offers table
CREATE TABLE public.vault_marketplace_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.vault_marketplace_listings(id) ON DELETE CASCADE,
  buyer_cpf TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  offer_price NUMERIC NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected, expired, counter
  counter_price NUMERIC,
  counter_message TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '48 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ
);

ALTER TABLE public.vault_marketplace_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view offers" ON public.vault_marketplace_offers FOR SELECT USING (true);
CREATE POLICY "Anyone can insert offers" ON public.vault_marketplace_offers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update offers" ON public.vault_marketplace_offers FOR UPDATE USING (true);

-- Add bio column to seller profiles if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vault_seller_profiles' AND column_name = 'bio') THEN
    ALTER TABLE public.vault_seller_profiles ADD COLUMN bio TEXT;
  END IF;
END $$;

-- Enable realtime for offers
ALTER PUBLICATION supabase_realtime ADD TABLE public.vault_marketplace_offers;
