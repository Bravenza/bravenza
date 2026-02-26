import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission | "default";
  isSubscribed: boolean;
}

// Register custom SW for push events
async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw-push.js", { scope: "/" });
    console.log("[Push] SW registered:", reg.scope);
    return reg;
  } catch (e) {
    console.error("[Push] SW registration failed:", e);
    return null;
  }
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: "default",
    isSubscribed: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const swRegRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const isSupported =
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window;

    setState((prev) => ({
      ...prev,
      isSupported,
      permission: isSupported ? Notification.permission : "default",
    }));

    if (isSupported) {
      registerPushServiceWorker().then((reg) => {
        swRegRef.current = reg;
        if (reg && Notification.permission === "granted") {
          checkSubscription(reg);
        }
      });
    }
  }, []);

  const checkSubscription = async (reg: ServiceWorkerRegistration) => {
    try {
      const pm = (reg as any).pushManager;
      const sub = pm ? await pm.getSubscription() : null;
      setState((prev) => ({ ...prev, isSubscribed: !!sub }));
    } catch (error) {
      console.error("Error checking push subscription:", error);
    }
  };

  const saveSubscription = useCallback(
    async (subscription: PushSubscription, cpf: string) => {
      const keys = subscription.toJSON().keys!;
      const { error } = await supabase.functions.invoke("push-subscribe", {
        body: {
          cpf,
          endpoint: subscription.endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          user_agent: navigator.userAgent,
        },
      });
      if (error) console.error("Error saving subscription:", error);
    },
    []
  );

  const requestPermission = useCallback(
    async (cpf?: string): Promise<boolean> => {
      if (!state.isSupported) return false;

      setIsLoading(true);
      try {
        const permission = await Notification.requestPermission();
        setState((prev) => ({ ...prev, permission }));

        if (permission !== "granted") return false;

        // Get or register the SW
        let reg = swRegRef.current;
        if (!reg) {
          reg = await registerPushServiceWorker();
          swRegRef.current = reg;
        }
        if (!reg) return false;

        // Fetch VAPID public key from server
        let vapidPublicKey: string | null = null;
        try {
          const { data } = await supabase.functions.invoke("push-vapid-key", { method: "GET" });
          vapidPublicKey = data?.vapidPublicKey || null;
        } catch {
          console.warn("[Push] Could not fetch VAPID key");
        }

        if (vapidPublicKey) {
          try {
            const pm = (reg as any).pushManager;
            const subscription = await pm.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            });

            if (cpf) {
              await saveSubscription(subscription, cpf);
            }

            setState((prev) => ({ ...prev, isSubscribed: true }));
          } catch (pushError) {
            console.warn("[Push] PushManager.subscribe failed, falling back to local:", pushError);
            setState((prev) => ({ ...prev, isSubscribed: true }));
          }
        } else {
          setState((prev) => ({ ...prev, isSubscribed: true }));
        }

        // Show confirmation
        await showLocalNotification(
          "Notificações Ativadas! 🔔",
          "Você receberá atualizações sobre seus pedidos, drops e alertas de preço."
        );

        return true;
      } catch (error) {
        console.error("Error requesting notification permission:", error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [state.isSupported, saveSubscription]
  );

  const showLocalNotification = async (
    title: string,
    body: string,
    options?: Record<string, unknown>
  ) => {
    if (!state.isSupported || Notification.permission !== "granted") return;

    try {
      const reg =
        swRegRef.current || (await navigator.serviceWorker.ready);
      await reg.showNotification(title, {
        body,
        icon: "/pwa-192x192.png",
        badge: "/pwa-192x192.png",
        tag: (options?.tag as string) || "bravenza-notification",
        renotify: true,
        vibrate: [200, 100, 200],
        ...options,
      } as NotificationOptions);
    } catch {
      new Notification(title, { body, icon: "/pwa-192x192.png" });
    }
  };

  // Subscribe to realtime notifications and show push
  const subscribeToRealtimeNotifications = useCallback(
    (clientCpf: string) => {
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
            const notif = payload.new as Record<string, unknown>;
            if (notif && Notification.permission === "granted") {
              showLocalNotification(
                notif.title as string,
                notif.message as string,
                { tag: `notif-${notif.id}` }
              );
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
    [state.isSupported]
  );

  return {
    ...state,
    isLoading,
    requestPermission,
    showLocalNotification,
    subscribeToRealtimeNotifications,
  };
}

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Utility for order status notification text
export function getOrderStatusNotification(
  status: string,
  orderId: string
): { title: string; body: string } {
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

  return (
    notifications[status] || {
      title: "Atualização do Pedido",
      body: `O status do pedido ${orderId} foi atualizado.`,
    }
  );
}
