-- Remove unnecessary anon grants that violate least-privilege principle
REVOKE UPDATE ON public.orders FROM anon;
REVOKE SELECT ON public.referrals FROM anon;