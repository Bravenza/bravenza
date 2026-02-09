
-- 1) Add the user as a Vault member with required fields
INSERT INTO public.vault_members (client_cpf, client_name, tier, status)
VALUES ('01042863180', 'Usuário Teste', 'elite', 'ACTIVE')
ON CONFLICT (client_cpf) DO NOTHING;

-- 2) Update the RPC to return ALL media columns
CREATE OR REPLACE FUNCTION public.get_vault_intel_posts(p_cpf TEXT)
RETURNS TABLE(
  id UUID,
  type TEXT,
  title TEXT,
  content TEXT,
  excerpt TEXT,
  cover_image TEXT,
  media_urls TEXT[],
  video_url TEXT,
  external_link TEXT,
  read_time_min INT,
  is_featured BOOLEAN,
  visibility TEXT,
  published_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier public.vault_tier;
BEGIN
  SELECT vm.tier INTO v_tier FROM public.vault_members vm WHERE vm.client_cpf = p_cpf;
  
  RETURN QUERY
  SELECT 
    ip.id,
    ip.type::TEXT,
    ip.title,
    ip.content,
    ip.excerpt,
    ip.cover_image,
    ip.media_urls,
    ip.video_url,
    ip.external_link,
    ip.read_time_min,
    ip.is_featured,
    ip.visibility::TEXT,
    ip.published_at
  FROM public.vault_intel_posts ip
  WHERE ip.status = 'PUBLISHED'
    AND ip.published_at <= NOW()
    AND (
      ip.visibility = 'ALL'
      OR (ip.visibility = 'PRIVILEGE_PLUS' AND v_tier IN ('collector', 'elite'))
      OR (ip.visibility = 'BLACK_ONLY' AND v_tier = 'elite')
    )
  ORDER BY ip.published_at DESC;
END;
$$;
