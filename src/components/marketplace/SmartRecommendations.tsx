import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { marketplaceRequest } from "@/hooks/marketplace/api";

interface RecommendedProduct {
  id: string;
  brand: string;
  model: string;
  colorway: string | null;
  images: string[] | null;
  lowest_price: number | null;
  total_offers: number;
  slug: string | null;
}

interface SmartRecommendationsProps {
  productId: string;
  cpf?: string;
  className?: string;
}

export function SmartRecommendations({ productId, cpf, className }: SmartRecommendationsProps) {
  const navigate = useNavigate();
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

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

  const ProductMini = ({ product, index }: { product: RecommendedProduct; index: number }) => (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => navigate(`/marketplace/product/${product.slug || product.id}`)}
      className="flex flex-col items-center text-center group min-w-[120px] max-w-[140px]"
    >
      <div className="w-[120px] h-[120px] rounded-xl bg-muted/20 border border-border/20 overflow-hidden mb-2 group-hover:border-primary/30 transition-colors">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.model} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="h-8 w-8 text-muted-foreground/20" />
          </div>
        )}
      </div>
      <p className="text-[11px] font-semibold truncate w-full">{product.brand}</p>
      <p className="text-[10px] text-muted-foreground truncate w-full">{product.model}</p>
      {product.lowest_price && (
        <p className="text-xs font-bold text-primary mt-0.5">A partir de {fmt(product.lowest_price)}</p>
      )}
      <p className="text-[9px] text-muted-foreground">{product.total_offers} oferta{product.total_offers !== 1 ? "s" : ""}</p>
    </motion.button>
  );

  return (
    <div className={cn("space-y-6", className)}>
      {alsoBought.length > 0 && (
        <Card className="card-premium">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" />
              Quem comprou também levou
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {alsoBought.map((p, i) => <ProductMini key={p.id} product={p} index={i} />)}
            </div>
          </CardContent>
        </Card>
      )}

      {similar.length > 0 && (
        <Card className="card-premium">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Modelos similares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {similar.map((p, i) => <ProductMini key={p.id} product={p} index={i} />)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
