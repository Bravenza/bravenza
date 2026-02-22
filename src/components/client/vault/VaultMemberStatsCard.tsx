import { memo } from "react";
import { motion } from "framer-motion";
import { Calendar, TrendingUp, ShoppingBag, Award, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface VaultMemberStatsCardProps {
  member: {
    tier: "member" | "collector" | "elite";
    total_purchases: number;
    stats_spend_total_12m: number;
    stats_decision_rate: number;
    stats_converted_invites: number;
  };
  joinedAt?: string;
  collectionValue?: number;
}

const tierConfig = {
  member: { name: "Vault Access", rank: 3 },
  collector: { name: "Vault Privilege", rank: 2 },
  elite: { name: "Vault Black", rank: 1 },
};

export const VaultMemberStatsCard = memo(function VaultMemberStatsCard({
  member,
  joinedAt,
  collectionValue = 0,
}: VaultMemberStatsCardProps) {
  const memberSince = joinedAt
    ? formatDistanceToNow(new Date(joinedAt), { locale: ptBR, addSuffix: false })
    : "—";

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  const stats = [
    {
      icon: Calendar,
      label: "Membro há",
      value: memberSince,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: ShoppingBag,
      label: "Compras",
      value: String(member.total_purchases),
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      icon: TrendingUp,
      label: "Investido (12m)",
      value: formatCurrency(member.stats_spend_total_12m),
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      icon: Star,
      label: "Taxa de decisão",
      value: `${Math.round(member.stats_decision_rate)}%`,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/50 bg-card p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          Resumo do membro
        </h3>
        <span className="text-xs text-muted-foreground">
          Ranking: #{tierConfig[member.tier].rank} de 3
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl bg-muted/20 p-3 space-y-1"
          >
            <div className="flex items-center gap-1.5">
              <div className={`w-6 h-6 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`h-3 w-3 ${stat.color}`} />
              </div>
              <span className="text-[10px] text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-sm font-bold tracking-tight truncate">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {collectionValue > 0 && (
        <div className="rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/10 p-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Valor da coleção</span>
          <span className="text-sm font-bold text-primary">{formatCurrency(collectionValue)}</span>
        </div>
      )}
    </motion.div>
  );
});
