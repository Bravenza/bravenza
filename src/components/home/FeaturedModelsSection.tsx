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
const FeaturedModelsSection = () => {
  const {
    data: models,
    isLoading
  } = useQuery({
    queryKey: ["featured-models"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("featured_models").select("id, name, brand, image_url").eq("is_active", true).order("order_index", {
        ascending: true
      });
      if (error) throw error;
      return data as FeaturedModel[];
    }
  });
  if (isLoading) {
    return <section className="py-12 md:py-16 bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="aspect-square bg-secondary animate-pulse rounded-xl" />)}
          </div>
        </div>
      </section>;
  }
  if (!models || models.length === 0) {
    return null;
  }
  return <section className="py-10 md:py-14 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} transition={{
        duration: 0.5
      }} className="text-center mb-8 md:mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <Flame className="h-4 w-4" />
            <span className="text-sm font-medium">Os mais procurados</span>
          </div>
          <h2 className="md:text-3xl lg:text-4xl font-bold text-foreground mb-3 text-3xl">
            Modelos que estão <span className="text-gradient-gold text-3xl">bombando</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto md:text-base text-base">
            Estes são os tênis que nossos clientes mais pedem. Edições limitadas, 
            collabs exclusivas e clássicos atemporais, todos ao seu alcance.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {models.map((model, index) => <motion.div key={model.id} initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true,
          margin: "-50px"
        }} transition={{
          duration: 0.4,
          delay: Math.min(index * 0.05, 0.3)
        }} className="group">
              <div className="bg-card rounded-xl overflow-hidden border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-secondary to-secondary/50">
                  <img src={model.image_url} alt={model.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" fetchPriority={index < 6 ? "high" : "low"} />
                </div>
                <div className="p-3 text-center">
                  <p className="text-xs text-primary font-medium uppercase tracking-wider">
                    {model.brand}
                  </p>
                  <h3 className="text-sm font-semibold text-foreground mt-1 line-clamp-2">
                    {model.name}
                  </h3>
                </div>
              </div>
            </motion.div>)}
        </div>

        <motion.div initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} transition={{
        duration: 0.5,
        delay: 0.3
      }} className="text-center mt-10">
          <p className="text-muted-foreground mb-4 text-base">
            Não encontrou o seu? Nós buscamos qualquer modelo para você.
          </p>
          <Link to="/solicitar">
            <Button variant="outline" size="lg" className="border-primary/30 hover:bg-primary/10">
              Solicitar outro modelo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>;
};
export default FeaturedModelsSection;