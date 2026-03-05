/**
 * Pure helper functions extracted from useClientAuth hook.
 * These functions encapsulate business logic so it can be tested
 * without React context or Supabase client dependencies.
 */

export const SESSION_KEY = "bravenza_client_session";

export interface ClientSession {
  cpf: string;
  client_name: string;
  session_token: string;
  expires_at: string;
}

// ─── CPF helpers ───────────────────────────────────────────────

/**
 * Strips non-digit characters from a CPF string.
 */
export function cleanCpf(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

/**
 * Validates that the cleaned CPF has exactly 11 digits.
 */
export function isValidCpf(cpf: string): boolean {
  return /^\d{11}$/.test(cleanCpf(cpf));
}

// ─── Code validation ──────────────────────────────────────────

/**
 * Validates that a magic code is exactly 6 digits.
 */
export function isValidMagicCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

/**
 * Checks whether a magic code token has expired.
 */
export function isMagicCodeExpired(expiresAt: string, now?: Date): boolean {
  const expiry = new Date(expiresAt);
  const current = now ?? new Date();
  return current >= expiry;
}

/**
 * Checks whether a magic code token has already been used.
 */
export function isMagicCodeUsed(usedAt: string | null): boolean {
  return usedAt !== null;
}

// ─── Session helpers ──────────────────────────────────────────

/**
 * Validates that a session token has the expected format (64 alnum chars).
 */
export function isValidSessionToken(token: string): boolean {
  return /^[A-Za-z0-9]{64}$/.test(token);
}

/**
 * Checks whether a session has expired.
 */
export function isSessionExpired(expiresAt: string, now?: Date): boolean {
  const expiry = new Date(expiresAt);
  const current = now ?? new Date();
  return current >= expiry;
}

/**
 * Builds a ClientSession object from verify_code response data.
 * Returns null if essential fields are missing.
 */
export function buildSessionFromResponse(
  cpf: string,
  data: { session_token?: string; client_name?: string; expires_at?: string } | null,
): ClientSession | null {
  if (!data || !data.session_token || !data.expires_at) return null;
  return {
    cpf: cleanCpf(cpf),
    client_name: data.client_name || "Cliente",
    session_token: data.session_token,
    expires_at: data.expires_at,
  };
}

/**
 * Parses a stored session string from localStorage.
 * Returns null if the string is invalid JSON or missing required fields.
 */
export function parseStoredSession(raw: string | null): ClientSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.session_token || !parsed.cpf || !parsed.expires_at) return null;
    return parsed as ClientSession;
  } catch {
    return null;
  }
}

/**
 * Determines if a stored session should be discarded (expired).
 */
export function shouldDiscardSession(session: ClientSession, now?: Date): boolean {
  return isSessionExpired(session.expires_at, now);
}

/**
 * Two different CPFs should never share a session.
 * Returns true if the session belongs to the given CPF.
 */
export function sessionBelongsToCpf(session: ClientSession, cpf: string): boolean {
  return session.cpf === cleanCpf(cpf);
}

// ─── Request/response helpers ─────────────────────────────────

export interface RequestCodeResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface VerifyCodeResult {
  success: boolean;
  error?: string;
  session?: ClientSession;
}

/**
 * Interprets the edge function response for request_code.
 */
export function interpretRequestCodeResponse(
  data: { error?: string; message?: string } | null,
  error: unknown,
): RequestCodeResult {
  if (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao enviar código",
    };
  }
  if (data?.error) {
    return { success: false, error: data.error };
  }
  return { success: true, message: data?.message };
}

/**
 * Interprets the edge function response for verify_code.
 */
export function interpretVerifyCodeResponse(
  cpf: string,
  data: { error?: string; session_token?: string; client_name?: string; expires_at?: string } | null,
  error: unknown,
): VerifyCodeResult {
  if (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao verificar código",
    };
  }
  if (data?.error) {
    return { success: false, error: data.error };
  }
  const session = buildSessionFromResponse(cpf, data);
  if (!session) {
    return { success: false, error: "Resposta inválida do servidor" };
  }
  return { success: true, session };
}
