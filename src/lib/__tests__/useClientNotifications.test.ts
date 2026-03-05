import { describe, it, expect } from "vitest";
import {
  filterClientNotifications,
  filterByCpf,
  countUnread,
  markOneAsRead,
  markAllAsRead,
  getUnreadIds,
  prependNotification,
  hasNoNotifications,
  decrementUnread,
  type ClientNotification,
} from "../client-notifications-logic";

// ─── Helpers ──────────────────────────────────────────────────

function makeNotification(
  overrides: Partial<ClientNotification> = {},
): ClientNotification {
  return {
    id: "n-1",
    target: "client",
    target_client_cpf: "12345678900",
    type: "order_status_update",
    title: "Pedido atualizado",
    message: "Seu pedido foi enviado",
    reference_id: null,
    reference_type: null,
    read: false,
    read_at: null,
    created_at: "2025-01-15T10:00:00Z",
    ...overrides,
  };
}

// ─── 1. Busca notificações pelo CPF correto ──────────────────
describe("Busca por CPF", () => {
  it("filterByCpf retorna apenas notificações do CPF informado", () => {
    const list = [
      makeNotification({ id: "1", target_client_cpf: "11111111111" }),
      makeNotification({ id: "2", target_client_cpf: "22222222222" }),
      makeNotification({ id: "3", target_client_cpf: "11111111111" }),
    ];
    const result = filterByCpf(list, "11111111111");
    expect(result).toHaveLength(2);
    expect(result.every((n) => n.target_client_cpf === "11111111111")).toBe(true);
  });

  it("filterByCpf retorna lista vazia se nenhum match", () => {
    const list = [makeNotification({ target_client_cpf: "99999999999" })];
    expect(filterByCpf(list, "11111111111")).toHaveLength(0);
  });
});

// ─── 2. Marcar como lida atualiza estado local sem refetch ───
describe("Marcar como lida (otimista)", () => {
  it("markOneAsRead atualiza apenas a notificação correta", () => {
    const list = [
      makeNotification({ id: "a", read: false }),
      makeNotification({ id: "b", read: false }),
    ];
    const result = markOneAsRead(list, "a");
    expect(result[0].read).toBe(true);
    expect(result[0].read_at).not.toBeNull();
    expect(result[1].read).toBe(false);
  });

  it("markOneAsRead não altera notificação já lida", () => {
    const list = [makeNotification({ id: "a", read: true, read_at: "2025-01-01T00:00:00Z" })];
    const result = markOneAsRead(list, "a");
    expect(result[0].read).toBe(true);
  });

  it("markOneAsRead retorna nova referência (imutável)", () => {
    const list = [makeNotification({ id: "a" })];
    const result = markOneAsRead(list, "a");
    expect(result).not.toBe(list);
    expect(result[0]).not.toBe(list[0]);
  });

  it("countUnread diminui após markOneAsRead", () => {
    const list = [
      makeNotification({ id: "a", read: false }),
      makeNotification({ id: "b", read: false }),
    ];
    expect(countUnread(list)).toBe(2);
    const after = markOneAsRead(list, "a");
    expect(countUnread(after)).toBe(1);
  });
});

// ─── 3. Marcar todas como lidas zera contador ────────────────
describe("Marcar todas como lidas", () => {
  it("markAllAsRead marca todas como read: true", () => {
    const list = [
      makeNotification({ id: "a", read: false }),
      makeNotification({ id: "b", read: false }),
      makeNotification({ id: "c", read: true, read_at: "2025-01-01T00:00:00Z" }),
    ];
    const result = markAllAsRead(list);
    expect(result.every((n) => n.read)).toBe(true);
    expect(countUnread(result)).toBe(0);
  });

  it("getUnreadIds retorna IDs das não lidas", () => {
    const list = [
      makeNotification({ id: "a", read: false }),
      makeNotification({ id: "b", read: true }),
      makeNotification({ id: "c", read: false }),
    ];
    expect(getUnreadIds(list)).toEqual(["a", "c"]);
  });

  it("decrementUnread nunca retorna negativo", () => {
    expect(decrementUnread(0)).toBe(0);
    expect(decrementUnread(3)).toBe(2);
  });
});

// ─── 4. Nova notificação via realtime no topo da lista ───────
describe("Realtime insert", () => {
  it("prependNotification adiciona ao início", () => {
    const existing = [
      makeNotification({ id: "old-1", created_at: "2025-01-01T00:00:00Z" }),
    ];
    const newN = makeNotification({ id: "new-1", created_at: "2025-01-15T12:00:00Z" });
    const result = prependNotification(existing, newN);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("new-1");
    expect(result[1].id).toBe("old-1");
  });

  it("prependNotification em lista vazia cria lista com 1 item", () => {
    const newN = makeNotification({ id: "first" });
    const result = prependNotification([], newN);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("first");
  });

  it("countUnread incrementa com nova notificação não lida", () => {
    const list = [makeNotification({ id: "a", read: false })];
    const newN = makeNotification({ id: "b", read: false });
    const result = prependNotification(list, newN);
    expect(countUnread(result)).toBe(2);
  });
});

// ─── 5. Notificação do tipo Vault não aparece na lista geral ─
describe("Filtragem por target", () => {
  it("filterClientNotifications exclui notificações com target != client", () => {
    const list = [
      makeNotification({ id: "1", target: "client" }),
      makeNotification({ id: "2", target: "vault" as any }),
      makeNotification({ id: "3", target: "admin" as any }),
      makeNotification({ id: "4", target: "client" }),
    ];
    const result = filterClientNotifications(list);
    expect(result).toHaveLength(2);
    expect(result.every((n) => n.target === "client")).toBe(true);
  });

  it("filterClientNotifications retorna lista vazia se nenhum target client", () => {
    const list = [
      makeNotification({ id: "1", target: "vault" as any }),
      makeNotification({ id: "2", target: "admin" as any }),
    ];
    expect(filterClientNotifications(list)).toHaveLength(0);
  });
});

// ─── 6. Cliente sem notificações retorna lista vazia ─────────
describe("Estado vazio", () => {
  it("hasNoNotifications retorna true para lista vazia", () => {
    expect(hasNoNotifications([])).toBe(true);
  });

  it("hasNoNotifications retorna false para lista com itens", () => {
    expect(hasNoNotifications([makeNotification()])).toBe(false);
  });

  it("countUnread retorna 0 para lista vazia", () => {
    expect(countUnread([])).toBe(0);
  });

  it("getUnreadIds retorna array vazio para lista vazia", () => {
    expect(getUnreadIds([])).toEqual([]);
  });

  it("markAllAsRead em lista vazia retorna lista vazia", () => {
    expect(markAllAsRead([])).toEqual([]);
  });

  it("filterByCpf em lista vazia retorna lista vazia", () => {
    expect(filterByCpf([], "12345678900")).toEqual([]);
  });
});
