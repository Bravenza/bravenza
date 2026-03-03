import type { CartGroup, CartItem } from "@/hooks/useMarketplaceCart";

export type Step = "review" | "address" | "freight" | "payment" | "processing" | "success";

export interface FreightOption {
  id: number;
  name: string;
  price: string;
  delivery_time: number;
  company?: { name: string; picture?: string };
}

export interface CheckoutFormData {
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  address_cep: string;
  address_street: string;
  address_number: string;
  address_complement: string;
  address_neighborhood: string;
  address_city: string;
  address_state: string;
  payment_method: string;
}

export const BR_STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

export const conditionLabel: Record<string, string> = {
  novo: "Novo",
  usado_excelente: "Excelente",
  usado_bom: "Bom",
  usado_regular: "Regular",
};

export const formatCep = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return digits;
};

export const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

export const HUB_FREIGHT_SURCHARGE = 20;
export const CHECKOUT_STORAGE_KEY = "bravenza_checkout_state";
