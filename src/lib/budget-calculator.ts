/**
 * Budget Calculator - Sistema de Cálculo Automático de Orçamentos
 * 
 * Regras:
 * - Multiplicador padrão: 1.36
 * - Arredondamento sempre para cima terminando em ,90
 * - Preço único independente da forma de pagamento
 * - Juros do cartão repassados ao cliente
 */

// Taxas de juros do Mercado Pago por número de parcelas
// NOTA: 1x não tem juros para o cliente (empresa absorve)
export const MERCADO_PAGO_RATES: Record<number, number> = {
  1: 0,        // À vista - sem juros para o cliente
  2: 0.0964,   // 9.64%
  3: 0.1123,   // 11.23%
  4: 0.1136,   // 11.36%
  5: 0.1431,   // 14.31%
  6: 0.1432,   // 14.32%
  7: 0.1672,   // 16.72%
  8: 0.1673,   // 16.73%
  9: 0.1969,   // 19.69%
  10: 0.2065,  // 20.65%
  11: 0.2066,  // 20.66%
  12: 0.2211,  // 22.11%
};

// Multiplicador padrão para cálculo de preço
export const DEFAULT_MULTIPLIER = 1.36;

/**
 * Arredonda sempre para cima para o próximo valor terminando em ,90
 * 
 * Exemplos:
 * - 1047.12 → 1047.90
 * - 1047.90 → 1047.90
 * - 1047.91 → 1048.90
 * - 0.10 → 0.90
 * - 999.99 → 1000.90
 */
export function roundUpTo90(value: number): number {
  const inteiro = Math.floor(value);
  const candidato = inteiro + 0.90;
  
  if (candidato >= value) {
    return candidato;
  } else {
    return (inteiro + 1) + 0.90;
  }
}

/**
 * Calcula o preço de venda a partir do custo total
 * 
 * preco_pix = roundUpTo90(custo_total * multiplicador)
 */
export function calculateProductPrice(totalCost: number, multiplier: number = DEFAULT_MULTIPLIER): number {
  const rawPrice = totalCost * multiplier;
  return roundUpTo90(rawPrice);
}

/**
 * Calcula o valor total no cartão incluindo juros
 * 
 * total_cartao(n) = roundUpTo90(preco_pix / (1 - taxa_cartao[n]))
 */
export function calculateCardTotal(basePrice: number, installments: number): number {
  const rate = MERCADO_PAGO_RATES[installments] || 0;
  const totalBeforeRounding = basePrice / (1 - rate);
  return roundUpTo90(totalBeforeRounding);
}

/**
 * Calcula o valor da parcela
 * 
 * parcela(n) = round(total_cartao(n) / n, 2)
 */
export function calculateInstallmentValue(cardTotal: number, installments: number): number {
  return Math.ceil((cardTotal / installments) * 100) / 100;
}

/**
 * Gera todas as opções de parcelamento de 1x a 12x
 */
export interface InstallmentOption {
  installments: number;
  installmentValue: number;
  totalWithInterest: number;
  interestRate: number;
}

export function generateInstallmentOptions(basePrice: number): InstallmentOption[] {
  const options: InstallmentOption[] = [];
  
  for (let i = 1; i <= 12; i++) {
    const totalWithInterest = calculateCardTotal(basePrice, i);
    const installmentValue = calculateInstallmentValue(totalWithInterest, i);
    const rate = MERCADO_PAGO_RATES[i] || 0;
    
    options.push({
      installments: i,
      installmentValue,
      totalWithInterest,
      interestRate: rate * 100, // Convertido para porcentagem
    });
  }
  
  return options;
}

/**
 * @deprecated Split payment removed. Use full payment only.
 */
export interface SplitPaymentValues {
  halfValue: number;
  pixHalf: number;
  cardOptions: InstallmentOption[];
}

export function calculateSplitPayment(totalPrice: number): SplitPaymentValues {
  const halfValue = Math.round((totalPrice * 0.5) * 100) / 100;
  const cardOptions = generateInstallmentOptions(halfValue);
  return { halfValue, pixHalf: halfValue, cardOptions };
}

/**
 * Formata o preço no padrão brasileiro
 */
export function formatPriceBR(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Resultado completo do cálculo de orçamento
 */
export interface BudgetCalculation {
  // Custo e preço
  totalCost: number;
  multiplier: number;
  productPrice: number; // Preço PIX à vista
  
  // Margem de lucro
  grossProfit: number;
  profitMargin: number;
  
  // Opções de pagamento à vista
  pixPrice: number;
  cardOptions: InstallmentOption[];
  
  // Opções 50/50
  splitPayment: SplitPaymentValues;
}

/**
 * Calcula todo o orçamento a partir do custo total
 */
export function calculateFullBudget(totalCost: number, multiplier: number = DEFAULT_MULTIPLIER): BudgetCalculation {
  const productPrice = calculateProductPrice(totalCost, multiplier);
  const grossProfit = productPrice - totalCost;
  const profitMargin = productPrice > 0 ? (grossProfit / productPrice) * 100 : 0;
  
  return {
    totalCost,
    multiplier,
    productPrice,
    grossProfit,
    profitMargin,
    pixPrice: productPrice,
    cardOptions: generateInstallmentOptions(productPrice),
    splitPayment: calculateSplitPayment(productPrice),
  };
}
