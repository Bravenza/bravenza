import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  product_id: string;
  product?: {
    brand: string;
    model: string;
    images: string[] | null;
  };
}

interface ClosetReviewsTabProps {
  cpf: string;
}

export function ClosetReviewsTab({ cpf }: ClosetReviewsTabProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [cpf]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("marketplace_product_reviews")
        .select(`
          id, rating, comment, created_at, product_id,
          marketplace_products!inner (brand, model, images)
        `)
        .eq("reviewer_cpf", cpf)
        .eq("is_visible", true)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!error && data) {
        const mapped = (data as any[]).map((d) => ({
          ...d,
          product: d.marketplace_products,
        }));
        setReviews(mapped);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="h-8 w-8 text-muted-foreground/30" />
        </div>
        <h3 className="font-semibold mb-1">Nenhuma avaliação</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Suas avaliações de produtos comprados aparecerão aqui
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review, index) => (
        <motion.div
          key={review.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04 }}
          className="flex gap-3 p-3 rounded-xl border border-border/40 bg-card"
        >
          <div className="w-14 h-14 rounded-lg overflow-hidden bg-secondary/30 shrink-0">
            {review.product?.images?.[0] ? (
              <img
                src={review.product.images[0]}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Star className="h-5 w-5 text-muted-foreground/20" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wide truncate">
                {review.product?.brand} {review.product?.model}
              </p>
              <span className="text-[10px] text-muted-foreground shrink-0">{formatDate(review.created_at)}</span>
            </div>
            <div className="flex items-center gap-0.5 my-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-3 w-3 ${s <= review.rating ? "text-primary fill-primary" : "text-muted-foreground/30"}`}
                />
              ))}
            </div>
            {review.comment && (
              <p className="text-xs text-muted-foreground line-clamp-2">{review.comment}</p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
