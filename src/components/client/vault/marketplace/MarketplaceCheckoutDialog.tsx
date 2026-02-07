import { useState, useEffect, useCallback } from "react";
import { ShoppingCart, ShieldCheck, Truck, CreditCard, Loader2, MapPin, Package, ChevronRight, ArrowLeft, Clock, AlertCircle } from "lucide-react";
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

type Step = "modality" | "address" | "freight" | "payment";

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

  // Determine if PRO is mandatory/recommended
  const isProMandatory = listing ? (listing.price >= 2000 || listing.shipping_mode === "bravenza") : false;
  const isProRecommended = listing ? (listing.price >= 800 && listing.condition !== "novo") : false;

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
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mk-hub?${params}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-client-cpf": "quote",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
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
      if (opts.length === 0) {
        setFreightError("Nenhuma opção de frete disponível para este CEP.");
      } else {
        setFreightOptions(opts);
        // Auto-select cheapest
        const cheapest = opts.reduce((a: FreightOption, b: FreightOption) =>
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
  const totalPrice = listing.price + shippingCost;
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
    try {
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
      if (result) onOpenChange(false);
    } finally {
      setIsSubmitting(false);
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

        {/* Product summary - always visible */}
        <div className="flex gap-3 p-3 bg-muted/30 rounded-lg border border-border/30">
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
              <Badge variant="outline" className="text-[10px] gap-0.5 px-1.5 py-0">
                <Truck className="h-2.5 w-2.5" />
                {listing.shipping_mode === "bravenza" ? "Via Bravenza" : "Direto"}
              </Badge>
            </div>
          </div>
          <p className="text-sm font-bold text-foreground whitespace-nowrap">
            R$ {listing.price.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
          </p>
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
              <Label className="text-sm font-semibold">Opções de envio</Label>
              {listing.shipping_mode === "bravenza" && (
                <Badge className="bg-primary/20 text-primary text-[10px] gap-0.5 px-1.5">
                  <ShieldCheck className="h-2.5 w-2.5" /> Via Bravenza
                </Badge>
              )}
            </div>

            {listing.shipping_mode === "bravenza" && (
              <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-lg text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3 w-3 inline mr-1 text-primary" />
                O produto passará pela BRAVENZA para autenticação antes de chegar a você. O frete inclui os dois trechos.
              </div>
            )}

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
                {freightOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedFreight(opt)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                      selectedFreight?.id === opt.id
                        ? "border-primary bg-primary/10"
                        : "border-border/50 hover:border-primary/40"
                    )}
                  >
                    <Package className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{opt.name || opt.company?.name || `Serviço ${opt.id}`}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <Clock className="h-3 w-3" />
                        {opt.delivery_time} dia{opt.delivery_time !== 1 ? "s" : ""} útei{opt.delivery_time !== 1 ? "s" : ""}
                        {opt.legs && (
                          <span className="text-[10px]">
                            ({opt.legs.seller_to_bravenza?.delivery_time}d + {opt.legs.bravenza_processing?.delivery_time || 5}d verificação + {opt.legs.bravenza_to_buyer?.delivery_time}d)
                          </span>
                        )}
                      </div>
                    </div>
                    <p className={cn(
                      "text-sm font-bold whitespace-nowrap",
                      selectedFreight?.id === opt.id ? "text-primary" : "text-foreground"
                    )}>
                      R$ {parseFloat(opt.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </button>
                ))}
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
              <p>📦 O vendedor só recebe o pagamento após o período de proteção.</p>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setStep("freight")} className="gap-1">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 btn-gold gap-2"
                size="lg"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                {isSubmitting ? "Processando..." : `Comprar — R$ ${totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}