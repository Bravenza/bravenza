-- Corrigir search_path na função generate_referral_code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS VARCHAR(20)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code VARCHAR(20) := 'BRVZ';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN code;
END;
$$;

-- Corrigir política permissiva demais para reviews INSERT
DROP POLICY IF EXISTS "Service role can insert reviews" ON public.reviews;

-- Adicionar política mais restritiva para inserção de reviews (via edge function com service role)
CREATE POLICY "Edge function can insert reviews"
ON public.reviews FOR INSERT
WITH CHECK (false); -- Apenas service role pode inserir

-- Corrigir política permissiva para order_requests INSERT (já existente, mas vamos manter pois é formulário público)
-- A política "Anyone can submit order requests" é intencional para permitir solicitações públicas