import { describe, it, expect } from "vitest";
import {
  canAcceptProposal,
  isValidProposalPrice,
  canActOnProposal,
  buildAcceptResult,
  buildRejectResult,
  hasDuplicateActiveProposal,
  isDeadlineExpired,
  isPending,
  getTimeRemaining,
  isValidDeclineReason,
  type MatchProposal,
} from "../match-room-logic";

// Helper to build a proposal
function makeProposal(overrides: Partial<MatchProposal> = {}): MatchProposal {
  return {
    id: "prop-1",
    proposer_cpf: "11111111111",
    target_cpf: "22222222222",
    item_id: "item-1",
    price: 500,
    status: "active",
    expires_at: new Date(Date.now() + 86400000).toISOString(), // +1 day
    ...overrides,
  };
}

const NOW = new Date("2026-03-05T12:00:00Z");

// ─── 1. Proposta só pode ser aceita pelo destinatário ─────────────

describe("canAcceptProposal", () => {
  it("allows the target to accept", () => {
    const proposal = makeProposal();
    const result = canAcceptProposal(proposal, "22222222222");
    expect(result.allowed).toBe(true);
  });

  it("blocks the proposer from accepting their own proposal", () => {
    const proposal = makeProposal();
    const result = canAcceptProposal(proposal, "11111111111");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("proponente");
  });

  it("blocks a third party from accepting", () => {
    const proposal = makeProposal();
    const result = canAcceptProposal(proposal, "33333333333");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("destinatário");
  });
});

// ─── 2. Valor da proposta deve ser maior que zero ─────────────────

describe("isValidProposalPrice", () => {
  it("accepts positive price", () => {
    expect(isValidProposalPrice(100)).toBe(true);
    expect(isValidProposalPrice(0.01)).toBe(true);
  });

  it("rejects zero", () => {
    expect(isValidProposalPrice(0)).toBe(false);
  });

  it("rejects negative", () => {
    expect(isValidProposalPrice(-50)).toBe(false);
  });

  it("rejects NaN", () => {
    expect(isValidProposalPrice(NaN)).toBe(false);
  });
});

// ─── 3. Proposta expirada não pode ser aceita ou rejeitada ────────

describe("canActOnProposal (expiry)", () => {
  it("allows action on active, non-expired proposal", () => {
    const proposal = makeProposal({ expires_at: "2026-03-06T12:00:00Z" });
    const result = canActOnProposal(proposal, NOW);
    expect(result.allowed).toBe(true);
  });

  it("blocks action on expired proposal", () => {
    const proposal = makeProposal({ expires_at: "2026-03-04T12:00:00Z" });
    const result = canActOnProposal(proposal, NOW);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("expirada");
  });

  it("blocks action on already rejected proposal", () => {
    const proposal = makeProposal({ status: "rejected" });
    const result = canActOnProposal(proposal, NOW);
    expect(result.allowed).toBe(false);
  });
});

// ─── 4. Aceite atualiza status de ambas as partes ─────────────────

describe("buildAcceptResult", () => {
  it("returns correct statuses for buyer and seller", () => {
    const result = buildAcceptResult();
    expect(result.proposal_status).toBe("accepted");
    expect(result.buyer_status).toBe("awaiting_payment");
    expect(result.seller_status).toBe("awaiting_shipment");
  });
});

// ─── 5. Rejeição libera o item ────────────────────────────────────

describe("buildRejectResult", () => {
  it("marks proposal as rejected and item as available", () => {
    const result = buildRejectResult();
    expect(result.proposal_status).toBe("rejected");
    expect(result.item_available).toBe(true);
  });
});

// ─── 6. Sem duplicatas ativas do mesmo comprador para mesmo item ──

describe("hasDuplicateActiveProposal", () => {
  it("detects duplicate active proposal", () => {
    const existing = [makeProposal({ proposer_cpf: "AAA", item_id: "X", status: "active" })];
    expect(hasDuplicateActiveProposal(existing, "AAA", "X")).toBe(true);
  });

  it("allows if existing proposal is rejected", () => {
    const existing = [makeProposal({ proposer_cpf: "AAA", item_id: "X", status: "rejected" })];
    expect(hasDuplicateActiveProposal(existing, "AAA", "X")).toBe(false);
  });

  it("allows if different buyer", () => {
    const existing = [makeProposal({ proposer_cpf: "BBB", item_id: "X", status: "active" })];
    expect(hasDuplicateActiveProposal(existing, "AAA", "X")).toBe(false);
  });

  it("allows if different item", () => {
    const existing = [makeProposal({ proposer_cpf: "AAA", item_id: "Y", status: "active" })];
    expect(hasDuplicateActiveProposal(existing, "AAA", "X")).toBe(false);
  });

  it("allows when list is empty", () => {
    expect(hasDuplicateActiveProposal([], "AAA", "X")).toBe(false);
  });
});

// ─── Bonus: deadline & pending helpers ────────────────────────────

describe("isDeadlineExpired", () => {
  it("returns false for null deadline", () => {
    expect(isDeadlineExpired(null, NOW)).toBe(false);
  });

  it("returns true for past deadline", () => {
    expect(isDeadlineExpired("2026-03-04T00:00:00Z", NOW)).toBe(true);
  });

  it("returns false for future deadline", () => {
    expect(isDeadlineExpired("2026-03-06T00:00:00Z", NOW)).toBe(false);
  });
});

describe("isPending", () => {
  it("returns true for PENDING with future deadline", () => {
    expect(isPending({ decision_status: "PENDING", decision_deadline_at: "2026-03-06T12:00:00Z" }, NOW)).toBe(true);
  });

  it("returns false for APPROVED", () => {
    expect(isPending({ decision_status: "APPROVED", decision_deadline_at: "2026-03-06T12:00:00Z" }, NOW)).toBe(false);
  });

  it("returns false for PENDING with expired deadline", () => {
    expect(isPending({ decision_status: "PENDING", decision_deadline_at: "2026-03-04T12:00:00Z" }, NOW)).toBe(false);
  });
});

describe("getTimeRemaining", () => {
  it("returns 'Expirado' for past deadline", () => {
    expect(getTimeRemaining("2026-03-04T12:00:00Z", NOW)).toBe("Expirado");
  });

  it("returns days for >24h", () => {
    expect(getTimeRemaining("2026-03-08T12:00:00Z", NOW)).toBe("3 dias");
  });

  it("returns hours and minutes for <24h", () => {
    const result = getTimeRemaining("2026-03-05T18:30:00Z", NOW);
    expect(result).toBe("6h 30m");
  });
});

describe("isValidDeclineReason", () => {
  it("accepts non-empty reason", () => {
    expect(isValidDeclineReason("Preço alto")).toBe(true);
  });

  it("rejects empty/whitespace reason", () => {
    expect(isValidDeclineReason("")).toBe(false);
    expect(isValidDeclineReason("   ")).toBe(false);
  });
});
