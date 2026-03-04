import { memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatProductName } from "@/lib/text-utils";
import { PriceVariationBadge } from "@/components/marketplace/PriceVariationBadge";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { optimizeImageUrl } from "@/lib/image-utils";
import type { CatalogProduct } from "@/hooks/useMarketplaceCatalog";

interface CatalogProductCardProps {
  product: CatalogProduct;
  hidePrice?: boolean;
}

function CatalogProductCardComponent({ product, hidePrice }: CatalogProductCardProps) {
  const navigate = useNavigate();
  const mainImage = product.images?.[0];
  const name = formatProductName(product.brand, product.model);

  const handleClick = useCallback(() => {
    navigate(`/marketplace/${product.slug}`);
  }, [navigate, product.slug]);

  return (
    <div
      className="group cursor-pointer rounded-2xl overflow-hidden bg-card border border-border/30 hover:border-primary/30 transition-all duration-300 hover:shadow-[0_8px_30px_-8px_hsl(var(--primary)/0.15)] hover:-translate-y-1.5 flex flex-col h-full will-change-transform"
      onClick={handleClick}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-white overflow-hidden shrink-0">
        {mainImage ? (
          <OptimizedImage
            src={optimizeImageUrl(mainImage, { width: 400, height: 300, quality: 80, resize: "contain" })}
            alt={name}
            width={400}
            height={300}
            className="w-full h-full object-contain p-2 group-hover:scale-110 transition-all duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/10">
            <span className="text-4xl opacity-10">👟</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-60" />

        {/* Top badges */}
        {product.is_high_risk && (
          <div className="absolute top-3 left-3">
            <Badge className="text-[9px] px-2 py-0.5 bg-primary text-primary-foreground border-0 gap-1 font-bold uppercase tracking-wider">
              <ShieldCheck className="h-3 w-3" /> PRO
            </Badge>
          </div>
        )}

        {/* Offers count */}
        {product.total_offers > 0 && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-background/80 backdrop-blur-md text-[10px] font-semibold text-foreground border border-border/30">
              <TrendingUp className="h-2.5 w-2.5 text-primary" />
              {product.total_offers}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-semibold">
          {product.brand}
        </p>
        <p className="text-sm font-bold leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors duration-300 mt-1">
          {name}
        </p>
        <p className="text-[11px] text-muted-foreground/70 mt-1 line-clamp-1 min-h-[16px]">
          {product.colorway || "\u00A0"}
        </p>
        {!hidePrice && (
          <div className="pt-2 mt-auto border-t border-border/20">
            {product.lowest_price ? (
              <div className="space-y-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[10px] text-muted-foreground">a partir de</span>
                  <span className="text-lg font-black text-foreground tracking-tight">
                    R$ {product.lowest_price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {(product as any).interest_free_installments > 0 && (
                  <p className="text-[10px] font-semibold text-primary">
                    até {(product as any).interest_free_installments}x sem juros
                  </p>
                )}
                <PriceVariationBadge
                  currentPrice={product.lowest_price}
                  retailPrice={product.retail_price}
                />
              </div>
            ) : (
              <span className="text-xs text-muted-foreground/60 italic">Sem ofertas</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const CatalogProductCard = memo(CatalogProductCardComponent);
