import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission | "default";
  isSubscribed: boolean;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: "default",
    isSubscribed: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const isSupported = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
    
    setState((prev) => ({
      ...prev,
      isSupported,
      permission: isSupported ? Notification.permission : "default",
    }));

    if (isSupported && Notification.permission === "granted") {
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await (registration as any).pushManager?.getSubscription();
      setState((prev) => ({ ...prev, isSubscribed: !!subscription }));
    } catch (error) {
      console.error("Error checking push subscription:", error);
    }
  };

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      console.log("Push notifications not supported");
      return false;
    }

    setIsLoading(true);

    try {
      const permission = await Notification.requestPermission();
      setState((prev) => ({ ...prev, permission }));

      if (permission === "granted") {
        await showLocalNotification(
          "Notificações Ativadas! 🔔",
          "Você receberá atualizações sobre seus pedidos, drops e alertas de preço."
        );
        setState((prev) => ({ ...prev, isSubscribed: true }));
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [state.isSupported]);

  const showLocalNotification = async (title: string, body: string, options?: any) => {
    if (!state.isSupported || Notification.permission !== "granted") {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        icon: "/pwa-192x192.png",
        badge: "/pwa-192x192.png",
        tag: options?.tag || "bravenza-notification",
        renotify: true,
        vibrate: [200, 100, 200],
        actions: options?.actions || [],
        ...options,
      } as NotificationOptions);
    } catch (error) {
      // Fallback to regular Notification API
      new Notification(title, {
        body,
        icon: "/pwa-192x192.png",
        ...options,
      });
    }
  };

  // Specialized notification senders
  const notifyDrop = useCallback(async (dropTitle: string, dropId: string) => {
    await showLocalNotification(
      "🔥 Novo Drop Disponível!",
      dropTitle,
      {
        tag: `drop-${dropId}`,
        data: { url: `/drops/${dropId}` },
        actions: [
          { action: "view", title: "Ver agora" },
          { action: "dismiss", title: "Depois" },
        ],
      } as any
    );
  }, [state.isSupported]);

  const notifyPriceAlert = useCallback(async (productName: string, newPrice: number, productSlug: string) => {
    await showLocalNotification(
      "💰 Alerta de Preço!",
      `${productName} caiu para R$ ${newPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      {
        tag: `price-${productSlug}`,
        data: { url: `/marketplace/produto/${productSlug}` },
        actions: [
          { action: "view", title: "Ver oferta" },
        ],
      } as any
    );
  }, [state.isSupported]);

  const notifyChatMessage = useCallback(async (senderName: string, message: string, orderId: string) => {
    await showLocalNotification(
      `💬 Nova mensagem de ${senderName}`,
      message.length > 80 ? message.slice(0, 80) + "..." : message,
      {
        tag: `chat-${orderId}`,
        data: { url: `/dashboard?tab=marketplace` },
      } as any
    );
  }, [state.isSupported]);

  const notifyOrderUpdate = useCallback(async (status: string, orderId: string) => {
    const notif = getOrderStatusNotification(status, orderId);
    await showLocalNotification(notif.title, notif.body, {
      tag: `order-${orderId}`,
      data: { url: `/dashboard` },
    } as any);
  }, [state.isSupported]);

  // Subscribe to realtime notifications
  const subscribeToRealtimeNotifications = useCallback((clientCpf: string) => {
    const channel = supabase
      .channel("push-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `target_client_cpf=eq.${clientCpf}`,
        },
        (payload) => {
          const notif = payload.new as any;
          if (notif && Notification.permission === "granted") {
            showLocalNotification(notif.title, notif.message, {
              tag: `notif-${notif.id}`,
            } as any);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [state.isSupported]);

  return {
    ...state,
    isLoading,
    requestPermission,
    showLocalNotification,
    notifyDrop,
    notifyPriceAlert,
    notifyChatMessage,
    notifyOrderUpdate,
    subscribeToRealtimeNotifications,
  };
}

// Utility to show order status notification
export function getOrderStatusNotification(status: string, orderId: string): { title: string; body: string } {
  const notifications: Record<string, { title: string; body: string }> = {
    BUDGET_SENT: {
      title: "Orçamento Disponível 📋",
      body: `O orçamento do pedido ${orderId} está pronto para aprovação.`,
    },
    ORDER_CONFIRMED: {
      title: "Pedido Confirmado ✅",
      body: `Seu pedido ${orderId} foi confirmado com sucesso!`,
    },
    PURCHASE_COMPLETED: {
      title: "Compra Realizada 🛒",
      body: `A compra do pedido ${orderId} foi finalizada.`,
    },
    ARRIVED_BRAZIL: {
      title: "Recebido no Hub! 📦",
      body: `Seu pedido ${orderId} foi recebido no Hub Bravenza.`,
    },
    PRODUCT_INSPECTED: {
      title: "Inspeção Concluída 🔍",
      body: `A inspeção do pedido ${orderId} foi aprovada.`,
    },
    SHIPPED_TO_CLIENT: {
      title: "Pedido Enviado! 🚚",
      body: `Seu pedido ${orderId} está a caminho.`,
    },
    DELIVERED: {
      title: "Pedido Entregue! 🎉",
      body: `Seu pedido ${orderId} foi entregue. Aproveite!`,
    },
    // Marketplace-specific
    paid: {
      title: "Pagamento Confirmado 💳",
      body: `Pagamento do pedido ${orderId} foi confirmado.`,
    },
    shipped: {
      title: "Produto Enviado! 📦",
      body: `O vendedor enviou o pedido ${orderId}.`,
    },
    delivered: {
      title: "Entrega Confirmada! ✅",
      body: `Pedido ${orderId} foi entregue. Você tem 7 dias úteis de proteção.`,
    },
    disputed: {
      title: "Disputa Aberta ⚠️",
      body: `Uma disputa foi aberta no pedido ${orderId}. Acompanhe.`,
    },
    payout_released: {
      title: "Pagamento Liberado! 💰",
      body: `O repasse do pedido ${orderId} foi liberado.`,
    },
  };

  return notifications[status] || {
    title: "Atualização do Pedido",
    body: `O status do pedido ${orderId} foi atualizado.`,
  };
}
