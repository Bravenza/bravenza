
DROP FUNCTION IF EXISTS public.get_vault_intel_posts(text);

CREATE FUNCTION public.get_vault_intel_posts(p_cpf text)
 RETURNS TABLE(id uuid, type text, title text, content text, excerpt text, cover_image text, media_urls text[], video_url text, external_link text, read_time_min integer, is_featured boolean, visibility text, published_at timestamp with time zone, likes_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tier public.vault_tier;
BEGIN
  SELECT vm.tier INTO v_tier FROM public.vault_members vm WHERE vm.client_cpf = p_cpf;
  
  RETURN QUERY
  SELECT 
    ip.id,
    ip.type::TEXT,
    ip.title::TEXT,
    ip.content::TEXT,
    ip.excerpt::TEXT,
    ip.cover_image::TEXT,
    ip.media_urls::TEXT[],
    ip.video_url::TEXT,
    ip.external_link::TEXT,
    ip.read_time_min,
    ip.is_featured,
    ip.visibility::TEXT,
    ip.published_at,
    ip.likes_count
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
$function$;
