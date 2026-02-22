import { memo, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { CatalogProductCard } from "@/components/client/vault/marketplace/CatalogProductCard";
import { ProductCarousel } from "@/components/marketplace/ProductCarousel";
import type { CatalogProduct } from "@/hooks/useMarketplaceCatalog";

const STORAGE_KEY = "bvz_recently_viewed";
const MAX_ITEMS = 10;

/** Save a product to recently viewed (call on PDP visit) */
export function saveRecentlyViewed(product: CatalogProduct) {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as CatalogProduct[];
    const filtered = stored.filter((p) => p.id !== product.id);
    filtered.unshift(product);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)));
  } catch {
    // silently fail
  }
}

export function getRecentlyViewed(): CatalogProduct[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export const RecentlyViewedSection = memo(function RecentlyViewedSection() {
  const [items, setItems] = useState<CatalogProduct[]>([]);

  useEffect(() => {
    setItems(getRecentlyViewed());
  }, []);

  if (items.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-6">
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="text-base font-bold text-foreground tracking-tight">
          Vistos recentemente
        </h3>
      </div>
      <ProductCarousel>
        {items.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="min-w-[180px] w-[180px] sm:min-w-[200px] sm:w-[200px] snap-start flex-shrink-0"
          >
            <CatalogProductCard product={product} hidePrice />
          </motion.div>
        ))}
      </ProductCarousel>
    </section>
  );
});
