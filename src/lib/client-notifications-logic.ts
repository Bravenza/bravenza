/**
 * Pure helper functions extracted from useClientNotifications hook.
 * These functions encapsulate business logic so it can be tested
 * without React context or Supabase client dependencies.
 */

export interface ClientNotification {
  id: string;
  target: string;
  target_client_cpf: string;
  type: string;
  title: string;
  message: string;
  reference_id: string | null;
  reference_type: string | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

// ─── Filtering ────────────────────────────────────────────────

/**
 * Filters notifications to only include those targeting "client".
 * Vault-specific notifications (target !== "client") are excluded.
 */
export function filterClientNotifications(
  notifications: ClientNotification[],
): ClientNotification[] {
  return notifications.filter((n) => n.target === "client");
}

/**
 * Filters notifications belonging to a specific CPF.
 */
export function filterByCpf(
  notifications: ClientNotification[],
  cpf: string,
): ClientNotification[] {
  return notifications.filter((n) => n.target_client_cpf === cpf);
}

// ─── Unread count ─────────────────────────────────────────────

/**
 * Counts unread notifications.
 */
export function countUnread(notifications: ClientNotification[]): number {
  return notifications.filter((n) => !n.read).length;
}

// ─── Mark as read ─────────────────────────────────────────────

/**
 * Returns a new notifications array with the specified notification marked as read.
 * Does NOT trigger a refetch — purely optimistic local update.
 */
export function markOneAsRead(
  notifications: ClientNotification[],
  notificationId: string,
): ClientNotification[] {
  return notifications.map((n) =>
    n.id === notificationId
      ? { ...n, read: true, read_at: new Date().toISOString() }
      : n,
  );
}

/**
 * Returns a new notifications array with ALL unread notifications marked as read.
 */
export function markAllAsRead(
  notifications: ClientNotification[],
): ClientNotification[] {
  return notifications.map((n) => ({
    ...n,
    read: true,
    read_at: n.read_at || new Date().toISOString(),
  }));
}

/**
 * Returns the IDs of all unread notifications.
 */
export function getUnreadIds(notifications: ClientNotification[]): string[] {
  return notifications.filter((n) => !n.read).map((n) => n.id);
}

// ─── Realtime insert ──────────────────────────────────────────

/**
 * Adds a new notification to the TOP of the list (most recent first).
 */
export function prependNotification(
  notifications: ClientNotification[],
  newNotification: ClientNotification,
): ClientNotification[] {
  return [newNotification, ...notifications];
}

// ─── Empty state ──────────────────────────────────────────────

/**
 * Checks if the notification list is empty.
 */
export function hasNoNotifications(notifications: ClientNotification[]): boolean {
  return notifications.length === 0;
}

/**
 * Builds the updated unread count after marking one as read.
 */
export function decrementUnread(currentCount: number): number {
  return Math.max(0, currentCount - 1);
}
