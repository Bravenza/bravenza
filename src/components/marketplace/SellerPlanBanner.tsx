import { useNavigate } from "react-router-dom";
import { Rocket, Shield, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SellerPlanStatus } from "@/hooks/marketplace/useSellerPlan";

const planIcons: Record<string, any> = { free: Shield, pro: Zap, elite: Crown };
const planLabels: Record<string, string> = { free: "Vault Free", pro: "Seller Pro", elite: "Seller Elite" };

interface SellerPlanBannerProps {
  status: SellerPlanStatus;
}

export function SellerPlanBanner({ status }: SellerPlanBannerProps) {
  const navigate = useNavigate();
  const planId = status.plan?.id || "free";
  const Icon = planIcons[planId] || Shield;
  const isElite = planId === "elite";

  const activePercent = status.maxActive
    ? Math.min(100, (status.activeCount / status.maxActive) * 100)
    : 0;
  const monthlyPercent = status.maxMonthlyNew
    ? Math.min(100, (status.monthlyNewCount / status.maxMonthlyNew) * 100)
    : 0;

  return (
    <div className={cn(
      "rounded-2xl border p-4 space-y-3",
      isElite ? "border-primary/30 bg-primary/5" : "border-border/20 bg-card/50"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", isElite ? "text-primary" : "text-muted-foreground")} />
          <span className="text-sm font-bold">{planLabels[planId]}</span>
          <Badge variant="outline" className="text-[10px]">
            {status.plan?.fee_percent}% comissão
          </Badge>
        </div>
        {!isElite && (
          <Button
            size="sm"
            variant="outline"
            className="text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
            onClick={() => navigate("/marketplace/planos")}
          >
            <Rocket className="h-3 w-3" />
            Upgrade
          </Button>
        )}
      </div>

      {/* Usage bars */}
      {status.maxActive !== null && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Anúncios ativos</span>
            <span>{status.activeCount}/{status.maxActive}</span>
          </div>
          <Progress value={activePercent} className="h-1.5" />
        </div>
      )}
      {status.maxMonthlyNew !== null && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Novos este mês</span>
            <span>{status.monthlyNewCount}/{status.maxMonthlyNew}</span>
          </div>
          <Progress value={monthlyPercent} className="h-1.5" />
        </div>
      )}

      {/* SLA info */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>⏱️ Suporte SLA:</span>
        <span className="font-medium">
          {status.plan?.support_sla_hours
            ? status.plan.support_sla_hours <= 24
              ? "Até 24h"
              : status.plan.support_sla_hours <= 48
                ? "24-48h"
                : "48-72h"
            : "48-72h"}
        </span>
        {status.plan?.boost_slots && (
          <>
            <span className="text-border">|</span>
            <span>🚀 Boosts: {status.plan.boost_slots}</span>
          </>
        )}
      </div>

      {isElite && (
        <p className="text-xs text-primary/70">✨ Anúncios e criações ilimitados • Vitrine e coleções • Selo Verificada</p>
      )}
    </div>
  );
}
