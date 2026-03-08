/**
 * Unified Auth Guard for Edge Functions
 * 
 * Replaces ad-hoc auth validation scattered across 59+ Edge Functions.
 * All functions should import from here instead of rolling their own JWT checks.
 * 
 * Usage:
 *   const { userId, cpf, email } = await requireAuth(req, sb);
 *   const { userId, cpf, email } = await requireAdmin(req, sb);
 */
import { corsHeaders, jsonResponse } from "./mk-helpers.ts";

export interface AuthResult {
  userId: string;
  cpf: string | null;
  email: string | null;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

/**
 * Extract and validate Bearer token from request.
 * Returns the authenticated user's ID, CPF (from client_profiles), and email.
 * Throws AuthError on failure.
 */
export async function requireAuth(req: Request, sb: any): Promise<AuthResult> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthError("Token de autenticação ausente");
  }

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await sb.auth.getUser(token);

  if (error || !data?.user) {
    throw new AuthError("Token inválido ou expirado");
  }

  const userId = data.user.id;
  const email = data.user.email || null;

  // Resolve CPF from client_profiles (optional — may not exist for admin-only users)
  const { data: profile } = await sb
    .from("client_profiles")
    .select("cpf")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    userId,
    cpf: profile?.cpf || null,
    email,
  };
}

/**
 * Requires authentication AND admin role.
 * Checks user_roles table for admin role.
 * Throws AuthError(403) if not admin.
 */
export async function requireAdmin(req: Request, sb: any): Promise<AuthResult> {
  const auth = await requireAuth(req, sb);

  const { data: roleData } = await sb
    .from("user_roles")
    .select("role")
    .eq("user_id", auth.userId)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleData) {
    throw new AuthError("Acesso restrito a administradores", 403);
  }

  return auth;
}

/**
 * Optional auth: returns AuthResult if token present and valid, null otherwise.
 * Never throws — useful for public endpoints that behave differently for logged-in users.
 */
export async function optionalAuth(req: Request, sb: any): Promise<AuthResult | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    return await requireAuth(req, sb);
  } catch {
    return null;
  }
}

/**
 * Requires admin role using a raw Bearer token string (not Request).
 * For use in minified/compact functions that already extracted the auth header.
 * Validates via user_roles table (not admin_profiles) for consistency.
 */
export async function requireAdminByToken(sb: any, authHeader: string): Promise<AuthResult> {
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthError("Token de autenticação ausente");
  }

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await sb.auth.getUser(token);

  if (error || !data?.user) {
    throw new AuthError("Token inválido ou expirado");
  }

  const userId = data.user.id;
  const email = data.user.email || null;

  // Check admin role via user_roles (not admin_profiles)
  const { data: roleData } = await sb
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleData) {
    throw new AuthError("Acesso restrito a administradores", 403);
  }

  // Resolve CPF (optional for admin users)
  const { data: profile } = await sb
    .from("client_profiles")
    .select("cpf")
    .eq("user_id", userId)
    .maybeSingle();

  return { userId, cpf: profile?.cpf || null, email };
}

/**
 * Check if a token belongs to an admin. Returns boolean (no throw).
 * Uses user_roles for consistency with requireAdmin.
 */
export async function isAdminByToken(sb: any, authHeader: string): Promise<boolean> {
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) return false;
  const { data: roleData } = await sb
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .eq("role", "admin")
    .maybeSingle();
  return !!roleData;
}

/**
 * Resolve CPF from auth token. Used by mkv2-* functions that key on CPF.
 * For public actions, returns "visitor" if no token; for private actions, throws AuthError.
 */
export async function resolveAuthCpf(
  req: Request,
  sb: any,
  opts?: { allowVisitor?: boolean }
): Promise<{ cpf: string; userId: string; email: string | null }> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    if (opts?.allowVisitor) return { cpf: "visitor", userId: "", email: null };
    throw new AuthError("Token de autenticação ausente");
  }

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) {
    if (opts?.allowVisitor) return { cpf: "visitor", userId: "", email: null };
    throw new AuthError("Token inválido ou expirado");
  }

  const userId = data.user.id;
  const email = data.user.email || null;

  const { data: profile } = await sb
    .from("client_profiles")
    .select("cpf")
    .eq("user_id", userId)
    .single();

  if (!profile?.cpf) {
    if (opts?.allowVisitor) return { cpf: "visitor", userId, email };
    throw new AuthError("Perfil de cliente não encontrado");
  }

  return { cpf: profile.cpf, userId, email };
}

/**
 * Convenience: wrap a handler with auth error handling.
 * Returns a proper JSON error response for AuthError instances.
 */
export function authErrorResponse(error: unknown): Response {
  if (error instanceof AuthError) {
    return jsonResponse({ error: error.message }, error.status);
  }
  throw error; // Re-throw non-auth errors
}
