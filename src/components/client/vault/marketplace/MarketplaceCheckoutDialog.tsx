import { useState, useEffect, useCallback, useRef } from "react";
import { ShoppingCart, ShieldCheck, Truck, CreditCard, Loader2, MapPin, Package, ChevronRight, ArrowLeft, Clock, AlertCircle, Copy, CheckCircle2 } from "lucide-react";
import { UnifiedCardForm, tokenizeCard, type UnifiedCardFormData } from "@/components/payment/UnifiedCardForm";
import { MERCADO_PAGO_RATES } from "@/lib/budget-calculator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { MobileSelect } from "@/components/ui/mobile-select";
import { cn } from "@/lib/utils";
import type { MarketplaceListing } from "@/hooks/useMarketplace";

const BR_STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const formatCep = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return digits;
};

interface FreightOption {
  id: number;
  name: string;
  price: string;
  delivery_time: number;
  company?: { name: string; picture?: string };
  legs?: {
    seller_to_bravenza?: { price: string; delivery_time: number };
    bravenza_processing?: { delivery_time: number };
    bravenza_to_buyer?: { price: string; delivery_time: number };
  };
}

interface MarketplaceCheckoutDialogProps {
  listing: MarketplaceListing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: {
    listing_id: string;
    buyer_name: string;
    buyer_email: string;
    buyer_phone: string;
    buyer_address: string;
    payment_method: string;
    shipping_cost?: number;
    shipping_service?: string;
  }) => Promise<any>;
  buyerDefaults?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

type Step = "modality" | "address" | "freight" | "payment" | "processing";

export function MarketplaceCheckoutDialog({
  listing,
  open,
  onOpenChange,
  onConfirm,
  buyerDefaults,
}: MarketplaceCheckoutDialogProps) {
  const [step, setStep] = useState<Step>("modality");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isLoadingFreight, setIsLoadingFreight] = useState(false);
  const [freightOptions, setFreightOptions] = useState<FreightOption[]>([]);
  const [selectedFreight, setSelectedFreight] = useState<FreightOption | null>(null);
  const [freightError, setFreightError] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<{
    status: string;
    payment_id?: string;
    pix_qr_code?: string;
    pix_copy_paste?: string;
    split?: { seller_payout: number; platform_fee: number; fee_percent: number };
    installments?: number;
    error?: string;
  } | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [cardFormData, setCardFormData] = useState<UnifiedCardFormData | null>(null);
  const [isCardValid, setIsCardValid] = useState(false);
  const [chosenMode, setChosenMode] = useState<"direct" | "bravenza">("direct");
  const [form, setForm] = useState({
    buyer_name: buyerDefaults?.name || "",
    buyer_email: buyerDefaults?.email || "",
    buyer_phone: buyerDefaults?.phone || "",
    address_cep: "",
    address_street: "",
    address_number: "",
    address_complement: "",
    address_neighborhood: "",
    address_city: "",
    address_state: "",
    payment_method: "pix",
  });

  // Normalize shipping_mode from offer data
  const normalizedShippingMode = listing ? (
    listing.shipping_mode === "seller_ships" ? "direct" 
    : listing.shipping_mode === "hub" ? "bravenza" 
    : listing.shipping_mode || "direct"
  ) : "direct";

  // Determine if PRO is mandatory/recommended
  const PRO_AUTH_FEE = 49.90;
  const isProMandatory = listing ? (listing.price >= 2000 || normalizedShippingMode === "bravenza") : false;
  const isProRecommended = listing ? (listing.price >= 800 && listing.condition !== "novo") : false;
  // Auth fee applies only when user chooses PRO on non-mandatory items
  const authFee = (chosenMode === "bravenza" && !isProMandatory) ? PRO_AUTH_FEE : 0;

  // Reset when dialog opens
  useEffect(() => {
    if (open && listing) {
      const defaultMode = isProMandatory ? "bravenza" : (listing.shipping_mode === "bravenza" ? "bravenza" : "direct");
      setChosenMode(defaultMode);
      setStep(isProMandatory ? "address" : "modality");
      setFreightOptions([]);
      setSelectedFreight(null);
      setFreightError(null);
    }
  }, [open, listing, isProMandatory]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      buyer_name: buyerDefaults?.name || prev.buyer_name,
      buyer_email: buyerDefaults?.email || prev.buyer_email,
      buyer_phone: buyerDefaults?.phone || prev.buyer_phone,
    }));
  }, [buyerDefaults?.name, buyerDefaults?.email, buyerDefaults?.phone]);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCepChange = async (cep: string) => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setIsLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm((prev) => ({
          ...prev,
          address_street: data.logradouro || prev.address_street,
          address_neighborhood: data.bairro || prev.address_neighborhood,
          address_city: data.localidade || prev.address_city,
          address_state: data.uf || prev.address_state,
        }));
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingCep(false);
    }
  };

  const fetchFreightQuotes = useCallback(async () => {
    if (!listing) return;
    setIsLoadingFreight(true);
    setFreightError(null);
    setFreightOptions([]);
    setSelectedFreight(null);
    try {
      const params = new URLSearchParams({ action: "freight-quote" });
      const { getMarketplaceHeaders } = await import("@/hooks/marketplace/api");
      const mkHeaders = await getMarketplaceHeaders();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mk-hub?${params}`, {
        method: "POST",
        headers: mkHeaders,
        body: JSON.stringify({
          listing_id: listing.id,
          buyer_cep: form.address_cep.replace(/\D/g, ""),
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(errData.error || "Erro ao calcular frete");
      }
      const parsed = await res.json();
      if (parsed.error) throw new Error(parsed.error);
      const opts = (parsed.quotes || []).filter((q: any) => q.price && !q.error);
      const HUB_SURCHARGE = 30;
      const pacSedexOnly = opts.filter((q: any) => /pac|sedex/i.test(q.name || q.company?.name || ""));
      const withSurcharge = (pacSedexOnly.length > 0 ? pacSedexOnly : opts).map((q: any) => ({
        ...q,
        price: String((parseFloat(q.price) + HUB_SURCHARGE).toFixed(2)),
      }));
      if (withSurcharge.length === 0) {
        setFreightError("Nenhuma opção de frete disponível para este CEP.");
      } else {
        setFreightOptions(withSurcharge);
        const cheapest = withSurcharge.reduce((a: FreightOption, b: FreightOption) =>
          parseFloat(a.price) < parseFloat(b.price) ? a : b
        );
        setSelectedFreight(cheapest);
      }
    } catch (err: any) {
      console.error("Freight quote error:", err);
      setFreightError(err.message || "Erro ao calcular frete. Tente novamente.");
    } finally {
      setIsLoadingFreight(false);
    }
  }, [listing, form.address_cep]);

  if (!listing) return null;

  const shippingCost = selectedFreight ? parseFloat(selectedFreight.price) : 0;
  const baseTotalPrice = listing.price + shippingCost + authFee;

  // Calculate card total with interest for display
  const cardInterestRate = (form.payment_method === "card" && cardFormData)
    ? (MERCADO_PAGO_RATES[cardFormData.installments] || 0)
    : 0;
  const displayTotalPrice = cardInterestRate > 0
    ? Math.round((baseTotalPrice / (1 - cardInterestRate)) * 100) / 100
    : baseTotalPrice;
  // For backward compatibility, keep totalPrice as base for non-display uses
  const totalPrice = baseTotalPrice;
  const isAddressValid = form.address_cep?.replace(/\D/g, "").length === 8 && form.address_street && form.address_number && form.address_neighborhood && form.address_city && form.address_state;
  const stateOptions = BR_STATES.map((s) => ({ value: s, label: s }));

  const buildAddressString = () => {
    return [form.address_street, form.address_number, form.address_complement, form.address_neighborhood, form.address_city, form.address_state, form.address_cep].filter(Boolean).join(", ");
  };

  const goToFreight = () => {
    setStep("freight");
    fetchFreightQuotes();
  };

  const goToPayment = () => {
    if (!selectedFreight) return;
    setStep("payment");
  };

  const handleSubmit = async () => {
    if (!form.buyer_name || !isAddressValid || !selectedFreight) return;
    setIsSubmitting(true);
    setPaymentResult(null);
    try {
      // Step 1: Create the order via mk-hub
      const result = await onConfirm({
        listing_id: listing.id,
        buyer_name: form.buyer_name,
        buyer_email: form.buyer_email,
        buyer_phone: form.buyer_phone,
        buyer_address: buildAddressString(),
        payment_method: form.payment_method,
        shipping_cost: shippingCost,
        shipping_service: selectedFreight.name,
      });
      if (!result?.order?.id) {
        setIsSubmitting(false);
        return;
      }

      // Step 2: Process payment via mk-checkout
      setStep("processing");
      const checkoutBody: Record<string, any> = {
        order_id: result.order.id,
        payment_method: form.payment_method,
        payer_email: form.buyer_email,
      };

      // If card, tokenize first
      if (form.payment_method === "card" && cardFormData) {
        try {
          const cardToken = await tokenizeCard(cardFormData);
          checkoutBody.card_token = cardToken;
          checkoutBody.installments = cardFormData.installments;
          checkoutBody.payer_email = cardFormData.email || form.buyer_email;
          checkoutBody.payer_identification = {
            type: "CPF",
            number: cardFormData.identificationNumber.replace(/\D/g, ""),
          };
        } catch (tokenErr: any) {
          setPaymentResult({ status: "error", error: tokenErr.message || "Erro ao processar cartão" });
          setIsSubmitting(false);
          return;
        }
      }

      const { getMarketplaceHeaders } = await import("@/hooks/marketplace/api");
      const headers = await getMarketplaceHeaders();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mk-checkout`,
        { method: "POST", headers, body: JSON.stringify(checkoutBody) }
      );
      const payData = await res.json();

      if (!res.ok || payData.error) {
        setPaymentResult({ status: "error", error: payData.error || "Erro ao processar pagamento" });
      } else {
        setPaymentResult(payData);

        // If card was approved, close after brief delay
        if (form.payment_method === "card" && payData.status === "approved") {
          setTimeout(() => onOpenChange(false), 2500);
        }
      }
    } catch (err: any) {
      setPaymentResult({ status: "error", error: err.message || "Erro inesperado" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPix = () => {
    if (paymentResult?.pix_copy_paste) {
      navigator.clipboard.writeText(paymentResult.pix_copy_paste);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 3000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Finalizar compra
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center gap-1 mb-2">
          {(isProMandatory
            ? (["address", "freight", "payment"] as Step[])
            : (["modality", "address", "freight", "payment"] as Step[])
          ).map((s, i, arr) => (
            <div key={s} className="flex items-center gap-1 flex-1">
              <div className={cn(
                "flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold transition-colors",
                step === s ? "bg-primary text-primary-foreground" :
                (arr.indexOf(step) > i) ? "bg-primary/30 text-primary" :
                "bg-muted text-muted-foreground"
              )}>
                {i + 1}
              </div>
              <span className={cn("text-[10px] font-medium hidden sm:inline", step === s ? "text-foreground" : "text-muted-foreground")}>
                {s === "modality" ? "Modalidade" : s === "address" ? "Endereço" : s === "freight" ? "Frete" : "Pagamento"}
              </span>
              {i < arr.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
            </div>
          ))}
        </div>

        {/* Product summary - always visible with running total */}
        <div className="p-3 bg-muted/30 rounded-lg border border-border/30 space-y-2">
          <div className="flex gap-3">
            {listing.photos?.[0] && (
              <img src={listing.photos[0]} alt={listing.title} className="w-14 h-14 rounded-lg object-cover" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm line-clamp-1">{listing.title}</p>
              <p className="text-xs text-muted-foreground">
                {listing.brand} {listing.model ? `· ${listing.model}` : ""} {listing.size ? `· Tam. ${listing.size}` : ""}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {listing.is_vault_certified && (
                  <Badge className="bg-primary/20 text-primary text-[10px] gap-0.5 px-1.5 py-0">
                    <ShieldCheck className="h-2.5 w-2.5" /> Vault ID
                  </Badge>
                )}
                {chosenMode === "bravenza" && (
                  <Badge className="bg-primary/20 text-primary text-[10px] gap-0.5 px-1.5 py-0">
                    <ShieldCheck className="h-2.5 w-2.5" /> Via Bravenza
                  </Badge>
                )}
                {chosenMode === "direct" && (
                  <Badge variant="outline" className="text-[10px] gap-0.5 px-1.5 py-0">
                    <Truck className="h-2.5 w-2.5" /> Direto
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {/* Running cost breakdown */}
          <div className="space-y-1 text-[11px] pt-1 border-t border-border/20">
            <div className="flex justify-between text-muted-foreground">
              <span>Produto</span>
              <span>R$ {listing.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
            {authFee > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span className="flex items-center gap-1"><ShieldCheck className="h-2.5 w-2.5" /> Autenticação PRO</span>
                <span>R$ {authFee.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {isProMandatory && chosenMode === "bravenza" && (
              <div className="flex justify-between text-muted-foreground/60">
                <span className="flex items-center gap-1"><ShieldCheck className="h-2.5 w-2.5" /> Autenticação PRO</span>
                <span>Inclusa</span>
              </div>
            )}
            {shippingCost > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span className="flex items-center gap-1"><Truck className="h-2.5 w-2.5" /> Frete</span>
                <span>R$ {shippingCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {!selectedFreight && step !== "modality" && (
              <div className="flex justify-between text-muted-foreground/60">
                <span className="flex items-center gap-1"><Truck className="h-2.5 w-2.5" /> Frete</span>
                <span>A calcular</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-foreground pt-1 border-t border-border/20">
              <span>Total</span>
              <span className="text-primary">R$ {totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* ========== STEP 0: MODALITY ========== */}
        {step === "modality" && (
          <div className="space-y-4 mt-1">
            <div className="space-y-3">
              <button
                onClick={() => setChosenMode("direct")}
                className={cn(
                  "w-full p-4 rounded-lg border text-left transition-all",
                  chosenMode === "direct" ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/40"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Truck className="h-4 w-4" />
                  <p className="font-medium text-sm">Envio Direto</p>
                </div>
                <p className="text-xs text-muted-foreground">Vendedor envia diretamente para você. Mais rápido.</p>
              </button>
              <button
                onClick={() => setChosenMode("bravenza")}
                className={cn(
                  "w-full p-4 rounded-lg border text-left transition-all",
                  chosenMode === "bravenza" ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/40"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <p className="font-medium text-sm">PRO — Via Bravenza</p>
                  {isProRecommended && <Badge className="bg-primary/20 text-primary text-[10px] px-1.5 py-0">Recomendado</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  Passa pelo Hub Bravenza para autenticação física + embalagem premium. +5 dias úteis.
                </p>
                <p className="text-xs text-primary font-medium mt-1">
                  + R$ {PRO_AUTH_FEE.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} taxa de autenticação
                </p>
              </button>
            </div>

            {isProRecommended && chosenMode === "direct" && (
              <div className="p-2.5 bg-warning/10 border border-warning/30 rounded-lg text-[11px] text-muted-foreground">
                <AlertCircle className="h-3 w-3 inline mr-1 text-warning" />
                Recomendamos o envio PRO para itens usados acima de R$ 800. A cobertura Direto é limitada.
              </div>
            )}

            <Button onClick={() => setStep("address")} className="w-full btn-gold gap-2" size="lg">
              Continuar
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* ========== STEP 1: ADDRESS ========== */}
        {step === "address" && (
          <div className="space-y-4 mt-1">
            <div className="space-y-3">
              <div>
                <Label>Seu nome *</Label>
                <Input value={form.buyer_name} onChange={(e) => updateField("buyer_name", e.target.value)} placeholder="Nome completo" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">E-mail</Label>
                  <Input value={form.buyer_email} onChange={(e) => updateField("buyer_email", e.target.value)} placeholder="seu@email.com" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Telefone</Label>
                  <Input value={form.buyer_phone} onChange={(e) => updateField("buyer_phone", e.target.value)} placeholder="(11) 99999-9999" className="mt-1" />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <Label className="text-sm font-semibold">Endereço de entrega</Label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">CEP *</Label>
                  <div className="relative">
                    <Input
                      value={form.address_cep}
                      onChange={(e) => {
                        const formatted = formatCep(e.target.value);
                        updateField("address_cep", formatted);
                        if (formatted.replace(/\D/g, "").length === 8) handleCepChange(formatted);
                      }}
                      placeholder="00000-000"
                      className="mt-1"
                    />
                    {isLoadingCep && <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-3.5 text-muted-foreground" />}
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Estado *</Label>
                  <MobileSelect value={form.address_state} onValueChange={(v) => updateField("address_state", v)} options={stateOptions} placeholder="UF" className="mt-1" />
                </div>
              </div>

              <div>
                <Label className="text-xs">Rua *</Label>
                <Input value={form.address_street} onChange={(e) => updateField("address_street", e.target.value)} placeholder="Nome da rua" className="mt-1" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Número *</Label>
                  <Input value={form.address_number} onChange={(e) => updateField("address_number", e.target.value)} placeholder="123" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Complemento</Label>
                  <Input value={form.address_complement} onChange={(e) => updateField("address_complement", e.target.value)} placeholder="Apto, bloco..." className="mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Bairro *</Label>
                  <Input value={form.address_neighborhood} onChange={(e) => updateField("address_neighborhood", e.target.value)} placeholder="Bairro" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Cidade *</Label>
                  <Input value={form.address_city} onChange={(e) => updateField("address_city", e.target.value)} placeholder="Cidade" className="mt-1" />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {!isProMandatory && (
                <Button variant="outline" onClick={() => setStep("modality")} className="gap-1">
                  <ArrowLeft className="h-4 w-4" /> Voltar
                </Button>
              )}
              <Button onClick={goToFreight} disabled={!form.buyer_name || !isAddressValid} className="flex-1 btn-gold gap-2" size="lg">
                Calcular frete
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ========== STEP 2: FREIGHT ========== */}
        {step === "freight" && (
          <div className="space-y-4 mt-1">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              <Label className="text-sm font-semibold">Escolha a modalidade de entrega</Label>
            </div>

            {/* PRO info banner */}
            <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-lg text-[11px] text-muted-foreground space-y-0.5">
              <div className="flex items-center gap-1 text-primary font-semibold text-xs mb-0.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Compra PRO — Autenticação garantida
              </div>
              <p>Seu item passa pelo HUB Bravenza para certificação de autenticidade antes do envio.</p>
            </div>

            {isLoadingFreight ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Calculando opções de frete...</p>
              </div>
            ) : freightError ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <AlertCircle className="h-8 w-8 text-destructive/60" />
                <p className="text-sm text-muted-foreground">{freightError}</p>
                <Button variant="outline" size="sm" onClick={fetchFreightQuotes}>Tentar novamente</Button>
              </div>
            ) : (
              <div className="space-y-2">
                {(() => {
                  const sorted = [...freightOptions].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
                  const cheapestId = sorted[0]?.id;
                  const fastestId = sorted.length > 1
                    ? sorted.reduce((f, o) => o.delivery_time < f.delivery_time ? o : f, sorted[0]).id
                    : null;

                  return freightOptions.map((opt) => {
                    const optName = opt.name || opt.company?.name || "";
                    const isPac = /pac/i.test(optName);
                    const isSedex = /sedex|expresso/i.test(optName);
                    const minDays = isSedex ? 3 : isPac ? 11 : Math.max(1, opt.delivery_time - 7);
                    const maxDays = isSedex ? 17 : isPac ? 24 : opt.delivery_time;
                    const isCheapest = opt.id === cheapestId;
                    const isFastest = opt.id === fastestId && fastestId !== cheapestId;

                    return (
                      <button
                        key={opt.id}
                        onClick={() => setSelectedFreight(opt)}
                        className={cn(
                          "w-full p-3 rounded-lg border text-left transition-all",
                          selectedFreight?.id === opt.id
                            ? "border-primary bg-primary/10"
                            : "border-border/50 hover:border-primary/40"
                        )}
                      >
                        <div className="flex items-center gap-1.5 mb-1.5">
                          {isCheapest && (
                            <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[9px] px-1.5 py-0 h-4">
                              Mais econômico
                            </Badge>
                          )}
                          {isFastest && (
                            <Badge className="bg-sky-500/15 text-sky-500 border-sky-500/30 text-[9px] px-1.5 py-0 h-4">
                              Mais rápido
                            </Badge>
                          )}
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] px-1.5 py-0 h-4 gap-0.5">
                            <ShieldCheck className="h-2.5 w-2.5" /> PRO
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <Package className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{optName || `Serviço ${opt.id}`}</p>
                            <p className="text-[10px] text-muted-foreground">Passa pelo HUB para certificação</p>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                              <Clock className="h-3 w-3" />
                              {minDays === maxDays
                                ? `${maxDays} dias úteis`
                                : `${minDays} a ${maxDays} dias úteis`
                              }
                            </div>
                          </div>
                          <p className={cn(
                            "text-sm font-bold whitespace-nowrap",
                            selectedFreight?.id === opt.id ? "text-primary" : "text-foreground"
                          )}>
                            R$ {parseFloat(opt.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setStep("address")} className="gap-1">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
              <Button onClick={goToPayment} disabled={!selectedFreight} className="flex-1 btn-gold gap-2" size="lg">
                Continuar
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ========== STEP 3: PAYMENT ========== */}
        {step === "payment" && (
          <div className="space-y-4 mt-1">
            {/* Price breakdown */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Produto</span>
                <span>R$ {listing.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Truck className="h-3 w-3" />
                  Frete ({selectedFreight?.name})
                </span>
                <span>R$ {shippingCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
              {authFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    Autenticação PRO
                  </span>
                  <span>R$ {authFee.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {isProMandatory && chosenMode === "bravenza" && (
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground/70 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    Autenticação PRO
                  </span>
                  <span className="text-muted-foreground/70">Inclusa</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-primary">R$ {totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <Separator />

            {/* Payment method */}
            <div>
              <Label className="mb-2 block">Forma de pagamento</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "pix", label: "PIX", icon: "💚" },
                  { value: "card", label: "Cartão", icon: "💳" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateField("payment_method", opt.value)}
                    className={cn(
                      "p-3 rounded-lg border text-sm font-medium transition-all",
                      form.payment_method === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 hover:border-primary/40"
                    )}
                  >
                    <span className="mr-1.5">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Card form (conditional) */}
            {form.payment_method === "card" && (
              <UnifiedCardForm
                amount={totalPrice}
                email={form.buyer_email}
                interestRates={MERCADO_PAGO_RATES}
                compact
                onDataChange={(data, valid) => {
                  setCardFormData(data);
                  setIsCardValid(valid);
                }}
              />
            )}

            {/* Delivery summary */}
            <div className="p-3 bg-muted/30 border border-border/30 rounded-lg text-xs space-y-1">
              <p className="font-medium text-foreground text-sm mb-1.5">📍 Entrega</p>
              <p className="text-muted-foreground">{buildAddressString()}</p>
              <p className="text-muted-foreground flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                Prazo estimado: {selectedFreight?.delivery_time} dia{selectedFreight && selectedFreight.delivery_time !== 1 ? "s" : ""} útei{selectedFreight && selectedFreight.delivery_time !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Trust box */}
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs text-muted-foreground space-y-1">
              <p>🔒 <strong>Compra protegida:</strong> 7 dias úteis para reportar problemas após a entrega.</p>
              <p>📦 O vendedor recebe o pagamento após 8 dias úteis do período de proteção.</p>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setStep("freight")} className="gap-1">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || (form.payment_method === "card" && !isCardValid)}
                className="flex-1 btn-gold gap-2"
                size="lg"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                {isSubmitting ? "Processando..." : `Comprar — R$ ${displayTotalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              </Button>
            </div>
          </div>
        )}
        {/* ========== STEP 4: PROCESSING / RESULT ========== */}
        {step === "processing" && (
          <div className="space-y-4 mt-1">
            {!paymentResult ? (
              <div className="flex flex-col items-center gap-4 py-10">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Processando pagamento...</p>
              </div>
            ) : paymentResult.status === "error" ? (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <AlertCircle className="h-10 w-10 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">Erro no pagamento</p>
                  <p className="text-sm text-muted-foreground mt-1">{paymentResult.error}</p>
                </div>
                <Button variant="outline" onClick={() => { setStep("payment"); setPaymentResult(null); }}>
                  Tentar novamente
                </Button>
              </div>
            ) : paymentResult.status === "approved" ? (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-success" />
                <div>
                  <p className="font-bold text-lg text-success">Pagamento aprovado!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {paymentResult.installments && paymentResult.installments > 1
                      ? `${paymentResult.installments}x no cartão`
                      : "Pagamento confirmado"}
                  </p>
                </div>
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs text-muted-foreground w-full">
                  <p>🔒 Compra protegida por 7 dias úteis após a entrega.</p>
                  <p className="mt-1">📦 O vendedor será notificado para enviar o produto.</p>
                </div>
              </div>
            ) : paymentResult.pix_copy_paste ? (
              /* PIX pending */
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3 text-center">
                  <Clock className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-bold">PIX gerado com sucesso!</p>
                    <p className="text-xs text-muted-foreground mt-1">Escaneie o QR Code ou copie o código abaixo</p>
                  </div>
                </div>

                {paymentResult.pix_qr_code && (
                  <div className="flex justify-center">
                    <img
                      src={`data:image/png;base64,${paymentResult.pix_qr_code}`}
                      alt="QR Code PIX"
                      className="w-48 h-48 rounded-lg border"
                    />
                  </div>
                )}

                <div className="relative">
                  <div className="p-3 bg-muted/50 rounded-lg font-mono text-xs break-all pr-12 max-h-20 overflow-y-auto">
                    {paymentResult.pix_copy_paste}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                    onClick={handleCopyPix}
                  >
                    {pixCopied ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>

                {pixCopied && (
                  <p className="text-xs text-success text-center">✅ Código copiado!</p>
                )}

                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs text-muted-foreground space-y-1">
                  <p>💡 Após o pagamento, o pedido será confirmado automaticamente.</p>
                  <p>🔒 Compra protegida por 7 dias úteis após a entrega.</p>
                </div>

                <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
                  Fechar — Vou pagar pelo app do banco
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <Clock className="h-10 w-10 text-warning" />
                <div>
                  <p className="font-medium">Pagamento em análise</p>
                  <p className="text-sm text-muted-foreground mt-1">Você será notificado quando for confirmado.</p>
                </div>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}