import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Award, Crown, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface SellerTierBadgeProps {
  tier: string;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

const tierConfig: Record<string, { label: string; icon: any; className: string }> = {
  bronze: {
    label: "Bronze",
    icon: ShieldCheck,
    className: "bg-amber-900/20 text-amber-600 border-amber-700/30",
  },
  prata: {
    label: "Prata",
    icon: Award,
    className: "bg-slate-300/20 text-slate-400 border-slate-400/30",
  },
  ouro: {
    label: "Ouro",
    icon: Star,
    className: "bg-primary/20 text-primary border-primary/30",
  },
  elite: {
    label: "Elite",
    icon: Crown,
    className: "bg-cyan-400/20 text-cyan-400 border-cyan-400/30",
  },
};

export function SellerTierBadge({ tier, size = "sm", showLabel = true, className }: SellerTierBadgeProps) {
  const config = tierConfig[tier] || tierConfig.bronze;
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        config.className,
        size === "sm" ? "text-[10px] px-1.5 py-0 gap-0.5" : "text-xs px-2 py-0.5 gap-1",
        className
      )}
    >
      <Icon className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
      {showLabel && config.label}
    </Badge>
  );
}
