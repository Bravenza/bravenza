import { memo, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { CatalogProductCard } from "@/components/client/vault/marketplace/CatalogProductCard";
import type { CatalogProduct } from "@/hooks/useMarketplaceCatalog";

interface Props {
  currentProductId: string;
  brand: string;
  category: string;
  cpf: string;
}

export const RelatedProductsSection = memo(function RelatedProductsSection({ currentProductId, brand, category, cpf }: Props) {
  const [products, setProducts] = useState<CatalogProduct[]>([]);

  const fetchRelated = useCallback(async () => {
    try {
      const BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mk-hub`;
      const { getMarketplaceHeaders } = await import("@/hooks/marketplace/api");
      const headers = await getMarketplaceHeaders();
      const params = new URLSearchParams({ action: "catalog-products", brand, category });
      const res = await fetch(`${BASE}?${params}`, { headers });
      const data = await res.json();
      const filtered = (data.products || []).filter((p: CatalogProduct) => p.id !== currentProductId).slice(0, 10);
      setProducts(filtered);
    } catch {
      setProducts([]);
    }
  }, [currentProductId, brand, category, cpf]);

  useEffect(() => {
    fetchRelated();
  }, [fetchRelated]);

  if (products.length === 0) return null;

  return (
    <section className="mt-14">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-base font-bold text-foreground tracking-tight">Relacionados</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {products.map((product, i) => (
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
    </section>
  );
});
