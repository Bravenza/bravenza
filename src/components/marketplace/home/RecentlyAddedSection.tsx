import { memo } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { CatalogProductCard } from "@/components/client/vault/marketplace/CatalogProductCard";
import type { CatalogProduct } from "@/hooks/useMarketplaceCatalog";

interface Props {
  products: CatalogProduct[];
}

export const RecentlyAddedSection = memo(function RecentlyAddedSection({ products }: Props) {
  // Sort by created_at desc, take first 10
  const recentProducts = [...products]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  if (recentProducts.length === 0) return null;

  return (
    <section className="py-12 border-t border-border/30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Plus className="h-6 w-6 text-primary" />
          <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight font-display">Acabaram de chegar</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {recentProducts.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
            >
              <CatalogProductCard product={product} hidePrice />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
});
