-- ====================================================
-- COMPREHENSIVE SECURITY CLEANUP
-- Step 1: Drop all policies that depend on is_admin()
-- ====================================================

-- Orders
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;

-- Order history
DROP POLICY IF EXISTS "Admins can view all order history" ON public.order_history;
DROP POLICY IF EXISTS "Admins can insert order history" ON public.order_history;

-- User roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

-- Profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Order requests
DROP POLICY IF EXISTS "Admins can view all order requests" ON public.order_requests;
DROP POLICY IF EXISTS "Admins can update order requests" ON public.order_requests;
DROP POLICY IF EXISTS "Admins can delete order requests" ON public.order_requests;

-- Notifications
DROP POLICY IF EXISTS "Admins can view admin notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can update admin notifications" ON public.notifications;

-- Activity logs
DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Admins can insert activity logs" ON public.activity_logs;

-- Suppliers
DROP POLICY IF EXISTS "Admins can view all suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Admins can insert suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Admins can update suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Admins can delete suppliers" ON public.suppliers;

-- Scheduled reminders
DROP POLICY IF EXISTS "Admins can view all reminders" ON public.scheduled_reminders;
DROP POLICY IF EXISTS "Admins can manage reminders" ON public.scheduled_reminders;

-- FAQs
DROP POLICY IF EXISTS "Admins can manage FAQs" ON public.faqs;

-- Reviews
DROP POLICY IF EXISTS "Admins can view all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can update reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can delete reviews" ON public.reviews;

-- Referrals
DROP POLICY IF EXISTS "Admins can view all referrals" ON public.referrals;
DROP POLICY IF EXISTS "Admins can manage referrals" ON public.referrals;
DROP POLICY IF EXISTS "Service can manage referrals" ON public.referrals;
DROP POLICY IF EXISTS "Service role can manage referrals" ON public.referrals;

-- Client documents
DROP POLICY IF EXISTS "Admins can view all documents" ON public.client_documents;

-- System settings
DROP POLICY IF EXISTS "Admins can view settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can insert settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can delete settings" ON public.system_settings;

-- Order costs
DROP POLICY IF EXISTS "Admins can view all order costs" ON public.order_costs;
DROP POLICY IF EXISTS "Admins can insert order costs" ON public.order_costs;
DROP POLICY IF EXISTS "Admins can update order costs" ON public.order_costs;
DROP POLICY IF EXISTS "Admins can delete order costs" ON public.order_costs;

-- Featured models
DROP POLICY IF EXISTS "Admins can manage featured models" ON public.featured_models;

-- Vault tables
DROP POLICY IF EXISTS "Admins can manage vault members" ON public.vault_members;
DROP POLICY IF EXISTS "Admins can manage vault_members" ON public.vault_members;
DROP POLICY IF EXISTS "Service can manage vault_members" ON public.vault_members;
DROP POLICY IF EXISTS "Service role manages vault members" ON public.vault_members;

DROP POLICY IF EXISTS "Admins can manage wishlists" ON public.vault_wishlists;
DROP POLICY IF EXISTS "Admins can manage vault_wishlists" ON public.vault_wishlists;
DROP POLICY IF EXISTS "Service can manage vault_wishlists" ON public.vault_wishlists;
DROP POLICY IF EXISTS "Service role manages wishlists" ON public.vault_wishlists;

DROP POLICY IF EXISTS "Admins can manage hunt options" ON public.vault_hunt_options;
DROP POLICY IF EXISTS "Admins can manage invites" ON public.vault_invites;
DROP POLICY IF EXISTS "Admins can manage badges" ON public.vault_badges;
DROP POLICY IF EXISTS "Admins can manage searches" ON public.vault_searches;
DROP POLICY IF EXISTS "Admins can manage search updates" ON public.vault_search_updates;
DROP POLICY IF EXISTS "Admins can manage match rooms" ON public.vault_match_rooms;
DROP POLICY IF EXISTS "Admins can manage match options" ON public.vault_match_options;
DROP POLICY IF EXISTS "Admins can manage vault items" ON public.vault_items;
DROP POLICY IF EXISTS "Admins can manage intel posts" ON public.vault_intel_posts;
DROP POLICY IF EXISTS "Admins can manage community posts" ON public.vault_community_posts;

-- Waitlist
DROP POLICY IF EXISTS "Admins can manage waitlist" ON public.vault_waitlist;
DROP POLICY IF EXISTS "Service can manage waitlist" ON public.vault_waitlist;

-- Client preferences
DROP POLICY IF EXISTS "Admins can manage preferences" ON public.client_preferences;
DROP POLICY IF EXISTS "Service can manage preferences" ON public.client_preferences;
DROP POLICY IF EXISTS "Service role can manage preferences" ON public.client_preferences;

-- Storage policies
DROP POLICY IF EXISTS "Admins can delete sneaker references" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload featured model images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete featured model images" ON storage.objects;