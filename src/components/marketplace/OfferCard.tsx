import { Star, Verified, ChevronRight, Receipt, ShoppingCart } from "lucide-react";
import { SellerReputationBadges } from "@/components/marketplace/SellerReputationBadges";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { conditionLabels, conditionColors, proLabels, normalizeShippingMode } from "@/lib/marketplace-constants";
import { generateInstallmentOptions, formatPriceBR } from "@/lib/budget-calculator";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { optimizeImageUrl } from "@/lib/image-utils";
import type { ProductOffer } from "@/hooks/useMarketplaceCatalog";

interface OfferCardProps {
  offer: ProductOffer;
  isBest: boolean;
  productImages: string[];
  onBuy: () => void;
  onClick: () => void;
  onAddToCart?: () => void;
  isInCart?: boolean;
}

export function OfferCard({ offer, isBest, productImages, onBuy, onClick, onAddToCart, isInCart }: OfferCardProps) {
  const normalizedMode = normalizeShippingMode(offer.shipping_mode);
  const proKey = offer.pro_recommendation
    || (normalizedMode === "bravenza" ? (offer.price >= 2000 ? "pro_mandatory" : "pro_recommended") : "direct_allowed");
  const pro = proLabels[proKey] || proLabels.direct_allowed;
  const ProIcon = pro.icon;
  const sellerName = offer.seller?.member?.client_name?.split(" ")[0] || "Vendedor";
  const offerImage = offer.photos?.length ? offer.photos[0] : productImages[0];

  return (
    <div
      onClick={onClick}
      className={cn(
        "group rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_-8px_hsl(var(--primary)/0.12)] cursor-pointer bg-card",
        isBest ? "border-primary/50 ring-2 ring-primary/15" : "border-border/30 hover:border-primary/30"
      )}
    >
      {/* Offer photo */}
      <div className="relative aspect-[4/3] bg-muted/5 overflow-hidden">
        <OptimizedImage
          src={optimizeImageUrl(offerImage, { width: 400, height: 300, quality: 80, resize: "contain" })}
          alt=""
          width={400}
          height={300}
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
        />
        {isBest && (
          <div className="absolute top-3 left-3">
            <Badge className="text-[9px] px-2 py-0.5 bg-primary text-primary-foreground border-0 font-bold uppercase tracking-wider">
              Melhor preço
            </Badge>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] px-2 py-0.5 backdrop-blur-md font-semibold border",
              conditionColors[offer.condition]
            )}
          >
            {conditionLabels[offer.condition] || offer.condition}
          </Badge>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Seller row */}
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-muted/50 flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase">
            {sellerName[0]}
          </div>
          <span className="text-xs font-semibold text-foreground">{sellerName}</span>
          {offer.seller?.average_rating && offer.seller.average_rating > 0 ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground ml-auto">
              <Star className="h-3 w-3 text-primary fill-primary" />
              {offer.seller.average_rating.toFixed(1)}
            </span>
          ) : null}
        </div>
        {/* Seller reputation */}
        {offer.seller && (
          <SellerReputationBadges
            totalSales={offer.seller.total_sales_count || 0}
            averageRating={offer.seller.average_rating}
            size="sm"
          />
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className={cn("text-[9px] px-2 py-0.5 gap-0.5 font-medium", pro.color)}>
            <ProIcon className="h-3 w-3" />
            {pro.text}
          </Badge>
          {offer.has_receipt && (
            <Badge variant="outline" className="text-[9px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-0.5">
              <Receipt className="h-3 w-3" />
              NF
            </Badge>
          )}
        </div>

        {/* Price + CTA */}
        <div className="pt-2 border-t border-border/20 space-y-3">
          <div>
            <p className="text-xl font-black text-foreground tracking-tight">
              R$ {offer.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            {(() => {
              const inst12 = generateInstallmentOptions(offer.price).find(o => o.installments === 12);
              return inst12 ? (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  12x de {formatPriceBR(inst12.installmentValue)}
                </p>
              ) : null;
            })()}
          </div>
          <div className="flex gap-1.5 sm:gap-2">
            {onAddToCart && (
              <Button
                variant="outline"
                size="sm"
                className={cn("text-xs h-9 rounded-xl font-semibold border-border/40", isInCart && "border-primary/40 text-primary")}
                onClick={(e) => { e.stopPropagation(); onAddToCart(); }}
              >
                <ShoppingCart className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-9 rounded-xl font-semibold border-border/40 flex-1"
              onClick={(e) => { e.stopPropagation(); onClick(); }}
            >
              Ver Oferta
            </Button>
            <Button
              size="sm"
              className="btn-gold text-xs h-9 gap-1 rounded-xl font-bold flex-1"
              onClick={(e) => { e.stopPropagation(); onBuy(); }}
            >
              Comprar <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
