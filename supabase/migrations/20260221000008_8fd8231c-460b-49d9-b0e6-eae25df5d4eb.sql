
-- Fix vault_login_streaks: change from public role to service_role
DROP POLICY IF EXISTS "Service can manage vault_login_streaks" ON public.vault_login_streaks;
CREATE POLICY "Service can manage vault_login_streaks"
ON public.vault_login_streaks
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Also revoke all from anon on vault_login_streaks
REVOKE ALL ON public.vault_login_streaks FROM anon;

-- Ensure members can read their own streaks
DROP POLICY IF EXISTS "Members can view own streaks" ON public.vault_login_streaks;
CREATE POLICY "Members can view own streaks"
ON public.vault_login_streaks
FOR SELECT
TO authenticated
USING (
  member_id IN (
    SELECT vm.id FROM vault_members vm
    JOIN client_profiles cp ON cp.cpf = vm.client_cpf
    WHERE cp.user_id = auth.uid()
  )
  OR is_admin(auth.uid())
);
