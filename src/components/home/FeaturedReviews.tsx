import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Review {
  id: string;
  client_name: string;
  rating: number;
  comment: string;
  product_quality: number | null;
  delivery_speed: number | null;
  customer_service: number | null;
  created_at: string;
}

export function FeaturedReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select("id, client_name, rating, comment, product_quality, delivery_speed, customer_service, created_at")
          .eq("is_approved", true)
          .eq("is_featured", true)
          .order("created_at", { ascending: false })
          .limit(6);

        if (error) throw error;
        setReviews(data || []);
      } catch (err) {
        console.error("Error fetching reviews:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, []);

  if (isLoading || reviews.length === 0) {
    return null;
  }

  const formatName = (name: string) => {
    const parts = name.split(" ");
    if (parts.length > 1) {
      return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
    }
    return name;
  };

  return (
    <section className="py-20 md:py-32 relative">
      <div className="absolute inset-0 bg-gradient-gold-subtle opacity-20" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            O que nossos clientes{" "}
            <span className="text-gradient-gold">dizem</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Avaliações reais de clientes satisfeitos
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="card-premium-gold p-8 relative"
            >
              <Quote className="absolute top-6 right-6 h-8 w-8 text-primary/20" />
              
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
                {Array.from({ length: 5 - review.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-muted-foreground/30" />
                ))}
              </div>

              {/* Comment */}
              <p className="text-foreground mb-6 leading-relaxed line-clamp-4">
                "{review.comment}"
              </p>

              {/* Detailed ratings */}
              {(review.product_quality || review.delivery_speed || review.customer_service) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {review.product_quality && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      Qualidade: {review.product_quality}/5
                    </span>
                  )}
                  {review.delivery_speed && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      Entrega: {review.delivery_speed}/5
                    </span>
                  )}
                </div>
              )}

              {/* Author */}
              <div className="border-t border-border pt-4">
                <div className="font-semibold">{formatName(review.client_name)}</div>
                <div className="text-sm text-muted-foreground">
                  Cliente verificado
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
