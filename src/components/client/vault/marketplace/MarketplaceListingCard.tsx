import { Heart, ShieldCheck, Star, Verified } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
      className="group cursor-pointer"
      onClick={() => onSelect(listing)}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      {/* Image Container - Clean, no borders */}
      <div className="relative aspect-square rounded-xl overflow-hidden bg-[hsl(0,0%,18%)]">
        {mainPhoto ? (
          <img
            src={mainPhoto}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center">
              <span className="text-2xl opacity-30">👟</span>
            </div>
          </div>
        )}

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Top-left: Certification badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {listing.is_vault_certified && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/90 text-primary-foreground text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
              <ShieldCheck className="h-3 w-3" />
              Certificado
            </span>
          )}
          {hasDiscount && (
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-500/90 text-white text-[10px] font-bold backdrop-blur-sm">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Top-right: Favorite */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 border-0"
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

        {/* Bottom: Condition pill */}
        <div className="absolute bottom-2.5 left-2.5">
          <span className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border backdrop-blur-sm",
            conditionColors[listing.condition] || conditionColors.usado_bom
          )}>
            {conditionLabels[listing.condition] || listing.condition}
          </span>
        </div>

        {/* Bottom-right: Size */}
        {listing.size && (
          <div className="absolute bottom-2.5 right-2.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium border border-white/10">
              {listing.size}
            </span>
          </div>
        )}
      </div>

      {/* Info - Minimal, clean typography */}
      <div className="pt-3 px-0.5 space-y-1.5">
        {/* Brand + Model */}
        {listing.brand && (
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
            {listing.brand}
            {listing.model ? ` · ${listing.model}` : ""}
          </p>
        )}

        {/* Title */}
        <p className="text-sm font-semibold leading-tight line-clamp-2 text-foreground">
          {listing.title}
        </p>

        {/* Price row */}
        <div className="flex items-baseline gap-2">
          <p className="text-base font-bold text-foreground">
            R$ {listing.price.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          {hasDiscount && (
            <p className="text-xs text-muted-foreground line-through">
              R$ {listing.original_purchase_price!.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          )}
        </div>

        {/* Seller trust row */}
        {listing.seller?.member && (
          <div className="flex items-center gap-1.5 pt-0.5">
            {listing.seller.average_rating && listing.seller.average_rating > 0 ? (
              <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground">
                <Star className="h-3 w-3 text-primary fill-primary" />
                {listing.seller.average_rating.toFixed(1)}
              </span>
            ) : null}
            <span className="text-[11px] text-muted-foreground">
              {listing.seller.member.client_name.split(" ")[0]}
            </span>
            {listing.seller.total_sales_count > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <Verified className="h-2.5 w-2.5 text-primary" />
                {listing.seller.total_sales_count}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
