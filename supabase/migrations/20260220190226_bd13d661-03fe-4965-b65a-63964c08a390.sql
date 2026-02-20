
-- Table for daily login streaks
CREATE TABLE public.vault_login_streaks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id uuid NOT NULL REFERENCES public.vault_members(id) ON DELETE CASCADE,
  login_date date NOT NULL DEFAULT CURRENT_DATE,
  current_streak integer NOT NULL DEFAULT 1,
  longest_streak integer NOT NULL DEFAULT 1,
  total_logins integer NOT NULL DEFAULT 1,
  last_login_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(member_id)
);

-- Enable RLS
ALTER TABLE public.vault_login_streaks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Members can view own streak" ON public.vault_login_streaks
  FOR SELECT USING (
    member_id IN (
      SELECT vm.id FROM vault_members vm
      JOIN client_profiles cp ON cp.cpf = vm.client_cpf
      WHERE cp.user_id = auth.uid()
    ) OR is_admin()
  );

CREATE POLICY "Admins full access to vault_login_streaks" ON public.vault_login_streaks
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Service can manage vault_login_streaks" ON public.vault_login_streaks
  FOR ALL USING (true) WITH CHECK (true);

-- Function to record daily login and update streak
CREATE OR REPLACE FUNCTION public.record_vault_login(p_cpf text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id uuid;
  v_streak record;
  v_today date := CURRENT_DATE;
  v_result jsonb;
BEGIN
  SELECT id INTO v_member_id FROM vault_members WHERE client_cpf = p_cpf AND is_active = true;
  IF v_member_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Member not found');
  END IF;

  SELECT * INTO v_streak FROM vault_login_streaks WHERE member_id = v_member_id;

  IF v_streak IS NULL THEN
    INSERT INTO vault_login_streaks (member_id, login_date, current_streak, longest_streak, total_logins, last_login_at)
    VALUES (v_member_id, v_today, 1, 1, 1, now());
    RETURN jsonb_build_object('success', true, 'current_streak', 1, 'longest_streak', 1, 'total_logins', 1, 'is_new_day', true);
  END IF;

  IF v_streak.login_date = v_today THEN
    RETURN jsonb_build_object('success', true, 'current_streak', v_streak.current_streak, 'longest_streak', v_streak.longest_streak, 'total_logins', v_streak.total_logins, 'is_new_day', false);
  END IF;

  IF v_streak.login_date = v_today - 1 THEN
    UPDATE vault_login_streaks SET
      login_date = v_today,
      current_streak = v_streak.current_streak + 1,
      longest_streak = GREATEST(v_streak.longest_streak, v_streak.current_streak + 1),
      total_logins = v_streak.total_logins + 1,
      last_login_at = now(),
      updated_at = now()
    WHERE member_id = v_member_id;
    RETURN jsonb_build_object('success', true, 'current_streak', v_streak.current_streak + 1, 'longest_streak', GREATEST(v_streak.longest_streak, v_streak.current_streak + 1), 'total_logins', v_streak.total_logins + 1, 'is_new_day', true);
  ELSE
    UPDATE vault_login_streaks SET
      login_date = v_today,
      current_streak = 1,
      total_logins = v_streak.total_logins + 1,
      last_login_at = now(),
      updated_at = now()
    WHERE member_id = v_member_id;
    RETURN jsonb_build_object('success', true, 'current_streak', 1, 'longest_streak', v_streak.longest_streak, 'total_logins', v_streak.total_logins + 1, 'is_new_day', true, 'streak_broken', true);
  END IF;
END;
$$;

-- View for member ranking (leaderboard)
CREATE OR REPLACE VIEW public.vault_member_rankings AS
SELECT
  vm.id as member_id,
  vm.display_name,
  vm.avatar_url,
  vm.tier,
  vm.client_name,
  vm.total_purchases,
  vm.stats_purchases_count_12m,
  vm.stats_converted_invites,
  vm.posts_count,
  COALESCE(vls.current_streak, 0) as current_streak,
  COALESCE(vls.longest_streak, 0) as longest_streak,
  COALESCE(vls.total_logins, 0) as total_logins,
  (SELECT count(*) FROM vault_badges vb WHERE vb.member_id = vm.id) as badges_count,
  -- Score calculation: purchases*30 + streak*5 + badges*20 + invites*15 + posts*10
  (
    COALESCE(vm.stats_purchases_count_12m, 0) * 30 +
    COALESCE(vls.current_streak, 0) * 5 +
    (SELECT count(*) FROM vault_badges vb WHERE vb.member_id = vm.id) * 20 +
    COALESCE(vm.stats_converted_invites, 0) * 15 +
    COALESCE(vm.posts_count, 0) * 10
  ) as total_score
FROM vault_members vm
LEFT JOIN vault_login_streaks vls ON vls.member_id = vm.id
WHERE vm.is_active = true AND vm.is_profile_public = true
ORDER BY total_score DESC;
