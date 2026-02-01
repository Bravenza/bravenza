-- =============================================
-- BRAVENZA VAULT CLUB - DATABASE MIGRATION
-- =============================================

-- 1. CREATE NEW ENUMS
-- =============================================

-- Member status enum
DO $$ BEGIN
  CREATE TYPE public.vault_member_status AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Condition preference enum  
DO $$ BEGIN
  CREATE TYPE public.condition_preference AS ENUM ('DS', 'VNDS', 'USED_OK');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Urgency enum
DO $$ BEGIN
  CREATE TYPE public.urgency_level AS ENUM ('NOW', 'FLEXIBLE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Search status enum
DO $$ BEGIN
  CREATE TYPE public.search_status AS ENUM (
    'RECEIVED', 
    'IN_CURATION', 
    'OPTIONS_IDENTIFIED', 
    'VALIDATING', 
    'MATCH_SENT', 
    'AWAITING_DECISION', 
    'CLOSED_APPROVED', 
    'CLOSED_NOT_FOUND', 
    'CLOSED_CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Search update type enum
DO $$ BEGIN
  CREATE TYPE public.search_update_type AS ENUM ('UPDATE', 'ALERT', 'REQUEST_INFO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Match decision status enum
DO $$ BEGIN
  CREATE TYPE public.match_decision_status AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Vault item verified status enum
DO $$ BEGIN
  CREATE TYPE public.vault_verified_status AS ENUM ('VERIFIED', 'PENDING', 'REVOKED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Intel post type enum
DO $$ BEGIN
  CREATE TYPE public.intel_post_type AS ENUM ('RADAR', 'GUIDE', 'ALERT', 'EVENT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Intel visibility enum
DO $$ BEGIN
  CREATE TYPE public.intel_visibility AS ENUM ('ALL', 'PRIVILEGE_PLUS', 'BLACK_ONLY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Community post type enum
DO $$ BEGIN
  CREATE TYPE public.community_post_type AS ENUM ('SHOWCASE', 'DISCUSSION', 'POLL', 'ISO_WTB');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Community post status enum
DO $$ BEGIN
  CREATE TYPE public.community_post_status AS ENUM ('PUBLISHED', 'PENDING_REVIEW', 'REMOVED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. ADAPT VAULT_MEMBERS TABLE
-- =============================================

-- Add new columns to vault_members
ALTER TABLE public.vault_members 
  ADD COLUMN IF NOT EXISTS status public.vault_member_status DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS community_opt_in boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS timezone varchar DEFAULT 'America/Sao_Paulo',
  ADD COLUMN IF NOT EXISTS stats_purchases_count_12m integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stats_spend_total_12m numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stats_purchases_count_18m integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stats_spend_total_18m numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stats_matches_total integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stats_matches_approved integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stats_matches_declined integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stats_decision_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stats_converted_invites integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS flags_review_mode_until timestamp with time zone,
  ADD COLUMN IF NOT EXISTS flags_consecutive_declines integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS flags_eligible_for_black boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS notes_internal text;

-- 3. ADAPT VAULT_WISHLISTS TABLE (Now WishlistItems)
-- =============================================

-- Add new columns to vault_wishlists
ALTER TABLE public.vault_wishlists
  ADD COLUMN IF NOT EXISTS title varchar,
  ADD COLUMN IF NOT EXISTS colorway varchar,
  ADD COLUMN IF NOT EXISTS condition_pref public.condition_preference DEFAULT 'DS',
  ADD COLUMN IF NOT EXISTS urgency_level public.urgency_level DEFAULT 'FLEXIBLE';

-- Update title from product_name if null
UPDATE public.vault_wishlists SET title = product_name WHERE title IS NULL;

-- 4. CREATE VAULT_SEARCHES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.vault_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.vault_members(id) ON DELETE CASCADE,
  wishlist_item_id uuid REFERENCES public.vault_wishlists(id) ON DELETE SET NULL,
  status public.search_status NOT NULL DEFAULT 'RECEIVED',
  is_active boolean DEFAULT true,
  started_at timestamp with time zone DEFAULT now(),
  last_update_at timestamp with time zone DEFAULT now(),
  match_room_id uuid,
  sla_next_update_due_at timestamp with time zone,
  created_by_admin_id uuid,
  internal_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vault_searches ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage searches" ON public.vault_searches FOR ALL USING (is_admin());
CREATE POLICY "Service role manages searches" ON public.vault_searches FOR ALL USING (false) WITH CHECK (false);

-- 5. CREATE VAULT_SEARCH_UPDATES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.vault_search_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id uuid NOT NULL REFERENCES public.vault_searches(id) ON DELETE CASCADE,
  update_type public.search_update_type NOT NULL DEFAULT 'UPDATE',
  message text NOT NULL,
  created_by_admin_id uuid,
  visible_to_customer boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vault_search_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage search updates" ON public.vault_search_updates FOR ALL USING (is_admin());
CREATE POLICY "Service role manages search updates" ON public.vault_search_updates FOR ALL USING (false) WITH CHECK (false);

-- 6. CREATE VAULT_MATCH_ROOMS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.vault_match_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id uuid NOT NULL REFERENCES public.vault_searches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.vault_members(id) ON DELETE CASCADE,
  decision_deadline_at timestamp with time zone,
  decision_status public.match_decision_status DEFAULT 'PENDING',
  decision_at timestamp with time zone,
  decision_notes_from_customer text,
  created_by_admin_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vault_match_rooms ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage match rooms" ON public.vault_match_rooms FOR ALL USING (is_admin());
CREATE POLICY "Service role manages match rooms" ON public.vault_match_rooms FOR ALL USING (false) WITH CHECK (false);

-- Update vault_searches foreign key
ALTER TABLE public.vault_searches 
  ADD CONSTRAINT fk_match_room FOREIGN KEY (match_room_id) REFERENCES public.vault_match_rooms(id) ON DELETE SET NULL;

-- 7. CREATE VAULT_MATCH_OPTIONS TABLE (Replace vault_hunt_options)
-- =============================================

CREATE TABLE IF NOT EXISTS public.vault_match_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_room_id uuid NOT NULL REFERENCES public.vault_match_rooms(id) ON DELETE CASCADE,
  option_title varchar NOT NULL,
  region varchar,
  condition varchar,
  price_estimate numeric,
  currency varchar DEFAULT 'BRL',
  pros text,
  risks text,
  evidence_urls text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vault_match_options ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage match options" ON public.vault_match_options FOR ALL USING (is_admin());
CREATE POLICY "Service role manages match options" ON public.vault_match_options FOR ALL USING (false) WITH CHECK (false);

-- 8. CREATE VAULT_ITEMS TABLE (Compras concluídas)
-- =============================================

CREATE TABLE IF NOT EXISTS public.vault_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.vault_members(id) ON DELETE CASCADE,
  vault_id varchar UNIQUE NOT NULL,
  title varchar NOT NULL,
  brand varchar,
  model varchar,
  colorway varchar,
  size varchar,
  origin_city varchar,
  origin_country varchar,
  verified_status public.vault_verified_status DEFAULT 'PENDING',
  verified_at timestamp with time zone,
  certificate_pdf_url text,
  qr_private_url text,
  inspection_photos text[] DEFAULT '{}',
  timeline_events jsonb DEFAULT '[]',
  purchase_value numeric,
  purchase_date timestamp with time zone,
  search_id uuid REFERENCES public.vault_searches(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vault_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage vault items" ON public.vault_items FOR ALL USING (is_admin());
CREATE POLICY "Service role manages vault items" ON public.vault_items FOR ALL USING (false) WITH CHECK (false);

-- 9. CREATE VAULT_INTEL_POSTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.vault_intel_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.intel_post_type NOT NULL DEFAULT 'RADAR',
  title varchar NOT NULL,
  content text NOT NULL,
  visibility public.intel_visibility DEFAULT 'ALL',
  published_at timestamp with time zone,
  created_by_admin_id uuid,
  status varchar DEFAULT 'DRAFT',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vault_intel_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage intel posts" ON public.vault_intel_posts FOR ALL USING (is_admin());
CREATE POLICY "Service role manages intel posts" ON public.vault_intel_posts FOR ALL USING (false) WITH CHECK (false);

-- 10. CREATE VAULT_COMMUNITY_POSTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.vault_community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.vault_members(id) ON DELETE CASCADE,
  type public.community_post_type NOT NULL DEFAULT 'DISCUSSION',
  title varchar NOT NULL,
  content text,
  attachments text[] DEFAULT '{}',
  status public.community_post_status DEFAULT 'PENDING_REVIEW',
  moderated_by_admin_id uuid,
  moderation_notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vault_community_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage community posts" ON public.vault_community_posts FOR ALL USING (is_admin());
CREATE POLICY "Service role manages community posts" ON public.vault_community_posts FOR ALL USING (false) WITH CHECK (false);

-- 11. ADAPT VAULT_INVITES TABLE
-- =============================================

-- Add new columns
ALTER TABLE public.vault_invites
  ADD COLUMN IF NOT EXISTS token varchar UNIQUE,
  ADD COLUMN IF NOT EXISTS created_by_tier_at_time public.vault_tier,
  ADD COLUMN IF NOT EXISTS converted_purchase_vault_item_id uuid REFERENCES public.vault_items(id) ON DELETE SET NULL;

-- Generate token for existing invites without one
UPDATE public.vault_invites SET token = invite_code WHERE token IS NULL;

-- 12. ADAPT VAULT_WAITLIST TABLE
-- =============================================

-- Add new columns
ALTER TABLE public.vault_waitlist
  ADD COLUMN IF NOT EXISTS city varchar,
  ADD COLUMN IF NOT EXISTS interests text;

-- 13. CREATE DATABASE FUNCTIONS
-- =============================================

-- Function to generate vault item ID
CREATE OR REPLACE FUNCTION public.generate_vault_item_id()
RETURNS varchar
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  year_str varchar;
  seq_num integer;
  new_id varchar;
BEGIN
  year_str := EXTRACT(YEAR FROM NOW())::varchar;
  
  SELECT COUNT(*) + 1 INTO seq_num
  FROM public.vault_items
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  
  new_id := 'BRVZ-' || year_str || '-' || LPAD(seq_num::varchar, 6, '0');
  
  RETURN new_id;
END;
$$;

-- Function to get tier limits
CREATE OR REPLACE FUNCTION public.get_vault_club_tier_limits(p_tier public.vault_tier)
RETURNS TABLE(
  max_wishlist_items integer,
  max_active_searches integer,
  invites_per_semester integer,
  sla_first_response_hours integer,
  sla_update_frequency_hours integer,
  sla_match_room_hours integer,
  decision_window_hours integer
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  CASE p_tier
    WHEN 'elite' THEN -- Vault Black
      RETURN QUERY SELECT 50, 5, 5, 6, 24, 12, 24;
    WHEN 'collector' THEN -- Vault Privilege
      RETURN QUERY SELECT 50, 3, 3, 12, 48, 24, 12;
    ELSE -- member = Vault Access
      RETURN QUERY SELECT 3, 1, 2, 24, 72, 48, 6;
  END CASE;
END;
$$;

-- Function to check tier eligibility
CREATE OR REPLACE FUNCTION public.check_vault_tier_eligibility(p_member_id uuid)
RETURNS TABLE(
  current_tier public.vault_tier,
  eligible_for_privilege boolean,
  eligible_for_black boolean,
  privilege_criteria_met integer,
  black_criteria_met integer
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_member RECORD;
  v_privilege_met integer := 0;
  v_black_met integer := 0;
  v_has_high_value_purchase boolean := false;
BEGIN
  SELECT * INTO v_member FROM public.vault_members WHERE id = p_member_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Check Privilege eligibility (2/3 criteria in 12 months)
  -- Criteria 1: purchases_count_12m >= 3 OR spend_total_12m >= 6000
  IF v_member.stats_purchases_count_12m >= 3 OR v_member.stats_spend_total_12m >= 6000 THEN
    v_privilege_met := v_privilege_met + 1;
  END IF;
  
  -- Criteria 2: decision_rate >= 50%
  IF v_member.stats_decision_rate >= 0.50 THEN
    v_privilege_met := v_privilege_met + 1;
  END IF;
  
  -- Criteria 3: converted_invites >= 1
  IF v_member.stats_converted_invites >= 1 THEN
    v_privilege_met := v_privilege_met + 1;
  END IF;
  
  -- Check Black eligibility (2/4 criteria in 18 months)
  -- Criteria 1: purchases_count_18m >= 8 OR spend_total_18m >= 15000
  IF v_member.stats_purchases_count_18m >= 8 OR v_member.stats_spend_total_18m >= 15000 THEN
    v_black_met := v_black_met + 1;
  END IF;
  
  -- Criteria 2: decision_rate >= 70%
  IF v_member.stats_decision_rate >= 0.70 THEN
    v_black_met := v_black_met + 1;
  END IF;
  
  -- Criteria 3: converted_invites >= 2
  IF v_member.stats_converted_invites >= 2 THEN
    v_black_met := v_black_met + 1;
  END IF;
  
  -- Criteria 4: at least one purchase >= 3500 in last 18m
  SELECT EXISTS(
    SELECT 1 FROM public.vault_items 
    WHERE user_id = p_member_id 
    AND purchase_value >= 3500 
    AND purchase_date >= NOW() - INTERVAL '18 months'
  ) INTO v_has_high_value_purchase;
  
  IF v_has_high_value_purchase THEN
    v_black_met := v_black_met + 1;
  END IF;
  
  RETURN QUERY SELECT 
    v_member.tier,
    (v_privilege_met >= 2 AND v_member.status = 'ACTIVE'),
    (v_black_met >= 2 AND v_member.status = 'ACTIVE'),
    v_privilege_met,
    v_black_met;
END;
$$;

-- Function to get member searches with details
CREATE OR REPLACE FUNCTION public.get_vault_member_searches(p_cpf varchar)
RETURNS TABLE(
  search_id uuid,
  wishlist_title varchar,
  status public.search_status,
  is_active boolean,
  started_at timestamp with time zone,
  last_update_at timestamp with time zone,
  has_match_room boolean,
  match_room_id uuid,
  decision_status public.match_decision_status
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    s.id as search_id,
    COALESCE(w.title, w.product_name) as wishlist_title,
    s.status,
    s.is_active,
    s.started_at,
    s.last_update_at,
    (s.match_room_id IS NOT NULL) as has_match_room,
    s.match_room_id,
    mr.decision_status
  FROM public.vault_searches s
  INNER JOIN public.vault_members m ON m.id = s.user_id
  LEFT JOIN public.vault_wishlists w ON w.id = s.wishlist_item_id
  LEFT JOIN public.vault_match_rooms mr ON mr.id = s.match_room_id
  WHERE m.client_cpf = p_cpf
  ORDER BY s.created_at DESC;
$$;

-- Function to get member vault items
CREATE OR REPLACE FUNCTION public.get_vault_member_items(p_cpf varchar)
RETURNS TABLE(
  id uuid,
  vault_id varchar,
  title varchar,
  brand varchar,
  model varchar,
  colorway varchar,
  size varchar,
  verified_status public.vault_verified_status,
  inspection_photos text[],
  certificate_pdf_url text,
  qr_private_url text,
  purchase_value numeric,
  purchase_date timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    vi.id,
    vi.vault_id,
    vi.title,
    vi.brand,
    vi.model,
    vi.colorway,
    vi.size,
    vi.verified_status,
    vi.inspection_photos,
    vi.certificate_pdf_url,
    vi.qr_private_url,
    vi.purchase_value,
    vi.purchase_date
  FROM public.vault_items vi
  INNER JOIN public.vault_members m ON m.id = vi.user_id
  WHERE m.client_cpf = p_cpf
  ORDER BY vi.purchase_date DESC;
$$;

-- Function to get intel posts for member tier
CREATE OR REPLACE FUNCTION public.get_vault_intel_posts(p_cpf varchar)
RETURNS TABLE(
  id uuid,
  type public.intel_post_type,
  title varchar,
  content text,
  visibility public.intel_visibility,
  published_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier public.vault_tier;
BEGIN
  SELECT tier INTO v_tier FROM public.vault_members WHERE client_cpf = p_cpf;
  
  RETURN QUERY
  SELECT 
    ip.id,
    ip.type,
    ip.title,
    ip.content,
    ip.visibility,
    ip.published_at
  FROM public.vault_intel_posts ip
  WHERE ip.status = 'PUBLISHED'
    AND ip.published_at <= NOW()
    AND (
      ip.visibility = 'ALL'
      OR (ip.visibility = 'PRIVILEGE_PLUS' AND v_tier IN ('collector', 'elite'))
      OR (ip.visibility = 'BLACK_ONLY' AND v_tier = 'elite')
    )
  ORDER BY ip.published_at DESC;
END;
$$;

-- Function to get community posts
CREATE OR REPLACE FUNCTION public.get_vault_community_posts(p_cpf varchar)
RETURNS TABLE(
  id uuid,
  author_name varchar,
  author_tier public.vault_tier,
  type public.community_post_type,
  title varchar,
  content text,
  attachments text[],
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    cp.id,
    m.client_name as author_name,
    m.tier as author_tier,
    cp.type,
    cp.title,
    cp.content,
    cp.attachments,
    cp.created_at
  FROM public.vault_community_posts cp
  INNER JOIN public.vault_members m ON m.id = cp.user_id
  WHERE cp.status = 'PUBLISHED'
  ORDER BY cp.created_at DESC;
$$;

-- Function to get match room details
CREATE OR REPLACE FUNCTION public.get_vault_match_room(p_cpf varchar, p_match_room_id uuid)
RETURNS TABLE(
  id uuid,
  search_id uuid,
  wishlist_title varchar,
  decision_deadline_at timestamp with time zone,
  decision_status public.match_decision_status,
  options jsonb,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    mr.id,
    mr.search_id,
    COALESCE(w.title, w.product_name) as wishlist_title,
    mr.decision_deadline_at,
    mr.decision_status,
    (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', mo.id,
        'option_title', mo.option_title,
        'region', mo.region,
        'condition', mo.condition,
        'price_estimate', mo.price_estimate,
        'currency', mo.currency,
        'pros', mo.pros,
        'risks', mo.risks,
        'evidence_urls', mo.evidence_urls
      )), '[]'::jsonb)
      FROM public.vault_match_options mo
      WHERE mo.match_room_id = mr.id
    ) as options,
    mr.created_at
  FROM public.vault_match_rooms mr
  INNER JOIN public.vault_members m ON m.id = mr.user_id
  LEFT JOIN public.vault_searches s ON s.id = mr.search_id
  LEFT JOIN public.vault_wishlists w ON w.id = s.wishlist_item_id
  WHERE m.client_cpf = p_cpf AND mr.id = p_match_room_id;
$$;

-- Function to approve match room decision
CREATE OR REPLACE FUNCTION public.approve_vault_match(p_cpf varchar, p_match_room_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id uuid;
  v_search_id uuid;
BEGIN
  -- Verify member owns this match room
  SELECT m.id, mr.search_id INTO v_member_id, v_search_id
  FROM public.vault_match_rooms mr
  INNER JOIN public.vault_members m ON m.id = mr.user_id
  WHERE m.client_cpf = p_cpf AND mr.id = p_match_room_id;
  
  IF v_member_id IS NULL THEN
    RAISE EXCEPTION 'Match room não encontrada';
  END IF;
  
  -- Update match room
  UPDATE public.vault_match_rooms
  SET decision_status = 'APPROVED', decision_at = NOW()
  WHERE id = p_match_room_id;
  
  -- Update search
  UPDATE public.vault_searches
  SET status = 'CLOSED_APPROVED', is_active = false, last_update_at = NOW()
  WHERE id = v_search_id;
  
  -- Update member stats
  UPDATE public.vault_members
  SET 
    stats_matches_approved = stats_matches_approved + 1,
    stats_decision_rate = CASE 
      WHEN stats_matches_total > 0 
      THEN (stats_matches_approved + 1)::numeric / stats_matches_total 
      ELSE 1 
    END,
    flags_consecutive_declines = 0
  WHERE id = v_member_id;
  
  RETURN TRUE;
END;
$$;

-- Function to decline match room decision
CREATE OR REPLACE FUNCTION public.decline_vault_match(p_cpf varchar, p_match_room_id uuid, p_reason text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id uuid;
  v_search_id uuid;
  v_consecutive_declines integer;
BEGIN
  -- Verify member owns this match room
  SELECT m.id, mr.search_id, m.flags_consecutive_declines INTO v_member_id, v_search_id, v_consecutive_declines
  FROM public.vault_match_rooms mr
  INNER JOIN public.vault_members m ON m.id = mr.user_id
  WHERE m.client_cpf = p_cpf AND mr.id = p_match_room_id;
  
  IF v_member_id IS NULL THEN
    RAISE EXCEPTION 'Match room não encontrada';
  END IF;
  
  -- Update match room
  UPDATE public.vault_match_rooms
  SET 
    decision_status = 'DECLINED', 
    decision_at = NOW(),
    decision_notes_from_customer = p_reason
  WHERE id = p_match_room_id;
  
  -- Update search back to curation
  UPDATE public.vault_searches
  SET status = 'IN_CURATION', match_room_id = NULL, last_update_at = NOW()
  WHERE id = v_search_id;
  
  -- Update member stats and check for review mode
  v_consecutive_declines := v_consecutive_declines + 1;
  
  UPDATE public.vault_members
  SET 
    stats_matches_declined = stats_matches_declined + 1,
    stats_decision_rate = CASE 
      WHEN stats_matches_total > 0 
      THEN stats_matches_approved::numeric / stats_matches_total 
      ELSE 0 
    END,
    flags_consecutive_declines = v_consecutive_declines,
    flags_review_mode_until = CASE 
      WHEN v_consecutive_declines >= 5 
      THEN NOW() + INTERVAL '30 days'
      ELSE flags_review_mode_until
    END
  WHERE id = v_member_id;
  
  RETURN TRUE;
END;
$$;

-- 14. CREATE INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_vault_searches_user_id ON public.vault_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_vault_searches_status ON public.vault_searches(status);
CREATE INDEX IF NOT EXISTS idx_vault_search_updates_search_id ON public.vault_search_updates(search_id);
CREATE INDEX IF NOT EXISTS idx_vault_match_rooms_user_id ON public.vault_match_rooms(user_id);
CREATE INDEX IF NOT EXISTS idx_vault_match_rooms_search_id ON public.vault_match_rooms(search_id);
CREATE INDEX IF NOT EXISTS idx_vault_match_options_room_id ON public.vault_match_options(match_room_id);
CREATE INDEX IF NOT EXISTS idx_vault_items_user_id ON public.vault_items(user_id);
CREATE INDEX IF NOT EXISTS idx_vault_intel_posts_status ON public.vault_intel_posts(status);
CREATE INDEX IF NOT EXISTS idx_vault_community_posts_status ON public.vault_community_posts(status);