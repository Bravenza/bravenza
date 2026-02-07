import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, x-supabase-client-platform, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CreateNotificationRequest {
  target: "admin" | "client";
  target_user_id?: string;
  target_client_cpf?: string;
  type: string;
  title: string;
  message: string;
  reference_id?: string;
  reference_type?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: CreateNotificationRequest = await req.json();

    // Validate required fields
    if (!body.target || !body.type || !body.title || !body.message) {
      throw new Error("Missing required fields: target, type, title, message");
    }

    // For admin notifications, we'll notify all admins
    if (body.target === "admin") {
      // Get all admin user IDs
      const { data: adminRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (rolesError) {
        console.error("Error fetching admin roles:", rolesError);
        throw rolesError;
      }

      // Create notification for each admin
      const notifications = (adminRoles || []).map((role) => ({
        target: "admin" as const,
        target_user_id: role.user_id,
        type: body.type,
        title: body.title,
        message: body.message,
        reference_id: body.reference_id || null,
        reference_type: body.reference_type || null,
      }));

      if (notifications.length > 0) {
        const { error: insertError } = await supabase
          .from("notifications")
          .insert(notifications);

        if (insertError) {
          console.error("Error inserting notifications:", insertError);
          throw insertError;
        }
      }

      console.log(`Created ${notifications.length} admin notifications for: ${body.type}`);
    } else if (body.target === "client" && body.target_client_cpf) {
      // Create single client notification
      const { error: insertError } = await supabase
        .from("notifications")
        .insert({
          target: "client",
          target_client_cpf: body.target_client_cpf,
          type: body.type,
          title: body.title,
          message: body.message,
          reference_id: body.reference_id || null,
          reference_type: body.reference_type || null,
        });

      if (insertError) {
        console.error("Error inserting client notification:", insertError);
        throw insertError;
      }

      console.log(`Created client notification for CPF: ${body.target_client_cpf}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Create notification error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      }
    );
  }
});
