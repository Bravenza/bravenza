import { useState, useEffect, useCallback } from "react";

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
    // Check if push notifications are supported
    const isSupported = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
    
    setState((prev) => ({
      ...prev,
      isSupported,
      permission: isSupported ? Notification.permission : "default",
    }));

    // Check if already subscribed
    if (isSupported && Notification.permission === "granted") {
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
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
        // Show a test notification
        await showLocalNotification(
          "Notificações Ativadas! 🔔",
          "Você receberá atualizações sobre seus pedidos."
        );
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

  const showLocalNotification = async (title: string, body: string, options?: NotificationOptions) => {
    if (!state.isSupported || Notification.permission !== "granted") {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        icon: "/pwa-192x192.png",
        badge: "/pwa-192x192.png",
        tag: "bravenza-notification",
        renotify: true,
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

  return {
    ...state,
    isLoading,
    requestPermission,
    showLocalNotification,
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
      title: "Chegou no Brasil! 🇧🇷",
      body: `Seu pedido ${orderId} chegou ao Brasil.`,
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
  };

  return notifications[status] || {
    title: "Atualização do Pedido",
    body: `O status do pedido ${orderId} foi atualizado.`,
  };
}
