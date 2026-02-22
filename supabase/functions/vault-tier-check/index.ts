import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tier limits configuration
const TIER_LIMITS = {
  member: { // Vault Access
    max_wishlist_items: 3,
    max_active_hunts: 1,
    invites_per_semester: 2,
  },
  collector: { // Vault Privilege
    max_wishlist_items: 50,
    max_active_hunts: 3,
    invites_per_semester: 3,
  },
  elite: { // Vault Black
    max_wishlist_items: 50,
    max_active_hunts: 5,
    invites_per_semester: 5,
  },
};

interface TierCheckRequest {
  member_id?: string;
  check_all?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const cronStartedAt = new Date().toISOString();
    const { data: logEntry } = await supabase
      .from("cron_execution_logs")
      .insert({ job_name: "vault-tier-check", started_at: cronStartedAt, status: "running" })
      .select("id")
      .single();
    const cronLogId = logEntry?.id || null;

    let body: TierCheckRequest = {};
    if (req.method === 'POST') {
      try {
        body = await req.json();
      } catch {
        // Empty body from cron — check all members
      }
    }
    const { member_id, check_all } = body;

    let query = supabase
      .from('vault_members')
      .select('*')
      .eq('is_active', true)
      .eq('status', 'ACTIVE');

    if (member_id && !check_all) {
      query = query.eq('id', member_id);
    }

    const { data: members, error } = await query;

    if (error) {
      console.error('Error fetching members:', error);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar membros' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = {
      checked: 0,
      upgraded: 0,
      downgraded: 0,
      unchanged: 0,
      details: [] as Array<{ member_id: string; name: string; old_tier: string; new_tier: string; action: string }>,
    };

    for (const member of members || []) {
      results.checked++;

      // Calculate eligibility
      const eligibility = checkTierEligibility(member);
      
      let newTier = member.tier;
      let action = 'unchanged';

      // Determine new tier (can only upgrade, not downgrade automatically)
      if (eligibility.eligible_for_black && member.tier !== 'elite') {
        // Black requires manual approval - just flag
        await supabase
          .from('vault_members')
          .update({ flags_eligible_for_black: true })
          .eq('id', member.id);
        
        action = 'flagged_for_black';
      } else if (eligibility.eligible_for_privilege && member.tier === 'member') {
        newTier = 'collector';
        action = 'upgraded';
      }

      if (newTier !== member.tier) {
        const limits = TIER_LIMITS[newTier as keyof typeof TIER_LIMITS];
        
        await supabase
          .from('vault_members')
          .update({
            tier: newTier,
            tier_upgraded_at: new Date().toISOString(),
            max_active_hunts: limits.max_active_hunts,
            max_wishlist_items: limits.max_wishlist_items,
            invites_remaining: Math.max(member.invites_remaining || 0, limits.invites_per_semester),
          })
          .eq('id', member.id);

        // Grant tier badge
        const tierNames: Record<string, string> = {
          collector: 'Vault Privilege',
          elite: 'Vault Black',
        };

        if (tierNames[newTier]) {
          await supabase
            .from('vault_badges')
            .insert({
              member_id: member.id,
              badge_type: 'tier_upgrade',
              badge_name: tierNames[newTier],
              badge_description: `Promovido para ${tierNames[newTier]}`,
              badge_icon: newTier === 'elite' ? 'crown' : 'star',
            });
        }

        // Create notification for tier upgrade
        await supabase.from('notifications').insert({
          target: 'client',
          target_client_cpf: member.client_cpf,
          type: 'tier_change',
          title: `Parabéns! Você agora é ${tierNames[newTier] || newTier}!`,
          message: `Você foi promovido para ${tierNames[newTier] || newTier}. Aproveite seus novos benefícios exclusivos.`,
          reference_type: 'vault_member',
          reference_id: member.id,
        });

        results.upgraded++;
        console.log(`Member ${member.client_name} upgraded from ${member.tier} to ${newTier}`);
      } else {
        results.unchanged++;
      }

      results.details.push({
        member_id: member.id,
        name: member.client_name,
        old_tier: member.tier,
        new_tier: newTier,
        action,
      });
    }

    console.log(`Tier check complete: ${results.checked} checked, ${results.upgraded} upgraded`);

    if (cronLogId) {
      await supabase.from("cron_execution_logs").update({
        status: "success",
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - new Date(cronStartedAt).getTime(),
        result: { checked: results.checked, upgraded: results.upgraded, unchanged: results.unchanged },
      }).eq("id", cronLogId);
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Tier check error:', error);

    try {
      const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      await sb.from("cron_execution_logs").insert({
        job_name: "vault-tier-check", status: "error",
        error_message: error instanceof Error ? error.message : "Unknown",
        finished_at: new Date().toISOString(),
      });
    } catch (_) {}

    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function checkTierEligibility(member: any) {
  let privilege_met = 0;
  let black_met = 0;

  // Privilege: 2/3 criteria in 12 months
  // Criteria 1: purchases_count_12m >= 3 OR spend_total_12m >= 6000
  if ((member.stats_purchases_count_12m || 0) >= 3 || (member.stats_spend_total_12m || 0) >= 6000) {
    privilege_met++;
  }

  // Criteria 2: decision_rate >= 50%
  if ((member.stats_decision_rate || 0) >= 0.50) {
    privilege_met++;
  }

  // Criteria 3: converted_invites >= 1
  if ((member.stats_converted_invites || 0) >= 1) {
    privilege_met++;
  }

  // Black: 2/4 criteria in 18 months
  // Criteria 1: purchases_count_18m >= 8 OR spend_total_18m >= 15000
  if ((member.stats_purchases_count_18m || 0) >= 8 || (member.stats_spend_total_18m || 0) >= 15000) {
    black_met++;
  }

  // Criteria 2: decision_rate >= 70%
  if ((member.stats_decision_rate || 0) >= 0.70) {
    black_met++;
  }

  // Criteria 3: converted_invites >= 2
  if ((member.stats_converted_invites || 0) >= 2) {
    black_met++;
  }

  // Criteria 4: high value purchase (checked via items - simplified here)
  // This would need a separate query in production
  if ((member.stats_spend_total_18m || 0) >= 3500) {
    black_met++;
  }

  return {
    current_tier: member.tier,
    eligible_for_privilege: privilege_met >= 2,
    eligible_for_black: black_met >= 2,
    privilege_criteria_met: privilege_met,
    black_criteria_met: black_met,
  };
}
