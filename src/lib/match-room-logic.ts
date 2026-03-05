/**
 * Pure business logic extracted from VaultMatchRoom.
 * All functions are side-effect-free and testable without React or Supabase.
 */

// ─── Types ─────────────────────────────────────────────────────────

export type DecisionStatus = "PENDING" | "APPROVED" | "DECLINED" | "EXPIRED";

export interface MatchProposal {
  id: string;
  proposer_cpf: string;
  target_cpf: string;
  item_id: string;
  price: number;
  status: "active" | "accepted" | "rejected" | "expired";
  expires_at: string;
}

export interface MatchRoomState {
  decision_status: DecisionStatus;
  decision_deadline_at: string | null;
}

// ─── Deadline / expiry helpers ─────────────────────────────────────

/**
 * Returns true if the deadline has passed relative to `now`.
 */
export function isDeadlineExpired(
  deadline: string | null,
  now: Date = new Date(),
): boolean {
  if (!deadline) return false;
  return new Date(deadline).getTime() < now.getTime();
}

/**
 * Returns human-readable time remaining string.
 */
export function getTimeRemaining(deadline: string, now: Date = new Date()): string {
  const diff = new Date(deadline).getTime() - now.getTime();
  if (diff <= 0) return "Expirado";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    return `${Math.floor(hours / 24)} dias`;
  }
  return `${hours}h ${minutes}m`;
}

/**
 * Determines if the room is in an actionable pending state.
 */
export function isPending(room: MatchRoomState, now: Date = new Date()): boolean {
  return (
    room.decision_status === "PENDING" &&
    !isDeadlineExpired(room.decision_deadline_at, now)
  );
}

// ─── Proposal validation rules ─────────────────────────────────────

/**
 * Rule 1: A proposal can only be accepted by its target — not the proposer.
 */
export function canAcceptProposal(proposal: MatchProposal, actorCpf: string): { allowed: boolean; reason?: string } {
  if (proposal.proposer_cpf === actorCpf) {
    return { allowed: false, reason: "O proponente não pode aceitar a própria proposta" };
  }
  if (proposal.target_cpf !== actorCpf) {
    return { allowed: false, reason: "Somente o destinatário pode aceitar esta proposta" };
  }
  if (proposal.status !== "active") {
    return { allowed: false, reason: `Proposta com status "${proposal.status}" não pode ser aceita` };
  }
  return { allowed: true };
}

/**
 * Rule 2: Proposal price must be greater than zero.
 */
export function isValidProposalPrice(price: number): boolean {
  return typeof price === "number" && price > 0;
}

/**
 * Rule 3: Expired proposals cannot be accepted or rejected.
 */
export function canActOnProposal(
  proposal: MatchProposal,
  now: Date = new Date(),
): { allowed: boolean; reason?: string } {
  if (isDeadlineExpired(proposal.expires_at, now)) {
    return { allowed: false, reason: "Proposta expirada" };
  }
  if (proposal.status !== "active") {
    return { allowed: false, reason: `Proposta com status "${proposal.status}" não é acionável` };
  }
  return { allowed: true };
}

/**
 * Rule 4: Accepting a proposal produces status updates for both parties.
 */
export interface AcceptResult {
  buyer_status: string;
  seller_status: string;
  proposal_status: "accepted";
}

export function buildAcceptResult(): AcceptResult {
  return {
    buyer_status: "awaiting_payment",
    seller_status: "awaiting_shipment",
    proposal_status: "accepted",
  };
}

/**
 * Rule 5: Rejecting a proposal frees the item for new proposals.
 */
export interface RejectResult {
  proposal_status: "rejected";
  item_available: true;
}

export function buildRejectResult(): RejectResult {
  return {
    proposal_status: "rejected",
    item_available: true,
  };
}

/**
 * Rule 6: Check for duplicate active proposals from the same buyer on the same item.
 */
export function hasDuplicateActiveProposal(
  existingProposals: MatchProposal[],
  buyerCpf: string,
  itemId: string,
): boolean {
  return existingProposals.some(
    (p) => p.proposer_cpf === buyerCpf && p.item_id === itemId && p.status === "active",
  );
}

// ─── Decline reason validation ─────────────────────────────────────

/**
 * Validates the decline reason (must be non-empty).
 */
export function isValidDeclineReason(reason: string): boolean {
  return reason.trim().length > 0;
}
