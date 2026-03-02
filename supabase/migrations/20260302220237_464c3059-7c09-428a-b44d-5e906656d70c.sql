
-- Fix mask_email search_path (non-security-definer but still flagged by linter)
CREATE OR REPLACE FUNCTION public.mask_email(email text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN email IS NULL OR email = '' THEN NULL
    WHEN position('@' in email) > 1 THEN
      left(split_part(email, '@', 1), 1) ||
      repeat('*', greatest(length(split_part(email, '@', 1)) - 1, 2)) ||
      '@' || split_part(email, '@', 2)
    ELSE '***'
  END;
$$;
