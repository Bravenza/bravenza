INSERT INTO storage.buckets (id, name, public) VALUES ('drop-images', 'drop-images', true);

CREATE POLICY "Anyone can read drop images"
ON storage.objects FOR SELECT
USING (bucket_id = 'drop-images');

CREATE POLICY "Service role can upload drop images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'drop-images');