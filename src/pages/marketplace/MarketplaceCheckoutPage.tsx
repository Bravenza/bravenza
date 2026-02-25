import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ShieldCheck, Truck, CreditCard, Loader2, MapPin,
  Package, ChevronRight, Clock, AlertCircle, Copy, CheckCircle2,
  ShoppingCart, Store, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { MobileSelect } from "@/components/ui/mobile-select";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { useClientSession } from "@/hooks/useClientSession";
import { useMarketplace } from "@/hooks/useMarketplace";
import { UnifiedCardForm, tokenizeCard, type UnifiedCardFormData } from "@/components/payment/UnifiedCardForm";
import { MERCADO_PAGO_RATES } from "@/lib/budget-calculator";
import { getMarketplaceHeaders } from "@/hooks/marketplace/api";
import type { CartGroup, CartItem } from "@/hooks/useMarketplaceCart";
import { CartProvider, useMarketplaceCart } from "@/hooks/useMarketplaceCart";
import { toast } from "sonner";

const BR_STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const formatCep = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return digits;
};

const conditionLabel: Record<string, string> = {
  novo: "Novo",
  usado_excelente: "Excelente",
  usado_bom: "Bom",
  usado_regular: "Regular",
};

type Step = "review" | "address" | "freight" | "payment" | "processing" | "success";

// R$20 hub surcharge added to each freight option to cover HUB logistics costs
const HUB_FREIGHT_SURCHARGE = 20;

const STEPS: { key: Step; label: string; icon: typeof ShoppingCart }[] = [
  { key: "review", label: "Resumo", icon: ShoppingCart },
  { key: "address", label: "Endereço", icon: MapPin },
  { key: "freight", label: "Frete", icon: Truck },
  { key: "payment", label: "Pagamento", icon: CreditCard },
];

interface FreightOption {
  id: number;
  name: string;
  price: string;
  delivery_time: number;
  company?: { name: string; picture?: string };
}

function MarketplaceCheckoutPageInner() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useClientSession();
  const cpf = profile?.cpf || null;
  const { createOrder } = useMarketplace(cpf);
  const { removeFromCart } = useMarketplaceCart();

  const group: CartGroup | null = location.state?.group || null;

  const [step, setStep] = useState<Step>("review");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isLoadingFreight, setIsLoadingFreight] = useState(false);
  const [freightOptions, setFreightOptions] = useState<FreightOption[]>([]);
  const [selectedFreight, setSelectedFreight] = useState<FreightOption | null>(null);
  const [freightError, setFreightError] = useState<string | null>(null);
  const [cardFormData, setCardFormData] = useState<UnifiedCardFormData | null>(null);
  const [isCardValid, setIsCardValid] = useState(false);
  const [processingIndex, setProcessingIndex] = useState(0);
  const [paymentResults, setPaymentResults] = useState<any[]>([]);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [pixData, setPixData] = useState<{ qr_code?: string; copy_paste?: string } | null>(null);
  const [pixCopied, setPixCopied] = useState(false);

  const [form, setForm] = useState({
    buyer_name: profile?.full_name || "",
    buyer_email: "",
    buyer_phone: profile?.phone || "",
    address_cep: "",
    address_street: "",
    address_number: "",
    address_complement: "",
    address_neighborhood: "",
    address_city: "",
    address_state: "",
    payment_method: "pix",
  });

  useEffect(() => {
    if (profile) {
      setForm(prev => ({
        ...prev,
        buyer_name: profile.full_name || prev.buyer_name,
        buyer_phone: profile.phone || prev.buyer_phone,
      }));
    }
  }, [profile]);

  // Redirect if no group
  useEffect(() => {
    if (!group || group.items.length === 0) {
      navigate("/marketplace", { replace: true });
    }
  }, [group, navigate]);

  const itemsSubtotal = group?.subtotal ?? 0;
  const shippingCost = selectedFreight ? parseFloat(selectedFreight.price) : 0;
  const baseTotalPrice = itemsSubtotal + shippingCost;

  const cardInterestRate = (form.payment_method === "card" && cardFormData)
    ? (MERCADO_PAGO_RATES[cardFormData.installments] || 0)
    : 0;
  const displayTotalPrice = cardInterestRate > 0
    ? Math.round((baseTotalPrice / (1 - cardInterestRate)) * 100) / 100
    : baseTotalPrice;

  const isAddressValid = form.address_cep?.replace(/\D/g, "").length === 8 &&
    form.address_street && form.address_number &&
    form.address_neighborhood && form.address_city && form.address_state;

  const stateOptions = BR_STATES.map(s => ({ value: s, label: s }));

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCepChange = async (cep: string) => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setIsLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm(prev => ({
          ...prev,
          address_street: data.logradouro || prev.address_street,
          address_neighborhood: data.bairro || prev.address_neighborhood,
          address_city: data.localidade || prev.address_city,
          address_state: data.uf || prev.address_state,
        }));
      }
    } catch { /* ignore */ }
    finally { setIsLoadingCep(false); }
  };

  const fetchFreightQuotes = useCallback(async () => {
    if (!group?.items[0]?.offer) return;
    setIsLoadingFreight(true);
    setFreightError(null);
    setFreightOptions([]);
    setSelectedFreight(null);
    try {
      const headers = await getMarketplaceHeaders();
      const params = new URLSearchParams({ action: "freight-quote" });
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mk-hub?${params}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          listing_id: group.items[0].offer.id,
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
      // Filter to only PAC and SEDEX, add hub surcharge
      const pacSedexOnly = opts.filter((q: any) => /pac|sedex/i.test(q.name || q.company?.name || ""));
      const withSurcharge = pacSedexOnly.map((q: any) => ({
        ...q,
        price: String((parseFloat(q.price) + HUB_FREIGHT_SURCHARGE).toFixed(2)),
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
      setFreightError(err.message || "Erro ao calcular frete.");
    } finally {
      setIsLoadingFreight(false);
    }
  }, [group?.items, form.address_cep]);

  if (!group || group.items.length === 0) return null;

  const buildAddressString = () => {
    return [form.address_street, form.address_number, form.address_complement,
      form.address_neighborhood, form.address_city, form.address_state, form.address_cep
    ].filter(Boolean).join(", ");
  };

  const handleGoToFreight = () => {
    setStep("freight");
    fetchFreightQuotes();
  };

  const handleSubmitPayment = async () => {
    setIsSubmitting(true);
    setPaymentError(null);
    setPaymentResults([]);
    setStep("processing");
    setProcessingIndex(0);

    const results: any[] = [];
    const address = buildAddressString();

    for (let i = 0; i < group.items.length; i++) {
      setProcessingIndex(i);
      const item = group.items[i];
      if (!item.offer) continue;

      try {
        // 1. Create order
        const orderResult = await createOrder({
          listing_id: item.offer.id,
          buyer_name: form.buyer_name,
          buyer_email: form.buyer_email,
          buyer_phone: form.buyer_phone,
          buyer_address: address,
          payment_method: form.payment_method,
        });

        if (!orderResult?.id) {
          results.push({ item, error: "Erro ao criar pedido" });
          continue;
        }

        // 2. Process payment
        const checkoutBody: Record<string, any> = {
          order_id: orderResult.id,
          payment_method: form.payment_method,
          payer_email: form.buyer_email,
        };

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
            results.push({ item, error: tokenErr.message || "Erro no cartão" });
            continue;
          }
        }

        const headers = await getMarketplaceHeaders();
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mk-checkout`,
          { method: "POST", headers, body: JSON.stringify(checkoutBody) }
        );
        const payData = await res.json();

        if (!res.ok || payData.error) {
          results.push({ item, error: payData.error || "Erro no pagamento" });
        } else {
          results.push({ item, ...payData, order: orderResult });
          // Save first PIX data for display
          if (form.payment_method === "pix" && payData.pix_copy_paste && !pixData) {
            setPixData({ qr_code: payData.pix_qr_code, copy_paste: payData.pix_copy_paste });
          }
          // Remove from cart on success
          await removeFromCart(item.offer_id);
        }
      } catch (err: any) {
        results.push({ item, error: err.message || "Erro inesperado" });
      }
    }

    setPaymentResults(results);
    const hasError = results.some(r => r.error);
    if (hasError && results.every(r => r.error)) {
      setPaymentError("Não foi possível processar nenhum pedido.");
    } else {
      setStep("success");
    }
    setIsSubmitting(false);
  };

  const handleCopyPix = () => {
    if (pixData?.copy_paste) {
      navigator.clipboard.writeText(pixData.copy_paste);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 3000);
    }
  };

  const currentStepIndex = STEPS.findIndex(s => s.key === step);

  return (
    <div className="min-h-screen bg-secondary/30 flex flex-col">
      {/* Minimal header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border/20 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 flex items-center h-14 gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full shrink-0"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Logo size="sm" />
            <span className="text-sm font-semibold text-muted-foreground hidden sm:inline">Checkout</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Lock className="h-3 w-3 text-primary" />
            <span className="hidden sm:inline">Ambiente seguro</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 pb-32">
        {/* Stepper */}
        {step !== "processing" && step !== "success" && (
          <div className="flex items-center gap-1 mb-8">
            {STEPS.map((s, i) => {
              const isActive = s.key === step;
              const isPast = currentStepIndex > i;
              const Icon = s.icon;
              return (
                <div key={s.key} className="flex items-center gap-1.5 flex-1">
                  <motion.div
                    className={cn(
                      "flex items-center justify-center h-9 w-9 rounded-xl text-xs font-bold transition-all duration-300 shrink-0",
                      isActive ? "bg-primary text-primary-foreground shadow-[0_4px_12px_-2px_hsl(var(--primary)/0.4)]" :
                      isPast ? "bg-primary/20 text-primary" :
                      "bg-muted text-muted-foreground"
                    )}
                    animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {isPast ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </motion.div>
                  <span className={cn(
                    "text-xs font-medium hidden sm:inline",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {s.label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div className={cn(
                      "flex-1 h-0.5 rounded-full mx-1 transition-colors",
                      isPast ? "bg-primary/30" : "bg-border/30"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr,340px]">
          {/* Left column: Step content */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* ===== REVIEW ===== */}
                {step === "review" && (
                  <div className="bg-background rounded-2xl border border-border/20 p-5 space-y-4">
                    <div className="flex items-center gap-2.5">
                      <Store className="h-5 w-5 text-primary" />
                      <div>
                        <h2 className="font-bold text-base">Revise seus itens</h2>
                        <p className="text-xs text-muted-foreground">Vendedor: {group.sellerName}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {group.items.map((item) => {
                        const offer = item.offer;
                        if (!offer) return null;
                        const name = offer.product ? `${offer.product.brand} ${offer.product.model}` : "Produto";
                        const image = offer.photos?.[0] || offer.product?.images?.[0];
                        return (
                          <div key={item.id} className="flex gap-3.5 p-3 rounded-xl bg-secondary/30 border border-border/10">
                            <div className="w-[72px] h-[72px] rounded-xl bg-white overflow-hidden shrink-0">
                              {image ? (
                                <img src={image} alt={name} className="w-full h-full object-contain p-1.5" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl opacity-10">👟</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                              <div>
                                <p className="text-sm font-semibold truncate">{name}</p>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-border/30">
                                    Tam. {offer.size}
                                  </Badge>
                                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-border/30">
                                    {conditionLabel[offer.condition] || offer.condition}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-sm font-bold text-primary">
                                R$ {offer.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <Button onClick={() => setStep("address")} className="w-full btn-gold gap-2 h-12 text-sm font-bold rounded-xl" size="lg">
                      Continuar para endereço
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* ===== ADDRESS ===== */}
                {step === "address" && (
                  <div className="bg-background rounded-2xl border border-border/20 p-5 space-y-5">
                    <div className="flex items-center gap-2.5">
                      <MapPin className="h-5 w-5 text-primary" />
                      <h2 className="font-bold text-base">Endereço de entrega</h2>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label>Seu nome *</Label>
                        <Input value={form.buyer_name} onChange={e => updateField("buyer_name", e.target.value)} placeholder="Nome completo" className="mt-1.5" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">E-mail</Label>
                          <Input value={form.buyer_email} onChange={e => updateField("buyer_email", e.target.value)} placeholder="seu@email.com" className="mt-1.5" />
                        </div>
                        <div>
                          <Label className="text-xs">Telefone</Label>
                          <Input value={form.buyer_phone} onChange={e => updateField("buyer_phone", e.target.value)} placeholder="(11) 99999-9999" className="mt-1.5" />
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">CEP *</Label>
                          <div className="relative">
                            <Input
                              value={form.address_cep}
                              onChange={e => {
                                const formatted = formatCep(e.target.value);
                                updateField("address_cep", formatted);
                                if (formatted.replace(/\D/g, "").length === 8) handleCepChange(formatted);
                              }}
                              placeholder="00000-000"
                              className="mt-1.5"
                              inputMode="numeric"
                            />
                            {isLoadingCep && <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-4 text-muted-foreground" />}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Estado *</Label>
                          <MobileSelect value={form.address_state} onValueChange={v => updateField("address_state", v)} options={stateOptions} placeholder="UF" className="mt-1.5" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Rua *</Label>
                        <Input value={form.address_street} onChange={e => updateField("address_street", e.target.value)} placeholder="Nome da rua" className="mt-1.5" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Número *</Label>
                          <Input value={form.address_number} onChange={e => updateField("address_number", e.target.value)} placeholder="123" className="mt-1.5" inputMode="numeric" />
                        </div>
                        <div>
                          <Label className="text-xs">Complemento</Label>
                          <Input value={form.address_complement} onChange={e => updateField("address_complement", e.target.value)} placeholder="Apto, bloco..." className="mt-1.5" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Bairro *</Label>
                          <Input value={form.address_neighborhood} onChange={e => updateField("address_neighborhood", e.target.value)} placeholder="Bairro" className="mt-1.5" />
                        </div>
                        <div>
                          <Label className="text-xs">Cidade *</Label>
                          <Input value={form.address_city} onChange={e => updateField("address_city", e.target.value)} placeholder="Cidade" className="mt-1.5" />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button variant="outline" onClick={() => setStep("review")} className="gap-1.5 rounded-xl">
                        <ArrowLeft className="h-4 w-4" /> Voltar
                      </Button>
                      <Button
                        onClick={handleGoToFreight}
                        disabled={!form.buyer_name || !isAddressValid}
                        className="flex-1 btn-gold gap-2 h-12 text-sm font-bold rounded-xl"
                        size="lg"
                      >
                        Calcular frete
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* ===== FREIGHT ===== */}
                {step === "freight" && (
                  <div className="bg-background rounded-2xl border border-border/20 p-5 space-y-5">
                    <div className="flex items-center gap-2.5">
                      <Truck className="h-5 w-5 text-primary" />
                      <h2 className="font-bold text-base">Escolha a modalidade de entrega</h2>
                    </div>

                    {/* PRO info banner */}
                    <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-xl text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center gap-1.5 text-primary font-semibold text-sm mb-1">
                        <ShieldCheck className="h-4 w-4" />
                        Compra PRO — Autenticação garantida
                      </div>
                      <p>Seu item passa primeiro pelo HUB Bravenza para receber uma certificação de autenticidade antes de ser enviado a você.</p>
                    </div>

                    {isLoadingFreight ? (
                      <div className="flex flex-col items-center gap-3 py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Calculando opções de frete...</p>
                      </div>
                    ) : freightError ? (
                      <div className="flex flex-col items-center gap-3 py-8 text-center">
                        <AlertCircle className="h-8 w-8 text-destructive/60" />
                        <p className="text-sm text-muted-foreground">{freightError}</p>
                        <Button variant="outline" size="sm" onClick={fetchFreightQuotes}>Tentar novamente</Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {(() => {
                          const sorted = [...freightOptions].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
                          const cheapestId = sorted[0]?.id;
                          const fastestId = sorted.length > 1
                            ? sorted.reduce((f, o) => o.delivery_time < f.delivery_time ? o : f, sorted[0]).id
                            : null;

                          return freightOptions.map(opt => {
                            const isPac = /pac/i.test(opt.name || opt.company?.name || "");
                            const isSedex = /sedex|expresso/i.test(opt.name || opt.company?.name || "");
                            const minDays = isSedex ? 3 : isPac ? 11 : Math.max(1, opt.delivery_time - 7);
                            const maxDays = isSedex ? 17 : isPac ? 24 : opt.delivery_time;
                            const isCheapest = opt.id === cheapestId;
                            const isFastest = opt.id === fastestId && fastestId !== cheapestId;

                            return (
                              <button
                                key={opt.id}
                                onClick={() => setSelectedFreight(opt)}
                                className={cn(
                                  "w-full p-4 rounded-xl border text-left transition-all relative",
                                  selectedFreight?.id === opt.id
                                    ? "border-primary bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.3)]"
                                    : "border-border/30 hover:border-primary/30"
                                )}
                              >
                                {/* Badges */}
                                <div className="flex items-center gap-2 mb-2">
                                  {isCheapest && (
                                    <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[10px] px-2 py-0 h-5">
                                      Mais econômico
                                    </Badge>
                                  )}
                                  {isFastest && (
                                    <Badge className="bg-sky-500/15 text-sky-500 border-sky-500/30 text-[10px] px-2 py-0 h-5">
                                      Mais rápido
                                    </Badge>
                                  )}
                                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] px-2 py-0 h-5 gap-0.5">
                                    <ShieldCheck className="h-2.5 w-2.5" /> PRO
                                  </Badge>
                                </div>

                                <div className="flex items-center gap-3">
                                  <Package className="h-5 w-5 text-muted-foreground shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold">{opt.name || opt.company?.name}</p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                      Passa pelo HUB para certificação de autenticidade
                                    </p>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                      <Clock className="h-3 w-3" />
                                      <span>
                                        {minDays === maxDays
                                          ? `${maxDays} dias úteis`
                                          : `${minDays} a ${maxDays} dias úteis`
                                        }
                                      </span>
                                    </div>
                                  </div>
                                  <p className={cn(
                                    "text-base font-bold whitespace-nowrap",
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

                    <div className="flex gap-3 pt-2">
                      <Button variant="outline" onClick={() => setStep("address")} className="gap-1.5 rounded-xl">
                        <ArrowLeft className="h-4 w-4" /> Voltar
                      </Button>
                      <Button
                        onClick={() => setStep("payment")}
                        disabled={!selectedFreight}
                        className="flex-1 btn-gold gap-2 h-12 text-sm font-bold rounded-xl"
                        size="lg"
                      >
                        Continuar para pagamento
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* ===== PAYMENT ===== */}
                {step === "payment" && (
                  <div className="bg-background rounded-2xl border border-border/20 p-5 space-y-5">
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <h2 className="font-bold text-base">Forma de pagamento</h2>
                    </div>

                    {/* Payment method selector */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: "pix", label: "PIX", desc: "Aprovação instantânea", icon: "💚" },
                        { value: "card", label: "Cartão", desc: "Até 12x com juros", icon: "💳" },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => updateField("payment_method", opt.value)}
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

                    {/* Card form */}
                    {form.payment_method === "card" && (
                      <UnifiedCardForm
                        amount={baseTotalPrice}
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
                    <div className="p-3.5 bg-secondary/30 rounded-xl text-xs space-y-1.5 border border-border/10">
                      <p className="font-medium text-foreground text-sm mb-1.5 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary" /> Entrega
                      </p>
                      <p className="text-muted-foreground">{buildAddressString()}</p>
                      <p className="text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        Prazo: {selectedFreight?.delivery_time} dia{selectedFreight && selectedFreight.delivery_time !== 1 ? "s" : ""} útei{selectedFreight && selectedFreight.delivery_time !== 1 ? "s" : ""}
                      </p>
                    </div>

                    {/* Trust */}
                    <div className="p-3.5 bg-primary/5 border border-primary/15 rounded-xl text-xs text-muted-foreground space-y-1">
                      <p>🔒 <strong>Compra protegida:</strong> 7 dias úteis para reportar problemas após a entrega.</p>
                      <p>📦 O vendedor recebe após o período de proteção.</p>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button variant="outline" onClick={() => setStep("freight")} className="gap-1.5 rounded-xl">
                        <ArrowLeft className="h-4 w-4" /> Voltar
                      </Button>
                      <Button
                        onClick={handleSubmitPayment}
                        disabled={isSubmitting || (form.payment_method === "card" && !isCardValid)}
                        className="flex-1 btn-gold gap-2 h-12 text-sm font-bold rounded-xl"
                        size="lg"
                      >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                        {`Pagar — R$ ${displayTotalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                      </Button>
                    </div>
                  </div>
                )}

                {/* ===== PROCESSING ===== */}
                {step === "processing" && (
                  <div className="bg-background rounded-2xl border border-border/20 p-8 flex flex-col items-center text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <h2 className="font-bold text-lg mb-1">Processando pagamento</h2>
                    <p className="text-sm text-muted-foreground">
                      Item {processingIndex + 1} de {group.items.length}
                    </p>
                    {paymentError && (
                      <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
                        {paymentError}
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => setStep("payment")}>
                          Tentar novamente
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* ===== SUCCESS ===== */}
                {step === "success" && (
                  <div className="bg-background rounded-2xl border border-border/20 p-8 space-y-6">
                    <div className="text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-green-500/10 mb-4"
                      >
                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                      </motion.div>
                      <h2 className="font-bold text-xl mb-1">
                        {form.payment_method === "pix" ? "PIX gerado!" : "Pagamento aprovado!"}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {paymentResults.filter(r => !r.error).length} pedido{paymentResults.filter(r => !r.error).length !== 1 ? "s" : ""} criado{paymentResults.filter(r => !r.error).length !== 1 ? "s" : ""}
                      </p>
                    </div>

                    {/* PIX data */}
                    {form.payment_method === "pix" && pixData?.copy_paste && (
                      <div className="space-y-3">
                        {pixData.qr_code && (
                          <div className="flex justify-center">
                            <img src={`data:image/png;base64,${pixData.qr_code}`} alt="QR Code PIX" className="w-48 h-48 rounded-xl border border-border/20" />
                          </div>
                        )}
                        <div className="relative">
                          <Input
                            readOnly
                            value={pixData.copy_paste}
                            className="pr-20 text-xs font-mono"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute right-1 top-1 h-7 text-xs gap-1"
                            onClick={handleCopyPix}
                          >
                            {pixCopied ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                            {pixCopied ? "Copiado!" : "Copiar"}
                          </Button>
                        </div>
                        <p className="text-xs text-center text-muted-foreground">
                          ⚠️ Pague todos os PIX para confirmar seus pedidos. Cada item gera um pagamento separado.
                        </p>
                      </div>
                    )}

                    {/* Order codes */}
                    <div className="space-y-2">
                      {paymentResults.filter(r => !r.error).map((r, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl border border-border/10">
                          <div className="flex items-center gap-2.5">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium">
                              {r.item?.offer?.product ? `${r.item.offer.product.brand} ${r.item.offer.product.model}` : "Item"}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            {r.order?.order_code || "—"}
                          </Badge>
                        </div>
                      ))}
                      {paymentResults.filter(r => r.error).map((r, i) => (
                        <div key={`err-${i}`} className="flex items-center justify-between p-3 bg-destructive/5 rounded-xl border border-destructive/10">
                          <div className="flex items-center gap-2.5">
                            <AlertCircle className="h-4 w-4 text-destructive" />
                            <span className="text-sm text-destructive">{r.error}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 rounded-xl h-11"
                        onClick={() => navigate("/app/pedidos")}
                      >
                        Ver meus pedidos
                      </Button>
                      <Button
                        className="flex-1 btn-gold rounded-xl h-11"
                        onClick={() => navigate("/marketplace")}
                      >
                        Continuar comprando
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right column: Order summary (desktop sidebar) */}
          {step !== "processing" && step !== "success" && (
            <div className="hidden lg:block">
              <div className="sticky top-20 bg-background rounded-2xl border border-border/20 p-5 space-y-4">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  Resumo do pedido
                </h3>

                <div className="space-y-3">
                  {group.items.map(item => {
                    const offer = item.offer;
                    if (!offer) return null;
                    const name = offer.product ? `${offer.product.brand} ${offer.product.model}` : "Produto";
                    return (
                      <div key={item.id} className="flex items-center gap-2.5 text-sm">
                        <span className="flex-1 truncate text-muted-foreground">{name} ({offer.size})</span>
                        <span className="font-medium whitespace-nowrap">
                          R$ {offer.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal ({group.items.length} {group.items.length === 1 ? "item" : "itens"})</span>
                    <span>R$ {itemsSubtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  {shippingCost > 0 ? (
                    <div className="flex justify-between text-muted-foreground">
                      <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> Frete</span>
                      <span>R$ {shippingCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </div>
                  ) : step !== "review" && (
                    <div className="flex justify-between text-muted-foreground/50">
                      <span>Frete</span>
                      <span>A calcular</span>
                    </div>
                  )}
                  {cardInterestRate > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Juros cartão</span>
                      <span>R$ {(displayTotalPrice - baseTotalPrice).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between items-baseline">
                  <span className="font-bold">Total</span>
                  <span className="text-xl font-black text-primary">
                    R$ {displayTotalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Trust badges */}
                <div className="pt-3 border-t border-border/10 space-y-2">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                    Compra protegida por 7 dias úteis
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Lock className="h-3.5 w-3.5 text-primary shrink-0" />
                    Pagamento 100% seguro
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile order summary (collapsible at bottom) */}
        {step !== "processing" && step !== "success" && (
          <div className="lg:hidden mt-6 bg-background rounded-2xl border border-border/20 p-4">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground">{group.items.length} {group.items.length === 1 ? "item" : "itens"} · {group.sellerName}</span>
              <span className="text-lg font-black text-primary">
                R$ {displayTotalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
            {shippingCost === 0 && step !== "review" && (
              <p className="text-[10px] text-muted-foreground/60 text-right">+ frete</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function MarketplaceCheckoutPage() {
  const { profile } = useClientSession();
  const cpf = profile?.cpf || null;
  return (
    <CartProvider cpf={cpf}>
      <MarketplaceCheckoutPageInner />
    </CartProvider>
  );
}
