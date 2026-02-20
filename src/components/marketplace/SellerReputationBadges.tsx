import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ShieldCheck, Zap, Star, Crown, ThumbsUp, Truck, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface SellerReputation {
  totalSales: number;
  averageRating: number | null;
  disputeRate?: number;
  verifiedBadge?: boolean;
  kycStatus?: string;
}

interface ReputationBadge {
  key: string;
  label: string;
  description: string;
  icon: typeof Star;
  className: string;
}

function getSellerLevel(sales: number): { level: string; label: string; icon: typeof Star; className: string; next?: string; salesForNext?: number } {
  if (sales >= 50) return { level: "elite", label: "Elite", icon: Crown, className: "bg-cyan-400/20 text-cyan-400 border-cyan-400/30" };
  if (sales >= 20) return { level: "top_seller", label: "Top Seller", icon: Star, className: "bg-primary/20 text-primary border-primary/30", next: "Elite", salesForNext: 50 };
  if (sales >= 5) return { level: "verificado", label: "Verificado", icon: ShieldCheck, className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", next: "Top Seller", salesForNext: 20 };
  return { level: "novato", label: "Novato", icon: Zap, className: "bg-muted text-muted-foreground border-border/50", next: "Verificado", salesForNext: 5 };
}

function getEarnedBadges(rep: SellerReputation): ReputationBadge[] {
  const badges: ReputationBadge[] = [];

  if (rep.averageRating && rep.averageRating >= 4.8 && rep.totalSales >= 10) {
    badges.push({
      key: "community_favorite",
      label: "Favorito",
      description: "Avaliação média acima de 4.8",
      icon: ThumbsUp,
      className: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    });
  }

  if (rep.disputeRate !== undefined && rep.disputeRate === 0 && rep.totalSales >= 5) {
    badges.push({
      key: "perfect_record",
      label: "100% Aprovado",
      description: "Nenhuma disputa registrada",
      icon: Award,
      className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    });
  }

  if (rep.verifiedBadge) {
    badges.push({
      key: "verified_pro",
      label: "PRO Verificado",
      description: "Identidade verificada e selo Elite",
      icon: ShieldCheck,
      className: "bg-cyan-400/20 text-cyan-400 border-cyan-400/30",
    });
  }

  return badges;
}

interface SellerReputationBadgesProps {
  totalSales: number;
  averageRating: number | null;
  disputeRate?: number;
  verifiedBadge?: boolean;
  kycStatus?: string;
  size?: "sm" | "md";
  showProgress?: boolean;
  className?: string;
}

function SellerReputationBadgesComponent({
  totalSales,
  averageRating,
  disputeRate,
  verifiedBadge,
  size = "sm",
  showProgress = false,
  className,
}: SellerReputationBadgesProps) {
  const level = getSellerLevel(totalSales);
  const badges = getEarnedBadges({ totalSales, averageRating, disputeRate, verifiedBadge });
  const LevelIcon = level.icon;

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-1.5 flex-wrap", className)}>
        {/* Main level badge */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={cn(
                level.className,
                size === "sm" ? "text-[10px] px-1.5 py-0 gap-0.5" : "text-xs px-2 py-0.5 gap-1",
                "cursor-default"
              )}
            >
              <LevelIcon className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
              {level.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs max-w-[200px]">
            <p className="font-semibold">{level.label}</p>
            <p className="text-muted-foreground">{totalSales} venda{totalSales !== 1 ? "s" : ""} realizadas</p>
            {showProgress && level.next && level.salesForNext && (
              <div className="mt-1.5">
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span>Próximo: {level.next}</span>
                  <span>{totalSales}/{level.salesForNext}</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min((totalSales / level.salesForNext) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </TooltipContent>
        </Tooltip>

        {/* Earned achievement badges */}
        {badges.map((badge) => {
          const BadgeIcon = badge.icon;
          return (
            <Tooltip key={badge.key}>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className={cn(
                    badge.className,
                    size === "sm" ? "text-[10px] px-1.5 py-0 gap-0.5" : "text-xs px-2 py-0.5 gap-1",
                    "cursor-default"
                  )}
                >
                  <BadgeIcon className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
                  {badge.label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {badge.description}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

export const SellerReputationBadges = memo(SellerReputationBadgesComponent);
