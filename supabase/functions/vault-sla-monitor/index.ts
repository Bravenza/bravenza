import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireServiceOrAdmin, authErrorResponse } from "../_shared/auth-guard.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-key',
};

// SLA configurations by tier (in hours) — fallback defaults
const SLA_CONFIG_DEFAULT = {
  member: { // Vault Access
    first_response: 24,
    update_frequency: 72,
    match_room_decision: 6,
  },
  collector: { // Vault Privilege
    first_response: 12,
    update_frequency: 48,
    match_room_decision: 12,
  },
  elite: { // Vault Black
    first_response: 6,
    update_frequency: 24,
    match_room_decision: 24,
  },
};

interface SLACheckResult {
  search_id: string;
  member_name: string;
  tier: string;
  status: string;
  sla_type: string;
  hours_overdue: number;
  deadline: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Auth: only service-role, cron, or admin
    try { await requireServiceOrAdmin(req, supabase); } catch (e) { return authErrorResponse(e); }

    const cronStartedAt = new Date().toISOString();
    const { data: logEntry } = await supabase
      .from("cron_execution_logs")
      .insert({ job_name: "vault-sla-monitor", started_at: cronStartedAt, status: "running" })
      .select("id")
      .single();
    const cronLogId = logEntry?.id || null;

    // Fetch SLA config from database, fallback to defaults
    let SLA_CONFIG = SLA_CONFIG_DEFAULT;
    try {
      const { data: slaSettingRow } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "vault_sla_config")
        .single();

      if (slaSettingRow?.value) {
        const parsed = typeof slaSettingRow.value === 'string'
          ? JSON.parse(slaSettingRow.value)
          : slaSettingRow.value;
        SLA_CONFIG = { ...SLA_CONFIG_DEFAULT, ...parsed };
      }
    } catch (e) {
      console.warn("Failed to load SLA config from DB, using defaults:", e);
    }

    const now = new Date();
    const violations: SLACheckResult[] = [];
    const warnings: SLACheckResult[] = [];

    // Check active searches
    const { data: activeSearches, error: searchError } = await supabase
      .from('vault_searches')
      .select(`
        *,
        member:user_id(id, client_name, tier),
        wishlist:wishlist_item_id(product_name, product_brand)
      `)
      .eq('is_active', true)
      .in('status', ['RECEIVED', 'IN_CURATION', 'MATCH_SENT']);

    if (searchError) {
      console.error('Error fetching searches:', searchError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar buscas ativas' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    for (const search of activeSearches || []) {
      const tier = search.member?.tier || 'member';
      const slaConfig = SLA_CONFIG[tier as keyof typeof SLA_CONFIG];
      const memberName = search.member?.client_name || 'Desconhecido';

      // Check first response SLA (RECEIVED status)
      if (search.status === 'RECEIVED') {
        const startedAt = new Date(search.started_at || search.created_at);
        const deadline = new Date(startedAt.getTime() + slaConfig.first_response * 60 * 60 * 1000);
        const hoursOverdue = (now.getTime() - deadline.getTime()) / (1000 * 60 * 60);

        if (hoursOverdue > 0) {
          violations.push({
            search_id: search.id,
            member_name: memberName,
            tier,
            status: search.status,
            sla_type: 'first_response',
            hours_overdue: Math.round(hoursOverdue * 10) / 10,
            deadline: deadline.toISOString(),
          });
        } else if (hoursOverdue > -2) {
          // Warning: less than 2 hours remaining
          warnings.push({
            search_id: search.id,
            member_name: memberName,
            tier,
            status: search.status,
            sla_type: 'first_response',
            hours_overdue: hoursOverdue,
            deadline: deadline.toISOString(),
          });
        }
      }

      // Check update frequency SLA (IN_CURATION status)
      if (search.status === 'IN_CURATION') {
        const lastUpdate = new Date(search.last_update_at || search.started_at);
        const deadline = new Date(lastUpdate.getTime() + slaConfig.update_frequency * 60 * 60 * 1000);
        const hoursOverdue = (now.getTime() - deadline.getTime()) / (1000 * 60 * 60);

        if (hoursOverdue > 0) {
          violations.push({
            search_id: search.id,
            member_name: memberName,
            tier,
            status: search.status,
            sla_type: 'update_frequency',
            hours_overdue: Math.round(hoursOverdue * 10) / 10,
            deadline: deadline.toISOString(),
          });
        } else if (hoursOverdue > -4) {
          warnings.push({
            search_id: search.id,
            member_name: memberName,
            tier,
            status: search.status,
            sla_type: 'update_frequency',
            hours_overdue: hoursOverdue,
            deadline: deadline.toISOString(),
          });
        }

        // Update next SLA deadline
        const nextDeadline = new Date(now.getTime() + slaConfig.update_frequency * 60 * 60 * 1000);
        await supabase
          .from('vault_searches')
          .update({ sla_next_update_due_at: nextDeadline.toISOString() })
          .eq('id', search.id);
      }
    }

    // Check match room decision deadlines
    const { data: pendingMatchRooms, error: matchError } = await supabase
      .from('vault_match_rooms')
      .select(`
        *,
        member:user_id(id, client_name, tier)
      `)
      .eq('decision_status', 'PENDING')
      .not('decision_deadline_at', 'is', null);

    for (const room of pendingMatchRooms || []) {
      const deadline = new Date(room.decision_deadline_at);
      const hoursOverdue = (now.getTime() - deadline.getTime()) / (1000 * 60 * 60);
      const memberName = room.member?.client_name || 'Desconhecido';
      const tier = room.member?.tier || 'member';

      if (hoursOverdue > 0) {
        // Auto-expire if more than 24h overdue
        if (hoursOverdue > 24) {
          await supabase
            .from('vault_match_rooms')
            .update({ decision_status: 'EXPIRED', decision_at: now.toISOString() })
            .eq('id', room.id);

          console.log(`Match room ${room.id} auto-expired after ${hoursOverdue}h overdue`);
        }

        violations.push({
          search_id: room.search_id,
          member_name: memberName,
          tier,
          status: 'MATCH_ROOM_PENDING',
          sla_type: 'decision_deadline',
          hours_overdue: Math.round(hoursOverdue * 10) / 10,
          deadline: deadline.toISOString(),
        });
      } else if (hoursOverdue > -2) {
        // Warning: notify client that deadline is approaching
        const { data: member } = await supabase
          .from('vault_members')
          .select('client_cpf')
          .eq('id', room.user_id)
          .single();

        if (member?.client_cpf) {
          const hoursRemaining = Math.abs(Math.round(hoursOverdue));
          await supabase.from('notifications').insert({
            target: 'client',
            target_client_cpf: member.client_cpf,
            type: 'match_room',
            title: 'Decisão pendente!',
            message: `Você tem ${hoursRemaining}h para decidir sobre as opções encontradas.`,
            reference_type: 'vault_match_room',
            reference_id: room.id,
          });
        }

        warnings.push({
          search_id: room.search_id,
          member_name: memberName,
          tier,
          status: 'MATCH_ROOM_PENDING',
          sla_type: 'decision_deadline',
          hours_overdue: hoursOverdue,
          deadline: deadline.toISOString(),
        });
      }
    }

    // Create notifications for violations
    for (const violation of violations) {
      await supabase.from('notifications').insert({
        target: 'admin',
        type: 'system_alert',
        title: `SLA Violado: ${violation.sla_type}`,
        message: `Busca de ${violation.member_name} (${violation.tier}) está ${violation.hours_overdue}h atrasada`,
        reference_type: 'vault_search',
        reference_id: violation.search_id,
      });
    }

    console.log(`SLA Monitor: ${violations.length} violations, ${warnings.length} warnings`);

    if (cronLogId) {
      await supabase.from("cron_execution_logs").update({
        status: "success",
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - new Date(cronStartedAt).getTime(),
        result: { violations: violations.length, warnings: warnings.length, searches: activeSearches?.length || 0 },
      }).eq("id", cronLogId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: now.toISOString(),
        violations,
        warnings,
        summary: {
          total_active_searches: activeSearches?.length || 0,
          pending_match_rooms: pendingMatchRooms?.length || 0,
          violations_count: violations.length,
          warnings_count: warnings.length,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('SLA Monitor error:', error);

    try {
      const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      await sb.from("cron_execution_logs").insert({
        job_name: "vault-sla-monitor", status: "error",
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
