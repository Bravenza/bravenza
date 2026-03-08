import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin, authErrorResponse } from "../_shared/auth-guard.ts";
import { corsHeaders, jsonResponse } from "../_shared/mk-helpers.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let auth;
  try {
    auth = await requireAdmin(req, supabaseAdmin);
  } catch (error) {
    return authErrorResponse(error);
  }

  try {
    const body = await req.json();
    const action = body.action || "create";

    // === UPDATE ===
    if (action === "update") {
      const { userId, fullName, email } = body;
      if (!userId) throw new Error("userId é obrigatório");

      const updatePayload: Record<string, unknown> = {};
      if (email) updatePayload.email = email;
      if (fullName) updatePayload.user_metadata = { full_name: fullName };

      if (Object.keys(updatePayload).length > 0) {
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, updatePayload);
        if (updateError) throw updateError;
      }

      const profileUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (fullName) profileUpdate.full_name = fullName;
      if (email) profileUpdate.email = email;

      await supabaseAdmin
        .from("admin_profiles")
        .update(profileUpdate)
        .eq("user_id", userId);

      return jsonResponse({ success: true, message: "Admin atualizado" });
    }

    // === DELETE ===
    if (action === "delete") {
      const { userId } = body;
      if (!userId) throw new Error("userId é obrigatório");

      if (userId === auth.userId) {
        throw new Error("Você não pode remover a si mesmo");
      }

      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "admin");

      await supabaseAdmin
        .from("admin_profiles")
        .delete()
        .eq("user_id", userId);

      await supabaseAdmin.auth.admin.deleteUser(userId);

      return jsonResponse({ success: true, message: "Admin removido" });
    }

    // === CREATE (default) ===
    const { email, fullName, tempPassword } = body;

    if (!email || !fullName || !tempPassword) {
      throw new Error("Email, nome e senha temporária são obrigatórios");
    }

    if (tempPassword.length < 6) {
      throw new Error("Senha temporária deve ter no mínimo 6 caracteres");
    }

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

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newUser.user.id, role: "admin" });

    if (roleError) {
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw new Error("Erro ao atribuir role de admin");
    }

    const { error: profileError } = await supabaseAdmin
      .from("admin_profiles")
      .insert({
        user_id: newUser.user.id,
        full_name: fullName,
        email,
        must_change_password: true,
        created_by: auth.userId,
      });

    if (profileError) {
      console.error("Error creating admin profile:", profileError);
    }

    return jsonResponse({
      success: true,
      message: `Admin ${fullName} criado com sucesso`,
      user_id: newUser.user.id,
    });
  } catch (error: any) {
    console.error("Admin management error:", error);
    return jsonResponse({ error: error.message }, 400);
  }
});
