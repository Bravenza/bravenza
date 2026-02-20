import { memo, useEffect, useState } from "react";
import { Coins, TrendingUp, Gift } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface LoyaltyBalance {
  current_balance: number;
  total_earned: number;
  total_redeemed: number;
  tier: string;
}

const tierConfig: Record<string, { label: string; color: string; icon: string; nextTier: string; nextAt: number }> = {
  bronze: { label: "Bronze", color: "text-amber-600", icon: "🥉", nextTier: "Silver", nextAt: 2000 },
  silver: { label: "Silver", color: "text-slate-400", icon: "🥈", nextTier: "Gold", nextAt: 5000 },
  gold: { label: "Gold", color: "text-primary", icon: "🥇", nextTier: "Platinum", nextAt: 10000 },
  platinum: { label: "Platinum", color: "text-cyan-400", icon: "💎", nextTier: "", nextAt: 0 },
};

interface LoyaltyPointsWidgetProps {
  clientCpf: string;
  compact?: boolean;
  className?: string;
}

function LoyaltyPointsWidgetComponent({ clientCpf, compact = false, className }: LoyaltyPointsWidgetProps) {
  const [balance, setBalance] = useState<LoyaltyBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const { data } = await supabase
          .from("marketplace_loyalty_balance" as any)
          .select("*")
          .eq("client_cpf", clientCpf)
          .maybeSingle();
        setBalance(data as any);
      } catch {
        // No balance yet
      } finally {
        setLoading(false);
      }
    };
    if (clientCpf) fetchBalance();
  }, [clientCpf]);

  if (loading || !balance) {
    if (compact) return null;
    return (
      <Card className="card-premium">
        <CardContent className="p-4 text-center">
          <Coins className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-xs text-muted-foreground">
            Compre no marketplace para acumular pontos!
          </p>
        </CardContent>
      </Card>
    );
  }

  const tier = tierConfig[balance.tier] || tierConfig.bronze;
  const progress = tier.nextAt > 0
    ? Math.min((balance.total_earned / tier.nextAt) * 100, 100)
    : 100;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Coins className="h-4 w-4 text-primary" />
        <span className="font-bold text-sm">{balance.current_balance.toLocaleString("pt-BR")}</span>
        <span className="text-xs text-muted-foreground">pts</span>
        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", tier.color)}>
          {tier.icon} {tier.label}
        </Badge>
      </div>
    );
  }

  return (
    <Card className={cn("card-premium overflow-hidden", className)}>
      {/* Gold gradient top */}
      <div className="h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Coins className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Meus Pontos</p>
              <p className="text-2xl font-black tracking-tight">{balance.current_balance.toLocaleString("pt-BR")}</p>
            </div>
          </div>
          <Badge variant="outline" className={cn("text-xs px-2.5 py-1 gap-1", tier.color)}>
            {tier.icon} {tier.label}
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/30">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            <div>
              <p className="text-[10px] text-muted-foreground">Ganhos</p>
              <p className="text-sm font-bold">{balance.total_earned.toLocaleString("pt-BR")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/30">
            <Gift className="h-3.5 w-3.5 text-pink-500" />
            <div>
              <p className="text-[10px] text-muted-foreground">Resgatados</p>
              <p className="text-sm font-bold">{balance.total_redeemed.toLocaleString("pt-BR")}</p>
            </div>
          </div>
        </div>

        {/* Tier progress */}
        {tier.nextTier && (
          <div>
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Próximo: {tier.nextTier}</span>
              <span>{balance.total_earned.toLocaleString("pt-BR")}/{tier.nextAt.toLocaleString("pt-BR")}</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        <p className="text-[10px] text-muted-foreground text-center">
          1 ponto = R$ 0,01 em desconto • Membros Vault ganham 1.5x
        </p>
      </CardContent>
    </Card>
  );
}

export const LoyaltyPointsWidget = memo(LoyaltyPointsWidgetComponent);
