// Shared helpers for all mk-* edge functions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuth, AuthError } from "./auth-guard.ts";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-client-cpf, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

export function createSupabaseClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

/**
 * Resolve authenticated CPF from JWT token via client_profiles.
 * Delegates JWT validation to shared auth-guard (single source of truth).
 */
export async function resolveAuthCpf(
  req: Request,
  sb: any
): Promise<{ cpf: string | null; error: string | null }> {
  try {
    const auth = await requireAuth(req, sb);
    if (!auth.cpf) {
      return { cpf: null, error: "Perfil de cliente não encontrado. Faça login novamente." };
    }
    return { cpf: auth.cpf, error: null };
  } catch (e) {
    if (e instanceof AuthError) {
      return { cpf: null, error: e.message };
    }
    return { cpf: null, error: "Erro de autenticação" };
  }
}

/** Get vault member by CPF */
export async function getMember(sb: any, cpf: string) {
  const { data } = await sb.from("vault_members").select("id").eq("client_cpf", cpf).single();
  return data;
}

/** Get seller profile by member ID */
export async function getSellerProfile(sb: any, memberId: string) {
  const { data } = await sb.from("vault_seller_profiles").select("*").eq("member_id", memberId).maybeSingle();
  return data;
}

/** Create notification for a client */
export async function notify(sb: any, title: string, message: string, clientCpf: string, refId?: string, refType?: string) {
  try {
    await sb.from("notifications").insert({
      title, message, target: "client", target_client_cpf: clientCpf,
      type: "info", reference_id: refId || null, reference_type: refType || "marketplace",
    });
  } catch (_) {}
}

/** Get member name + email + phone by CPF */
export async function getMemberEmail(sb: any, cpf: string): Promise<{ name: string; email: string; phone?: string } | null> {
  const { data } = await sb.from("vault_members").select("client_name, client_email, client_phone").eq("client_cpf", cpf).maybeSingle();
  if (!data?.client_email) return null;
  return { name: data.client_name, email: data.client_email, phone: data.client_phone || undefined };
}

/** Send marketplace email via edge function (fire-and-forget) */
export async function sendMarketplaceEmail(type: string, data: Record<string, any>) {
  try {
    const baseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!baseUrl || !serviceKey) return;
    fetch(`${baseUrl}/functions/v1/send-marketplace-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceKey}` },
      body: JSON.stringify({ type, ...data }),
    }).catch((e: any) => console.error("[mk] email fire-and-forget error:", e));
  } catch (e) { console.error("[mk] email error:", e); }
}

/** Send marketplace WhatsApp via edge function (fire-and-forget) */
export async function sendMarketplaceWhatsApp(type: string, data: Record<string, any>) {
  try {
    const baseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!baseUrl || !serviceKey) return;
    fetch(`${baseUrl}/functions/v1/send-whatsapp`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceKey}` },
      body: JSON.stringify({ message_type: type, ...data }),
    }).catch((e: any) => console.error("[mk] whatsapp fire-and-forget error:", e));
  } catch (e) { console.error("[mk] whatsapp error:", e); }
}

/** Generate marketplace order code */
export function generateOrderCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "MKT-";
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

/** Resolve CPF for request: returns cpf or error response */
export async function resolveCpf(
  req: Request,
  sb: any,
  publicActions: Set<string>,
  action: string | null
): Promise<{ cpf: string | null; errorResponse: Response | null }> {
  const isPublicAction = publicActions.has(action || "");

  if (isPublicAction) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const authResult = await resolveAuthCpf(req, sb);
      if (authResult.cpf) return { cpf: authResult.cpf, errorResponse: null };
    }
    return { cpf: "visitor", errorResponse: null };
  } else {
    const authResult = await resolveAuthCpf(req, sb);
    if (authResult.error || !authResult.cpf) {
      return { cpf: null, errorResponse: jsonResponse({ error: authResult.error || "Autenticação obrigatória" }, 401) };
    }
    return { cpf: authResult.cpf, errorResponse: null };
  }
}
