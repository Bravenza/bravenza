-- Add column for inspection photos (array of URLs)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS inspection_photos text[] DEFAULT '{}';

-- Create storage bucket for inspection photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('inspection-photos', 'inspection-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow admins to upload inspection photos
CREATE POLICY "Admins can upload inspection photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'inspection-photos' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create policy to allow admins to update/delete inspection photos
CREATE POLICY "Admins can manage inspection photos"
ON storage.objects FOR ALL
USING (
  bucket_id = 'inspection-photos' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create policy to allow public read access to inspection photos
CREATE POLICY "Anyone can view inspection photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'inspection-photos');