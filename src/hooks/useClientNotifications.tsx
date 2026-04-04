import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ClientNotification {
  id: string;
  target: "client";
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

export function useClientNotifications(clientCpf: string | null) {
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!clientCpf) return;

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("target", "client")
        .eq("target_client_cpf", clientCpf)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const typedData = (data || []) as ClientNotification[];
      setNotifications(typedData);
      setUnreadCount(typedData.filter((n) => !n.read).length);
    } catch (error) {
      console.error("Error fetching client notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [clientCpf]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true, read_at: new Date().toISOString() })
        .eq("id", notificationId)
        .eq("target_client_cpf", clientCpf);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read: true, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, [clientCpf]);

  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from("notifications")
        .update({ read: true, read_at: new Date().toISOString() })
        .in("id", unreadIds)
        .eq("target_client_cpf", clientCpf);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }, [notifications, clientCpf]);

  // Subscribe to realtime notifications for the authenticated client context
  useEffect(() => {
    if (!clientCpf) return;

    fetchNotifications();

    const channel = supabase
      .channel(`client-notifications-${clientCpf}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `target_client_cpf=eq.${clientCpf}`,
        },
        (payload) => {
          const newNotification = payload.new as ClientNotification;
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
          
          // Show toast notification
          toast.info(newNotification.title, {
            description: newNotification.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientCpf, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}

// Client notification types
export const CLIENT_NOTIFICATION_TYPES = {
  ORDER_STATUS_UPDATE: "order_status_update",
  BUDGET_SENT: "budget_sent",
  PAYMENT_CONFIRMED: "payment_received",
  ORDER_DELIVERED: "order_delivered",
  CASHBACK_AVAILABLE: "cashback_available",
  CASHBACK_EXPIRING: "cashback_expiring",
} as const;
