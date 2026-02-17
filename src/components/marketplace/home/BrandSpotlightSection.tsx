import { memo } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CatalogProductCard } from "@/components/client/vault/marketplace/CatalogProductCard";
import type { CatalogProduct } from "@/hooks/useMarketplaceCatalog";
import { BrandLogo } from "./BrandLogos";

interface SpotlightConfig {
  brand: string;
  tagline: string;
  gradient: string;
}

const spotlights: SpotlightConfig[] = [
  {
    brand: "Nike",
    tagline: "O ícone que define a cultura sneaker.",
    gradient: "from-orange-500/10 via-transparent to-red-500/10",
  },
  {
    brand: "Jordan",
    tagline: "Lendas nunca saem de linha.",
    gradient: "from-red-500/10 via-transparent to-zinc-500/10",
  },
  {
    brand: "adidas",
    tagline: "Três listras, infinitas possibilidades.",
    gradient: "from-blue-500/10 via-transparent to-cyan-500/10",
  },
];

interface Props {
  products: CatalogProduct[];
}

export const BrandSpotlightSection = memo(function BrandSpotlightSection({ products }: Props) {
  const navigate = useNavigate();

  return (
    <>
      {spotlights.map((spotlight) => {
        const brandProducts = products.filter(
          (p) => p.brand.toLowerCase() === spotlight.brand.toLowerCase()
        ).slice(0, 5);

        if (brandProducts.length === 0) return null;

        return (
          <section key={spotlight.brand} className="py-10 border-t border-border/30">
            <div className="max-w-7xl mx-auto px-4">
              {/* Header with gradient accent */}
              <div className={`relative rounded-2xl p-6 mb-6 bg-gradient-to-r ${spotlight.gradient} border border-border/10 overflow-hidden`}>
                <div className="relative z-10">
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <div className="text-2xl md:text-3xl mb-1">
                        <BrandLogo name={spotlight.brand} size="md" />
                      </div>
                      <p className="text-xs text-muted-foreground">{spotlight.tagline}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-sm gap-1 text-muted-foreground hover:text-foreground"
                      onClick={() => navigate(`/marketplace?q=${encodeURIComponent(spotlight.brand)}`)}
                    >
                      Ver tudo <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </motion.div>
                </div>
                {/* Faded large brand name in background */}
                <div className="absolute -right-4 -bottom-4 text-[100px] md:text-[140px] font-black uppercase opacity-[0.03] leading-none select-none pointer-events-none">
                  {spotlight.brand}
                </div>
              </div>

              {/* Product cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {brandProducts.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <CatalogProductCard product={product} />
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
});
