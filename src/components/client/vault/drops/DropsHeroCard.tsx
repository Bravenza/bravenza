import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DropsPost, typeConfig, placeholderGradients, getExcerpt } from "./types";

interface DropsHeroCardProps {
  post: DropsPost;
}

export function DropsHeroCard({ post }: DropsHeroCardProps) {
  const navigate = useNavigate();
  const config = typeConfig[post.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className="relative overflow-hidden cursor-pointer group rounded-3xl"
        onClick={() => navigate(`/drops/${post.id}`)}
      >
        {/* Image */}
        <div className="relative h-[340px] sm:h-[420px] overflow-hidden">
          {post.cover_image ? (
            <img
              src={post.cover_image}
              alt={post.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-[1.2s] ease-out"
            />
          ) : (
            <div className={cn("absolute inset-0 bg-gradient-to-br", placeholderGradients[post.type])} />
          )}

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

          {/* Featured badge - top left */}
          <div className="absolute top-5 left-5 z-10">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-md border-0 px-3 py-1 text-xs font-semibold shadow-lg">
                <Sparkles className="h-3 w-3 mr-1.5" /> Destaque
              </Badge>
            </motion.div>
          </div>

          {/* Content overlay - bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 z-10">
            <div className="flex items-center gap-2.5 mb-4">
              <Badge className={cn("bg-gradient-to-r text-white border-0 text-[10px] font-semibold px-2.5 py-0.5", config.gradient)}>
                {config.label}
              </Badge>
              <span className="text-white/40 text-xs flex items-center gap-1">
                <Clock className="h-3 w-3" /> {post.read_time_min || 3} min
              </span>
              {post.visibility !== "ALL" && (
                <Badge className="bg-white/10 backdrop-blur-md text-white/70 border-0 text-[10px]">
                  🔒 {post.visibility === "BLACK_ONLY" ? "Black" : "Privilege+"}
                </Badge>
              )}
            </div>

            <h2 className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold leading-[1.15] tracking-tight mb-3 max-w-2xl">
              {post.title}
            </h2>

            <p className="text-white/50 text-sm sm:text-base leading-relaxed line-clamp-2 max-w-xl mb-5">
              {getExcerpt(post, 180)}
            </p>

            {/* CTA */}
            <div className="inline-flex items-center gap-2 text-sm text-white font-medium opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              <span>Continuar lendo</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
