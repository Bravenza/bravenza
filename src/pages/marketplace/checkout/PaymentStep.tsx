import { ArrowLeft, CreditCard, MapPin, Clock, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { cn } from "@/lib/utils";
import { UnifiedCardForm, type UnifiedCardFormData } from "@/components/payment/UnifiedCardForm";
import { MERCADO_PAGO_RATES } from "@/lib/budget-calculator";
import { fmt, type CheckoutFormData, type FreightOption } from "./types";

interface PaymentStepProps {
  form: CheckoutFormData;
  baseTotalPrice: number;
  displayTotalPrice: number;
  effectiveInterestFreeMax: number;
  selectedFreight: FreightOption | null;
  isSubmitting: boolean;
  isCardValid: boolean;
  onUpdateField: (field: string, value: string) => void;
  onCardDataChange: (data: UnifiedCardFormData | null, valid: boolean) => void;
  buildAddressString: () => string;
  onBack: () => void;
  onSubmit: () => void;
}

export function PaymentStep({
  form, baseTotalPrice, displayTotalPrice, effectiveInterestFreeMax,
  selectedFreight, isSubmitting, isCardValid,
  onUpdateField, onCardDataChange, buildAddressString, onBack, onSubmit,
}: PaymentStepProps) {
  return (
    <div className="bg-background rounded-2xl border border-border/20 p-5 space-y-5">
      <div className="flex items-center gap-2.5">
        <CreditCard className="h-5 w-5 text-primary" />
        <h2 className="font-bold text-base">Forma de pagamento</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { value: "pix", label: "PIX", desc: "Aprovação instantânea", icon: "💚" },
          { value: "card", label: "Cartão", desc: effectiveInterestFreeMax > 0 ? `Até ${effectiveInterestFreeMax}x sem juros` : "Até 12x com juros", icon: "💳" },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => onUpdateField("payment_method", opt.value)}
            className={cn(
              "p-4 rounded-xl border text-left transition-all",
              form.payment_method === opt.value
                ? "border-primary bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.3)]"
                : "border-border/30 hover:border-primary/30"
            )}
          >
            <span className="text-xl">{opt.icon}</span>
            <p className="font-semibold text-sm mt-1.5">{opt.label}</p>
            <p className="text-[11px] text-muted-foreground">{opt.desc}</p>
          </button>
        ))}
      </div>

      {form.payment_method === "card" && (
        <UnifiedCardForm
          amount={baseTotalPrice}
          email={form.buyer_email}
          interestRates={MERCADO_PAGO_RATES}
          interestFreeMax={effectiveInterestFreeMax}
          compact
          onDataChange={(data, valid) => onCardDataChange(data, valid)}
        />
      )}

      <div className="p-3.5 bg-secondary/30 rounded-xl text-xs space-y-1.5 border border-border/10">
        <p className="font-medium text-foreground text-sm mb-1.5 flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-primary" /> Entrega
        </p>
        <p className="text-muted-foreground">{buildAddressString()}</p>
        {selectedFreight && (
          <p className="text-muted-foreground flex items-center gap-1 mt-1">
            <Clock className="h-3 w-3" />
            Frete: R$ {fmt(parseFloat(selectedFreight.price))} · {selectedFreight.name || selectedFreight.company?.name}
          </p>
        )}
      </div>

      <div className="p-3.5 bg-primary/5 border border-primary/15 rounded-xl text-xs text-muted-foreground space-y-1">
        <p>🔒 <strong>Compra protegida:</strong> 7 dias úteis para reportar problemas após a entrega.</p>
        <p>📦 O vendedor recebe após o período de proteção.</p>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack} className="gap-1.5 rounded-xl">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <LoadingButton
          loading={isSubmitting}
          onClick={onSubmit}
          disabled={isSubmitting || (form.payment_method === "card" && !isCardValid)}
          className="flex-1 btn-gold gap-2 h-12 text-sm font-bold rounded-xl"
          size="lg"
          loadingText="Processando..."
        >
          <Lock className="h-4 w-4" />
          {`Pagar — R$ ${fmt(displayTotalPrice)}`}
        </LoadingButton>
      </div>
    </div>
  );
}
