import { useState, useEffect, useCallback } from "react";
import { Loader2, CreditCard, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
  const parts = [];
  for (let i = 0; i < v.length && i < 16; i += 4) {
    parts.push(v.substring(i, i + 4));
  }
  return parts.join(" ");
};

const detectCardBrand = (number: string) => {
  const n = number.replace(/\s/g, "");
  if (n.startsWith("4")) return "visa";
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "master";
  if (/^3[47]/.test(n)) return "amex";
  if (/^636368/.test(n)) return "elo";
  if (/^606282/.test(n)) return "hipercard";
  return "";
};

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cardBrand, setCardBrand] = useState("");
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
    if (data.cardNumber.replace(/\s/g, "").length < 13) e.cardNumber = "Inválido";
    if (data.cardholderName.length < 3) e.cardholderName = "Inválido";
    if (!data.expirationMonth || +data.expirationMonth < 1 || +data.expirationMonth > 12) e.expirationMonth = "Inválido";
    const curYear = new Date().getFullYear() % 100;
    if (!data.expirationYear || +data.expirationYear < curYear) e.expirationYear = "Inválido";
    if (data.securityCode.length < 3) e.securityCode = "Inválido";
    if (data.identificationNumber.replace(/\D/g, "").length !== 11) e.identificationNumber = "Inválido";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = "Inválido";
    return e;
  }, []);

  const update = (field: keyof CardFormData, value: string) => {
    let processed = value;
    if (field === "cardNumber") {
      processed = formatCardNumber(value);
      setCardBrand(detectCardBrand(processed));
    }
    if (field === "identificationNumber") {
      processed = value.replace(/\D/g, "")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})/, "$1-$2")
        .replace(/(-\d{2})\d+?$/, "$1");
    }
    if (field === "expirationMonth" || field === "expirationYear" || field === "securityCode") {
      processed = value.replace(/\D/g, "");
    }

    const next = { ...form, [field]: processed };
    setForm(next);
    setErrors(prev => ({ ...prev, [field]: undefined }));
    const errs = validate(next);
    onDataChange(next, Object.keys(errs).length === 0);
  };

  const setInstallments = (v: number) => {
    const next = { ...form, installments: v };
    setForm(next);
    const errs = validate(next);
    onDataChange(next, Object.keys(errs).length === 0);
  };

  // Installment options (marketplace: no interest markup, simple division)
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

  if (!mpReady) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="ml-2 text-xs text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" />
        Pagamento seguro via MercadoPago
      </div>

      {/* Card number */}
      <div>
        <Label className="text-xs">Número do cartão *</Label>
        <div className="relative">
          <Input
            inputMode="numeric"
            placeholder="0000 0000 0000 0000"
            value={form.cardNumber}
            onChange={(e) => update("cardNumber", e.target.value)}
            maxLength={19}
            className="mt-1 text-sm"
          />
          {cardBrand && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase font-medium text-muted-foreground">
              {cardBrand}
            </span>
          )}
        </div>
      </div>

      {/* Name */}
      <div>
        <Label className="text-xs">Nome no cartão *</Label>
        <Input
          placeholder="NOME COMO NO CARTÃO"
          value={form.cardholderName}
          onChange={(e) => update("cardholderName", e.target.value.toUpperCase())}
          className="mt-1 text-sm"
        />
      </div>

      {/* Expiry + CVV */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-xs">Mês *</Label>
          <Input inputMode="numeric" placeholder="MM" value={form.expirationMonth} onChange={(e) => update("expirationMonth", e.target.value)} maxLength={2} className="mt-1 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Ano *</Label>
          <Input inputMode="numeric" placeholder="AA" value={form.expirationYear} onChange={(e) => update("expirationYear", e.target.value)} maxLength={2} className="mt-1 text-sm" />
        </div>
        <div>
          <Label className="text-xs">CVV *</Label>
          <Input inputMode="numeric" placeholder="123" value={form.securityCode} onChange={(e) => update("securityCode", e.target.value)} maxLength={4} className="mt-1 text-sm" />
        </div>
      </div>

      {/* CPF + Email */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">CPF do titular *</Label>
          <Input inputMode="numeric" placeholder="000.000.000-00" value={form.identificationNumber} onChange={(e) => update("identificationNumber", e.target.value)} maxLength={14} className="mt-1 text-sm" />
        </div>
        <div>
          <Label className="text-xs">E-mail *</Label>
          <Input type="email" placeholder="seu@email.com" value={form.email} onChange={(e) => update("email", e.target.value)} className="mt-1 text-sm" />
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
