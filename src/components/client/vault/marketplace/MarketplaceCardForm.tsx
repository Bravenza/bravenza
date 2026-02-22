import { useState, useEffect, useCallback } from "react";
import { Loader2, Lock, ShieldCheck, AlertCircle, CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const MP_PUBLIC_KEY = "APP_USR-7e93dfe2-f5cd-4acc-a5a9-8ccc1ad0cdb9";

declare global {
  interface Window {
    MercadoPago: any;
  }
}

export interface CardFormData {
  cardNumber: string;
  cardholderName: string;
  expirationMonth: string;
  expirationYear: string;
  securityCode: string;
  identificationNumber: string;
  email: string;
  installments: number;
}

interface MarketplaceCardFormProps {
  totalAmount: number;
  buyerEmail?: string;
  onDataChange: (data: CardFormData, isValid: boolean) => void;
}

const formatCardNumber = (value: string) => {
  const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "").slice(0, 16);
  const parts = [];
  for (let i = 0; i < v.length; i += 4) {
    parts.push(v.substring(i, i + 4));
  }
  return parts.join(" ");
};

const detectCardBrand = (number: string): { key: string; label: string } => {
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

export function MarketplaceCardForm({ totalAmount, buyerEmail, onDataChange }: MarketplaceCardFormProps) {
  const [form, setForm] = useState<CardFormData>({
    cardNumber: "",
    cardholderName: "",
    expirationMonth: "",
    expirationYear: "",
    securityCode: "",
    identificationNumber: "",
    email: buyerEmail || "",
    installments: 1,
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [cardBrand, setCardBrand] = useState<{ key: string; label: string }>({ key: "", label: "" });
  const [mpReady, setMpReady] = useState(false);

  // Load MP SDK
  useEffect(() => {
    if (window.MercadoPago) { setMpReady(true); return; }
    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    script.onload = () => setMpReady(true);
    document.body.appendChild(script);
  }, []);

  const validate = useCallback((data: CardFormData) => {
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

  const update = (field: keyof CardFormData, value: string) => {
    let processed = value;
    if (field === "cardNumber") {
      processed = formatCardNumber(value);
      setCardBrand(detectCardBrand(processed));
    }
    if (field === "identificationNumber") processed = formatCpf(value);
    if (field === "expirationMonth" || field === "expirationYear" || field === "securityCode") {
      processed = value.replace(/\D/g, "");
    }
    if (field === "cardholderName") processed = value.toUpperCase();

    const next = { ...form, [field]: processed };
    setForm(next);
    const errs = validate(next);
    onDataChange(next, Object.keys(errs).length === 0);
  };

  const markTouched = (field: string) => setTouched(prev => ({ ...prev, [field]: true }));

  const setInstallments = (v: number) => {
    const next = { ...form, installments: v };
    setForm(next);
    const errs = validate(next);
    onDataChange(next, Object.keys(errs).length === 0);
  };

  // Installment options
  const installmentOptions = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    const val = totalAmount / n;
    return {
      value: n,
      label: n === 1
        ? `1x de R$ ${totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (sem juros)`
        : `${n}x de R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    };
  });

  const fieldError = (field: string) => touched[field] && errors[field] ? errors[field] : null;

  if (!mpReady) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="ml-2 text-xs text-muted-foreground">Carregando pagamento seguro...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          Pagamento 100% seguro
        </div>
        {cardBrand.label && (
          <Badge variant="outline" className="text-[10px] gap-1 px-2 py-0.5 font-semibold">
            <CreditCard className="h-2.5 w-2.5" />
            {cardBrand.label}
          </Badge>
        )}
      </div>

      {/* Card number */}
      <div>
        <Label className="text-xs" htmlFor="mk-cardNumber">Número do cartão *</Label>
        <Input
          id="mk-cardNumber"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="0000 0000 0000 0000"
          value={form.cardNumber}
          onChange={(e) => update("cardNumber", e.target.value)}
          onBlur={() => markTouched("cardNumber")}
          maxLength={19}
          className={`mt-1 text-sm ${fieldError("cardNumber") ? "border-destructive" : ""}`}
        />
        {fieldError("cardNumber") && <p className="text-[11px] text-destructive mt-0.5">{fieldError("cardNumber")}</p>}
      </div>

      {/* Name */}
      <div>
        <Label className="text-xs" htmlFor="mk-cardholderName">Nome no cartão *</Label>
        <Input
          id="mk-cardholderName"
          autoComplete="cc-name"
          placeholder="NOME COMO NO CARTÃO"
          value={form.cardholderName}
          onChange={(e) => update("cardholderName", e.target.value)}
          onBlur={() => markTouched("cardholderName")}
          className={`mt-1 text-sm ${fieldError("cardholderName") ? "border-destructive" : ""}`}
        />
        {fieldError("cardholderName") && <p className="text-[11px] text-destructive mt-0.5">{fieldError("cardholderName")}</p>}
      </div>

      {/* Expiry + CVV */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-xs" htmlFor="mk-expMonth">Mês *</Label>
          <Input
            id="mk-expMonth"
            inputMode="numeric"
            autoComplete="cc-exp-month"
            placeholder="MM"
            value={form.expirationMonth}
            onChange={(e) => update("expirationMonth", e.target.value)}
            onBlur={() => markTouched("expirationMonth")}
            maxLength={2}
            className={`mt-1 text-sm ${fieldError("expirationMonth") ? "border-destructive" : ""}`}
          />
          {fieldError("expirationMonth") && <p className="text-[11px] text-destructive mt-0.5">{fieldError("expirationMonth")}</p>}
        </div>
        <div>
          <Label className="text-xs" htmlFor="mk-expYear">Ano *</Label>
          <Input
            id="mk-expYear"
            inputMode="numeric"
            autoComplete="cc-exp-year"
            placeholder="AA"
            value={form.expirationYear}
            onChange={(e) => update("expirationYear", e.target.value)}
            onBlur={() => markTouched("expirationYear")}
            maxLength={2}
            className={`mt-1 text-sm ${fieldError("expirationYear") ? "border-destructive" : ""}`}
          />
          {fieldError("expirationYear") && <p className="text-[11px] text-destructive mt-0.5">{fieldError("expirationYear")}</p>}
        </div>
        <div>
          <Label className="text-xs" htmlFor="mk-cvv">CVV *</Label>
          <Input
            id="mk-cvv"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="123"
            value={form.securityCode}
            onChange={(e) => update("securityCode", e.target.value)}
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
          <Label className="text-xs" htmlFor="mk-cpf">CPF do titular *</Label>
          <Input
            id="mk-cpf"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={form.identificationNumber}
            onChange={(e) => update("identificationNumber", e.target.value)}
            onBlur={() => markTouched("identificationNumber")}
            maxLength={14}
            className={`mt-1 text-sm ${fieldError("identificationNumber") ? "border-destructive" : ""}`}
          />
          {fieldError("identificationNumber") && <p className="text-[11px] text-destructive mt-0.5">{fieldError("identificationNumber")}</p>}
        </div>
        <div>
          <Label className="text-xs" htmlFor="mk-email">E-mail *</Label>
          <Input
            id="mk-email"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
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

      {/* Trust badge */}
      <div className="flex items-center justify-center gap-2 py-1 text-[11px] text-muted-foreground">
        <ShieldCheck className="h-3 w-3 text-primary" />
        Processado por Mercado Pago · Seus dados não ficam conosco
      </div>
    </div>
  );
}

/** Tokenize card data using MercadoPago SDK */
export async function tokenizeCard(cardData: CardFormData): Promise<string> {
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
