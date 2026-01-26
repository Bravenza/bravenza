export const ORDER_STATUS_LABELS: Record<string, string> = {
  REQUEST_RECEIVED: "Solicitação Recebida",
  BUDGET_SENT: "Orçamento Enviado",
  DEPOSIT_CONFIRMED: "Sinal Confirmado",
  SEARCH_SELECTION: "Busca e Seleção",
  PRODUCT_FOUND: "Produto Encontrado",
  PREPARING_INTERNATIONAL: "Preparação para Envio Internacional",
  INTERNATIONAL_TRANSIT: "Em Trânsito Internacional",
  ARRIVED_BRAZIL: "Produto Chegou no Brasil",
  PRODUCT_INSPECTED: "Produto Conferido",
  BALANCE_PENDING: "Aguardando Pagamento do Saldo",
  FULLY_PAID: "Produto Pago Integralmente",
  SHIPPED_TO_CLIENT: "Produto Enviado ao Cliente",
  DELIVERED: "Produto Entregue",
  LOST: "Pedido Perdido",
  // Legacy statuses (for backward compatibility with existing orders)
  ORDER_CONFIRMED: "Pedido Confirmado",
  SOURCING: "Sourcing",
  NEGOTIATING: "Em Negociação",
  PURCHASE_COMPLETED: "Compra Realizada",
  PACKAGE_EN_ROUTE: "Pacote a Caminho",
  ARRIVED: "Chegou no Brasil",
  INSPECTION_APPROVED: "Inspeção Aprovada",
  BALANCE_DUE: "Saldo Pendente",
  INTERNATIONAL_DISPATCH: "Despacho Internacional",
  CUSTOMS: "Alfândega",
  NATIONAL_TRANSIT: "Trânsito Nacional",
  DISPATCHED: "Despachado",
};

export const ORDER_STATUS_DESCRIPTIONS: Record<string, string> = {
  REQUEST_RECEIVED: "Sua solicitação foi recebida e está sendo analisada.",
  BUDGET_SENT: "O orçamento foi enviado para sua aprovação.",
  DEPOSIT_CONFIRMED: "O pagamento do sinal foi confirmado.",
  SEARCH_SELECTION: "Estamos buscando e selecionando o melhor produto.",
  PRODUCT_FOUND: "Produto encontrado e selecionado!",
  PREPARING_INTERNATIONAL: "Preparando o produto para envio internacional.",
  INTERNATIONAL_TRANSIT: "Seu produto está em trânsito internacional.",
  ARRIVED_BRAZIL: "Seu produto chegou ao Brasil!",
  PRODUCT_INSPECTED: "Produto conferido e aprovado.",
  BALANCE_PENDING: "Aguardando o pagamento do saldo restante.",
  FULLY_PAID: "Pagamento completo confirmado!",
  SHIPPED_TO_CLIENT: "Produto enviado para seu endereço.",
  DELIVERED: "Produto entregue com sucesso!",
  // Legacy descriptions
  ORDER_CONFIRMED: "Seu pedido foi confirmado e está em nosso sistema.",
  SOURCING: "Estamos buscando o melhor produto para você.",
  NEGOTIATING: "Negociando as melhores condições com o fornecedor.",
  PURCHASE_COMPLETED: "Compra realizada com sucesso!",
  PACKAGE_EN_ROUTE: "Seu pacote está a caminho do Brasil.",
  ARRIVED: "Seu pacote chegou ao Brasil!",
  INSPECTION_APPROVED: "Produto inspecionado e aprovado.",
  BALANCE_DUE: "Aguardando pagamento do saldo restante.",
  INTERNATIONAL_DISPATCH: "Preparando despacho internacional.",
  CUSTOMS: "Seu pacote está na alfândega.",
  NATIONAL_TRANSIT: "Em trânsito pelo Brasil.",
  DISPATCHED: "Pacote despachado para entrega.",
};

// New VAULT flow (13 steps)
export const VAULT_STATUSES = [
  "REQUEST_RECEIVED",
  "BUDGET_SENT",
  "DEPOSIT_CONFIRMED",
  "SEARCH_SELECTION",
  "PRODUCT_FOUND",
  "PREPARING_INTERNATIONAL",
  "INTERNATIONAL_TRANSIT",
  "ARRIVED_BRAZIL",
  "PRODUCT_INSPECTED",
  "BALANCE_PENDING",
  "FULLY_PAID",
  "SHIPPED_TO_CLIENT",
  "DELIVERED",
] as const;

// Simplified READY flow (for products already in stock)
export const READY_STATUSES = [
  "REQUEST_RECEIVED",
  "BUDGET_SENT",
  "DEPOSIT_CONFIRMED",
  "BALANCE_PENDING",
  "FULLY_PAID",
  "SHIPPED_TO_CLIENT",
  "DELIVERED",
] as const;

export type OrderStatus = typeof VAULT_STATUSES[number];
export type OrderType = "READY" | "VAULT";

export const getStatusesForType = (type: OrderType): readonly string[] => {
  return type === "READY" ? READY_STATUSES : VAULT_STATUSES;
};

export const getStatusIndex = (status: string, type: OrderType): number => {
  const statuses = getStatusesForType(type);
  return statuses.indexOf(status as any);
};

export const isStatusCompleted = (
  currentStatus: string,
  checkStatus: string,
  type: OrderType
): boolean => {
  const currentIndex = getStatusIndex(currentStatus, type);
  const checkIndex = getStatusIndex(checkStatus, type);
  return checkIndex < currentIndex;
};

export const isStatusActive = (
  currentStatus: string,
  checkStatus: string
): boolean => {
  return currentStatus === checkStatus;
};

export const formatCPF = (cpf: string): string => {
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return cleaned.replace(/(\d{3})(\d+)/, "$1.$2");
  if (cleaned.length <= 9) return cleaned.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3");
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, "$1.$2.$3-$4");
};

export const cleanCPF = (cpf: string): string => {
  return cpf.replace(/\D/g, "");
};

export const validateCPF = (cpf: string): boolean => {
  const cleaned = cleanCPF(cpf);
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  if (parseInt(cleaned[9]) !== digit) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  if (parseInt(cleaned[10]) !== digit) return false;
  
  return true;
};

// Phone validation and formatting
export const cleanPhone = (phone: string): string => {
  return phone.replace(/\D/g, "");
};

export const formatPhone = (phone: string): string => {
  const cleaned = cleanPhone(phone);
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 7) return cleaned.replace(/(\d{2})(\d+)/, "($1) $2");
  if (cleaned.length <= 10) return cleaned.replace(/(\d{2})(\d{4})(\d+)/, "($1) $2-$3");
  return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
};

export const validatePhone = (phone: string): boolean => {
  const cleaned = cleanPhone(phone);
  // Brazilian phone: 10 or 11 digits (with DDD)
  return cleaned.length >= 10 && cleaned.length <= 11;
};

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const formatCurrency = (value: number, currency: string = "BRL"): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(value);
};

export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
};

export const formatDateTime = (date: string | Date): string => {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

export const generateOrderId = (): string => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear()).slice(-2);
  const sequence = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");
  return `BV-${day}${month}${year}-${sequence}`;
};

// Map old statuses to new ones for display purposes
export const mapLegacyStatus = (status: string): string => {
  const legacyMap: Record<string, string> = {
    ORDER_CONFIRMED: "REQUEST_RECEIVED",
    SOURCING: "SEARCH_SELECTION",
    NEGOTIATING: "SEARCH_SELECTION",
    PURCHASE_COMPLETED: "PRODUCT_FOUND",
    PACKAGE_EN_ROUTE: "INTERNATIONAL_TRANSIT",
    ARRIVED: "ARRIVED_BRAZIL",
    INSPECTION_APPROVED: "PRODUCT_INSPECTED",
    BALANCE_DUE: "BALANCE_PENDING",
    INTERNATIONAL_DISPATCH: "PREPARING_INTERNATIONAL",
    CUSTOMS: "ARRIVED_BRAZIL",
    NATIONAL_TRANSIT: "SHIPPED_TO_CLIENT",
    DISPATCHED: "SHIPPED_TO_CLIENT",
  };
  return legacyMap[status] || status;
};
