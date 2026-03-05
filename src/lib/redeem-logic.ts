/**
 * Pure business logic extracted from VaultRedeemPage.
 * All functions are side-effect-free and testable without React or Supabase.
 */

// ─── Types ─────────────────────────────────────────────────────────

export type InviteStatus = "valid" | "used" | "expired" | "not_found";

export interface InviteValidationResult {
  is_valid: boolean;
  status: InviteStatus;
  invite_id?: string;
  inviter_name?: string;
}

export interface RedeemAttempt {
  invite_code: string;
  invite_status: InviteStatus;
  redeemer_cpf: string;
  already_redeemed_by: string[];
}

// ─── Validation helpers ────────────────────────────────────────────

/**
 * Rule 1 & 2: Determines the user-facing error message from a validation result.
 * Returns null if the invite is valid (success case).
 */
export function getInviteError(result: InviteValidationResult | null): string | null {
  if (!result) return "Convite não encontrado";
  if (result.is_valid) return null;

  switch (result.status) {
    case "used":
      return "Este convite já foi resgatado";
    case "expired":
      return "Este convite não é mais válido";
    case "not_found":
    default:
      return "Convite não encontrado";
  }
}

/**
 * Rule 3: Check if an invite code has already been used.
 */
export function isInviteUsed(result: InviteValidationResult): boolean {
  return result.status === "used";
}

/**
 * Rule 4: Check if an invite code has expired.
 */
export function isInviteExpired(result: InviteValidationResult): boolean {
  return result.status === "expired";
}

/**
 * Rule 5: Check if a specific user has already redeemed this invite.
 */
export function hasUserAlreadyRedeemed(attempt: RedeemAttempt): boolean {
  return attempt.already_redeemed_by.includes(attempt.redeemer_cpf);
}

/**
 * Rule 6: Determines the benefit tier granted upon successful redemption.
 */
export function getRedemptionBenefit(): { tier: string; label: string } {
  return { tier: "vault_access", label: "Vault Access" };
}

/**
 * Validates invite code format (non-empty after trim, uppercased).
 */
export function normalizeInviteCode(code: string): string {
  return code.trim().toUpperCase();
}

export function isValidInviteCode(code: string): boolean {
  return normalizeInviteCode(code).length > 0;
}

/**
 * Extracts the inviter's first name for display.
 */
export function extractInviterFirstName(fullName: string | null | undefined): string {
  if (!fullName) return "Membro do Vault";
  const firstName = fullName.split(" ")[0];
  return firstName || "Membro do Vault";
}

/**
 * Validates CPF for redeem registration (exactly 11 digits after stripping).
 */
export function isValidRedeemCpf(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, "");
  return clean.length === 11;
}

/**
 * Formats CPF with dots and dash for display.
 */
export function formatCPF(value: string): string {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  return numbers
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2");
}

/**
 * Validates that required registration fields are present.
 */
export function validateRegistrationFields(fields: {
  name: string;
  email: string;
  cpf: string;
}): { valid: boolean; error?: string } {
  if (!fields.name || !fields.email || !fields.cpf) {
    return { valid: false, error: "Preencha nome, email e CPF" };
  }
  if (!isValidRedeemCpf(fields.cpf)) {
    return { valid: false, error: "CPF inválido" };
  }
  return { valid: true };
}
