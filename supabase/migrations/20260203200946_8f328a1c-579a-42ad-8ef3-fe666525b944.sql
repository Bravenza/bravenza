-- Fix security: Restrict system_settings public read access
-- Only admins should be able to read system settings

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view settings" ON public.system_settings;

-- Create new policy that only allows admins to view settings
CREATE POLICY "Admins can view settings" 
ON public.system_settings 
FOR SELECT 
USING (is_admin());
