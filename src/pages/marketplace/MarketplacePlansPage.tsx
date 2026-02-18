import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Check, X, Crown, Zap, Shield, Rocket, Star, ArrowRight,
  Package, Percent, Gauge, Headphones, Sparkles, Loader2, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useSellerPlan, type MarketplacePlan, type FeeTier } from "@/hooks/marketplace/useSellerPlan";
import { useMarketplace } from "@/hooks/useMarketplace";
import { toast } from "sonner";

const planIcons: Record<string, any> = {
  free: Shield,
  pro: Zap,
  elite: Crown,
};

const planColors: Record<string, string> = {
  free: "border-border/30",
  pro: "border-primary/40 ring-1 ring-primary/20",
  elite: "border-primary ring-2 ring-primary/30",
};

const planBg: Record<string, string> = {
  free: "",
  pro: "bg-gradient-to-b from-primary/5 to-transparent",
  elite: "bg-gradient-to-b from-primary/10 to-transparent",
};

const highlightFeatures = [
  { key: "fee", label: "Comissão por venda", icon: Percent },
  { key: "active", label: "Anúncios ativos", icon: Package },
  { key: "new", label: "Novos anúncios/mês", icon: Sparkles },
  { key: "boost", label: "Boost / destaques", icon: Rocket, paidOnly: true },
  { key: "sla", label: "Suporte SLA", icon: Headphones },
  { key: "storefront", label: "Vitrine / coleções", icon: Star },
  { key: "badge", label: "Selo Loja Verificada", icon: Shield },
  { key: "batch", label: "Ferramentas de lote", icon: Gauge },
  { key: "search", label: "Prioridade na busca", icon: Zap },
];

function getFeatureValue(plan: MarketplacePlan, key: string, feeTiers: FeeTier[]): string | boolean {
  switch (key) {
    case "fee": {
      const tiers = feeTiers.filter(t => t.plan_id === plan.id);
      const maxDiscount = tiers.length > 0 ? Math.max(...tiers.map(t => t.fee_discount)) : 0;
      if (plan.id === "free" || maxDiscount === 0) return `${plan.fee_percent}%`;
      return `${plan.fee_percent}% → ${plan.fee_percent - maxDiscount}%`;
    }
    case "active": return plan.max_active_listings === null ? "Ilimitado" : String(plan.max_active_listings);
    case "new": return plan.max_new_listings_month === null ? "Ilimitado" : `${plan.max_new_listings_month}/mês`;
    case "boost": return plan.id === "free" ? false : `${plan.boost_slots} slot${plan.boost_slots > 1 ? "s" : ""}`;
    case "sla": return plan.support_sla_hours <= 24 ? "Até 24h" : plan.support_sla_hours <= 48 ? "24-48h" : "48-72h";
    case "storefront": return plan.has_storefront;
    case "badge": return plan.has_verified_badge;
    case "batch": return plan.has_batch_tools;
    case "search": return plan.has_priority_search;
    default: return false;
  }
}

export default function MarketplacePlansPage() {
  const context = useOutletContext<{ cpf?: string; profile?: any }>();
  const navigate = useNavigate();
  const cpf = context?.cpf;
  const isLoggedIn = !!cpf && cpf !== "visitor";

  const { seller } = useMarketplace(cpf || null);
  const {
    plans, feeTiers, status, subscription, isSubscribing,
    subscribe, cancelSubscription, fetchSubscription,
  } = useSellerPlan(seller?.id || null);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const currentPlanId = status?.plan?.id || "free";
  const hasActiveSubscription = subscription?.status === "active" && subscription?.plan_id !== "free";

  const handleSubscribe = async (planId: string) => {
    if (!isLoggedIn) {
      navigate("/entrar");
      return;
    }
    if (!seller) {
      toast.error("Complete o cadastro de vendedor primeiro.");
      navigate("/marketplace/loja");
      return;
    }
    setSelectedPlan(planId);
    setCheckoutOpen(true);
  };

  const handleConfirmSubscribe = async () => {
    if (!selectedPlan || !email) return;
    try {
      await subscribe(selectedPlan, email);
      toast.success("Redirecionando para o checkout do Mercado Pago...");
      setCheckoutOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao iniciar assinatura");
    }
  };

  const handleCancel = async () => {
    const ok = await cancelSubscription();
    if (ok) {
      toast.success("Assinatura será cancelada ao final do período.");
      setCancelConfirmOpen(false);
    } else {
      toast.error("Erro ao cancelar assinatura");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 pb-28 md:pb-12">
      {/* Header */}
      <div className="text-center mb-10">
        <Badge className="bg-primary/10 text-primary border-primary/20 mb-3 text-xs">
          Marketplace Bravenza
        </Badge>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight font-display mb-3">
          Escolha seu plano de vendedor
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Comece grátis e evolua conforme seu volume. Reduza comissões e desbloqueie ferramentas avançadas.
        </p>
      </div>

      {/* Active subscription banner */}
      {hasActiveSubscription && (
        <div className="mb-8 p-4 rounded-2xl border border-primary/20 bg-primary/5 flex items-center justify-between">
          <div>
            <p className="font-bold text-sm">
              Assinatura ativa: {subscription?.marketplace_plans?.name || subscription?.plan_id}
            </p>
            {subscription?.current_period_end && (
              <p className="text-xs text-muted-foreground">
                Próxima cobrança: {new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}
              </p>
            )}
            {subscription?.cancel_at_period_end && (
              <p className="text-xs text-warning">⚠️ Será cancelada ao final do período</p>
            )}
          </div>
          {!subscription?.cancel_at_period_end && (
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setCancelConfirmOpen(true)}>
              Cancelar assinatura
            </Button>
          )}
        </div>
      )}

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {plans.map((plan, i) => {
          const Icon = planIcons[plan.id] || Shield;
          const isCurrent = plan.id === currentPlanId;
          const isPopular = plan.id === "pro";

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className={cn(
                "relative overflow-hidden transition-all duration-300 hover:shadow-lg",
                planColors[plan.id],
                planBg[plan.id],
              )}>
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                    MAIS POPULAR
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute top-0 left-0 bg-success/20 text-success text-[10px] font-bold px-3 py-1 rounded-br-xl">
                    SEU PLANO
                  </div>
                )}

                <CardContent className="p-6 pt-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      plan.id === "elite" ? "bg-primary/20" : plan.id === "pro" ? "bg-primary/10" : "bg-muted"
                    )}>
                      <Icon className={cn("h-5 w-5", plan.id === "free" ? "text-muted-foreground" : "text-primary")} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{plan.name}</h3>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    {plan.price_monthly > 0 ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black">R$ {plan.price_monthly}</span>
                        <span className="text-sm text-muted-foreground">/mês</span>
                      </div>
                    ) : (
                      <div className="text-3xl font-black">Grátis</div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {plan.id === "free" ? (
                        `Comissão fixa de ${plan.fee_percent}%`
                      ) : (
                        <>Comissão de {plan.fee_percent}%, reduz com vendas</>
                      )}
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f: string, fi: number) => (
                      <li key={fi} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      Plano atual
                    </Button>
                  ) : plan.price_monthly > 0 ? (
                    <Button
                      className={cn("w-full gap-2", plan.id === "elite" ? "btn-gold" : "bg-primary text-primary-foreground hover:bg-primary/90")}
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={isSubscribing}
                    >
                      {isSubscribing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Assinar {plan.name}
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full" disabled>
                      Plano padrão
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Comparison Table */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-center mb-6">Comparação detalhada</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Recurso</th>
                {plans.map((plan) => (
                  <th key={plan.id} className="text-center py-3 px-4 font-bold">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {highlightFeatures.map((feat) => (
                <tr key={feat.key} className="border-b border-border/10">
                  <td className="py-3 px-4 flex items-center gap-2">
                    <feat.icon className="h-4 w-4 text-muted-foreground" />
                    {feat.label}
                  </td>
                  {plans.map((plan) => {
                    const val = getFeatureValue(plan, feat.key, feeTiers);
                    return (
                      <td key={plan.id} className="text-center py-3 px-4">
                        {typeof val === "boolean" ? (
                          val ? (
                            <Check className="h-4 w-4 text-primary mx-auto" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                          )
                        ) : (
                          <span className={cn(
                            "font-medium",
                            feat.key === "fee" && plan.id === "elite" ? "text-primary" : ""
                          )}>
                            {val}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Progressive Fee Table */}
      {feeTiers.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-center mb-2">Comissão progressiva por vendas</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Nos planos pagos, sua comissão diminui automaticamente conforme você vende mais.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Vendas realizadas</th>
                  {plans.map((plan) => (
                    <th key={plan.id} className="text-center py-3 px-4 font-bold">{plan.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[0, 10, 25, 50, 100].map((threshold) => (
                  <tr key={threshold} className="border-b border-border/10">
                    <td className="py-3 px-4 font-medium">
                      {threshold === 0 ? "0–9" : threshold === 10 ? "10–24" : threshold === 25 ? "25–49" : threshold === 50 ? "50–99" : "100+"}
                    </td>
                    {plans.map((plan) => {
                      const tier = feeTiers.find(t => t.plan_id === plan.id && t.min_sales === threshold);
                      const discount = tier?.fee_discount || 0;
                      const effectiveFee = plan.fee_percent - discount;
                      const isReduced = discount > 0;
                      return (
                        <td key={plan.id} className="text-center py-3 px-4">
                          <span className={cn("font-medium", isReduced ? "text-primary" : "")}>
                            {effectiveFee}%
                          </span>
                          {isReduced && (
                            <span className="text-[10px] text-muted-foreground ml-1">(-{discount}%)</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          Dúvidas? Fale com nosso suporte ou consulte as{" "}
          <a href="/regras-marketplace" className="text-primary underline">regras do marketplace</a>.
        </p>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assinar plano</DialogTitle>
            <DialogDescription>
              Você será redirecionado para o Mercado Pago para completar o pagamento recorrente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="payer-email">Email para pagamento</Label>
              <Input
                id="payer-email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button
              className="w-full btn-gold gap-2"
              onClick={handleConfirmSubscribe}
              disabled={isSubscribing || !email}
            >
              {isSubscribing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Rocket className="h-4 w-4" />
                  Ir para pagamento
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation */}
      <Dialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <DialogTitle>Cancelar assinatura?</DialogTitle>
            </div>
            <DialogDescription>
              Sua assinatura continuará ativa até o final do período atual. 
              Após isso, você voltará ao plano Free e seus anúncios excedentes serão pausados.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4 space-y-3">
            <Button variant="destructive" className="w-full" onClick={handleCancel}>
              Confirmar cancelamento
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setCancelConfirmOpen(false)}>
              Manter assinatura
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
