import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

/**
 * Hook that subscribes to realtime changes on key admin tables
 * and shows toast alerts + invalidates relevant queries.
 */
export function useRealtimeAdmin() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user || !isAdmin) return;

    const channel = supabase
      .channel("admin-realtime-hub")
      // New order requests
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "order_requests" },
        (payload) => {
          const req = payload.new as any;
          toast.info("📋 Nova Solicitação", {
            description: `${req.client_name} — ${req.product_brand || ""} ${req.product_model || ""}`.trim(),
            action: { label: "Ver", onClick: () => window.location.assign("/admin/solicitacoes") },
          });
          queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
        }
      )
      // Order status changes
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: "current_status=neq.current_status" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
          queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
        }
      )
      // New reviews
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reviews" },
        (payload) => {
          const review = payload.new as any;
          toast.info("⭐ Nova Avaliação", {
            description: `${review.client_name} deu ${review.rating} estrelas`,
          });
        }
      )
      // Vault waitlist
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "vault_waitlist" },
        (payload) => {
          const entry = payload.new as any;
          toast.info("🎫 Nova Inscrição Vault", {
            description: entry.name,
          });
        }
      )
      // Marketplace orders
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "vault_marketplace_orders" },
        (payload) => {
          const order = payload.new as any;
          toast.info("🛍️ Nova Venda Marketplace", {
            description: `${order.order_code || "Pedido"} — ${order.buyer_name}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin, queryClient]);
}
