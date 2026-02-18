-- Create missing vault_community_follows table
CREATE TABLE public.vault_community_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES public.vault_members(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.vault_members(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE public.vault_community_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view follows" ON public.vault_community_follows FOR SELECT USING (true);

CREATE POLICY "Members can follow" ON public.vault_community_follows FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.vault_members WHERE id = follower_id AND is_active = true)
);

CREATE POLICY "Members can unfollow" ON public.vault_community_follows FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.vault_members WHERE id = follower_id AND is_active = true)
);

CREATE INDEX idx_follows_follower ON public.vault_community_follows(follower_id);
CREATE INDEX idx_follows_following ON public.vault_community_follows(following_id);