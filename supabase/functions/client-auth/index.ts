import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, x-supabase-client-platform, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface AuthRequest {
  action: "request_code" | "verify_code" | "validate_session";
  cpf?: string;
  code?: string;
  session_token?: string;
}

// Generate 6-digit code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate session token
function generateSessionToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Clean CPF
function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, cpf, code, session_token }: AuthRequest = await req.json();

    // REQUEST CODE - Send magic code to client email
    if (action === "request_code") {
      if (!cpf) {
        throw new Error("CPF é obrigatório");
      }

      const cleanedCPF = cleanCPF(cpf);

      // Check if client has any orders
      const { data: orders, error: orderError } = await supabase
        .from("orders")
        .select("client_email, client_name")
        .eq("client_cpf", cleanedCPF)
        .limit(1);

      if (orderError) throw orderError;

      if (!orders || orders.length === 0) {
        throw new Error("Nenhum pedido encontrado para este CPF");
      }

      const clientEmail = orders[0].client_email;
      const clientName = orders[0].client_name;

      if (!clientEmail) {
        throw new Error("Não há email cadastrado para este CPF");
      }

      // Generate code
      const authCode = generateCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Save token
      const { error: tokenError } = await supabase
        .from("client_auth_tokens")
        .insert({
          cpf: cleanedCPF,
          token: authCode,
          expires_at: expiresAt.toISOString(),
        });

      if (tokenError) throw tokenError;

      // Send email with code (if Resend is configured)
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey) {
        try {
          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${resendKey}`,
            },
            body: JSON.stringify({
              from: "Bravenza <noreply@bravenza.com.br>",
              to: [clientEmail],
              subject: "Seu código de acesso - Bravenza",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 40px;">
                  <h1 style="color: #d4af37; margin-bottom: 20px;">Olá, ${clientName}!</h1>
                  <p style="font-size: 16px; line-height: 1.6;">Use o código abaixo para acessar sua área do cliente:</p>
                  <div style="background: #1a1a1a; border: 2px solid #d4af37; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #d4af37;">${authCode}</span>
                  </div>
                  <p style="font-size: 14px; color: #888;">Este código expira em 10 minutos.</p>
                  <p style="font-size: 14px; color: #888;">Se você não solicitou este código, ignore este email.</p>
                </div>
              `,
            }),
          });

          if (!emailResponse.ok) {
            console.error("Failed to send email:", await emailResponse.text());
          }
        } catch (emailError) {
          console.error("Email error:", emailError);
        }
      } else {
        console.log(`Auth code for ${cleanedCPF}: ${authCode} (Resend not configured)`);
      }

      // Mask email for response
      const maskedEmail = clientEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3");

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Código enviado para ${maskedEmail}`,
          email_masked: maskedEmail 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // VERIFY CODE - Validate code and create session
    if (action === "verify_code") {
      if (!cpf || !code) {
        throw new Error("CPF e código são obrigatórios");
      }

      const cleanedCPF = cleanCPF(cpf);

      // Find valid token
      const { data: tokens, error: tokenError } = await supabase
        .from("client_auth_tokens")
        .select("*")
        .eq("cpf", cleanedCPF)
        .eq("token", code)
        .is("used_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1);

      if (tokenError) throw tokenError;

      if (!tokens || tokens.length === 0) {
        throw new Error("Código inválido ou expirado");
      }

      // Mark token as used
      await supabase
        .from("client_auth_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("id", tokens[0].id);

      // Create session (7 days)
      const sessionToken = generateSessionToken();
      const sessionExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const { error: sessionError } = await supabase
        .from("client_sessions")
        .insert({
          cpf: cleanedCPF,
          session_token: sessionToken,
          expires_at: sessionExpires.toISOString(),
        });

      if (sessionError) throw sessionError;

      // Get client name
      const { data: orders } = await supabase
        .from("orders")
        .select("client_name")
        .eq("client_cpf", cleanedCPF)
        .limit(1);

      return new Response(
        JSON.stringify({ 
          success: true, 
          session_token: sessionToken,
          client_name: orders?.[0]?.client_name || "Cliente",
          expires_at: sessionExpires.toISOString()
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // VALIDATE SESSION - Check if session is valid
    if (action === "validate_session") {
      if (!session_token) {
        throw new Error("Token de sessão é obrigatório");
      }

      const { data: sessions, error: sessionError } = await supabase
        .from("client_sessions")
        .select("*")
        .eq("session_token", session_token)
        .gt("expires_at", new Date().toISOString())
        .limit(1);

      if (sessionError) throw sessionError;

      if (!sessions || sessions.length === 0) {
        return new Response(
          JSON.stringify({ valid: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get client name
      const { data: orders } = await supabase
        .from("orders")
        .select("client_name")
        .eq("client_cpf", sessions[0].cpf)
        .limit(1);

      return new Response(
        JSON.stringify({ 
          valid: true,
          cpf: sessions[0].cpf,
          client_name: orders?.[0]?.client_name || "Cliente",
          expires_at: sessions[0].expires_at
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Ação inválida");

  } catch (error: any) {
    console.error("Client auth error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      }
    );
  }
});
