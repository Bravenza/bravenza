DROP POLICY "Service role can upload drop images" ON storage.objects;

CREATE POLICY "Service role can upload drop images"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'drop-images');