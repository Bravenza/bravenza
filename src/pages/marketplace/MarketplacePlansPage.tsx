import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Check, X, Crown, Zap, Shield, Rocket, Star, ArrowRight, ArrowDown,
  Package, Percent, Gauge, Headphones, Sparkles, Loader2, AlertTriangle,
  Store, BarChart3, TrendingDown, ShoppingBag, Eye, BadgeCheck, Layers,
  Timer, Bot
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
import plansHeroMockup from "@/assets/plans-hero-mockup.png";

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
  { key: "autocut", label: "AutoCut (redução automática)", icon: Bot },
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
    case "autocut": return plan.id !== "free";
    case "sla": return plan.support_sla_hours <= 24 ? "Até 24h" : plan.support_sla_hours <= 48 ? "24-48h" : "48-72h";
    case "storefront": return plan.has_storefront;
    case "badge": return plan.has_verified_badge;
    case "batch": return plan.has_batch_tools;
    case "search": return plan.has_priority_search;
    default: return false;
  }
}

/* ── Feature showcase sections ── */
const featureSections = [
  {
    icon: Store,
    title: "Vitrine Personalizada",
    description: "Crie sua loja virtual com a cara da sua marca. Personalize avatar, banner, bio e tagline. Compartilhe o link da sua loja e conquiste clientes exclusivos.",
    highlights: ["Link exclusivo da sua loja", "Personalização completa", "Catálogo filtrado de anúncios"],
    gradient: "from-primary/20 to-primary/5",
  },
  {
    icon: Bot,
    title: "AutoCut",
    badge: "Exclusivo",
    description: "Fique sempre na frente. Com o AutoCut você reduz preços automaticamente e vende mais rápido. Configure o valor mínimo e o intervalo — o sistema faz o resto.",
    highlights: ["Redução automática de preço", "Configuração de preço mínimo", "Venda mais rápido que a concorrência"],
    gradient: "from-accent/20 to-accent/5",
  },
  {
    icon: BarChart3,
    title: "Analytics Avançado",
    description: "Acompanhe o desempenho de suas vendas e anúncios de forma simples e prática. Dados de mercado para tomar decisões mais assertivas.",
    highlights: ["KPIs de conversão", "Funil de vendas", "Insights de mercado e tendências"],
    gradient: "from-primary/15 to-primary/5",
  },
  {
    icon: Layers,
    title: "Ferramentas de Lote",
    description: "Gerencie dezenas de anúncios de uma só vez. Edite preços, pause ou reative em massa. Economize tempo e foque no que importa: vender.",
    highlights: ["Edição em massa", "Pausa/reativação em lote", "Gestão profissional de estoque"],
    gradient: "from-muted to-muted/30",
  },
];

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

  const scrollToPlans = () => {
    document.getElementById("plans-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToFeatures = () => {
    document.getElementById("features-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="pb-28 md:pb-12">
      {/* ═══════════ HERO SECTION ═══════════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/30">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-4 text-xs font-bold">
              Bravenza Market+
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight font-display leading-[1.1] mb-5">
              Venda <span className="text-primary">MAIS</span> com ferramentas profissionais
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-md">
              Soluções avançadas de gerenciamento de anúncios, vendas otimizadas e um espaço de loja aprimorado.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="btn-gold text-base gap-2 h-12 px-8 rounded-xl font-bold" onClick={scrollToPlans}>
                Começar a usar <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="text-base h-12 px-8 rounded-xl font-semibold" onClick={scrollToFeatures}>
                <ArrowDown className="h-4 w-4 mr-2" /> Saiba mais
              </Button>
            </div>
          </motion.div>

          {/* Right: Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden md:block"
          >
            <img
              src={plansHeroMockup}
              alt="Bravenza Marketplace - Vitrine do vendedor"
              className="w-full rounded-2xl shadow-2xl"
            />
          </motion.div>
        </div>
      </section>

      {/* ═══════════ FEATURE SECTIONS ═══════════ */}
      <section id="features-section" className="max-w-6xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-black tracking-tight font-display mb-3">
            Profissionalize seu processo de venda
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Ferramentas únicas para você vender mais e melhor no marketplace da Bravenza.
          </p>
        </motion.div>

        <div className="space-y-20">
          {featureSections.map((feat, i) => {
            const Icon = feat.icon;
            const isReversed = i % 2 === 1;
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5 }}
                className={cn(
                  "grid md:grid-cols-2 gap-10 items-center",
                  isReversed && "md:direction-reverse"
                )}
              >
                {/* Icon card */}
                <div className={cn("order-2", isReversed ? "md:order-1" : "md:order-2")}>
                  <div className={cn(
                    "aspect-square max-w-[320px] mx-auto rounded-3xl bg-gradient-to-br flex items-center justify-center",
                    feat.gradient
                  )}>
                    <Icon className="h-24 w-24 text-primary/60" strokeWidth={1} />
                  </div>
                </div>

                {/* Text */}
                <div className={cn("order-1", isReversed ? "md:order-2" : "md:order-1")}>
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-2xl md:text-3xl font-black tracking-tight">{feat.title}</h3>
                    {feat.badge && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">{feat.badge}</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mb-6 text-base leading-relaxed">
                    {feat.description}
                  </p>
                  <ul className="space-y-2.5">
                    {feat.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-2.5 text-sm">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ═══════════ STATS BAR ═══════════ */}
      <section className="border-y border-border/20 bg-muted/20">
        <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "0%", label: "Fraudes registradas", icon: Shield },
            { value: "6 etapas", label: "Autenticação técnica", icon: BadgeCheck },
            { value: "8 dias", label: "Proteção ao comprador", icon: Timer },
            { value: "100%", label: "Vendas seguras", icon: ShoppingBag },
          ].map((stat) => (
            <div key={stat.label}>
              <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-black text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ PLANS SECTION ═══════════ */}
      <section id="plans-section" className="max-w-5xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight font-display mb-3">
            Planos e preços
          </h2>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan, i) => {
            const Icon = planIcons[plan.id] || Shield;
            const isCurrent = plan.id === currentPlanId;
            const isPopular = plan.id === "pro";

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className={cn(
                  "relative overflow-hidden transition-all duration-300 hover:shadow-lg h-full",
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

                  <CardContent className="p-6 pt-8 flex flex-col h-full">
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
                          <span className="text-3xl font-black">R$ {plan.price_monthly.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
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
                    <ul className="space-y-2.5 mb-6 flex-1">
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
      </section>

      {/* ═══════════ CTA: Crie sua loja ═══════════ */}
      <section className="bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <Store className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-black tracking-tight font-display mb-3">
            Crie sua loja virtual
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Personalize sua vitrine com a identidade da sua marca e comece a vender para colecionadores de todo o Brasil.
          </p>
          <Button
            size="lg"
            className="btn-gold text-base gap-2 h-12 px-10 rounded-xl font-bold"
            onClick={() => navigate("/marketplace/loja")}
          >
            <Rocket className="h-5 w-5" />
            Começar agora
          </Button>
        </div>
      </section>

      {/* ═══════════ DIALOGS ═══════════ */}
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
