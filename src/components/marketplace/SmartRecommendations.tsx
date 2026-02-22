import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { marketplaceRequest } from "@/hooks/marketplace/api";
import { CatalogProductCard } from "@/components/client/vault/marketplace/CatalogProductCard";
import { ProductCarousel } from "@/components/marketplace/ProductCarousel";

interface RecommendedProduct {
  id: string;
  brand: string;
  model: string;
  colorway: string | null;
  images: string[] | null;
  lowest_price: number | null;
  total_offers: number;
  slug: string | null;
  retail_price?: number | null;
  is_high_risk?: boolean;
  category?: string;
}

interface SmartRecommendationsProps {
  productId: string;
  cpf?: string;
  className?: string;
}

export function SmartRecommendations({ productId, cpf, className }: SmartRecommendationsProps) {
  const [similar, setSimilar] = useState<RecommendedProduct[]>([]);
  const [alsoBought, setAlsoBought] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await marketplaceRequest(cpf || "visitor", "recommendations", "GET", undefined, {
          product_id: productId, limit: "8",
        });
        setSimilar(res.similar || []);
        setAlsoBought(res.also_bought || []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetch();
  }, [productId, cpf]);

  if (loading || (similar.length === 0 && alsoBought.length === 0)) return null;

  const CarouselRow = ({ items, icon: Icon, title }: { items: RecommendedProduct[]; icon: typeof Sparkles; title: string }) => (
    <section>
      <div className="flex items-center gap-2 mb-6">
        <Icon className="h-5 w-5 text-primary" />
        <h3 className="text-base font-bold text-foreground tracking-tight">{title}</h3>
      </div>
      <ProductCarousel>
        {items.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04 }}
            className="min-w-[180px] w-[180px] sm:min-w-[200px] sm:w-[200px] snap-start flex-shrink-0"
          >
            <CatalogProductCard product={p as any} hidePrice />
          </motion.div>
        ))}
      </ProductCarousel>
    </section>
  );

  return (
    <div className={cn("space-y-14", className)}>
      {alsoBought.length > 0 && <CarouselRow items={alsoBought} icon={ShoppingBag} title="Quem comprou também levou" />}
      {similar.length > 0 && <CarouselRow items={similar} icon={Sparkles} title="Modelos similares" />}
    </div>
  );
}
