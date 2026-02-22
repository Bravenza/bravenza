import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tier limits for invite reset
const TIER_INVITES = {
  member: 2,
  collector: 3,
  elite: 5,
};

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
      .insert({ job_name: "vault-semester-reset", started_at: cronStartedAt, status: "running" })
      .select("id")
      .single();
    const cronLogId = logEntry?.id || null;

    const now = new Date();
    const sixMonthsFromNow = new Date(now);
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

    // Find members whose semester reset is due
    const { data: membersToReset, error: fetchError } = await supabase
      .from('vault_members')
      .select('*')
      .eq('is_active', true)
      .lte('invites_semester_reset', now.toISOString());

    if (fetchError) {
      console.error('Error fetching members for reset:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar membros para reset' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = {
      total_reset: 0,
      members_updated: [] as Array<{ id: string; name: string; new_invites: number }>,
    };

    for (const member of membersToReset || []) {
      const tierInvites = TIER_INVITES[member.tier as keyof typeof TIER_INVITES] || 2;
      
      const { error: updateError } = await supabase
        .from('vault_members')
        .update({
          invites_remaining: tierInvites,
          invites_semester_reset: sixMonthsFromNow.toISOString(),
          // Also recalculate 12m/18m stats (simplified - would need actual calculation)
          updated_at: now.toISOString(),
        })
        .eq('id', member.id);

      if (!updateError) {
        results.total_reset++;
        results.members_updated.push({
          id: member.id,
          name: member.client_name,
          new_invites: tierInvites,
        });
        console.log(`Reset invites for ${member.client_name}: ${tierInvites} invites`);
      }
    }

    // Also expire old pending invites
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: expiredInvites, error: expireError } = await supabase
      .from('vault_invites')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('expires_at', now.toISOString())
      .select('id');

    const expiredCount = expiredInvites?.length || 0;
    if (expiredCount > 0) {
      console.log(`Expired ${expiredCount} old invites`);
    }

    // Recalculate stats for all active members (rolling window)
    await recalculateMemberStats(supabase);

    console.log(`Semester reset complete: ${results.total_reset} members updated, ${expiredCount} invites expired`);

    if (cronLogId) {
      await supabase.from("cron_execution_logs").update({
        status: "success",
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - new Date(cronStartedAt).getTime(),
        result: { reset: results.total_reset, expired_invites: expiredCount },
      }).eq("id", cronLogId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        results: {
          ...results,
          expired_invites: expiredCount,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Semester reset error:', error);

    try {
      const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      await sb.from("cron_execution_logs").insert({
        job_name: "vault-semester-reset", status: "error",
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

async function recalculateMemberStats(supabase: any) {
  const now = new Date();
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const eighteenMonthsAgo = new Date(now);
  eighteenMonthsAgo.setMonth(eighteenMonthsAgo.getMonth() - 18);

  // Get all active members
  const { data: members } = await supabase
    .from('vault_members')
    .select('id')
    .eq('is_active', true);

  for (const member of members || []) {
    // Get items purchased in last 12 months
    const { data: items12m } = await supabase
      .from('vault_items')
      .select('purchase_value, purchase_date')
      .eq('user_id', member.id)
      .gte('purchase_date', twelveMonthsAgo.toISOString());

    // Get items purchased in last 18 months
    const { data: items18m } = await supabase
      .from('vault_items')
      .select('purchase_value, purchase_date')
      .eq('user_id', member.id)
      .gte('purchase_date', eighteenMonthsAgo.toISOString());

    const stats12m = {
      count: items12m?.length || 0,
      spend: items12m?.reduce((sum: number, i: any) => sum + (i.purchase_value || 0), 0) || 0,
    };

    const stats18m = {
      count: items18m?.length || 0,
      spend: items18m?.reduce((sum: number, i: any) => sum + (i.purchase_value || 0), 0) || 0,
    };

    // Get match room stats
    const { data: matchRooms } = await supabase
      .from('vault_match_rooms')
      .select('decision_status')
      .eq('user_id', member.id)
      .not('decision_status', 'is', null);

    const totalMatches = matchRooms?.length || 0;
    const approvedMatches = matchRooms?.filter((m: any) => m.decision_status === 'APPROVED').length || 0;
    const declinedMatches = matchRooms?.filter((m: any) => m.decision_status === 'DECLINED').length || 0;
    const decisionRate = totalMatches > 0 ? approvedMatches / totalMatches : 0;

    // Get converted invites count
    const { data: convertedInvites } = await supabase
      .from('vault_invites')
      .select('id')
      .eq('inviter_id', member.id)
      .eq('status', 'used');

    // Update member stats
    await supabase
      .from('vault_members')
      .update({
        stats_purchases_count_12m: stats12m.count,
        stats_spend_total_12m: stats12m.spend,
        stats_purchases_count_18m: stats18m.count,
        stats_spend_total_18m: stats18m.spend,
        stats_matches_total: totalMatches,
        stats_matches_approved: approvedMatches,
        stats_matches_declined: declinedMatches,
        stats_decision_rate: decisionRate,
        stats_converted_invites: convertedInvites?.length || 0,
        total_purchases: stats18m.count,
        total_spent: stats18m.spend,
      })
      .eq('id', member.id);
  }

  console.log(`Recalculated stats for ${members?.length || 0} members`);
}
