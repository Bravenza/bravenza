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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { cpf, endpoint, p256dh, auth, user_agent } = await req.json();

    if (!cpf || !endpoint || !p256dh || !auth) {
      throw new Error("Missing required fields: cpf, endpoint, p256dh, auth");
    }

    // Upsert subscription (update if same endpoint for same user)
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          user_cpf: cpf,
          endpoint,
          p256dh,
          auth,
          user_agent: user_agent || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_cpf,endpoint" }
      );

    if (error) throw error;

    console.log(`Push subscription saved for CPF: ${cpf.slice(0, 3)}***`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Push subscribe error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
