import { Star, Verified, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { conditionLabels, conditionColors, proLabels, normalizeShippingMode } from "@/lib/marketplace-constants";
import { generateInstallmentOptions, formatPriceBR } from "@/lib/budget-calculator";
import type { ProductOffer } from "@/hooks/useMarketplaceCatalog";

interface OfferCardProps {
  offer: ProductOffer;
  isBest: boolean;
  productImages: string[];
  onBuy: () => void;
  onClick: () => void;
}

export function OfferCard({ offer, isBest, productImages, onBuy, onClick }: OfferCardProps) {
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
        "rounded-xl border overflow-hidden transition-all hover:shadow-md cursor-pointer",
        isBest ? "border-primary/40 ring-1 ring-primary/20" : "border-border/40"
      )}
    >
      {/* Offer photo */}
      <div className="relative aspect-[4/3] bg-muted/10">
        <img src={offerImage} alt="" className="w-full h-full object-contain p-2" loading="lazy" />
        {isBest && (
          <Badge className="absolute top-2 left-2 text-[10px] px-1.5 py-0 bg-primary text-primary-foreground">
            Melhor preço
          </Badge>
        )}
        <Badge variant="outline" className={cn("absolute top-2 right-2 text-[10px] px-1.5 py-0 gap-0.5", conditionColors[offer.condition])}>
          {conditionLabels[offer.condition] || offer.condition}
        </Badge>
      </div>

      <div className="p-3 space-y-2">
        {/* Seller */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">{sellerName}</span>
          {offer.seller?.total_sales_count && offer.seller.total_sales_count > 0 ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <Verified className="h-2.5 w-2.5 text-primary" />
              {offer.seller.total_sales_count} vendas
            </span>
          ) : null}
          {offer.seller?.average_rating && offer.seller.average_rating > 0 ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground ml-auto">
              <Star className="h-2.5 w-2.5 text-primary fill-primary" />
              {offer.seller.average_rating.toFixed(1)}
            </span>
          ) : null}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 gap-0.5", pro.color)}>
            <ProIcon className="h-2.5 w-2.5" />
            {pro.text}
          </Badge>
          {offer.has_receipt && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              NF
            </Badge>
          )}
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-lg font-bold text-foreground">
              R$ {offer.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            {(() => {
              const inst12 = generateInstallmentOptions(offer.price).find(o => o.installments === 12);
              return inst12 ? (
                <p className="text-[10px] text-muted-foreground">
                  12x de {formatPriceBR(inst12.installmentValue)}
                </p>
              ) : null;
            })()}
          </div>
          <Button size="sm" className="btn-gold text-xs h-8 gap-1" onClick={(e) => { e.stopPropagation(); onBuy(); }}>
            Comprar <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
