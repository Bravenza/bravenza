
-- 1. Create the missing assert_caller_owns_cpf function
-- This validates that the current JWT user owns the given CPF
CREATE OR REPLACE FUNCTION public.assert_caller_owns_cpf(p_cpf text)
  RETURNS void
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.client_profiles
    WHERE user_id = auth.uid() AND cpf = p_cpf
  ) THEN
    RAISE EXCEPTION 'Unauthorized: CPF does not belong to caller';
  END IF;
END;
$$;

-- 2. Fix vault_marketplace_messages: revoke anon & authenticated access
REVOKE SELECT, INSERT ON public.vault_marketplace_messages FROM anon;
REVOKE SELECT, INSERT ON public.vault_marketplace_messages FROM authenticated;

-- 3. Drop the vulnerable header-based RLS policies
DROP POLICY IF EXISTS "Users can read their own messages" ON public.vault_marketplace_messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.vault_marketplace_messages;

-- 4. Only service_role (edge functions) should access messages.
-- Add a deny-all policy for safety (service_role bypasses RLS anyway)
CREATE POLICY "No direct access to messages"
  ON public.vault_marketplace_messages
  FOR ALL
  USING (false);
