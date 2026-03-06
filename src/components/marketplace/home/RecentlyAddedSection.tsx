import { memo } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { CatalogProductCard } from "@/components/client/vault/marketplace/CatalogProductCard";
import { supabase } from "@/integrations/supabase/client";
import { STALE, GC_TIME } from "@/lib/query-config";

export const RecentlyAddedSection = memo(function RecentlyAddedSection() {
  const { data: recentProducts = [] } = useQuery({
    queryKey: ["recently-added-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("marketplace_products")
        .select("id, brand, model, colorway, slug, images, lowest_price, total_offers, created_at")
        .eq("is_active", true)
        .gt("total_offers", 0)
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 min
    gcTime: GC_TIME.LONG,
  });

  if (recentProducts.length === 0) return null;

  return (
    <section className="py-12 border-t border-border/30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Plus className="h-6 w-6 text-primary" />
          <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight font-display">Acabaram de chegar</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {recentProducts.map((product: any, i: number) => (
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
