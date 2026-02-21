import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, x-supabase-client-platform, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Não autorizado");
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: callerUser }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !callerUser) {
      throw new Error("Não autorizado");
    }

    // Check if caller is admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerUser.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      throw new Error("Apenas administradores podem gerenciar admins");
    }

    const body = await req.json();
    const action = body.action || "create";

    // === UPDATE ===
    if (action === "update") {
      const { userId, fullName, email } = body;
      if (!userId) throw new Error("userId é obrigatório");

      // Update auth user metadata and email
      const updatePayload: Record<string, unknown> = {};
      if (email) updatePayload.email = email;
      if (fullName) updatePayload.user_metadata = { full_name: fullName };

      if (Object.keys(updatePayload).length > 0) {
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, updatePayload);
        if (updateError) throw updateError;
      }

      // Update admin profile
      const profileUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (fullName) profileUpdate.full_name = fullName;
      if (email) profileUpdate.email = email;

      await supabaseAdmin
        .from("admin_profiles")
        .update(profileUpdate)
        .eq("user_id", userId);

      return new Response(
        JSON.stringify({ success: true, message: "Admin atualizado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === DELETE ===
    if (action === "delete") {
      const { userId } = body;
      if (!userId) throw new Error("userId é obrigatório");

      // Prevent self-deletion
      if (userId === callerUser.id) {
        throw new Error("Você não pode remover a si mesmo");
      }

      // Remove role
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "admin");

      // Remove profile
      await supabaseAdmin
        .from("admin_profiles")
        .delete()
        .eq("user_id", userId);

      // Delete user from auth
      await supabaseAdmin.auth.admin.deleteUser(userId);

      return new Response(
        JSON.stringify({ success: true, message: "Admin removido" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === CREATE (default) ===
    const { email, fullName, tempPassword } = body;

    if (!email || !fullName || !tempPassword) {
      throw new Error("Email, nome e senha temporária são obrigatórios");
    }

    if (tempPassword.length < 6) {
      throw new Error("Senha temporária deve ter no mínimo 6 caracteres");
    }

    // Create user via admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError) {
      if (createError.message.includes("already been registered")) {
        throw new Error("Este email já está cadastrado");
      }
      throw createError;
    }

    // Add admin role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newUser.user.id, role: "admin" });

    if (roleError) {
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw new Error("Erro ao atribuir role de admin");
    }

    // Create admin profile with must_change_password = true
    const { error: profileError } = await supabaseAdmin
      .from("admin_profiles")
      .insert({
        user_id: newUser.user.id,
        full_name: fullName,
        email,
        must_change_password: true,
        created_by: callerUser.id,
      });

    if (profileError) {
      console.error("Error creating admin profile:", profileError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Admin ${fullName} criado com sucesso`,
        user_id: newUser.user.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Admin management error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
