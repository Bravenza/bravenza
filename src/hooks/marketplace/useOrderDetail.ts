import { useState, useCallback } from "react";
import { marketplaceRequest } from "@/hooks/marketplace/api";

export interface OrderTimelineEvent {
  id: string;
  event_type: string;
  description: string;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface OrderDocument {
  id: string;
  document_name: string;
  document_type: string;
  file_url: string;
  generated_at: string;
}

export interface OrderDetailData {
  order: Record<string, any>;
  timeline: OrderTimelineEvent[];
  documents: OrderDocument[];
  allowed_actions: string[];
  role: "buyer" | "seller";
}

export function useOrderDetail(cpf: string | null) {
  const [data, setData] = useState<OrderDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async (orderId: string) => {
    if (!cpf) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await marketplaceRequest(cpf, "order-detail", "GET", undefined, { order_id: orderId });
      if (!res.ok) throw new Error(res.error || "Erro ao carregar pedido");
      setData(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar pedido");
    } finally {
      setIsLoading(false);
    }
  }, [cpf]);

  const confirmDelivery = useCallback(async (orderId: string) => {
    if (!cpf) return false;
    try {
      const res = await marketplaceRequest(cpf, "confirm-delivery", "PUT", { order_id: orderId });
      if (!res.ok && !res.success) throw new Error(res.error || "Erro");
      return true;
    } catch {
      return false;
    }
  }, [cpf]);

  return { data, isLoading, error, fetchDetail, confirmDelivery };
}
