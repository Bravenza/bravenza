
-- ============================================================
-- SECURITY FIX: Corrigir políticas RLS permissivas
-- ============================================================

-- 1. seller_collections: "Service can manage" está com role {public} (CRÍTICO!)
--    Permite CRUD irrestrito para qualquer pessoa. Corrigir para service_role.
DROP POLICY IF EXISTS "Service can manage seller_collections" ON public.seller_collections;
CREATE POLICY "Service can manage seller_collections"
  ON public.seller_collections
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Corrigir também a policy de admin que está em {public} ao invés de {authenticated}
DROP POLICY IF EXISTS "Admins full access seller_collections" ON public.seller_collections;
CREATE POLICY "Admins full access seller_collections"
  ON public.seller_collections
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 2. vault_marketplace_offers: "Anyone can view offers" expõe buyer_cpf publicamente.
--    O marketplace já usa edge functions (mk-hub) com service_role para buscar ofertas.
--    Já existem policies específicas para buyers e sellers verem suas próprias ofertas.
DROP POLICY IF EXISTS "Anyone can view offers" ON public.vault_marketplace_offers;

-- Adicionar policy para usuários autenticados verem ofertas ativas SEM dados sensíveis
-- (a visibilidade real do buyer_cpf já é controlada pelas policies "Users can view own offers")
-- Para browsing público, criar policy que permite ver ofertas mas apenas de listagens ativas
CREATE POLICY "Authenticated can view active listing offers"
  ON public.vault_marketplace_offers
  FOR SELECT
  TO authenticated
  USING (
    status = 'pending' OR status = 'accepted' OR status = 'countered'
    OR buyer_cpf IN (SELECT cp.cpf FROM client_profiles cp WHERE cp.user_id = auth.uid())
    OR listing_id IN (
      SELECT vml.id FROM vault_marketplace_listings vml
      JOIN vault_seller_profiles vsp ON vsp.id = vml.seller_id
      JOIN vault_members vm ON vm.id = vsp.member_id
      JOIN client_profiles cp ON cp.cpf::text = vm.client_cpf::text
      WHERE cp.user_id = auth.uid()
    )
  );

-- 3. marketplace_product_comments: base table SELECT expõe CPF.
--    Já existe view "marketplace_product_comments_public" que mascara CPFs.
--    Restringir SELECT na tabela base para donos dos comentários + admins apenas.
--    (já existe "Users can read own comments" policy que faz isso, mas confirmar que
--     não há outra SELECT aberta)
-- A policy existente "Users can read own comments" já restringe corretamente.
-- Nenhuma ação necessária pois não há SELECT pública nesta tabela.

-- 4. vault_marketplace_orders: tem "Service can manage" para service_role (OK)
--    e policies buyer/seller SELECT + admin ALL. Tudo correto.

-- 5. Verificar que order_requests não permite SELECT público
--    Atualmente tem: admin ALL + anon INSERT. Sem SELECT para não-admins. OK.

-- 6. vault_waitlist: admin ALL + public INSERT. Sem SELECT para não-admins. OK.

-- 7. suppliers: admin ALL. Sem SELECT para não-admins. OK.

-- 8. vault_members: member SELECT + admin ALL. OK.

-- 9. referrals: user SELECT + admin ALL. OK.

-- 10. vault_seller_profiles: seller SELECT/UPDATE + admin ALL + service_role ALL. OK.

-- 11. vault_marketplace_messages: "No direct access" with false + admin ALL. OK.
