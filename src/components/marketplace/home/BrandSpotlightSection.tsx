import { memo, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CatalogProductCard } from "@/components/client/vault/marketplace/CatalogProductCard";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo } from "./BrandLogos";
import { STALE, GC_TIME } from "@/lib/query-config";

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
  insertAfterIndex?: number;
  children?: React.ReactNode;
}

async function fetchBrandProducts(brand: string) {
  const { data } = await supabase
    .from("marketplace_products")
    .select("id, brand, model, colorway, slug, images, lowest_price, total_offers, created_at")
    .eq("is_active", true)
    .ilike("brand", brand)
    .gt("total_offers", 0)
    .order("total_offers", { ascending: false })
    .limit(5);
  return data || [];
}

export const BrandSpotlightSection = memo(function BrandSpotlightSection({ insertAfterIndex, children }: Props) {
  const navigate = useNavigate();

  const { data: brandData } = useQuery({
    queryKey: ["brand-spotlights"],
    queryFn: async () => {
      const results = await Promise.all(
        spotlights.map(async (s) => ({
          brand: s.brand,
          products: await fetchBrandProducts(s.brand),
        }))
      );
      return results;
    },
    staleTime: STALE.STATIC,
    gcTime: GC_TIME.LONG,
  });

  let renderedCount = -1;

  return (
    <>
      {spotlights.map((spotlight) => {
        const brandProducts = brandData?.find(
          (b) => b.brand.toLowerCase() === spotlight.brand.toLowerCase()
        )?.products || [];

        if (brandProducts.length === 0) return null;

        renderedCount++;
        const currentIndex = renderedCount;

        return (
          <span key={spotlight.brand}>
            <section className="py-12 border-t border-border/30">
              <div className="max-w-7xl mx-auto px-4">
                <div className={`relative rounded-2xl p-8 mb-8 bg-gradient-to-r ${spotlight.gradient} border border-border/10 overflow-hidden`}>
                  <div className="relative z-10">
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <div className="text-3xl md:text-4xl mb-2">
                          <BrandLogo name={spotlight.brand} size="lg" />
                        </div>
                        <p className="text-sm text-muted-foreground">{spotlight.tagline}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-sm gap-1 text-muted-foreground hover:text-foreground"
                        onClick={() => navigate(`/app?q=${encodeURIComponent(spotlight.brand)}`)}
                      >
                        Ver tudo <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </motion.div>
                  </div>
                  <div className="absolute -right-4 -bottom-4 text-[100px] md:text-[140px] font-black uppercase opacity-[0.03] leading-none select-none pointer-events-none">
                    {spotlight.brand}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {brandProducts.map((product: any, i: number) => (
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
            {insertAfterIndex === currentIndex && children}
          </span>
        );
      })}
    </>
  );
});
