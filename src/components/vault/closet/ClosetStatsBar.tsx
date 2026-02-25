import { Box, Heart, Star, ShoppingBag } from "lucide-react";

interface ClosetStatsBarProps {
  collectionCount: number;
  favoritesCount: number;
  reviewsCount: number;
  totalValue: number;
}

export function ClosetStatsBar({ collectionCount, favoritesCount, reviewsCount, totalValue }: ClosetStatsBarProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);

  return (
    <div className="grid grid-cols-4 gap-2">
      <StatItem icon={Box} label="Coleção" value={String(collectionCount)} />
      <StatItem icon={Heart} label="Favoritos" value={String(favoritesCount)} />
      <StatItem icon={Star} label="Avaliações" value={String(reviewsCount)} />
      <StatItem icon={ShoppingBag} label="Valor total" value={formatCurrency(totalValue)} highlight />
    </div>
  );
}

function StatItem({ icon: Icon, label, value, highlight }: { icon: React.ElementType; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-secondary/40 border border-border/30 py-3 px-2">
      <Icon className={`h-4 w-4 ${highlight ? "text-primary" : "text-muted-foreground"}`} />
      <span className={`text-sm font-bold ${highlight ? "text-primary" : "text-foreground"}`}>{value}</span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  );
}
