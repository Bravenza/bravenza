
-- Table for post likes
CREATE TABLE public.vault_intel_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.vault_intel_posts(id) ON DELETE CASCADE,
  client_cpf text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(post_id, client_cpf)
);

ALTER TABLE public.vault_intel_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view likes" ON public.vault_intel_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own likes" ON public.vault_intel_likes
  FOR ALL USING (
    client_cpf IN (SELECT cp.cpf FROM client_profiles cp WHERE cp.user_id = auth.uid())
  ) WITH CHECK (
    client_cpf IN (SELECT cp.cpf FROM client_profiles cp WHERE cp.user_id = auth.uid())
  );

CREATE POLICY "Admins full access to vault_intel_likes" ON public.vault_intel_likes
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Table for post bookmarks
CREATE TABLE public.vault_intel_bookmarks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.vault_intel_posts(id) ON DELETE CASCADE,
  client_cpf text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(post_id, client_cpf)
);

ALTER TABLE public.vault_intel_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own bookmarks" ON public.vault_intel_bookmarks
  FOR ALL USING (
    client_cpf IN (SELECT cp.cpf FROM client_profiles cp WHERE cp.user_id = auth.uid())
  ) WITH CHECK (
    client_cpf IN (SELECT cp.cpf FROM client_profiles cp WHERE cp.user_id = auth.uid())
  );

CREATE POLICY "Admins full access to vault_intel_bookmarks" ON public.vault_intel_bookmarks
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Add likes_count to posts table
ALTER TABLE public.vault_intel_posts ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;

-- Trigger to update likes_count
CREATE OR REPLACE FUNCTION public.update_intel_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE vault_intel_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE vault_intel_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_update_intel_likes_count
AFTER INSERT OR DELETE ON public.vault_intel_likes
FOR EACH ROW EXECUTE FUNCTION public.update_intel_post_likes_count();
