-- Create storage bucket for featured model images
INSERT INTO storage.buckets (id, name, public)
VALUES ('featured-models', 'featured-models', true);

-- Allow public to view images
CREATE POLICY "Anyone can view featured model images"
ON storage.objects FOR SELECT
USING (bucket_id = 'featured-models');

-- Allow admins to upload images
CREATE POLICY "Admins can upload featured model images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'featured-models' AND is_admin());

-- Allow admins to delete images
CREATE POLICY "Admins can delete featured model images"
ON storage.objects FOR DELETE
USING (bucket_id = 'featured-models' AND is_admin());