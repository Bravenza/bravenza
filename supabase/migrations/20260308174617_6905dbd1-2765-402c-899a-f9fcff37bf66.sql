
-- PR 3: Auditoria RLS — Tabelas PII

-- Helper: get user CPF from auth.uid() (security definer to avoid recursion)
CREATE OR REPLACE FUNCTION public.get_my_cpf()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cpf FROM public.client_profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- 1. client_profiles — add admin read/update
DROP POLICY IF EXISTS "Users can read own profile" ON public.client_profiles;
DROP POLICY IF EXISTS "Admins full access to client_profiles" ON public.client_profiles;

CREATE POLICY "Users and admins can read profiles"
  ON public.client_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Admins can update all profiles"
  ON public.client_profiles FOR UPDATE TO authenticated
  USING (is_admin());

-- 2. client_addresses — fix roles from public to authenticated, add admin
DROP POLICY IF EXISTS "Users can view their own addresses" ON public.client_addresses;
DROP POLICY IF EXISTS "Users can insert their own addresses" ON public.client_addresses;
DROP POLICY IF EXISTS "Users can update their own addresses" ON public.client_addresses;
DROP POLICY IF EXISTS "Users can delete their own addresses" ON public.client_addresses;

CREATE POLICY "Users can view own addresses"
  ON public.client_addresses FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can insert own addresses"
  ON public.client_addresses FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses"
  ON public.client_addresses FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses"
  ON public.client_addresses FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR is_admin());

-- 3. client_documents — add user read for own docs, remove broken policy
DROP POLICY IF EXISTS "Service role can manage documents" ON public.client_documents;

CREATE POLICY "Users can view own documents"
  ON public.client_documents FOR SELECT TO authenticated
  USING (client_cpf = get_my_cpf() OR is_admin());

-- 4. activity_logs — add service_role write access
CREATE POLICY "Service role full access to activity_logs"
  ON public.activity_logs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 5. client_preferences — add user CRUD (was admin-only!)
CREATE POLICY "Users can view own preferences"
  ON public.client_preferences FOR SELECT TO authenticated
  USING (client_cpf = get_my_cpf() OR is_admin());

CREATE POLICY "Users can insert own preferences"
  ON public.client_preferences FOR INSERT TO authenticated
  WITH CHECK (client_cpf = get_my_cpf());

CREATE POLICY "Users can update own preferences"
  ON public.client_preferences FOR UPDATE TO authenticated
  USING (client_cpf = get_my_cpf());

-- 6. client_auth_tokens — remove broken/duplicate policies
DROP POLICY IF EXISTS "Service role can manage tokens" ON public.client_auth_tokens;
DROP POLICY IF EXISTS "Admins can manage auth_tokens" ON public.client_auth_tokens;
