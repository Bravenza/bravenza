import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useClientSession } from "@/hooks/useClientSession";
import { useMarketplace } from "@/hooks/useMarketplace";
import { tokenizeCard, type UnifiedCardFormData } from "@/components/payment/UnifiedCardForm";
import { MERCADO_PAGO_RATES } from "@/lib/budget-calculator";
import { getMarketplaceHeaders } from "@/hooks/marketplace/api";
import type { CartGroup, CartItem } from "@/hooks/useMarketplaceCart";
import { CartProvider, useMarketplaceCart } from "@/hooks/useMarketplaceCart";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCartAbandonment } from "@/hooks/useCartAbandonment";

import { CheckoutHeader } from "./checkout/CheckoutHeader";
import { CheckoutStepper } from "./checkout/CheckoutStepper";
import { ReviewStep } from "./checkout/ReviewStep";
import { AddressStep } from "./checkout/AddressStep";
import { FreightStep } from "./checkout/FreightStep";
import { PaymentStep } from "./checkout/PaymentStep";
import { ProcessingStep } from "./checkout/ProcessingStep";
import { SuccessStep } from "./checkout/SuccessStep";
import { OrderSummaryDesktop, OrderSummaryMobile } from "./checkout/OrderSummary";
import {
  type Step, type FreightOption, type CheckoutFormData,
  formatCep, HUB_FREIGHT_SURCHARGE, CHECKOUT_STORAGE_KEY,
} from "./checkout/types";

function MarketplaceCheckoutPageInner() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useClientSession();
  const cpf = profile?.cpf || null;
  const { createOrder } = useMarketplace(cpf);
  const { removeFromCart } = useMarketplaceCart();
  const submitLockRef = useRef(false);

  // Restore group from location.state or sessionStorage
  const group: CartGroup | null = (() => {
    if (location.state?.group) {
      try { sessionStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(location.state.group)); } catch {}
      return location.state.group;
    }
    try {
      const saved = sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  })();

  // Cart abandonment detection
  const cartItemsForAbandonment = useMemo(() => {
    if (!group) return [];
    return group.items.map((item: CartItem) => ({
      product_name: `${item.offer?.product?.brand || ""} ${item.offer?.product?.model || ""}`.trim(),
      price: item.offer?.price || 0,
      size: item.offer?.size || "",
      offer_id: item.offer_id,
    }));
  }, [group]);
  const { markCompleted } = useCartAbandonment(cpf, cartItemsForAbandonment);

  const [step, setStep] = useState<Step>("review");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingFreight, setIsLoadingFreight] = useState(false);
  const [freightOptions, setFreightOptions] = useState<FreightOption[]>([]);
  const [selectedFreight, setSelectedFreight] = useState<FreightOption | null>(null);
  const [freightError, setFreightError] = useState<string | null>(null);
  const [cardFormData, setCardFormData] = useState<UnifiedCardFormData | null>(null);
  const [isCardValid, setIsCardValid] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [pixData, setPixData] = useState<{ qr_code?: string; copy_paste?: string; expiration?: string } | null>(null);
  const [orderCodes, setOrderCodes] = useState<string[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<string | undefined>();
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);

  const [form, setForm] = useState<CheckoutFormData>({
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

  // Load saved addresses
  useEffect(() => {
    if (!profile?.user_id) return;
    supabase
      .from("client_addresses")
      .select("*")
      .eq("user_id", profile.user_id)
      .order("is_default", { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setSavedAddresses(data);
          const defaultAddr = data.find(a => a.is_default) || data[0];
          setForm(prev => ({
            ...prev,
            address_cep: formatCep(defaultAddr.cep),
            address_street: defaultAddr.street,
            address_number: defaultAddr.number,
            address_complement: defaultAddr.complement || "",
            address_neighborhood: defaultAddr.neighborhood,
            address_city: defaultAddr.city,
            address_state: defaultAddr.state,
          }));
        }
      });
  }, [profile?.user_id]);

  useEffect(() => {
    if (profile) {
      setForm(prev => ({
        ...prev,
        buyer_name: profile.full_name || prev.buyer_name,
        buyer_phone: profile.phone || prev.buyer_phone,
      }));
    }
  }, [profile]);

  useEffect(() => {
    if (!group || group.items.length === 0) {
      navigate("/app", { replace: true });
    }
  }, [group, navigate]);

  useEffect(() => {
    return () => {
      if (step === "success") {
        try { sessionStorage.removeItem(CHECKOUT_STORAGE_KEY); } catch {}
      }
    };
  }, [step]);

  const itemsSubtotal = group?.subtotal ?? 0;
  const shippingCost = selectedFreight ? parseFloat(selectedFreight.price) : 0;
  const baseTotalPrice = itemsSubtotal + shippingCost;

  const interestFreeMax = useMemo(() => {
    if (!group?.items?.length) return 0;
    return group.items.reduce((min, item) => {
      const ifMax = item.offer?.interest_free_installments || 0;
      return min === -1 ? ifMax : Math.min(min, ifMax);
    }, -1 as number);
  }, [group?.items]);
  const effectiveInterestFreeMax = interestFreeMax === -1 ? 0 : interestFreeMax;

  const cardInterestRate = (form.payment_method === "card" && cardFormData)
    ? (effectiveInterestFreeMax > 0 && cardFormData.installments <= effectiveInterestFreeMax
        ? 0
        : (MERCADO_PAGO_RATES[cardFormData.installments] || 0))
    : 0;
  const displayTotalPrice = cardInterestRate > 0
    ? Math.round((baseTotalPrice / (1 - cardInterestRate)) * 100) / 100
    : baseTotalPrice;

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const applySavedAddress = (addr: any) => {
    setForm(prev => ({
      ...prev,
      address_cep: formatCep(addr.cep),
      address_street: addr.street,
      address_number: addr.number,
      address_complement: addr.complement || "",
      address_neighborhood: addr.neighborhood,
      address_city: addr.city,
      address_state: addr.state,
    }));
  };

  const fetchFreightQuotes = useCallback(async () => {
    if (!group?.items?.length) return;
    setIsLoadingFreight(true);
    setFreightError(null);
    setFreightOptions([]);
    setSelectedFreight(null);
    try {
      const headers = await getMarketplaceHeaders();
      const params = new URLSearchParams({ action: "freight-quote" });
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mkv2-discover?${params}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          listing_id: group.items[0].offer.id,
          listing_ids: group.items.map(i => i.offer?.id).filter(Boolean),
          buyer_cep: form.address_cep.replace(/\D/g, ""),
          items_count: group.items.length,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(errData.error || "Erro ao calcular frete");
      }
      const parsed = await res.json();
      if (parsed.error) throw new Error(parsed.error);
      const opts = (parsed.quotes || []).filter((q: any) => q.price && !q.error);
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
    } catch (err) {
      setFreightError(err instanceof Error ? err.message : "Erro ao calcular frete.");
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
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setIsSubmitting(true);
    setPaymentError(null);
    setStep("processing");

    const address = buildAddressString();

    try {
      const validItems = group.items.filter(item => !!item.offer);

      // Parallel order creation with Promise.allSettled
      const orderResults = await Promise.allSettled(
        validItems.map(item =>
          createOrder({
            listing_id: item.offer!.id,
            buyer_name: form.buyer_name,
            buyer_email: form.buyer_email,
            buyer_phone: form.buyer_phone,
            buyer_address: address,
            payment_method: form.payment_method,
            shipping_cost: shippingCost / validItems.length,
          }).then(result => {
            if (!result?.id) {
              throw new Error(`Erro ao criar pedido para ${item.offer?.product?.brand || "item"}`);
            }
            return { id: result.id, order_code: result.order_code, item };
          })
        )
      );

      const failed = orderResults.filter((r): r is PromiseRejectedResult => r.status === "rejected");
      if (failed.length === validItems.length) {
        throw new Error(failed[0].reason?.message || "Erro ao criar pedidos");
      }
      if (failed.length > 0) {
        const createdCount = validItems.length - failed.length;
        const ok = window.confirm(
          `${failed.length} item(ns) não puderam ser processados ` +
          `e serão removidos do checkout. ` +
          `Deseja continuar com os ${createdCount} itens restantes?`
        );
        if (!ok) {
          setStep("review");
          setIsSubmitting(false);
          submitLockRef.current = false;
          return;
        }
      }

      const createdOrders = orderResults
        .filter((r): r is PromiseFulfilledResult<{ id: string; order_code: string; item: CartItem }> => r.status === "fulfilled")
        .map(r => r.value);

      const sortedIds = createdOrders.map(o => o.id).sort();
      const idempKey = `mkt-${sortedIds.join("-")}-${form.payment_method}`;
      const checkoutBody: Record<string, any> = {
        order_ids: sortedIds,
        payment_method: form.payment_method,
        payer_email: form.buyer_email,
        idempotency_key: idempKey,
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
        } catch (tokenErr) {
          throw new Error(tokenErr instanceof Error ? tokenErr.message : "Erro ao processar cartão");
        }
      }

      const { marketplaceRequest } = await import("@/hooks/marketplace/api");
      const payData = await marketplaceRequest(cpf || "", "checkout", "POST", checkoutBody);

      if (payData.error) {
        throw new Error(payData.error || "Erro no pagamento");
      }

      if (form.payment_method === "pix" && payData.pix_copy_paste) {
        setPixData({
          qr_code: payData.pix_qr_code,
          copy_paste: payData.pix_copy_paste,
          expiration: payData.pix_expiration,
        });
      }

      setOrderCodes(payData.order_codes || createdOrders.map(o => o.order_code));
      setPaymentStatus(payData.status);

      await Promise.allSettled(createdOrders.map(co => removeFromCart(co.item.offer_id)));

      await markCompleted();
      setStep("success");
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : "Erro inesperado no pagamento");
    } finally {
      setIsSubmitting(false);
      submitLockRef.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex flex-col">
      <CheckoutHeader />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 pb-32 md:pb-8">
        <CheckoutStepper currentStep={step} />

        <div className="grid gap-6 lg:grid-cols-[1fr,340px]">
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {step === "review" && (
                  <ReviewStep group={group} onNext={() => setStep("address")} />
                )}

                {step === "address" && (
                  <AddressStep
                    form={form}
                    savedAddresses={savedAddresses}
                    onUpdateField={updateField}
                    onApplySavedAddress={applySavedAddress}
                    onBack={() => setStep("review")}
                    onNext={handleGoToFreight}
                  />
                )}

                {step === "freight" && (
                  <FreightStep
                    isLoading={isLoadingFreight}
                    error={freightError}
                    options={freightOptions}
                    selected={selectedFreight}
                    onSelect={setSelectedFreight}
                    onRetry={fetchFreightQuotes}
                    onBack={() => setStep("address")}
                    onNext={() => setStep("payment")}
                  />
                )}

                {step === "payment" && (
                  <PaymentStep
                    form={form}
                    baseTotalPrice={baseTotalPrice}
                    displayTotalPrice={displayTotalPrice}
                    effectiveInterestFreeMax={effectiveInterestFreeMax}
                    selectedFreight={selectedFreight}
                    isSubmitting={isSubmitting}
                    isCardValid={isCardValid}
                    onUpdateField={updateField}
                    onCardDataChange={(data, valid) => { setCardFormData(data); setIsCardValid(valid); }}
                    buildAddressString={buildAddressString}
                    onBack={() => setStep("freight")}
                    onSubmit={handleSubmitPayment}
                  />
                )}

                {step === "processing" && (
                  <ProcessingStep
                    error={paymentError}
                    itemsCount={group.items.length}
                    onRetry={() => { setPaymentError(null); setStep("payment"); }}
                  />
                )}

                {step === "success" && (
                  <SuccessStep
                    paymentMethod={form.payment_method}
                    paymentStatus={paymentStatus}
                    orderCodes={orderCodes}
                    group={group}
                    pixData={pixData}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <OrderSummaryDesktop
            group={group}
            step={step}
            itemsSubtotal={itemsSubtotal}
            shippingCost={shippingCost}
            cardInterestRate={cardInterestRate}
            displayTotalPrice={displayTotalPrice}
            baseTotalPrice={baseTotalPrice}
          />
        </div>

        <OrderSummaryMobile
          group={group}
          step={step}
          shippingCost={shippingCost}
          displayTotalPrice={displayTotalPrice}
        />
      </main>
    </div>
  );
}

export default function MarketplaceCheckoutPage() {
  const { profile, isLoading, user } = useClientSession();
  const navigate = useNavigate();
  const cpf = profile?.cpf || null;

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/app?login=true", { replace: true });
    }
  }, [isLoading, user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <CartProvider cpf={cpf}>
      <MarketplaceCheckoutPageInner />
    </CartProvider>
  );
}
