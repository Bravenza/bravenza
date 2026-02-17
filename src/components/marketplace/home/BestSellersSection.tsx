import { memo } from "react";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { CatalogProduct } from "@/hooks/useMarketplaceCatalog";

interface Props {
  products: CatalogProduct[];
}

const rankColors = [
  "text-yellow-400 bg-yellow-500/15 border-yellow-500/30", // 1st
  "text-zinc-300 bg-zinc-400/15 border-zinc-400/30",       // 2nd
  "text-amber-600 bg-amber-600/15 border-amber-600/30",    // 3rd
];

export const BestSellersSection = memo(function BestSellersSection({ products }: Props) {
  const navigate = useNavigate();
  const topProducts = products.slice(0, 10);

  if (topProducts.length === 0) return null;

  return (
    <section className="py-10 border-t border-border/30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Trophy className="h-6 w-6 text-primary" />
          <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tight">Mais vendidos da semana</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {topProducts.map((product, i) => (
            <motion.button
              key={product.id}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              onClick={() => navigate(`/marketplace/${product.slug}`)}
              className="w-full flex items-center gap-4 p-3 rounded-2xl bg-card/50 border border-border/20 hover:border-primary/20 hover:bg-card/80 transition-all group text-left"
            >
              {/* Rank badge */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black border shrink-0 ${
                  rankColors[i] || "text-muted-foreground bg-muted/30 border-border/30"
                }`}
              >
                {i + 1}
              </div>

              {/* Product image */}
              <div className="w-16 h-16 rounded-xl bg-muted/10 overflow-hidden shrink-0">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.model}
                    className="w-full h-full object-contain p-1 group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-xs">
                    Sem foto
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                  {product.brand}
                </p>
                <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                  {product.model}
                </p>
                {product.colorway && (
                  <p className="text-[11px] text-muted-foreground truncate">{product.colorway}</p>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
});
