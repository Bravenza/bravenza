import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Check, X, Crown, Zap, Shield, Rocket, Star, ArrowRight,
  Package, Percent, Gauge, Headphones, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSellerPlan, type MarketplacePlan } from "@/hooks/marketplace/useSellerPlan";

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
  { key: "boost", label: "Boost / destaques", icon: Rocket },
  { key: "sla", label: "Suporte SLA", icon: Headphones },
  { key: "storefront", label: "Vitrine / coleções", icon: Star },
  { key: "badge", label: "Selo Loja Verificada", icon: Shield },
  { key: "batch", label: "Ferramentas de lote", icon: Gauge },
  { key: "search", label: "Prioridade na busca", icon: Zap },
];

function getFeatureValue(plan: MarketplacePlan, key: string): string | boolean {
  switch (key) {
    case "fee": return `${plan.fee_percent}%`;
    case "active": return plan.max_active_listings === null ? "Ilimitado" : String(plan.max_active_listings);
    case "new": return plan.max_new_listings_month === null ? "Ilimitado" : `${plan.max_new_listings_month}/mês`;
    case "boost": return `${plan.boost_slots} slot${plan.boost_slots > 1 ? "s" : ""}`;
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
  const { plans, status } = useSellerPlan(null); // fetch plans only

  const currentPlanId = status?.plan?.id || "free";

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
                      Comissão de {plan.fee_percent}% por venda
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
                    <Button className={cn("w-full gap-2", plan.id === "elite" ? "btn-gold" : "bg-primary text-primary-foreground hover:bg-primary/90")}>
                      Assinar {plan.name}
                      <ArrowRight className="h-4 w-4" />
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
                    const val = getFeatureValue(plan, feat.key);
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

      {/* FAQ */}
      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          Dúvidas? Fale com nosso suporte ou consulte as{" "}
          <a href="/regras-marketplace" className="text-primary underline">regras do marketplace</a>.
        </p>
      </div>
    </div>
  );
}
