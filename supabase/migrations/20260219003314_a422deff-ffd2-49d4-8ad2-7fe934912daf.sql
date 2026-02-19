
-- Revoke SELECT from anon on vault_waitlist - only INSERT is needed for public form
REVOKE SELECT, UPDATE, DELETE ON public.vault_waitlist FROM anon;

-- Add explicit SELECT policy restricted to admins only
-- The existing "Admins full access" policy already covers admin SELECT,
-- but let's ensure no implicit access exists by revoking from authenticated too
-- and granting back only what's needed
REVOKE SELECT, UPDATE, DELETE ON public.vault_waitlist FROM authenticated;

-- Re-grant SELECT to authenticated (RLS will filter via admin-only policy)
GRANT SELECT, UPDATE, DELETE ON public.vault_waitlist TO authenticated;

-- Keep INSERT for anon (public waitlist form)
GRANT INSERT ON public.vault_waitlist TO anon;
