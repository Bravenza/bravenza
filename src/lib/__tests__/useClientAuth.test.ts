import { describe, it, expect } from "vitest";
import {
  cleanCpf,
  isValidCpf,
  isValidMagicCode,
  isMagicCodeExpired,
  isMagicCodeUsed,
  isValidSessionToken,
  isSessionExpired,
  buildSessionFromResponse,
  parseStoredSession,
  shouldDiscardSession,
  sessionBelongsToCpf,
  interpretRequestCodeResponse,
  interpretVerifyCodeResponse,
} from "../client-auth-logic";

// ─── 1. Login por CPF válido retorna token e armazena ────────
describe("Login por CPF válido", () => {
  it("buildSessionFromResponse cria sessão com CPF limpo e token", () => {
    const session = buildSessionFromResponse("123.456.789-00", {
      session_token: "A".repeat(64),
      client_name: "João",
      expires_at: "2099-12-31T23:59:59Z",
    });
    expect(session).not.toBeNull();
    expect(session!.cpf).toBe("12345678900");
    expect(session!.session_token).toBe("A".repeat(64));
    expect(session!.client_name).toBe("João");
  });

  it("interpretVerifyCodeResponse retorna success com sessão válida", () => {
    const result = interpretVerifyCodeResponse(
      "12345678900",
      {
        session_token: "B".repeat(64),
        client_name: "Maria",
        expires_at: "2099-12-31T23:59:59Z",
      },
      null,
    );
    expect(result.success).toBe(true);
    expect(result.session).toBeDefined();
    expect(result.session!.cpf).toBe("12345678900");
  });

  it("parseStoredSession restaura sessão válida do localStorage", () => {
    const raw = JSON.stringify({
      cpf: "12345678900",
      client_name: "Test",
      session_token: "C".repeat(64),
      expires_at: "2099-12-31T23:59:59Z",
    });
    const session = parseStoredSession(raw);
    expect(session).not.toBeNull();
    expect(session!.cpf).toBe("12345678900");
  });
});

// ─── 2. Login por CPF inválido retorna erro ──────────────────
describe("Login por CPF inválido", () => {
  it("isValidCpf rejeita CPF com menos de 11 dígitos", () => {
    expect(isValidCpf("1234567890")).toBe(false);
  });

  it("isValidCpf rejeita CPF com letras", () => {
    expect(isValidCpf("123456789ab")).toBe(false);
  });

  it("isValidCpf aceita CPF com 11 dígitos", () => {
    expect(isValidCpf("12345678901")).toBe(true);
  });

  it("isValidCpf aceita CPF formatado", () => {
    expect(isValidCpf("123.456.789-01")).toBe(true);
  });

  it("cleanCpf remove formatação", () => {
    expect(cleanCpf("123.456.789-01")).toBe("12345678901");
  });
});

// ─── 3. Código mágico expirado é rejeitado ───────────────────
describe("Código mágico expirado", () => {
  it("isMagicCodeExpired retorna true para data passada", () => {
    expect(isMagicCodeExpired("2020-01-01T00:00:00Z")).toBe(true);
  });

  it("isMagicCodeExpired retorna false para data futura", () => {
    expect(isMagicCodeExpired("2099-12-31T23:59:59Z")).toBe(false);
  });

  it("isMagicCodeExpired usa now customizado", () => {
    const now = new Date("2025-06-15T12:00:00Z");
    expect(isMagicCodeExpired("2025-06-15T11:59:59Z", now)).toBe(true);
    expect(isMagicCodeExpired("2025-06-15T12:00:01Z", now)).toBe(false);
  });
});

// ─── 4. Código mágico já utilizado é rejeitado ───────────────
describe("Código mágico já utilizado", () => {
  it("isMagicCodeUsed retorna true quando used_at não é null", () => {
    expect(isMagicCodeUsed("2025-01-01T00:00:00Z")).toBe(true);
  });

  it("isMagicCodeUsed retorna false quando used_at é null", () => {
    expect(isMagicCodeUsed(null)).toBe(false);
  });

  it("isValidMagicCode valida formato de 6 dígitos", () => {
    expect(isValidMagicCode("123456")).toBe(true);
    expect(isValidMagicCode("12345")).toBe(false);
    expect(isValidMagicCode("abcdef")).toBe(false);
    expect(isValidMagicCode("1234567")).toBe(false);
  });
});

// ─── 5. Sessão válida no localStorage é restaurada ───────────
describe("Sessão restaurada do localStorage", () => {
  it("parseStoredSession retorna null para JSON inválido", () => {
    expect(parseStoredSession("not-json")).toBeNull();
  });

  it("parseStoredSession retorna null para string null", () => {
    expect(parseStoredSession(null)).toBeNull();
  });

  it("parseStoredSession retorna null se campos obrigatórios faltam", () => {
    expect(parseStoredSession(JSON.stringify({ cpf: "123" }))).toBeNull();
  });

  it("parseStoredSession retorna sessão com todos os campos", () => {
    const session = parseStoredSession(
      JSON.stringify({
        cpf: "12345678900",
        client_name: "Test",
        session_token: "X".repeat(64),
        expires_at: "2099-01-01T00:00:00Z",
      }),
    );
    expect(session).not.toBeNull();
    expect(session!.session_token).toBe("X".repeat(64));
  });
});

// ─── 6. Sessão expirada é descartada ─────────────────────────
describe("Sessão expirada no localStorage", () => {
  const expiredSession = {
    cpf: "12345678900",
    client_name: "Test",
    session_token: "Y".repeat(64),
    expires_at: "2020-01-01T00:00:00Z",
  };

  const validSession = {
    cpf: "12345678900",
    client_name: "Test",
    session_token: "Z".repeat(64),
    expires_at: "2099-12-31T23:59:59Z",
  };

  it("shouldDiscardSession retorna true para sessão expirada", () => {
    expect(shouldDiscardSession(expiredSession)).toBe(true);
  });

  it("shouldDiscardSession retorna false para sessão válida", () => {
    expect(shouldDiscardSession(validSession)).toBe(false);
  });

  it("isSessionExpired detecta expiração corretamente", () => {
    expect(isSessionExpired("2020-01-01T00:00:00Z")).toBe(true);
    expect(isSessionExpired("2099-01-01T00:00:00Z")).toBe(false);
  });
});

// ─── 7. Dois CPFs diferentes não compartilham sessão ─────────
describe("Isolamento de sessão por CPF", () => {
  const session = {
    cpf: "12345678900",
    client_name: "João",
    session_token: "A".repeat(64),
    expires_at: "2099-12-31T23:59:59Z",
  };

  it("sessionBelongsToCpf retorna true para o CPF correto", () => {
    expect(sessionBelongsToCpf(session, "12345678900")).toBe(true);
  });

  it("sessionBelongsToCpf retorna true para CPF formatado do mesmo número", () => {
    expect(sessionBelongsToCpf(session, "123.456.789-00")).toBe(true);
  });

  it("sessionBelongsToCpf retorna false para CPF diferente", () => {
    expect(sessionBelongsToCpf(session, "99988877766")).toBe(false);
  });

  it("sessões de CPFs distintos são objetos independentes", () => {
    const s1 = buildSessionFromResponse("11111111111", {
      session_token: "A".repeat(64),
      client_name: "User1",
      expires_at: "2099-01-01T00:00:00Z",
    });
    const s2 = buildSessionFromResponse("22222222222", {
      session_token: "B".repeat(64),
      client_name: "User2",
      expires_at: "2099-01-01T00:00:00Z",
    });
    expect(s1!.cpf).not.toBe(s2!.cpf);
    expect(s1!.session_token).not.toBe(s2!.session_token);
    expect(sessionBelongsToCpf(s1!, "22222222222")).toBe(false);
    expect(sessionBelongsToCpf(s2!, "11111111111")).toBe(false);
  });
});

// ─── Edge function response interpretation ───────────────────
describe("interpretRequestCodeResponse", () => {
  it("retorna erro quando error é truthy", () => {
    const r = interpretRequestCodeResponse(null, new Error("network"));
    expect(r.success).toBe(false);
    expect(r.error).toBe("network");
  });

  it("retorna erro do data.error", () => {
    const r = interpretRequestCodeResponse({ error: "CPF não encontrado" }, null);
    expect(r.success).toBe(false);
    expect(r.error).toBe("CPF não encontrado");
  });

  it("retorna sucesso com mensagem", () => {
    const r = interpretRequestCodeResponse({ message: "Código enviado" }, null);
    expect(r.success).toBe(true);
    expect(r.message).toBe("Código enviado");
  });
});

describe("interpretVerifyCodeResponse", () => {
  it("retorna erro quando error é truthy", () => {
    const r = interpretVerifyCodeResponse("12345678900", null, new Error("fail"));
    expect(r.success).toBe(false);
    expect(r.error).toBe("fail");
  });

  it("retorna erro do data.error", () => {
    const r = interpretVerifyCodeResponse(
      "12345678900",
      { error: "Código expirado" },
      null,
    );
    expect(r.success).toBe(false);
    expect(r.error).toBe("Código expirado");
  });

  it("retorna erro se dados incompletos", () => {
    const r = interpretVerifyCodeResponse("12345678900", {}, null);
    expect(r.success).toBe(false);
    expect(r.error).toBe("Resposta inválida do servidor");
  });
});

// ─── Session token validation ────────────────────────────────
describe("isValidSessionToken", () => {
  it("aceita token de 64 caracteres alfanuméricos", () => {
    expect(isValidSessionToken("A".repeat(64))).toBe(true);
  });

  it("rejeita token curto", () => {
    expect(isValidSessionToken("A".repeat(63))).toBe(false);
  });

  it("rejeita token com caracteres especiais", () => {
    expect(isValidSessionToken("A".repeat(63) + "!")).toBe(false);
  });
});
