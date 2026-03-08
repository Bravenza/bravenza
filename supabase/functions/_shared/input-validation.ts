/**
 * Server-side input validation helpers for edge functions.
 * Lightweight — no external deps required.
 */

/** Trim and limit string length. Returns null if empty after trim. */
export function sanitizeString(
  input: unknown,
  maxLength = 500
): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, maxLength);
}

/** Validate and clean CPF (11 digits only). */
export function validateCPF(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const cleaned = input.replace(/\D/g, "");
  if (cleaned.length !== 11) return null;
  // Reject all-same-digit CPFs
  if (/^(\d)\1{10}$/.test(cleaned)) return null;
  return cleaned;
}

/** Validate email format. */
export function validateEmail(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim().toLowerCase();
  if (trimmed.length > 255) return null;
  // Simple but effective email regex
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  return trimmed;
}

/** Validate integer within range. */
export function validateInt(
  input: unknown,
  min: number,
  max: number
): number | null {
  const num = typeof input === "number" ? input : Number(input);
  if (!Number.isInteger(num)) return null;
  if (num < min || num > max) return null;
  return num;
}

/** Validate UUID format. */
export function validateUUID(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim().toLowerCase();
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
      trimmed
    )
  )
    return null;
  return trimmed;
}

/** Validate positive monetary amount (max 999999.99). */
export function validateMoney(input: unknown): number | null {
  const num = typeof input === "number" ? input : Number(input);
  if (isNaN(num) || num <= 0 || num > 999999.99) return null;
  return Math.round(num * 100) / 100;
}

/** Strip HTML tags from a string (basic XSS prevention for text-only fields). */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/** Validate request body size (reject oversized payloads). */
export async function validateBodySize(
  req: Request,
  maxBytes = 50_000
): Promise<boolean> {
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > maxBytes) return false;
  return true;
}

/**
 * Parse JSON body with size guard.
 * Returns null if body is too large or invalid JSON.
 */
export async function safeParseBody<T = Record<string, unknown>>(
  req: Request,
  maxBytes = 50_000
): Promise<T | null> {
  if (!(await validateBodySize(req, maxBytes))) return null;
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}
