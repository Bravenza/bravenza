import { describe, it, expect } from "vitest";
import {
  resolveAdminRole,
  isRecoveryEvent,
  buildSignUpRedirectUrl,
} from "../auth-logic";

// ─── 1. checkAdminRole retorna true para admin ────────────────────

describe("resolveAdminRole", () => {
  it("returns true when query finds admin role", () => {
    const result = { data: { role: "admin" }, error: null };
    expect(resolveAdminRole(result)).toBe(true);
  });

  // ─── 2. checkAdminRole retorna false para não-admin ─────────────

  it("returns false when query returns null data (no admin role)", () => {
    const result = { data: null, error: null };
    expect(resolveAdminRole(result)).toBe(false);
  });

  // ─── 3. checkAdminRole retorna false quando query falha ─────────

  it("returns false when query has an error (does not throw)", () => {
    const result = {
      data: null,
      error: { message: "Network error" },
    };
    expect(resolveAdminRole(result)).toBe(false);
  });

  it("returns false when error is present even if data exists", () => {
    const result = {
      data: { role: "admin" },
      error: { message: "Partial failure" },
    };
    expect(resolveAdminRole(result)).toBe(false);
  });
});

// ─── 4. PASSWORD_RECOVERY event seta isPasswordRecovery ───────────

describe("isRecoveryEvent", () => {
  it("returns true for PASSWORD_RECOVERY event", () => {
    expect(isRecoveryEvent("PASSWORD_RECOVERY", "")).toBe(true);
  });

  it("returns true when URL hash contains type=recovery", () => {
    expect(
      isRecoveryEvent("SIGNED_IN", "#access_token=abc&type=recovery"),
    ).toBe(true);
  });

  it("returns false for normal SIGNED_IN without recovery hash", () => {
    expect(isRecoveryEvent("SIGNED_IN", "")).toBe(false);
  });

  it("returns false for INITIAL_SESSION event", () => {
    expect(isRecoveryEvent("INITIAL_SESSION", "")).toBe(false);
  });
});

// ─── 5. signOut — estado limpo verificado via resolveAdminRole ────

describe("state after signOut (admin role cleared)", () => {
  it("resolveAdminRole returns false with null data (post-signout state)", () => {
    // After signOut, checkAdminRole would receive null data
    expect(resolveAdminRole({ data: null, error: null })).toBe(false);
  });
});

// ─── 6. signUp — emailRedirectTo correto ──────────────────────────

describe("buildSignUpRedirectUrl", () => {
  it("appends / to origin", () => {
    expect(buildSignUpRedirectUrl("https://bravenza.lovable.app")).toBe(
      "https://bravenza.lovable.app/",
    );
  });

  it("works with localhost origin", () => {
    expect(buildSignUpRedirectUrl("http://localhost:5173")).toBe(
      "http://localhost:5173/",
    );
  });

  it("does not produce double trailing slash", () => {
    const url = buildSignUpRedirectUrl("https://example.com");
    expect(url).toBe("https://example.com/");
    expect(url.endsWith("//")).toBe(false);
  });
});
