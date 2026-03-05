import { useState, useEffect, useCallback } from "react";
import { Loader2, CreditCard, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/constants";
import { 
  calculateCardTotal, 
  calculateInstallmentValue,
  MERCADO_PAGO_RATES 
} from "@/lib/budget-calculator";

// MercadoPago Public Key - this is safe to expose
const MP_PUBLIC_KEY = "APP_USR-7e93dfe2-f5cd-4acc-a5a9-8ccc1ad0cdb9";

interface CardPaymentFormProps {
  token: string;
  orderId: string;
  productName: string;
  amount: number;
  paymentType: "sinal" | "balance" | "full";
  onSuccess: () => void;
  onError: (error: string) => void;
}

interface CardFormData {
  cardNumber: string;
  cardholderName: string;
  expirationMonth: string;
  expirationYear: string;
  securityCode: string;
  identificationType: string;
  identificationNumber: string;
  email: string;
}

declare global {
  interface Window {
    MercadoPago: any;
  }
}

export function CardPaymentForm({
  token,
  orderId,
  productName,
  amount,
  paymentType,
  onSuccess,
  onError,
}: CardPaymentFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isMPReady, setIsMPReady] = useState(false);
  const [mp, setMp] = useState<any>(null);
  const [installments, setInstallments] = useState<number>(1);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  
  const [formData, setFormData] = useState<CardFormData>({
    cardNumber: "",
    cardholderName: "",
    expirationMonth: "",
    expirationYear: "",
    securityCode: "",
    identificationType: "CPF",
    identificationNumber: "",
    email: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CardFormData, string>>>({});
  const [cardBrand, setCardBrand] = useState<string>("");

  // Load MercadoPago SDK
  useEffect(() => {
    const loadMercadoPago = async () => {
      if (window.MercadoPago) {
        const mpInstance = new window.MercadoPago(MP_PUBLIC_KEY, { locale: "pt-BR" });
        setMp(mpInstance);
        setIsMPReady(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://sdk.mercadopago.com/js/v2";
      script.async = true;
      script.onload = () => {
        const mpInstance = new window.MercadoPago(MP_PUBLIC_KEY, { locale: "pt-BR" });
        setMp(mpInstance);
        setIsMPReady(true);
      };
      script.onerror = () => {
        onError("Erro ao carregar o SDK de pagamento");
      };
      document.body.appendChild(script);
    };

    loadMercadoPago();
  }, [onError]);

  // Detect card brand from number
  const detectCardBrand = useCallback((number: string) => {
    const cleanNumber = number.replace(/\s/g, "");
    if (cleanNumber.startsWith("4")) return "visa";
    if (/^5[1-5]/.test(cleanNumber) || /^2[2-7]/.test(cleanNumber)) return "mastercard";
    if (/^3[47]/.test(cleanNumber)) return "amex";
    if (/^6(?:011|5)/.test(cleanNumber)) return "discover";
    if (/^(?:2131|1800|35)/.test(cleanNumber)) return "jcb";
    if (/^3(?:0[0-5]|[68])/.test(cleanNumber)) return "diners";
    if (/^(?:5[0678]|6304|6390|67)/.test(cleanNumber)) return "maestro";
    if (/^636368/.test(cleanNumber)) return "elo";
    if (/^50/.test(cleanNumber)) return "aura";
    if (/^606282/.test(cleanNumber)) return "hipercard";
    return "";
  }, []);

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof CardFormData, value: string) => {
    let processedValue = value;

    if (field === "cardNumber") {
      processedValue = formatCardNumber(value);
      const brand = detectCardBrand(processedValue);
      setCardBrand(brand);
    }

    if (field === "identificationNumber") {
      // Format CPF: 000.000.000-00
      processedValue = value
        .replace(/\D/g, "")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})/, "$1-$2")
        .replace(/(-\d{2})\d+?$/, "$1");
    }

    if (field === "expirationMonth" || field === "expirationYear") {
      processedValue = value.replace(/\D/g, "");
    }

    setFormData((prev) => ({ ...prev, [field]: processedValue }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CardFormData, string>> = {};

    if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, "").length < 13) {
      newErrors.cardNumber = "Número do cartão inválido";
    }

    if (!formData.cardholderName || formData.cardholderName.length < 3) {
      newErrors.cardholderName = "Nome do titular inválido";
    }

    if (!formData.expirationMonth || parseInt(formData.expirationMonth) < 1 || parseInt(formData.expirationMonth) > 12) {
      newErrors.expirationMonth = "Mês inválido";
    }

    const currentYear = new Date().getFullYear() % 100;
    if (!formData.expirationYear || parseInt(formData.expirationYear) < currentYear) {
      newErrors.expirationYear = "Ano inválido";
    }

    if (!formData.securityCode || formData.securityCode.length < 3) {
      newErrors.securityCode = "CVV inválido";
    }

    if (!formData.identificationNumber || formData.identificationNumber.replace(/\D/g, "").length !== 11) {
      newErrors.identificationNumber = "CPF inválido";
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculate total with interest
  const totalWithInterest = calculateCardTotal(amount, installments);
  const installmentValue = calculateInstallmentValue(totalWithInterest, installments);
  const interestRate = MERCADO_PAGO_RATES[installments] || 0;

  // Generate installment options
  const installmentOptions = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    const total = calculateCardTotal(amount, n);
    const value = calculateInstallmentValue(total, n);
    const rate = MERCADO_PAGO_RATES[n] || 0;
    return {
      value: n,
      label: n === 1
        ? `1x de ${formatCurrency(total)} (sem juros)`
        : `${n}x de ${formatCurrency(value)} (Total: ${formatCurrency(total)})`,
      isInterestFree: n === 1,
    };
  });

  // Process payment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !mp) return;

    setIsLoading(true);
    setPaymentStatus("processing");

    try {
      // Create card token using MercadoPago SDK
      const cardTokenResponse = await mp.createCardToken({
        cardNumber: formData.cardNumber.replace(/\s/g, ""),
        cardholderName: formData.cardholderName,
        cardExpirationMonth: formData.expirationMonth,
        cardExpirationYear: `20${formData.expirationYear}`,
        securityCode: formData.securityCode,
        identificationType: formData.identificationType,
        identificationNumber: formData.identificationNumber.replace(/\D/g, ""),
      });

      if (cardTokenResponse.error) {
        throw new Error(cardTokenResponse.error.message || "Erro ao tokenizar cartão");
      }

      // Send to our edge function to process payment
      const { data, error } = await supabase.functions.invoke("process-card-payment", {
        body: {
          token,
          card_token: cardTokenResponse.id,
          payment_type: paymentType,
          amount: totalWithInterest, // Amount with interest
          order_id: orderId,
          product_name: productName,
          installments,
          payer_email: formData.email,
          payer_identification: {
            type: formData.identificationType,
            number: formData.identificationNumber.replace(/\D/g, ""),
          },
        },
      });

      if (error) throw error;

      if (data.status === "approved") {
        setPaymentStatus("success");
        toast({
          title: "Pagamento aprovado!",
          description: "Seu pagamento foi processado com sucesso.",
        });
        setTimeout(() => onSuccess(), 2000);
      } else if (data.status === "pending" || data.status === "in_process") {
        setPaymentStatus("success");
        toast({
          title: "Pagamento em processamento",
          description: "Seu pagamento está sendo analisado e será confirmado em breve.",
        });
        setTimeout(() => onSuccess(), 2000);
      } else {
        throw new Error(data.status_detail || "Pagamento não aprovado");
      }
    } catch (error) {
      console.error("Payment error:", error);
      setPaymentStatus("error");
      
      // Map common error messages
      let errorMessage = error instanceof Error ? error.message : "Erro ao processar pagamento";
      if (errorMessage.includes("cc_rejected")) {
        errorMessage = "Cartão recusado. Verifique os dados ou tente outro cartão.";
      } else if (errorMessage.includes("insufficient_amount")) {
        errorMessage = "Saldo insuficiente no cartão.";
      } else if (errorMessage.includes("invalid_security_code")) {
        errorMessage = "Código de segurança inválido.";
      }
      
      toast({
        title: "Erro no pagamento",
        description: errorMessage,
        variant: "destructive",
      });
      onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMPReady) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  if (paymentStatus === "success") {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Pagamento Confirmado!</h3>
        <p className="text-muted-foreground">Redirecionando...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Card Number */}
      <div className="space-y-2">
        <Label htmlFor="cardNumber">Número do Cartão</Label>
        <div className="relative">
          <Input
            id="cardNumber"
            type="text"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="0000 0000 0000 0000"
            value={formData.cardNumber}
            onChange={(e) => handleInputChange("cardNumber", e.target.value)}
            maxLength={19}
            className={errors.cardNumber ? "border-destructive" : ""}
          />
          {cardBrand && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <span className="text-xs uppercase font-medium text-muted-foreground">
                {cardBrand}
              </span>
            </div>
          )}
        </div>
        {errors.cardNumber && (
          <p className="text-xs text-destructive">{errors.cardNumber}</p>
        )}
      </div>

      {/* Cardholder Name */}
      <div className="space-y-2">
        <Label htmlFor="cardholderName">Nome no Cartão</Label>
        <Input
          id="cardholderName"
          type="text"
          autoComplete="cc-name"
          placeholder="NOME COMO NO CARTÃO"
          value={formData.cardholderName}
          onChange={(e) => handleInputChange("cardholderName", e.target.value.toUpperCase())}
          className={errors.cardholderName ? "border-destructive" : ""}
        />
        {errors.cardholderName && (
          <p className="text-xs text-destructive">{errors.cardholderName}</p>
        )}
      </div>

      {/* Expiration and CVV */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="expirationMonth">Mês</Label>
          <Input
            id="expirationMonth"
            type="text"
            inputMode="numeric"
            placeholder="MM"
            value={formData.expirationMonth}
            onChange={(e) => handleInputChange("expirationMonth", e.target.value)}
            maxLength={2}
            className={errors.expirationMonth ? "border-destructive" : ""}
          />
          {errors.expirationMonth && (
            <p className="text-xs text-destructive">{errors.expirationMonth}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="expirationYear">Ano</Label>
          <Input
            id="expirationYear"
            type="text"
            inputMode="numeric"
            placeholder="AA"
            value={formData.expirationYear}
            onChange={(e) => handleInputChange("expirationYear", e.target.value)}
            maxLength={2}
            className={errors.expirationYear ? "border-destructive" : ""}
          />
          {errors.expirationYear && (
            <p className="text-xs text-destructive">{errors.expirationYear}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="securityCode">CVV</Label>
          <Input
            id="securityCode"
            type="text"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="123"
            value={formData.securityCode}
            onChange={(e) => handleInputChange("securityCode", e.target.value.replace(/\D/g, ""))}
            maxLength={4}
            className={errors.securityCode ? "border-destructive" : ""}
          />
          {errors.securityCode && (
            <p className="text-xs text-destructive">{errors.securityCode}</p>
          )}
        </div>
      </div>

      {/* CPF */}
      <div className="space-y-2">
        <Label htmlFor="identificationNumber">CPF do Titular</Label>
        <Input
          id="identificationNumber"
          type="text"
          inputMode="numeric"
          placeholder="000.000.000-00"
          value={formData.identificationNumber}
          onChange={(e) => handleInputChange("identificationNumber", e.target.value)}
          maxLength={14}
          className={errors.identificationNumber ? "border-destructive" : ""}
        />
        {errors.identificationNumber && (
          <p className="text-xs text-destructive">{errors.identificationNumber}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="seu@email.com"
          value={formData.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          className={errors.email ? "border-destructive" : ""}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email}</p>
        )}
      </div>

      {/* Installments */}
      <div className="space-y-2">
        <Label>Parcelamento</Label>
        <Select
          value={installments.toString()}
          onValueChange={(value) => setInstallments(parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o parcelamento" />
          </SelectTrigger>
          <SelectContent>
            {installmentOptions.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {interestRate > 0 && (
          <p className="text-xs text-muted-foreground">
            * Juros de {(interestRate * 100).toFixed(2)}% incluídos no valor total
          </p>
        )}
      </div>

      {/* Total */}
      <div className="p-4 bg-secondary/50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Total a pagar:</span>
          <span className="text-xl font-bold text-primary">
            {formatCurrency(totalWithInterest)}
          </span>
        </div>
        {installments > 1 && (
          <p className="text-sm text-muted-foreground mt-1">
            {installments}x de {formatCurrency(installmentValue)}
          </p>
        )}
      </div>

      {/* Interest warning or interest-free info */}
      {interestRate > 0 ? (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-500">
            O parcelamento possui juros da operadora de pagamento.
          </p>
        </div>
      ) : installments === 1 ? (
        <div className="p-3 bg-success/10 border border-success/30 rounded-lg flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
          <p className="text-sm text-success">
            1x sem juros! Mesmo valor do pagamento via PIX.
          </p>
        </div>
      ) : null}

      {/* Submit button */}
      <Button
        type="submit"
        className="w-full btn-gold"
        disabled={isLoading || paymentStatus === "processing"}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            <Lock className="mr-2 h-4 w-4" />
            Pagar {formatCurrency(totalWithInterest)}
          </>
        )}
      </Button>

      {/* Security badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" />
        <span>Pagamento seguro processado por Mercado Pago</span>
      </div>
    </form>
  );
}
