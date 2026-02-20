import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Crown, Flame, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface Collection {
  id: string;
  title: string;
  subtitle: string;
  query: string;
  icon: React.ElementType;
  gradient: string;
  accent: string;
  tag: string;
}

const collections: Collection[] = [
  {
    id: "grails",
    title: "Grails da Semana",
    subtitle: "Peças raras que apareceram no radar",
    query: "?sort=price_desc",
    icon: Crown,
    gradient: "from-amber-500/20 via-amber-600/10 to-transparent",
    accent: "text-amber-500 border-amber-500/30 bg-amber-500/10",
    tag: "Curadoria",
  },
  {
    id: "hype",
    title: "Em Alta Agora",
    subtitle: "Os mais buscados da comunidade",
    query: "?sort=popular",
    icon: Flame,
    gradient: "from-red-500/15 via-orange-500/8 to-transparent",
    accent: "text-red-400 border-red-400/30 bg-red-400/10",
    tag: "Trending",
  },
  {
    id: "steals",
    title: "Abaixo do Retail",
    subtitle: "Oportunidades com preço imbatível",
    query: "?sort=price_asc",
    icon: Sparkles,
    gradient: "from-emerald-500/15 via-emerald-600/8 to-transparent",
    accent: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
    tag: "Oferta",
  },
  {
    id: "new",
    title: "Recém-chegados",
    subtitle: "Últimas adições ao catálogo",
    query: "?sort=recent",
    icon: Star,
    gradient: "from-blue-500/15 via-indigo-500/8 to-transparent",
    accent: "text-blue-400 border-blue-400/30 bg-blue-400/10",
    tag: "Novo",
  },
];

export function FeaturedCollectionsSection() {
  const navigate = useNavigate();

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight font-display text-foreground">
              Coleções em destaque
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Seleções curadas pela equipe Bravenza
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {collections.map((col, i) => {
            const Icon = col.icon;
            return (
              <motion.button
                key={col.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, type: "spring", stiffness: 200 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                onClick={() => navigate(`/marketplace/feed${col.query}`)}
                className="relative overflow-hidden rounded-2xl border border-border/40 bg-card p-6 text-left group transition-shadow hover:shadow-lg hover:border-border"
              >
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${col.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />

                <div className="relative z-10">
                  <Badge variant="outline" className={`text-[10px] mb-4 ${col.accent}`}>
                    {col.tag}
                  </Badge>

                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-5 w-5 text-foreground" />
                    <h3 className="font-bold text-foreground">{col.title}</h3>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    {col.subtitle}
                  </p>

                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:gap-2 transition-all">
                    Explorar <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
