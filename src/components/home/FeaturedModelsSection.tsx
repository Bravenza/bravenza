import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Flame, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface FeaturedModel {
  id: string;
  name: string;
  brand: string;
  image_url: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4 },
  },
};

const FeaturedModelsSection = () => {
  const { data: models, isLoading } = useQuery({
    queryKey: ["featured-models"],
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("featured_models")
        .select("id, name, brand, image_url")
        .eq("is_active", true)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as FeaturedModel[];
    },
  });

  if (isLoading) {
    return (
      <section className="py-16 md:py-20 bg-secondary/20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square bg-secondary/50 animate-pulse rounded-md" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!models || models.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-20 bg-secondary/20 relative overflow-hidden">
      {/* Subtle top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <Flame className="h-4 w-4" />
            <span className="text-sm font-medium">Os mais procurados</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3 tracking-tight">
            Modelos que estão <span className="text-gradient-gold">bombando</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
            Edições limitadas, collabs exclusivas e clássicos atemporais.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
        >
          {models.map((model, index) => (
            <motion.div key={model.id} variants={itemVariants} className="group">
              <div className="card-premium overflow-hidden">
                <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-secondary/80 to-secondary/30">
                  <img
                    src={model.image_url}
                    alt={model.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                    decoding="async"
                    fetchPriority={index < 6 ? "high" : "low"}
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="p-3 text-center">
                  <p className="text-[10px] text-primary font-medium uppercase tracking-wider">
                    {model.brand}
                  </p>
                  <h3 className="text-xs font-semibold text-foreground mt-1 line-clamp-2 group-hover:text-primary transition-colors">
                    {model.name}
                  </h3>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-10"
        >
          <p className="text-muted-foreground mb-4 text-sm">
            Não encontrou o seu? Nós buscamos qualquer modelo.
          </p>
          <Link to="/solicitar">
            <Button variant="outline" className="border-primary/20 hover:bg-primary/5 hover:border-primary/40">
              Solicitar outro modelo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
      
      {/* Subtle bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </section>
  );
};

export default FeaturedModelsSection;
