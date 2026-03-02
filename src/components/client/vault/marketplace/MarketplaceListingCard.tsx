import { Heart, ShieldCheck, Star, Verified, Rocket, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { optimizeImageUrl } from "@/lib/image-utils";
import type { MarketplaceListing } from "@/hooks/useMarketplace";
import { motion } from "framer-motion";

const conditionLabels: Record<string, string> = {
  novo: "Novo",
  usado_excelente: "Excelente",
  usado_bom: "Bom",
  usado_regular: "Regular",
};

const conditionColors: Record<string, string> = {
  novo: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  usado_excelente: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  usado_bom: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  usado_regular: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

interface MarketplaceListingCardProps {
  listing: MarketplaceListing;
  onSelect: (listing: MarketplaceListing) => void;
  onToggleFavorite: (id: string) => void;
}

export function MarketplaceListingCard({
  listing,
  onSelect,
  onToggleFavorite,
}: MarketplaceListingCardProps) {
  const mainPhoto = listing.photos?.[0];
  const hasDiscount = listing.original_purchase_price && listing.original_purchase_price > listing.price;
  const discountPercent = hasDiscount
    ? Math.round(((listing.original_purchase_price! - listing.price) / listing.original_purchase_price!) * 100)
    : 0;

  return (
    <motion.div
      className="group cursor-pointer rounded-2xl overflow-hidden bg-card border border-border/30 hover:border-primary/30 transition-all duration-300 hover:shadow-[0_8px_30px_-8px_hsl(var(--primary)/0.15)]"
      onClick={() => onSelect(listing)}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-muted/5">
        {mainPhoto ? (
          <OptimizedImage
            src={optimizeImageUrl(mainPhoto, { width: 400, height: 400, quality: 80, resize: "cover" })}
            alt={listing.title}
            width={400}
            height={400}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl opacity-10">👟</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Top-left badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {listing.is_vault_certified && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-[9px] font-bold uppercase tracking-[0.1em] backdrop-blur-sm">
              <ShieldCheck className="h-3 w-3" />
              Certificado
            </span>
          )}
          {(listing as any).pro_recommendation === "boosted" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500 text-white text-[9px] font-bold uppercase tracking-[0.1em] backdrop-blur-sm animate-pulse">
              <Rocket className="h-3 w-3" />
              Destaque
            </span>
          )}
          {hasDiscount && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-[10px] font-black backdrop-blur-sm">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Top-right: Favorite */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 h-9 w-9 rounded-full bg-black/30 backdrop-blur-md hover:bg-black/50 border border-white/10"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(listing.id);
          }}
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-all duration-200",
              listing.is_favorited
                ? "fill-red-500 text-red-500 scale-110"
                : "text-white"
            )}
          />
        </Button>

        {/* Bottom overlays */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <span className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-semibold border backdrop-blur-md",
            conditionColors[listing.condition] || conditionColors.usado_bom
          )}>
            {conditionLabels[listing.condition] || listing.condition}
          </span>
          {listing.size && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-md text-white text-[11px] font-bold border border-white/10">
              {listing.size}
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        {listing.brand && (
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-semibold">
            {listing.brand}
            {listing.model ? ` · ${listing.model}` : ""}
          </p>
        )}

        <p className="text-sm font-bold leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors duration-300">
          {listing.title}
        </p>

        {/* Price row */}
        <div className="flex items-baseline gap-2 pt-1">
          <p className="text-lg font-black text-foreground tracking-tight">
            R$ {listing.price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          {hasDiscount && (
            <p className="text-xs text-muted-foreground line-through">
              R$ {listing.original_purchase_price!.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          )}
        </div>

        {/* Seller trust row */}
        {listing.seller?.member && listing.seller.member.client_name && (
          <div className="flex items-center gap-2 pt-2 border-t border-border/20">
            <div className="h-5 w-5 rounded-full bg-muted/50 flex items-center justify-center text-[9px] font-bold text-muted-foreground uppercase">
              {listing.seller.member.client_name?.[0] || "?"}
            </div>
            <span className="text-[11px] font-medium text-muted-foreground">
              {(listing.seller.member.client_name || "").split(" ")[0]}
            </span>
            {(listing.seller as any).verified_badge && (
              <span className="inline-flex items-center gap-0.5 text-[9px] text-primary font-semibold">
                <BadgeCheck className="h-3 w-3 text-primary fill-primary/20" />
                Verificada
              </span>
            )}
            {listing.seller.average_rating && listing.seller.average_rating > 0 ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground ml-auto">
                <Star className="h-3 w-3 text-primary fill-primary" />
                {listing.seller.average_rating.toFixed(1)}
              </span>
            ) : null}
            {listing.seller.total_sales_count > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <Verified className="h-3 w-3 text-primary" />
                {listing.seller.total_sales_count}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
