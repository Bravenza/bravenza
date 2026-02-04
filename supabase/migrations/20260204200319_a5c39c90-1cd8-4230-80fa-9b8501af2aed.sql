-- Create storage bucket for community media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-media',
  'community-media', 
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for community-media bucket
CREATE POLICY "Community media is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'community-media');

CREATE POLICY "Vault members can upload community media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'community-media' AND
  EXISTS (
    SELECT 1 FROM vault_members 
    WHERE id::text = (storage.foldername(name))[1]
    AND community_opt_in = true
  )
);

CREATE POLICY "Users can update their own community media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'community-media' AND
  EXISTS (
    SELECT 1 FROM vault_members 
    WHERE id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Users can delete their own community media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'community-media' AND
  EXISTS (
    SELECT 1 FROM vault_members 
    WHERE id::text = (storage.foldername(name))[1]
  )
);