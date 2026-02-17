import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, ArrowUpRight, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DropsPost, typeConfig, placeholderGradients, formatRelativeDate, getExcerpt } from "./types";

interface DropsEditorialCardProps {
  post: DropsPost;
  index: number;
  variant?: "default" | "wide" | "compact";
}

export function DropsEditorialCard({ post, index, variant = "default" }: DropsEditorialCardProps) {
  const navigate = useNavigate();
  const config = typeConfig[post.type];

  if (variant === "wide") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06, duration: 0.5 }}
        className="col-span-full"
      >
        <div
          className="group cursor-pointer flex flex-col sm:flex-row gap-0 rounded-2xl overflow-hidden bg-card border border-border/10 hover:border-border/30 transition-all duration-500 hover:shadow-[0_8px_40px_rgba(0,0,0,0.3)]"
          onClick={() => navigate(`/drops/${post.id}`)}
        >
          {/* Image side */}
          <div className="relative w-full sm:w-[45%] h-52 sm:h-auto overflow-hidden">
            {post.cover_image ? (
              <img
                src={post.cover_image}
                alt={post.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className={cn("absolute inset-0 bg-gradient-to-br", placeholderGradients[post.type])} />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/50 sm:block hidden" />
          </div>
          {/* Content side */}
          <div className="flex-1 p-5 sm:p-7 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <div className={cn("p-1.5 rounded-lg bg-gradient-to-br", config.gradient)}>
                <config.icon className="h-3 w-3 text-white" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{config.label}</span>
              <span className="text-xs text-muted-foreground/50">·</span>
              <span className="text-xs text-muted-foreground/50">{formatRelativeDate(post.published_at)}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold leading-tight mb-4 group-hover:text-primary transition-colors tracking-tight">
              {post.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">
              {getExcerpt(post, 160)}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground/60">
              {post.read_time_min && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {post.read_time_min} min
                </span>
              )}
              {post.visibility !== "ALL" && (
                <Badge variant="outline" className="text-[10px] border-primary/20 text-primary">
                  {post.visibility === "BLACK_ONLY" ? "Black" : "Privilege+"}
                </Badge>
              )}
              <ArrowUpRight className="h-3.5 w-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <div
          className="group cursor-pointer flex gap-4 items-center py-4 border-b border-border/10 last:border-0 hover:bg-muted/10 -mx-2 px-2 rounded-xl transition-colors"
          onClick={() => navigate(`/drops/${post.id}`)}
        >
          {/* Thumbnail */}
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0">
            {post.cover_image ? (
              <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            ) : (
              <div className={cn("w-full h-full bg-gradient-to-br", placeholderGradients[post.type])} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className={cn("text-[10px] font-semibold", config.color)}>{config.label}</span>
              <span className="text-[10px] text-muted-foreground/40">· {formatRelativeDate(post.published_at)}</span>
            </div>
            <h4 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors leading-snug">
              {post.title}
            </h4>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary shrink-0 transition-colors" />
        </div>
      </motion.div>
    );
  }

  // Default card
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.5 }}
    >
      <div
        className="group cursor-pointer rounded-2xl overflow-hidden bg-card border border-border/10 hover:border-border/25 transition-all duration-500 hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)]"
        onClick={() => navigate(`/drops/${post.id}`)}
      >
        {/* Image */}
        <div className="relative h-48 sm:h-52 overflow-hidden">
          {post.cover_image ? (
            <img
              src={post.cover_image}
              alt={post.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className={cn("absolute inset-0 bg-gradient-to-br", placeholderGradients[post.type])} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-60" />

          {/* Type icon */}
          <div className="absolute top-3 left-3">
            <div className={cn("p-2 rounded-xl bg-gradient-to-br shadow-lg", config.gradient)}>
              <config.icon className="h-3.5 w-3.5 text-white" />
            </div>
          </div>

          {/* Date */}
          <div className="absolute top-3 right-3">
            <span className="text-[10px] text-white/60 bg-black/40 backdrop-blur-md rounded-full px-2.5 py-1 font-medium">
              {formatRelativeDate(post.published_at)}
            </span>
          </div>

          {/* Hover CTA */}
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
            <div className="flex items-center gap-1 text-[10px] text-white bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full font-medium">
              Ler <ArrowUpRight className="h-3 w-3" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5">
          <h3 className="text-sm sm:text-base font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors tracking-tight mb-3">
            {post.title}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-4">
            {getExcerpt(post)}
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] border-border/15 text-muted-foreground/60 font-medium">
              {config.label}
            </Badge>
            {post.read_time_min && (
              <span className="text-[10px] text-muted-foreground/40 flex items-center gap-0.5">
                <Clock className="h-3 w-3" /> {post.read_time_min} min
              </span>
            )}
            {(post.likes_count ?? 0) > 0 && (
              <span className="text-[10px] text-destructive/60 flex items-center gap-0.5">
                <Heart className="h-3 w-3 fill-destructive/60" /> {post.likes_count}
              </span>
            )}
            {post.visibility !== "ALL" && (
              <Badge variant="outline" className="text-[10px] border-primary/20 text-primary ml-auto">
                {post.visibility === "BLACK_ONLY" ? "Black" : "Privilege+"}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
