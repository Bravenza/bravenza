
-- =====================================================
-- DROP AND RECREATE remaining policies
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage referrals" ON public.referrals;
DROP POLICY IF EXISTS "Service can manage referrals" ON public.referrals;
DROP POLICY IF EXISTS "Admins can manage waitlist" ON public.vault_waitlist;
DROP POLICY IF EXISTS "Service can manage waitlist" ON public.vault_waitlist;
DROP POLICY IF EXISTS "Admins can manage documents" ON public.client_documents;
DROP POLICY IF EXISTS "Service can manage documents" ON public.client_documents;
DROP POLICY IF EXISTS "Admins can manage vault_members" ON public.vault_members;
DROP POLICY IF EXISTS "Service can manage vault_members" ON public.vault_members;
DROP POLICY IF EXISTS "Admins can manage auth_tokens" ON public.client_auth_tokens;
DROP POLICY IF EXISTS "Service can manage auth_tokens" ON public.client_auth_tokens;
DROP POLICY IF EXISTS "Admins can manage sessions" ON public.client_sessions;
DROP POLICY IF EXISTS "Service can manage sessions" ON public.client_sessions;
DROP POLICY IF EXISTS "Admins can manage preferences" ON public.client_preferences;
DROP POLICY IF EXISTS "Service can manage preferences" ON public.client_preferences;
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service can manage notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage vault_items" ON public.vault_items;
DROP POLICY IF EXISTS "Service can manage vault_items" ON public.vault_items;
DROP POLICY IF EXISTS "Admins can manage vault_wishlists" ON public.vault_wishlists;
DROP POLICY IF EXISTS "Service can manage vault_wishlists" ON public.vault_wishlists;
DROP POLICY IF EXISTS "Admins can manage vault_searches" ON public.vault_searches;
DROP POLICY IF EXISTS "Service can manage vault_searches" ON public.vault_searches;
DROP POLICY IF EXISTS "Admins can manage vault_badges" ON public.vault_badges;
DROP POLICY IF EXISTS "Service can manage vault_badges" ON public.vault_badges;
DROP POLICY IF EXISTS "Admins can manage vault_invites" ON public.vault_invites;
DROP POLICY IF EXISTS "Service can manage vault_invites" ON public.vault_invites;
DROP POLICY IF EXISTS "Admins can manage vault_intel_posts" ON public.vault_intel_posts;
DROP POLICY IF EXISTS "Service can manage vault_intel_posts" ON public.vault_intel_posts;
DROP POLICY IF EXISTS "Admins can manage vault_community_posts" ON public.vault_community_posts;
DROP POLICY IF EXISTS "Service can manage vault_community_posts" ON public.vault_community_posts;
DROP POLICY IF EXISTS "Admins can manage vault_match_rooms" ON public.vault_match_rooms;
DROP POLICY IF EXISTS "Service can manage vault_match_rooms" ON public.vault_match_rooms;
DROP POLICY IF EXISTS "Admins can manage vault_match_options" ON public.vault_match_options;
DROP POLICY IF EXISTS "Service can manage vault_match_options" ON public.vault_match_options;
DROP POLICY IF EXISTS "Admins can manage vault_search_updates" ON public.vault_search_updates;
DROP POLICY IF EXISTS "Service can manage vault_search_updates" ON public.vault_search_updates;
DROP POLICY IF EXISTS "Admins can manage vault_hunt_options" ON public.vault_hunt_options;
DROP POLICY IF EXISTS "Service can manage vault_hunt_options" ON public.vault_hunt_options;

-- Now create fresh policies
-- referrals
CREATE POLICY "Admins can manage referrals" ON public.referrals FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Service can manage referrals" ON public.referrals FOR ALL TO service_role USING (true) WITH CHECK (true);

-- vault_waitlist
CREATE POLICY "Admins can manage waitlist" ON public.vault_waitlist FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Service can manage waitlist" ON public.vault_waitlist FOR ALL TO service_role USING (true) WITH CHECK (true);

-- client_documents
CREATE POLICY "Admins can manage documents" ON public.client_documents FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Service can manage documents" ON public.client_documents FOR ALL TO service_role USING (true) WITH CHECK (true);

-- vault_members
CREATE POLICY "Admins can manage vault_members" ON public.vault_members FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Service can manage vault_members" ON public.vault_members FOR ALL TO service_role USING (true) WITH CHECK (true);

-- client_auth_tokens
CREATE POLICY "Admins can manage auth_tokens" ON public.client_auth_tokens FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Service can manage auth_tokens" ON public.client_auth_tokens FOR ALL TO service_role USING (true) WITH CHECK (true);

-- client_sessions
CREATE POLICY "Admins can manage sessions" ON public.client_sessions FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Service can manage sessions" ON public.client_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- client_preferences
CREATE POLICY "Admins can manage preferences" ON public.client_preferences FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Service can manage preferences" ON public.client_preferences FOR ALL TO service_role USING (true) WITH CHECK (true);

-- notifications
CREATE POLICY "Admins can manage notifications" ON public.notifications FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Service can manage notifications" ON public.notifications FOR ALL TO service_role USING (true) WITH CHECK (true);

-- vault_items
CREATE POLICY "Admins can manage vault_items" ON public.vault_items FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Service can manage vault_items" ON public.vault_items FOR ALL TO service_role USING (true) WITH CHECK (true);

-- vault_wishlists
CREATE POLICY "Admins can manage vault_wishlists" ON public.vault_wishlists FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Service can manage vault_wishlists" ON public.vault_wishlists FOR ALL TO service_role USING (true) WITH CHECK (true);

-- vault_searches
CREATE POLICY "Admins can manage vault_searches" ON public.vault_searches FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Service can manage vault_searches" ON public.vault_searches FOR ALL TO service_role USING (true) WITH CHECK (true);

-- vault_badges
CREATE POLICY "Admins can manage vault_badges" ON public.vault_badges FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Service can manage vault_badges" ON public.vault_badges FOR ALL TO service_role USING (true) WITH CHECK (true);

-- vault_invites
CREATE POLICY "Admins can manage vault_invites" ON public.vault_invites FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Service can manage vault_invites" ON public.vault_invites FOR ALL TO service_role USING (true) WITH CHECK (true);

-- vault_intel_posts
CREATE POLICY "Admins can manage vault_intel_posts" ON public.vault_intel_posts FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Service can manage vault_intel_posts" ON public.vault_intel_posts FOR ALL TO service_role USING (true) WITH CHECK (true);

-- vault_community_posts
CREATE POLICY "Admins can manage vault_community_posts" ON public.vault_community_posts FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Service can manage vault_community_posts" ON public.vault_community_posts FOR ALL TO service_role USING (true) WITH CHECK (true);

-- vault_match_rooms
CREATE POLICY "Admins can manage vault_match_rooms" ON public.vault_match_rooms FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Service can manage vault_match_rooms" ON public.vault_match_rooms FOR ALL TO service_role USING (true) WITH CHECK (true);

-- vault_match_options
CREATE POLICY "Admins can manage vault_match_options" ON public.vault_match_options FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Service can manage vault_match_options" ON public.vault_match_options FOR ALL TO service_role USING (true) WITH CHECK (true);

-- vault_search_updates
CREATE POLICY "Admins can manage vault_search_updates" ON public.vault_search_updates FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Service can manage vault_search_updates" ON public.vault_search_updates FOR ALL TO service_role USING (true) WITH CHECK (true);

-- vault_hunt_options
CREATE POLICY "Admins can manage vault_hunt_options" ON public.vault_hunt_options FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Service can manage vault_hunt_options" ON public.vault_hunt_options FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Grant permissions
GRANT INSERT ON public.order_requests TO anon;
GRANT INSERT ON public.vault_waitlist TO anon;
GRANT SELECT ON public.referrals TO anon;
GRANT SELECT, UPDATE ON public.orders TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
