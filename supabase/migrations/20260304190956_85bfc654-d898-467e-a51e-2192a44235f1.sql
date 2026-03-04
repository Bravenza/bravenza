CREATE POLICY "admin_update_sneaker_models"
ON public.sneaker_models
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
);