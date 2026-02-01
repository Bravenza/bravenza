import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface VaultNotification {
  id: string;
  type: "search_update" | "match_room" | "tier_upgrade" | "sla_alert" | "invite_used" | "general";
  title: string;
  message: string;
  reference_id?: string;
  reference_type?: string;
  read: boolean;
  created_at: string;
}

interface UseVaultNotificationsOptions {
  cpf: string | null;
  enabled?: boolean;
}

export function useVaultNotifications({ cpf, enabled = true }: UseVaultNotificationsOptions) {
  const [notifications, setNotifications] = useState<VaultNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!cpf || !enabled) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("target", "client")
        .eq("target_client_cpf", cpf)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      const mapped: VaultNotification[] = (data || []).map((n) => ({
        id: n.id,
        type: mapNotificationType(n.type),
        title: n.title,
        message: n.message,
        reference_id: n.reference_id || undefined,
        reference_type: n.reference_type || undefined,
        read: n.read,
        created_at: n.created_at,
      }));

      setNotifications(mapped);
      setUnreadCount(mapped.filter((n) => !n.read).length);
    } catch (error) {
      console.error("Error fetching vault notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [cpf, enabled]);

  const mapNotificationType = (type: string): VaultNotification["type"] => {
    switch (type) {
      case "search_update":
        return "search_update";
      case "match_room":
        return "match_room";
      case "tier_change":
        return "tier_upgrade";
      case "sla_alert":
        return "sla_alert";
      case "invite_used":
        return "invite_used";
      default:
        return "general";
    }
  };

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true, read_at: new Date().toISOString() })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!cpf) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true, read_at: new Date().toISOString() })
        .eq("target", "client")
        .eq("target_client_cpf", cpf)
        .eq("read", false);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }, [cpf]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Set up realtime subscription
  useEffect(() => {
    if (!cpf || !enabled) return;

    const channel = supabase
      .channel(`vault-notifications-${cpf}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `target_client_cpf=eq.${cpf}`,
        },
        (payload) => {
          const newNotification: VaultNotification = {
            id: payload.new.id,
            type: mapNotificationType(payload.new.type),
            title: payload.new.title,
            message: payload.new.message,
            reference_id: payload.new.reference_id || undefined,
            reference_type: payload.new.reference_type || undefined,
            read: payload.new.read,
            created_at: payload.new.created_at,
          };

          setNotifications((prev) => [newNotification, ...prev.slice(0, 19)]);
          if (!newNotification.read) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cpf, enabled]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}
