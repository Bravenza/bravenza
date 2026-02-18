import { memo, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { CatalogProductCard } from "@/components/client/vault/marketplace/CatalogProductCard";
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
    <section className="py-10 border-t border-border/30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="text-base font-bold text-foreground tracking-tight">Vistos recentemente</h3>
        </div>

        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
          {items.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="min-w-[200px] max-w-[220px] flex-shrink-0"
            >
              <CatalogProductCard product={product} hidePrice />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
});
