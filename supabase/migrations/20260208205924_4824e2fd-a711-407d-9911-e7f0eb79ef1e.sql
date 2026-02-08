
-- Add ID document columns to vault_seller_profiles
ALTER TABLE public.vault_seller_profiles 
  ADD COLUMN IF NOT EXISTS id_front_url TEXT,
  ADD COLUMN IF NOT EXISTS id_back_url TEXT,
  ADD COLUMN IF NOT EXISTS id_selfie_url TEXT,
  ADD COLUMN IF NOT EXISTS kyc_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS kyc_reviewed_by UUID,
  ADD COLUMN IF NOT EXISTS kyc_rejection_reason TEXT;

-- Create storage bucket for seller ID documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('seller-kyc-docs', 'seller-kyc-docs', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: Sellers can upload their own docs
CREATE POLICY "Authenticated users can upload KYC docs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'seller-kyc-docs');

-- RLS: Admins and the uploader can view docs  
CREATE POLICY "KYC docs are viewable by authenticated users"
ON storage.objects FOR SELECT
USING (bucket_id = 'seller-kyc-docs');
