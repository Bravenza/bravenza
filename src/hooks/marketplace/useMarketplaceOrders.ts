import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { marketplaceRequest } from "./api";
import type { MarketplaceOrder } from "./types";

export function useMarketplaceOrders(cpf: string | null) {
  const { toast } = useToast();
  const [myOrders, setMyOrders] = useState<MarketplaceOrder[]>([]);
  const [mySales, setMySales] = useState<MarketplaceOrder[]>([]);

  const createOrder = useCallback(
    async (body: { listing_id: string; buyer_name: string; buyer_email?: string; buyer_phone?: string; buyer_address?: string; payment_method?: string }) => {
      if (!cpf) return null;
      try {
        const data = await marketplaceRequest(cpf, "create-order", "POST", body);
        toast({ title: "Pedido criado!", description: `Código: ${data.order?.order_code}` });
        return data.order;
      } catch (err: any) {
        toast({ title: "Erro ao comprar", description: err.message, variant: "destructive" });
        return null;
      }
    },
    [cpf, toast]
  );

  const confirmPayment = useCallback(
    async (orderId: string, paymentMethod: string, paymentId?: string) => {
      if (!cpf) return false;
      try {
        await marketplaceRequest(cpf, "confirm-payment", "PUT", { order_id: orderId, payment_method: paymentMethod, payment_id: paymentId });
        toast({ title: "Pagamento confirmado!" });
        return true;
      } catch (err: any) {
        toast({ title: "Erro no pagamento", description: err.message, variant: "destructive" });
        return false;
      }
    },
    [cpf, toast]
  );

  const fetchMyOrders = useCallback(async () => {
    if (!cpf) return;
    try {
      const data = await marketplaceRequest(cpf, "my-orders");
      setMyOrders(data.orders || []);
    } catch (err: any) {
      console.error("Fetch my orders error:", err);
    }
  }, [cpf]);

  const fetchMySales = useCallback(async () => {
    if (!cpf) return;
    try {
      const data = await marketplaceRequest(cpf, "my-sales");
      setMySales(data.orders || []);
    } catch (err: any) {
      console.error("Fetch my sales error:", err);
    }
  }, [cpf]);

  const updateOrderStatus = useCallback(
    async (orderId: string, status: string, extra?: Record<string, any>) => {
      if (!cpf) return false;
      try {
        await marketplaceRequest(cpf, "update-order-status", "PUT", { order_id: orderId, status, ...extra });
        toast({ title: "Status atualizado!" });
        return true;
      } catch (err: any) {
        toast({ title: "Erro ao atualizar", description: err.message, variant: "destructive" });
        return false;
      }
    },
    [cpf, toast]
  );

  const rateSeller = useCallback(
    async (orderId: string, rating: number, review?: string) => {
      if (!cpf) return false;
      try {
        await marketplaceRequest(cpf, "rate-seller", "POST", { order_id: orderId, rating, review });
        toast({ title: "Avaliação enviada!" });
        return true;
      } catch (err: any) {
        toast({ title: "Erro ao avaliar", description: err.message, variant: "destructive" });
        return false;
      }
    },
    [cpf, toast]
  );

  return {
    myOrders, mySales,
    createOrder, confirmPayment, fetchMyOrders, fetchMySales, updateOrderStatus, rateSeller,
  };
}
