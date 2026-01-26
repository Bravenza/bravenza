export const ORDER_STATUS_LABELS: Record<string, string> = {
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
  DELIVERED: "Entregue",
};

export const ORDER_STATUS_DESCRIPTIONS: Record<string, string> = {
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
  DELIVERED: "Entregue com sucesso!",
};

export const VAULT_STATUSES = [
  "ORDER_CONFIRMED",
  "SOURCING",
  "NEGOTIATING",
  "PURCHASE_COMPLETED",
  "PACKAGE_EN_ROUTE",
  "ARRIVED",
  "INSPECTION_APPROVED",
  "BALANCE_DUE",
  "INTERNATIONAL_DISPATCH",
  "CUSTOMS",
  "NATIONAL_TRANSIT",
  "DISPATCHED",
  "DELIVERED",
] as const;

export const READY_STATUSES = [
  "ORDER_CONFIRMED",
  "BALANCE_DUE",
  "DISPATCHED",
  "NATIONAL_TRANSIT",
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
