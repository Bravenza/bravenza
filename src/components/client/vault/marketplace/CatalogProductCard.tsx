import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatProductName } from "@/lib/text-utils";
import type { CatalogProduct } from "@/hooks/useMarketplaceCatalog";

interface CatalogProductCardProps {
  product: CatalogProduct;
}

export function CatalogProductCard({ product }: CatalogProductCardProps) {
  const navigate = useNavigate();
  const mainImage = product.images?.[0];
  const name = formatProductName(product.brand, product.model);

  return (
    <motion.div
      className="group cursor-pointer"
      onClick={() => navigate(`/marketplace/${product.slug}`)}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      {/* Image */}
      <div className="relative aspect-square rounded-xl overflow-hidden bg-muted/10 border border-border/20">
        {mainImage ? (
          <img
            src={mainImage}
            alt={name}
            className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-3xl opacity-20">👟</span>
          </div>
        )}

        {/* Offers count badge */}
        {product.total_offers > 0 && (
          <div className="absolute bottom-2 right-2">
            <Badge variant="secondary" className="text-[10px] bg-background/80 backdrop-blur-sm border-border/30">
              {product.total_offers} oferta{product.total_offers !== 1 ? "s" : ""}
            </Badge>
          </div>
        )}

        {product.is_high_risk && (
          <div className="absolute top-2 left-2">
            <Badge className="text-[9px] bg-amber-500/90 text-white border-0">
              Alto risco
            </Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="pt-3 px-0.5 space-y-1">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
          {product.brand}
        </p>
        <p className="text-sm font-semibold leading-tight line-clamp-2 text-foreground">
          {name}
        </p>
        {product.colorway && (
          <p className="text-[11px] text-muted-foreground">{product.colorway}</p>
        )}
        <div className="flex items-baseline gap-2 pt-0.5">
          {product.lowest_price ? (
            <>
              <span className="text-xs text-muted-foreground">A partir de</span>
              <span className="text-base font-bold text-foreground">
                R$ {product.lowest_price.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
              </span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">Sem ofertas</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
