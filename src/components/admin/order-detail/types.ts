import { OrderType } from "@/lib/constants";

export interface Order {
  order_id: string;
  order_type: OrderType;
  current_status: string;
  client_name: string;
  client_cpf: string;
  client_email: string | null;
  client_phone: string | null;
  client_address: string | null;
  product_brand: string | null;
  product_model: string | null;
  product_name: string;
  product_size: string | null;
  product_color: string | null;
  product_reference: string | null;
  product_link: string | null;
  product_cost: number | null;
  product_price: number | null;
  product_currency: string;
  shipping_cost: number | null;
  other_costs: number | null;
  other_costs_description: string | null;
  sinal_value: number | null;
  sinal_paid: boolean;
  sinal_payment_method: string | null;
  balance_value: number | null;
  balance_paid: boolean;
  balance_payment_method: string | null;
  international_tracking: string | null;
  national_tracking: string | null;
  international_carrier: string | null;
  national_carrier: string | null;
  sla_vault_due_date: string | null;
  balance_due_date: string | null;
  internal_notes: string | null;
  inspection_photos: string[] | null;
  reference_image_url: string | null;
  created_at: string;
  updated_at: string;
  budget_status: string | null;
  budget_sent_at: string | null;
  budget_approved_at: string | null;
  budget_rejected_at: string | null;
  budget_expires_at: string | null;
  budget_approval_token: string | null;
}

export interface HistoryItem {
  id: string;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface AddressFields {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

export const SHOE_SIZES = [
  "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"
];

export const BRAZILIAN_STATES = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];
