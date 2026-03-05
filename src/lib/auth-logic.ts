/**
 * Pure helper functions extracted from useAuth and useClientSession hooks.
 * These functions encapsulate business logic so it can be tested without
 * React context or Supabase client dependencies.
 */

// ─── useAuth helpers ───────────────────────────────────────────────

export interface AdminRoleRow {
  role: string;
}

export interface AdminRoleQueryResult {
  data: AdminRoleRow | null;
  error: { message: string } | null;
}

/**
 * Determines if the query result indicates the user has admin role.
 * Returns false on any error instead of throwing.
 */
export function resolveAdminRole(result: AdminRoleQueryResult): boolean {
  if (result.error) return false;
  return !!result.data;
}

/**
 * Determines whether a recovery flow is active based on
 * the auth event and the URL hash.
 */
export function isRecoveryEvent(
  event: string,
  urlHash: string,
): boolean {
  return event === "PASSWORD_RECOVERY" || urlHash.includes("type=recovery");
}

/**
 * Builds the emailRedirectTo URL for signUp.
 */
export function buildSignUpRedirectUrl(origin: string): string {
  return `${origin}/`;
}

// ─── useClientSession helpers ──────────────────────────────────────

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

export interface SignUpProfilePayload {
  user_id: string;
  cpf: string;
  full_name: string;
  phone: string | null;
}

/**
 * Builds the client_profiles insert payload from signup inputs.
 * Returns null if no user id is available (signup didn't return a user).
 */
export function buildProfilePayload(
  userId: string | undefined,
  cpf: string,
  fullName: string,
  phone?: string,
): SignUpProfilePayload | null {
  if (!userId) return null;
  return {
    user_id: userId,
    cpf: cleanCpf(cpf),
    full_name: fullName,
    phone: phone ? phone.replace(/\D/g, "") : null,
  };
}

/**
 * Determines the composite loading state.
 */
export function isSessionLoading(authLoading: boolean, profileLoading: boolean): boolean {
  return authLoading || profileLoading;
}

/**
 * Determines vault membership from profile data.
 */
export function isVaultMember(vaultMemberId: string | null | undefined): boolean {
  return !!vaultMemberId;
}

/**
 * Checks if a CPF-duplicate error should be returned.
 * Returns an error message string if duplicate exists, null otherwise.
 */
export function checkCpfDuplicate(existingProfile: unknown): string | null {
  if (existingProfile) {
    return "Este CPF já está cadastrado no sistema.";
  }
  return null;
}
