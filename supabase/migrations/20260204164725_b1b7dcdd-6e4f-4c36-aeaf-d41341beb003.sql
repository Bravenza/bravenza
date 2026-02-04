-- Continue creating remaining policies (skipping ones that were already created)

-- ORDER_REQUESTS (keep public INSERT)
DROP POLICY IF EXISTS "Admins full access to order_requests" ON public.order_requests;
CREATE POLICY "Admins full access to order_requests"
  ON public.order_requests FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Admins full access to notifications" ON public.notifications;
CREATE POLICY "Admins full access to notifications"
  ON public.notifications FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ACTIVITY_LOGS
DROP POLICY IF EXISTS "Admins full access to activity_logs" ON public.activity_logs;
CREATE POLICY "Admins full access to activity_logs"
  ON public.activity_logs FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- SUPPLIERS
DROP POLICY IF EXISTS "Admins full access to suppliers" ON public.suppliers;
CREATE POLICY "Admins full access to suppliers"
  ON public.suppliers FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- SCHEDULED_REMINDERS
DROP POLICY IF EXISTS "Admins full access to reminders" ON public.scheduled_reminders;
CREATE POLICY "Admins full access to reminders"
  ON public.scheduled_reminders FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- FAQS
DROP POLICY IF EXISTS "Admins full access to faqs" ON public.faqs;
CREATE POLICY "Admins full access to faqs"
  ON public.faqs FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- REVIEWS
DROP POLICY IF EXISTS "Admins full access to reviews" ON public.reviews;
CREATE POLICY "Admins full access to reviews"
  ON public.reviews FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- REFERRALS
DROP POLICY IF EXISTS "Admins full access to referrals" ON public.referrals;
CREATE POLICY "Admins full access to referrals"
  ON public.referrals FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- CLIENT_DOCUMENTS
DROP POLICY IF EXISTS "Admins full access to client_documents" ON public.client_documents;
CREATE POLICY "Admins full access to client_documents"
  ON public.client_documents FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- CLIENT_AUTH_TOKENS
DROP POLICY IF EXISTS "Admins full access to client_auth_tokens" ON public.client_auth_tokens;
CREATE POLICY "Admins full access to client_auth_tokens"
  ON public.client_auth_tokens FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- CLIENT_SESSIONS
DROP POLICY IF EXISTS "Admins full access to client_sessions" ON public.client_sessions;
CREATE POLICY "Admins full access to client_sessions"
  ON public.client_sessions FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- SYSTEM_SETTINGS
DROP POLICY IF EXISTS "Admins full access to system_settings" ON public.system_settings;
CREATE POLICY "Admins full access to system_settings"
  ON public.system_settings FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ORDER_COSTS
DROP POLICY IF EXISTS "Admins full access to order_costs" ON public.order_costs;
CREATE POLICY "Admins full access to order_costs"
  ON public.order_costs FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- FEATURED_MODELS
DROP POLICY IF EXISTS "Admins full access to featured_models" ON public.featured_models;
CREATE POLICY "Admins full access to featured_models"
  ON public.featured_models FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- CLIENT_PREFERENCES
DROP POLICY IF EXISTS "Admins full access to client_preferences" ON public.client_preferences;
CREATE POLICY "Admins full access to client_preferences"
  ON public.client_preferences FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- VAULT_MEMBERS
DROP POLICY IF EXISTS "Admins full access to vault_members" ON public.vault_members;
CREATE POLICY "Admins full access to vault_members"
  ON public.vault_members FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- VAULT_WISHLISTS
DROP POLICY IF EXISTS "Admins full access to vault_wishlists" ON public.vault_wishlists;
CREATE POLICY "Admins full access to vault_wishlists"
  ON public.vault_wishlists FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- VAULT_HUNT_OPTIONS
DROP POLICY IF EXISTS "Admins full access to vault_hunt_options" ON public.vault_hunt_options;
CREATE POLICY "Admins full access to vault_hunt_options"
  ON public.vault_hunt_options FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- VAULT_INVITES
DROP POLICY IF EXISTS "Admins full access to vault_invites" ON public.vault_invites;
CREATE POLICY "Admins full access to vault_invites"
  ON public.vault_invites FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- VAULT_BADGES
DROP POLICY IF EXISTS "Admins full access to vault_badges" ON public.vault_badges;
CREATE POLICY "Admins full access to vault_badges"
  ON public.vault_badges FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- VAULT_SEARCHES
DROP POLICY IF EXISTS "Admins full access to vault_searches" ON public.vault_searches;
CREATE POLICY "Admins full access to vault_searches"
  ON public.vault_searches FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- VAULT_SEARCH_UPDATES
DROP POLICY IF EXISTS "Admins full access to vault_search_updates" ON public.vault_search_updates;
CREATE POLICY "Admins full access to vault_search_updates"
  ON public.vault_search_updates FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- VAULT_MATCH_ROOMS
DROP POLICY IF EXISTS "Admins full access to vault_match_rooms" ON public.vault_match_rooms;
CREATE POLICY "Admins full access to vault_match_rooms"
  ON public.vault_match_rooms FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- VAULT_MATCH_OPTIONS
DROP POLICY IF EXISTS "Admins full access to vault_match_options" ON public.vault_match_options;
CREATE POLICY "Admins full access to vault_match_options"
  ON public.vault_match_options FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- VAULT_ITEMS
DROP POLICY IF EXISTS "Admins full access to vault_items" ON public.vault_items;
CREATE POLICY "Admins full access to vault_items"
  ON public.vault_items FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- VAULT_INTEL_POSTS
DROP POLICY IF EXISTS "Admins full access to vault_intel_posts" ON public.vault_intel_posts;
CREATE POLICY "Admins full access to vault_intel_posts"
  ON public.vault_intel_posts FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- VAULT_COMMUNITY_POSTS
DROP POLICY IF EXISTS "Admins full access to vault_community_posts" ON public.vault_community_posts;
CREATE POLICY "Admins full access to vault_community_posts"
  ON public.vault_community_posts FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- VAULT_WAITLIST
DROP POLICY IF EXISTS "Admins full access to vault_waitlist" ON public.vault_waitlist;
CREATE POLICY "Admins full access to vault_waitlist"
  ON public.vault_waitlist FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());