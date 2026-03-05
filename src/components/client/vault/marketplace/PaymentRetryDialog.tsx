import { useState } from "react";
import { CreditCard, QrCode, Loader2, Copy, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UnifiedCardForm, tokenizeCard, type UnifiedCardFormData } from "@/components/payment/UnifiedCardForm";
import type { MarketplaceOrder } from "@/hooks/marketplace/types";

interface PaymentRetryDialogProps {
  order: MarketplaceOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  /** If true, forces switching to alternative payment method */
  switchMethod?: boolean;
}

export function PaymentRetryDialog({ order, open, onOpenChange, onSuccess, switchMethod }: PaymentRetryDialogProps) {
  const currentMethod = order?.payment_method || "pix";
  const defaultMethod = switchMethod
    ? (currentMethod === "pix" ? "card" : "pix")
    : currentMethod;

  const [method, setMethod] = useState<"pix" | "card">(defaultMethod as "pix" | "card");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cardFormData, setCardFormData] = useState<UnifiedCardFormData | null>(null);
  const [isCardValid, setIsCardValid] = useState(false);
  const [result, setResult] = useState<{
    status: string;
    pix_qr_code?: string;
    pix_copy_paste?: string;
    error?: string;
  } | null>(null);
  const [pixCopied, setPixCopied] = useState(false);

  // Reset state when dialog opens
  const handleOpenChange = (o: boolean) => {
    if (o && order) {
      const dm = switchMethod
        ? (order.payment_method === "pix" ? "card" : "pix")
        : (order.payment_method || "pix");
      setMethod(dm as "pix" | "card");
      setResult(null);
      setCardFormData(null);
      setIsCardValid(false);
    }
    onOpenChange(o);
  };

  const handleSubmit = async () => {
    if (!order) return;
    setIsSubmitting(true);
    setResult(null);

    try {
      const checkoutBody: Record<string, any> = {
        order_id: order.id,
        payment_method: method,
        payer_email: "cliente@bravenza.com",
        idempotency_key: `retry-${order.id}-${method}`,
      };

      if (method === "card" && cardFormData) {
        try {
          const cardToken = await tokenizeCard(cardFormData);
          checkoutBody.card_token = cardToken;
          checkoutBody.installments = cardFormData.installments;
          checkoutBody.payer_email = cardFormData.email || "cliente@bravenza.com";
          checkoutBody.payer_identification = {
            type: "CPF",
            number: cardFormData.identificationNumber.replace(/\D/g, ""),
          };
        } catch (tokenErr) {
          setResult({ status: "error", error: tokenErr instanceof Error ? tokenErr.message : "Erro ao processar cartão" });
          setIsSubmitting(false);
          return;
        }
      }

      const { marketplaceRequest } = await import("@/hooks/marketplace/api");
      const payData = await marketplaceRequest("", "checkout", "POST", checkoutBody);
      setResult(payData);
      if (method === "card" && payData.status === "approved") {
        setTimeout(() => {
          onOpenChange(false);
          onSuccess();
        }, 2500);
      }
    } catch (err) {
      setResult({ status: "error", error: err instanceof Error ? err.message : "Erro inesperado" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPix = () => {
    if (result?.pix_copy_paste) {
      navigator.clipboard.writeText(result.pix_copy_paste);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 3000);
    }
  };

  if (!order) return null;

  const totalAmount = (order.sale_price || 0) + (order.shipping_cost || 0);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {switchMethod ? "Mudar forma de pagamento" : "Pagar agora"}
          </DialogTitle>
        </DialogHeader>

        {/* Order summary */}
        <div className="p-3 bg-muted/30 rounded-lg border border-border/30">
          <div className="flex gap-3">
            {order.listing?.photos?.[0] && (
              <img src={order.listing.photos[0]} alt={order.listing.title} className="w-12 h-12 rounded-lg object-cover" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm line-clamp-1">{order.listing?.title || `Pedido ${order.order_code}`}</p>
              <p className="text-xs text-muted-foreground">{order.order_code}</p>
            </div>
            <p className="font-bold text-sm text-primary">
              R$ {totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Payment result */}
        {result?.status === "error" && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-sm text-destructive">{result.error}</p>
          </div>
        )}

        {result?.status === "approved" && (
          <div className="p-4 text-center space-y-2">
            <CheckCircle2 className="h-12 w-12 mx-auto text-success" />
            <p className="font-bold text-lg">Pagamento aprovado!</p>
            <p className="text-sm text-muted-foreground">Seu pedido está sendo processado.</p>
          </div>
        )}

        {result?.pix_qr_code && result.status !== "error" && (
          <div className="space-y-3 text-center">
            <p className="text-sm font-medium">Escaneie o QR Code para pagar:</p>
            <img
              src={`data:image/png;base64,${result.pix_qr_code}`}
              alt="QR Code PIX"
              className="mx-auto w-48 h-48 rounded-lg border"
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleCopyPix}
            >
              {pixCopied ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              {pixCopied ? "Copiado!" : "Copiar código PIX"}
            </Button>
          </div>
        )}

        {/* Payment form (only when no success result) */}
        {!result?.pix_qr_code && result?.status !== "approved" && (
          <div className="space-y-4">
            {/* Method selector */}
            {switchMethod && (
              <div className="flex gap-2">
                <Button
                  variant={method === "pix" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={() => setMethod("pix")}
                  disabled={currentMethod === "pix"}
                >
                  <QrCode className="h-4 w-4" />
                  PIX
                  {currentMethod === "pix" && <Badge variant="outline" className="text-[9px] ml-1">já tentado</Badge>}
                </Button>
                <Button
                  variant={method === "card" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={() => setMethod("card")}
                  disabled={currentMethod === "card" && !switchMethod}
                >
                  <CreditCard className="h-4 w-4" />
                  Cartão
                  {currentMethod === "card" && <Badge variant="outline" className="text-[9px] ml-1">já tentado</Badge>}
                </Button>
              </div>
            )}

            {/* For card that failed - allow retry with another card */}
            {!switchMethod && currentMethod === "card" && (
              <p className="text-sm text-muted-foreground text-center">
                Tente novamente com outro cartão
              </p>
            )}

            {method === "pix" ? (
              <div className="text-center space-y-3">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <QrCode className="h-8 w-8 mx-auto text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Um novo QR Code PIX será gerado para pagamento imediato.
                  </p>
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full btn-gold gap-2"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                  Gerar PIX
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <UnifiedCardForm
                  amount={totalAmount}
                  compact
                  onDataChange={(data, valid) => {
                    setCardFormData(data);
                    setIsCardValid(valid);
                  }}
                />
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !isCardValid}
                  className="w-full btn-gold gap-2"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  Pagar com cartão
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
