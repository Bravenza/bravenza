import { describe, it, expect } from "vitest";
import {
  getInviteError,
  isInviteUsed,
  isInviteExpired,
  hasUserAlreadyRedeemed,
  getRedemptionBenefit,
  normalizeInviteCode,
  isValidInviteCode,
  extractInviterFirstName,
  isValidRedeemCpf,
  formatCPF,
  validateRegistrationFields,
  type InviteValidationResult,
  type RedeemAttempt,
} from "../redeem-logic";

// ─── 1. Código válido resgatado com sucesso ───────────────────────

describe("getInviteError (valid invite)", () => {
  it("returns null for a valid invite", () => {
    const result: InviteValidationResult = {
      is_valid: true,
      status: "valid",
      invite_id: "inv-1",
      inviter_name: "Carlos Silva",
    };
    expect(getInviteError(result)).toBeNull();
  });
});

// ─── 2. Código inválido retorna erro ──────────────────────────────

describe("getInviteError (invalid/not found)", () => {
  it("returns error for not_found status", () => {
    const result: InviteValidationResult = { is_valid: false, status: "not_found" };
    expect(getInviteError(result)).toBe("Convite não encontrado");
  });

  it("returns error for null result", () => {
    expect(getInviteError(null)).toBe("Convite não encontrado");
  });
});

// ─── 3. Código já utilizado é rejeitado ───────────────────────────

describe("isInviteUsed", () => {
  it("returns true for used invite", () => {
    expect(isInviteUsed({ is_valid: false, status: "used" })).toBe(true);
  });

  it("returns false for valid invite", () => {
    expect(isInviteUsed({ is_valid: true, status: "valid" })).toBe(false);
  });
});

describe("getInviteError (used)", () => {
  it("returns correct message for used invite", () => {
    const result: InviteValidationResult = { is_valid: false, status: "used" };
    expect(getInviteError(result)).toBe("Este convite já foi resgatado");
  });
});

// ─── 4. Código expirado é rejeitado ───────────────────────────────

describe("isInviteExpired", () => {
  it("returns true for expired invite", () => {
    expect(isInviteExpired({ is_valid: false, status: "expired" })).toBe(true);
  });

  it("returns false for valid invite", () => {
    expect(isInviteExpired({ is_valid: true, status: "valid" })).toBe(false);
  });
});

describe("getInviteError (expired)", () => {
  it("returns correct message for expired invite", () => {
    const result: InviteValidationResult = { is_valid: false, status: "expired" };
    expect(getInviteError(result)).toBe("Este convite não é mais válido");
  });
});

// ─── 5. Mesmo usuário não pode resgatar duas vezes ────────────────

describe("hasUserAlreadyRedeemed", () => {
  it("returns true when user CPF is in already_redeemed_by", () => {
    const attempt: RedeemAttempt = {
      invite_code: "VLT-ABC",
      invite_status: "valid",
      redeemer_cpf: "12345678901",
      already_redeemed_by: ["12345678901", "99999999999"],
    };
    expect(hasUserAlreadyRedeemed(attempt)).toBe(true);
  });

  it("returns false when user CPF is not in the list", () => {
    const attempt: RedeemAttempt = {
      invite_code: "VLT-ABC",
      invite_status: "valid",
      redeemer_cpf: "12345678901",
      already_redeemed_by: ["99999999999"],
    };
    expect(hasUserAlreadyRedeemed(attempt)).toBe(false);
  });

  it("returns false for empty redemption list", () => {
    const attempt: RedeemAttempt = {
      invite_code: "VLT-ABC",
      invite_status: "valid",
      redeemer_cpf: "12345678901",
      already_redeemed_by: [],
    };
    expect(hasUserAlreadyRedeemed(attempt)).toBe(false);
  });
});

// ─── 6. Resgate concede benefício correto ─────────────────────────

describe("getRedemptionBenefit", () => {
  it("grants vault_access tier", () => {
    const benefit = getRedemptionBenefit();
    expect(benefit.tier).toBe("vault_access");
    expect(benefit.label).toBe("Vault Access");
  });
});

// ─── Helpers bonus ────────────────────────────────────────────────

describe("normalizeInviteCode", () => {
  it("trims and uppercases", () => {
    expect(normalizeInviteCode("  vlt-abc  ")).toBe("VLT-ABC");
  });
});

describe("isValidInviteCode", () => {
  it("accepts non-empty code", () => {
    expect(isValidInviteCode("VLT-123")).toBe(true);
  });

  it("rejects empty/whitespace code", () => {
    expect(isValidInviteCode("")).toBe(false);
    expect(isValidInviteCode("   ")).toBe(false);
  });
});

describe("extractInviterFirstName", () => {
  it("extracts first name from full name", () => {
    expect(extractInviterFirstName("Carlos Silva")).toBe("Carlos");
  });

  it("returns default for null/undefined", () => {
    expect(extractInviterFirstName(null)).toBe("Membro do Vault");
    expect(extractInviterFirstName(undefined)).toBe("Membro do Vault");
  });

  it("returns default for empty string", () => {
    expect(extractInviterFirstName("")).toBe("Membro do Vault");
  });
});

describe("isValidRedeemCpf", () => {
  it("accepts 11-digit CPF", () => {
    expect(isValidRedeemCpf("123.456.789-01")).toBe(true);
    expect(isValidRedeemCpf("12345678901")).toBe(true);
  });

  it("rejects short CPF", () => {
    expect(isValidRedeemCpf("123456")).toBe(false);
  });
});

describe("formatCPF", () => {
  it("formats 11 digits with dots and dash", () => {
    expect(formatCPF("12345678901")).toBe("123.456.789-01");
  });

  it("handles partial input", () => {
    expect(formatCPF("123")).toBe("123");
    expect(formatCPF("1234")).toBe("123.4");
  });
});

describe("validateRegistrationFields", () => {
  it("returns valid for complete fields", () => {
    expect(validateRegistrationFields({ name: "João", email: "j@e.com", cpf: "12345678901" }).valid).toBe(true);
  });

  it("returns invalid for missing name", () => {
    expect(validateRegistrationFields({ name: "", email: "j@e.com", cpf: "12345678901" }).valid).toBe(false);
  });

  it("returns invalid for bad CPF", () => {
    expect(validateRegistrationFields({ name: "João", email: "j@e.com", cpf: "123" }).valid).toBe(false);
  });
});
