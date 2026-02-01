import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RedeemRequest {
  invite_code: string;
  cpf: string;
  name: string;
  email?: string;
  phone?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { invite_code, cpf, name, email, phone }: RedeemRequest = await req.json();

    if (!invite_code || !cpf || !name) {
      return new Response(
        JSON.stringify({ error: 'Código de convite, CPF e nome são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean CPF
    const cleanCpf = cpf.replace(/\D/g, '');

    // Check if CPF already is a member
    const { data: existingMember } = await supabase
      .from('vault_members')
      .select('id')
      .eq('client_cpf', cleanCpf)
      .maybeSingle();

    if (existingMember) {
      return new Response(
        JSON.stringify({ error: 'Este CPF já é membro do Vault Club' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the invite
    const { data: invite, error: inviteError } = await supabase
      .from('vault_invites')
      .select('*, inviter:inviter_id(id, client_name, tier)')
      .eq('invite_code', invite_code.toUpperCase())
      .eq('status', 'pending')
      .maybeSingle();

    if (inviteError || !invite) {
      console.error('Invite lookup error:', inviteError);
      return new Response(
        JSON.stringify({ error: 'Código de convite inválido ou já utilizado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check expiration
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      // Mark as expired
      await supabase
        .from('vault_invites')
        .update({ status: 'expired' })
        .eq('id', invite.id);

      return new Response(
        JSON.stringify({ error: 'Este convite expirou' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the new member
    const { data: newMember, error: memberError } = await supabase
      .from('vault_members')
      .insert({
        client_cpf: cleanCpf,
        client_name: name,
        client_email: email || null,
        tier: 'member', // Vault Access
        status: 'ACTIVE',
        invited_by: invite.inviter_id,
        joined_via: `invite:${invite_code}`,
        max_active_hunts: 1,
        max_wishlist_items: 3,
        invites_remaining: 2,
      })
      .select()
      .single();

    if (memberError) {
      console.error('Member creation error:', memberError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar membro' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update invite as used
    await supabase
      .from('vault_invites')
      .update({
        status: 'used',
        used_at: new Date().toISOString(),
        used_by_member_id: newMember.id,
        recipient_name: name,
        recipient_email: email || null,
      })
      .eq('id', invite.id);

    // Update inviter stats
    await supabase
      .from('vault_members')
      .update({
        stats_converted_invites: (invite.inviter?.stats_converted_invites || 0) + 1,
      })
      .eq('id', invite.inviter_id);

    // Grant welcome badge
    await supabase
      .from('vault_badges')
      .insert({
        member_id: newMember.id,
        badge_type: 'membership',
        badge_name: 'Vault Access',
        badge_description: 'Bem-vindo ao Bravenza Vault Club',
        badge_icon: 'key',
      });

    // Create notification for new member
    await supabase.from('notifications').insert({
      target: 'client',
      target_client_cpf: cleanCpf,
      type: 'tier_change',
      title: 'Bem-vindo ao Vault Club!',
      message: `Você agora é membro Vault Access. Explore sua área exclusiva de curadoria.`,
      reference_type: 'vault_member',
      reference_id: newMember.id,
    });

    // Create notification for inviter
    if (invite.inviter?.client_cpf) {
      const { data: inviterMember } = await supabase
        .from('vault_members')
        .select('client_cpf')
        .eq('id', invite.inviter_id)
        .single();

      if (inviterMember?.client_cpf) {
        await supabase.from('notifications').insert({
          target: 'client',
          target_client_cpf: inviterMember.client_cpf,
          type: 'invite_used',
          title: 'Seu convite foi utilizado!',
          message: `${name} entrou no Vault Club usando seu convite.`,
          reference_type: 'vault_invite',
          reference_id: invite.id,
        });
      }
    }

    console.log(`New member created: ${newMember.id} via invite ${invite_code}`);

    return new Response(
      JSON.stringify({
        success: true,
        member: {
          id: newMember.id,
          name: newMember.client_name,
          tier: newMember.tier,
          inviter_name: invite.inviter?.client_name || 'Bravenza',
        },
        message: 'Bem-vindo ao Vault Club!'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Redeem invite error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
