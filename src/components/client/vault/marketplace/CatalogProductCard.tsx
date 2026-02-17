import { useNavigate } from "react-router-dom";
import { ShieldCheck, TrendingUp } from "lucide-react";
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
      className="group cursor-pointer rounded-2xl overflow-hidden bg-card border border-border/30 hover:border-primary/30 transition-all duration-300 hover:shadow-[0_8px_30px_-8px_hsl(var(--primary)/0.15)]"
      onClick={() => navigate(`/marketplace/${product.slug}`)}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-muted/5 overflow-hidden">
        {mainImage ? (
          <img
            src={mainImage}
            alt={name}
            className="w-full h-full object-contain p-6 group-hover:scale-110 transition-transform duration-700 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
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
      <div className="p-4 space-y-2">
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-semibold">
          {product.brand}
        </p>
        <p className="text-sm font-bold leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors duration-300">
          {name}
        </p>
        {product.colorway && (
          <p className="text-[11px] text-muted-foreground/70">{product.colorway}</p>
        )}
        <div className="pt-2 border-t border-border/20">
          {product.lowest_price ? (
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] text-muted-foreground">a partir de</span>
              <span className="text-lg font-black text-foreground tracking-tight">
                R$ {product.lowest_price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground/60 italic">Sem ofertas</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
