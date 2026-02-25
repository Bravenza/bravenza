import { useNavigate } from "react-router-dom";
import { Rocket, Shield, Zap, Crown, ArrowRight, TrendingUp, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { SellerPlanStatus } from "@/hooks/marketplace/useSellerPlan";

const planConfig: Record<string, { icon: any; label: string; gradient: string; accent: string }> = {
  free: { icon: Shield, label: "Free", gradient: "from-muted/60 to-muted/30", accent: "text-muted-foreground" },
  pro: { icon: Zap, label: "Pro", gradient: "from-primary/15 to-primary/5", accent: "text-primary" },
  elite: { icon: Crown, label: "Elite", gradient: "from-primary/20 via-primary/10 to-primary/5", accent: "text-primary" },
};

interface SellerPlanBannerProps {
  status: SellerPlanStatus;
}

export function SellerPlanBanner({ status }: SellerPlanBannerProps) {
  const navigate = useNavigate();
  const planId = status.plan?.id || "free";
  const config = planConfig[planId] || planConfig.free;
  const Icon = config.icon;
  const isFree = planId === "free";
  const isElite = planId === "elite";

  const activePercent = status.maxActive ? Math.min(100, (status.activeCount / status.maxActive) * 100) : 0;
  const monthlyPercent = status.maxMonthlyNew ? Math.min(100, (status.monthlyNewCount / status.maxMonthlyNew) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={cn(
        "rounded-2xl border p-5 relative overflow-hidden",
        isElite ? "border-primary/30" : "border-border/30"
      )}
    >
      {/* Background gradient */}
      <div className={cn("absolute inset-0 bg-gradient-to-br", config.gradient)} />
      {isElite && <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle,hsl(var(--primary)/0.15),transparent_70%)]" />}

      <div className="relative z-10 space-y-4">
        {/* Plan header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              isElite ? "bg-primary/15" : isFree ? "bg-muted" : "bg-primary/10"
            )}>
              <Icon className={cn("h-5 w-5", config.accent)} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-tight">{config.label}</span>
                <Badge variant="outline" className={cn("text-[10px] font-bold", isElite && "border-primary/30 text-primary")}>
                  {status.plan?.fee_percent}% comissão
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                {status.plan?.support_sla_hours && (
                  <span className="text-[10px] text-muted-foreground">
                    Suporte: {status.plan.support_sla_hours <= 24 ? "24h" : status.plan.support_sla_hours <= 48 ? "48h" : "72h"}
                  </span>
                )}
                {status.plan?.boost_slots && status.plan.boost_slots > 0 && planId !== "free" && (
                  <span className="text-[10px] text-muted-foreground">
                    {status.plan.boost_slots} boost(s)
                  </span>
                )}
              </div>
            </div>
          </div>
          {!isElite && (
            <Button
              size="sm"
              className="btn-gold text-xs gap-1.5 rounded-full h-9 px-4 font-bold shadow-lg shadow-primary/20"
              onClick={() => navigate("/marketplace/planos")}
            >
              <Rocket className="h-3.5 w-3.5" />
              Upgrade
            </Button>
          )}
        </div>

        {/* Usage bars */}
        {(status.maxActive !== null || status.maxMonthlyNew !== null) && (
          <div className="grid grid-cols-2 gap-4">
            {status.maxActive !== null && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground font-medium">Anúncios ativos</span>
                  <span className="font-bold">{status.activeCount}/{status.maxActive}</span>
                </div>
                <Progress value={activePercent} className="h-2" />
              </div>
            )}
            {status.maxMonthlyNew !== null && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground font-medium">Novos este mês</span>
                  <span className="font-bold">{status.monthlyNewCount}/{status.maxMonthlyNew}</span>
                </div>
                <Progress value={monthlyPercent} className="h-2" />
              </div>
            )}
          </div>
        )}

        {isElite && (
          <div className="flex items-center gap-2 text-xs text-primary/80">
            <Star className="h-3.5 w-3.5" />
            <span>Anúncios ilimitados · Vitrine · Coleções · Selo Verificada</span>
          </div>
        )}

        {/* Upgrade CTA for free users */}
        {isFree && (
          <button
            onClick={() => navigate("/marketplace/planos")}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div className="text-left">
                <p className="text-xs font-bold">Reduza sua comissão para 8%</p>
                <p className="text-[10px] text-muted-foreground">Upgrade para Pro e desbloqueie ferramentas avançadas</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
