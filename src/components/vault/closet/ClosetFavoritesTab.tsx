import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface WatchlistItem {
  id: string;
  product_id: string;
  size: string;
  max_price: number | null;
  created_at: string;
  product?: {
    brand: string;
    model: string;
    images: string[] | null;
    lowest_price: number | null;
    slug: string | null;
  };
}

interface ClosetFavoritesTabProps {
  cpf: string;
}

export function ClosetFavoritesTab({ cpf }: ClosetFavoritesTabProps) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFavorites();
  }, [cpf]);

  const fetchFavorites = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("marketplace_watchlist")
        .select(`
          id, product_id, size, max_price, created_at,
          marketplace_products!inner (brand, model, images, lowest_price, slug)
        `)
        .eq("user_cpf", cpf)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!error && data) {
        const mapped = (data as any[]).map((d) => ({
          ...d,
          product: d.marketplace_products,
        }));
        setItems(mapped);
      }
    } catch (err) {
      console.error("Error fetching watchlist:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="sr-only">Carregando favoritos...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
          <Heart className="h-8 w-8 text-muted-foreground/30" />
        </div>
        <h3 className="font-semibold mb-1">Nenhum favorito ainda</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Adicione itens à sua watchlist no marketplace para acompanhá-los aqui
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {items.map((item, index) => (
        <motion.button
          key={item.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.03 }}
          onClick={() => {
            if (item.product?.slug) {
              navigate(`/marketplace/produto/${item.product.slug}`);
            }
          }}
          className="text-left group rounded-2xl overflow-hidden border border-border/40 bg-card hover:border-primary/30 hover:shadow-md transition-all"
        >
          <div className="aspect-square bg-secondary/30 overflow-hidden relative">
            {item.product?.images?.[0] ? (
              <img
                src={item.product.images[0]}
                alt={`${item.product.brand} ${item.product.model}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag className="h-8 w-8 text-muted-foreground/20" />
              </div>
            )}
            <div className="absolute top-2 right-2">
              <Heart className="h-4 w-4 text-destructive fill-destructive" />
            </div>
            <div className="absolute bottom-2 right-2">
              <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold">
                {item.size}
              </span>
            </div>
          </div>
          <div className="p-3 space-y-1">
            <p className="text-xs font-bold uppercase tracking-wide truncate">{item.product?.brand}</p>
            <p className="text-[11px] text-muted-foreground truncate">{item.product?.model}</p>
            {item.product?.lowest_price && (
              <p className="text-xs font-semibold text-primary">
                A partir de {fmt(item.product.lowest_price)}
              </p>
            )}
          </div>
        </motion.button>
      ))}
    </div>
  );
}
