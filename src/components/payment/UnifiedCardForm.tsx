import { useState, useEffect, useCallback } from "react";
import { Loader2, Lock, ShieldCheck, CreditCard, AlertCircle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { InteractiveCardPreview } from "./InteractiveCardPreview";

const MP_PUBLIC_KEY = "APP_USR-7e93dfe2-f5cd-4acc-a5a9-8ccc1ad0cdb9";

declare global {
  interface Window {
    MercadoPago: any;
  }
}

export interface UnifiedCardFormData {
  cardNumber: string;
  cardholderName: string;
  expirationMonth: string;
  expirationYear: string;
  securityCode: string;
  identificationNumber: string;
  email: string;
  installments: number;
}

interface InstallmentOption {
  value: number;
  label: string;
  total: number;
  isInterestFree: boolean;
  interestRate?: number;
}

interface UnifiedCardFormProps {
  /** Total amount to charge */
  amount: number;
  /** Pre-filled email */
  email?: string;
  /** Whether to show interest rates (Bravenza uses MP rates, Marketplace doesn't) */
  interestRates?: Record<number, number>;
  /** Called whenever form data or validity changes */
  onDataChange?: (data: UnifiedCardFormData, isValid: boolean) => void;
  /** If provided, form will submit directly (Bravenza mode) */
  onSubmit?: (cardToken: string, data: UnifiedCardFormData) => Promise<void>;
  /** Label for the submit button */
  submitLabel?: string;
  /** Whether form is in a compact context (modal) */
  compact?: boolean;
}

// ── Helpers ──

const formatCardNumber = (value: string) => {
  const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "").slice(0, 16);
  const parts = [];
  for (let i = 0; i < v.length; i += 4) parts.push(v.substring(i, i + 4));
  return parts.join(" ");
};

const detectBrand = (number: string): { key: string; label: string } => {
  const n = number.replace(/\s/g, "");
  if (n.startsWith("4")) return { key: "visa", label: "Visa" };
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return { key: "mastercard", label: "Mastercard" };
  if (/^3[47]/.test(n)) return { key: "amex", label: "Amex" };
  if (/^636368/.test(n)) return { key: "elo", label: "Elo" };
  if (/^606282/.test(n)) return { key: "hipercard", label: "Hipercard" };
  if (/^50/.test(n)) return { key: "aura", label: "Aura" };
  if (/^3(?:0[0-5]|[68])/.test(n)) return { key: "diners", label: "Diners" };
  return { key: "", label: "" };
};

const formatCpf = (value: string) =>
  value.replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

// ── Component ──

export function UnifiedCardForm({
  amount,
  email: initialEmail,
  interestRates,
  onDataChange,
  onSubmit,
  submitLabel,
  compact = false,
}: UnifiedCardFormProps) {
  const [form, setForm] = useState<UnifiedCardFormData>({
    cardNumber: "",
    cardholderName: "",
    expirationMonth: "",
    expirationYear: "",
    securityCode: "",
    identificationNumber: "",
    email: initialEmail || "",
    installments: 1,
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [brand, setBrand] = useState<{ key: string; label: string }>({ key: "", label: "" });
  const [mpReady, setMpReady] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState("");

  // Load MP SDK
  useEffect(() => {
    if (window.MercadoPago) { setMpReady(true); return; }
    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    script.onload = () => setMpReady(true);
    document.body.appendChild(script);
  }, []);

  // Validate
  const validate = useCallback((data: UnifiedCardFormData) => {
    const e: Record<string, string> = {};
    if (data.cardNumber.replace(/\s/g, "").length < 13) e.cardNumber = "Número do cartão inválido";
    if (data.cardholderName.length < 3) e.cardholderName = "Nome do titular inválido";
    if (!data.expirationMonth || +data.expirationMonth < 1 || +data.expirationMonth > 12) e.expirationMonth = "Mês inválido";
    const curYear = new Date().getFullYear() % 100;
    if (!data.expirationYear || +data.expirationYear < curYear) e.expirationYear = "Ano inválido";
    if (data.securityCode.length < 3) e.securityCode = "CVV inválido";
    if (data.identificationNumber.replace(/\D/g, "").length !== 11) e.identificationNumber = "CPF inválido";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = "E-mail inválido";
    return e;
  }, []);

  const errors = validate(form);
  const isValid = Object.keys(errors).length === 0;

  const update = (field: keyof UnifiedCardFormData, value: string) => {
    let processed = value;
    if (field === "cardNumber") {
      processed = formatCardNumber(value);
      setBrand(detectBrand(processed));
    }
    if (field === "identificationNumber") processed = formatCpf(value);
    if (field === "expirationMonth" || field === "expirationYear" || field === "securityCode") {
      processed = value.replace(/\D/g, "");
    }
    if (field === "cardholderName") processed = value.toUpperCase();

    const next = { ...form, [field]: processed };
    setForm(next);
    const errs = validate(next);
    onDataChange?.(next, Object.keys(errs).length === 0);
  };

  const markTouched = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field === "securityCode") setIsFlipped(false);
  };

  const setInstallments = (v: number) => {
    const next = { ...form, installments: v };
    setForm(next);
    const errs = validate(next);
    onDataChange?.(next, Object.keys(errs).length === 0);
  };

  // Build installment options
  const installmentOptions: InstallmentOption[] = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    const rate = interestRates?.[n] ?? 0;
    const total = amount * (1 + rate);
    const perInstallment = total / n;
    return {
      value: n,
      label: n === 1
        ? `1x de ${fmt(total)} (sem juros)`
        : rate > 0
          ? `${n}x de ${fmt(perInstallment)} (${fmt(total)})`
          : `${n}x de ${fmt(perInstallment)}`,
      total,
      isInterestFree: rate === 0,
      interestRate: rate,
    };
  });

  const selectedOption = installmentOptions.find(o => o.value === form.installments) || installmentOptions[0];
  const totalWithInterest = selectedOption.total;

  // Tokenize + submit (for Bravenza self-contained mode)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !onSubmit || !mpReady) return;

    // Touch all fields to show errors
    const allFields = ["cardNumber", "cardholderName", "expirationMonth", "expirationYear", "securityCode", "identificationNumber", "email"];
    setTouched(Object.fromEntries(allFields.map(f => [f, true])));
    if (!isValid) return;

    setIsSubmitting(true);
    setSubmitStatus("idle");
    try {
      const token = await tokenizeCard(form);
      await onSubmit(token, form);
      setSubmitStatus("success");
    } catch (err: any) {
      setSubmitError(err.message || "Erro ao processar pagamento");
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldError = (field: string) => touched[field] && errors[field] ? errors[field] : null;

  if (!mpReady) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Carregando pagamento seguro...</span>
      </div>
    );
  }

  if (submitStatus === "success") {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="h-14 w-14 text-success mx-auto mb-3" />
        <h3 className="text-lg font-bold mb-1">Pagamento Confirmado!</h3>
        <p className="text-sm text-muted-foreground">Redirecionando...</p>
      </div>
    );
  }

  const spacing = compact ? "space-y-3" : "space-y-5";

  return (
    <form onSubmit={handleSubmit} className={spacing}>
      {/* Interactive Card Preview */}
      <InteractiveCardPreview
        cardNumber={form.cardNumber}
        cardholderName={form.cardholderName}
        expirationMonth={form.expirationMonth}
        expirationYear={form.expirationYear}
        securityCode={form.securityCode}
        brand={brand.key}
        isFlipped={isFlipped}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          Pagamento 100% seguro
        </div>
        {brand.label && (
          <Badge variant="outline" className="text-[10px] gap-1 px-2 py-0.5 font-semibold">
            <CreditCard className="h-2.5 w-2.5" />
            {brand.label}
          </Badge>
        )}
      </div>

      {/* Card number */}
      <div>
        <Label className="text-xs" htmlFor="uc-cardNumber">Número do cartão *</Label>
        <Input
          id="uc-cardNumber"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="0000 0000 0000 0000"
          value={form.cardNumber}
          onChange={(e) => update("cardNumber", e.target.value)}
          onFocus={() => setIsFlipped(false)}
          onBlur={() => markTouched("cardNumber")}
          maxLength={19}
          className={`mt-1 text-sm ${fieldError("cardNumber") ? "border-destructive" : ""}`}
        />
        {fieldError("cardNumber") && <p className="text-[11px] text-destructive mt-0.5">{fieldError("cardNumber")}</p>}
      </div>

      {/* Name */}
      <div>
        <Label className="text-xs" htmlFor="uc-cardholderName">Nome no cartão *</Label>
        <Input
          id="uc-cardholderName"
          autoComplete="cc-name"
          placeholder="NOME COMO NO CARTÃO"
          value={form.cardholderName}
          onChange={(e) => update("cardholderName", e.target.value)}
          onFocus={() => setIsFlipped(false)}
          onBlur={() => markTouched("cardholderName")}
          className={`mt-1 text-sm ${fieldError("cardholderName") ? "border-destructive" : ""}`}
        />
        {fieldError("cardholderName") && <p className="text-[11px] text-destructive mt-0.5">{fieldError("cardholderName")}</p>}
      </div>

      {/* Expiry + CVV */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-xs" htmlFor="uc-expMonth">Mês *</Label>
          <Input
            id="uc-expMonth"
            inputMode="numeric"
            autoComplete="cc-exp-month"
            placeholder="MM"
            value={form.expirationMonth}
            onChange={(e) => update("expirationMonth", e.target.value)}
            onFocus={() => setIsFlipped(false)}
            onBlur={() => markTouched("expirationMonth")}
            maxLength={2}
            className={`mt-1 text-sm ${fieldError("expirationMonth") ? "border-destructive" : ""}`}
          />
          {fieldError("expirationMonth") && <p className="text-[11px] text-destructive mt-0.5">{fieldError("expirationMonth")}</p>}
        </div>
        <div>
          <Label className="text-xs" htmlFor="uc-expYear">Ano *</Label>
          <Input
            id="uc-expYear"
            inputMode="numeric"
            autoComplete="cc-exp-year"
            placeholder="AA"
            value={form.expirationYear}
            onChange={(e) => update("expirationYear", e.target.value)}
            onFocus={() => setIsFlipped(false)}
            onBlur={() => markTouched("expirationYear")}
            maxLength={2}
            className={`mt-1 text-sm ${fieldError("expirationYear") ? "border-destructive" : ""}`}
          />
          {fieldError("expirationYear") && <p className="text-[11px] text-destructive mt-0.5">{fieldError("expirationYear")}</p>}
        </div>
        <div>
          <Label className="text-xs" htmlFor="uc-cvv">CVV *</Label>
          <Input
            id="uc-cvv"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="123"
            value={form.securityCode}
            onChange={(e) => update("securityCode", e.target.value)}
            onFocus={() => setIsFlipped(true)}
            onBlur={() => markTouched("securityCode")}
            maxLength={4}
            className={`mt-1 text-sm ${fieldError("securityCode") ? "border-destructive" : ""}`}
          />
          {fieldError("securityCode") && <p className="text-[11px] text-destructive mt-0.5">{fieldError("securityCode")}</p>}
        </div>
      </div>

      {/* CPF + Email */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs" htmlFor="uc-cpf">CPF do titular *</Label>
          <Input
            id="uc-cpf"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={form.identificationNumber}
            onChange={(e) => update("identificationNumber", e.target.value)}
            onFocus={() => setIsFlipped(false)}
            onBlur={() => markTouched("identificationNumber")}
            maxLength={14}
            className={`mt-1 text-sm ${fieldError("identificationNumber") ? "border-destructive" : ""}`}
          />
          {fieldError("identificationNumber") && <p className="text-[11px] text-destructive mt-0.5">{fieldError("identificationNumber")}</p>}
        </div>
        <div>
          <Label className="text-xs" htmlFor="uc-email">E-mail *</Label>
          <Input
            id="uc-email"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            onFocus={() => setIsFlipped(false)}
            onBlur={() => markTouched("email")}
            className={`mt-1 text-sm ${fieldError("email") ? "border-destructive" : ""}`}
          />
          {fieldError("email") && <p className="text-[11px] text-destructive mt-0.5">{fieldError("email")}</p>}
        </div>
      </div>

      {/* Installments */}
      <div>
        <Label className="text-xs">Parcelamento</Label>
        <Select value={form.installments.toString()} onValueChange={(v) => setInstallments(parseInt(v))}>
          <SelectTrigger className="mt-1 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {installmentOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value.toString()}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Interest info */}
      {interestRates && selectedOption.interestRate !== undefined && selectedOption.interestRate > 0 && (
        <div className="p-2.5 bg-warning/10 border border-warning/30 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-3.5 w-3.5 text-warning flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-warning">
            Juros de {((selectedOption.interestRate) * 100).toFixed(2)}% incluídos — Total: {fmt(totalWithInterest)}
          </p>
        </div>
      )}
      {interestRates && form.installments === 1 && (
        <div className="p-2.5 bg-success/10 border border-success/30 rounded-lg flex items-start gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-success flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-success">1x sem juros! Mesmo valor do PIX.</p>
        </div>
      )}

      {/* Submit button (Bravenza self-contained mode) */}
      {onSubmit && (
        <>
          {/* Total display */}
          <div className="p-3 bg-secondary/50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total a pagar:</span>
              <span className="text-lg font-bold text-primary">{fmt(totalWithInterest)}</span>
            </div>
            {form.installments > 1 && (
              <p className="text-xs text-muted-foreground mt-1">
                {form.installments}x de {fmt(totalWithInterest / form.installments)}
              </p>
            )}
          </div>

          {submitStatus === "error" && (
            <div className="p-2.5 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-destructive">{submitError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-lg font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            {isSubmitting ? "Processando..." : (submitLabel || `Pagar ${fmt(totalWithInterest)}`)}
          </button>
        </>
      )}

      {/* Trust badge */}
      <div className="flex items-center justify-center gap-2 py-1 text-[11px] text-muted-foreground">
        <ShieldCheck className="h-3 w-3 text-primary" />
        Processado por Mercado Pago · Seus dados não ficam conosco
      </div>
    </form>
  );
}

/** Tokenize card data using MercadoPago SDK */
export async function tokenizeCard(cardData: UnifiedCardFormData): Promise<string> {
  if (!window.MercadoPago) throw new Error("SDK de pagamento não carregado");
  const mp = new window.MercadoPago(MP_PUBLIC_KEY, { locale: "pt-BR" });
  const result = await mp.createCardToken({
    cardNumber: cardData.cardNumber.replace(/\s/g, ""),
    cardholderName: cardData.cardholderName,
    cardExpirationMonth: cardData.expirationMonth,
    cardExpirationYear: `20${cardData.expirationYear}`,
    securityCode: cardData.securityCode,
    identificationType: "CPF",
    identificationNumber: cardData.identificationNumber.replace(/\D/g, ""),
  });
  if (result.error) throw new Error(result.error.message || "Erro ao tokenizar cartão");
  return result.id;
}
