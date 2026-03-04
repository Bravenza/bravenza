CREATE POLICY "admin_delete_sneaker_models"
ON public.sneaker_models
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));