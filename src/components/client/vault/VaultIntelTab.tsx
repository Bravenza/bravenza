import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Sparkles, Radar, BookOpen, AlertTriangle, Calendar,
  ChevronLeft, ChevronRight, Clock, Eye, ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface IntelPost {
  id: string;
  type: "RADAR" | "GUIDE" | "ALERT" | "EVENT";
  title: string;
  content: string;
  visibility: "ALL" | "PRIVILEGE_PLUS" | "BLACK_ONLY";
  published_at: string;
}

interface VaultIntelTabProps {
  clientCpf: string;
}

const typeConfig = {
  RADAR: { icon: Radar, label: "Radar", gradient: "from-blue-600 to-cyan-500", ring: "ring-blue-500/30" },
  GUIDE: { icon: BookOpen, label: "Guia", gradient: "from-emerald-600 to-teal-500", ring: "ring-emerald-500/30" },
  ALERT: { icon: AlertTriangle, label: "Alerta", gradient: "from-amber-600 to-orange-500", ring: "ring-amber-500/30" },
  EVENT: { icon: Calendar, label: "Evento", gradient: "from-purple-600 to-pink-500", ring: "ring-purple-500/30" },
};

const filterOptions = [
  { value: "all", label: "Todos" },
  { value: "RADAR", label: "Radar" },
  { value: "GUIDE", label: "Guias" },
  { value: "ALERT", label: "Alertas" },
  { value: "EVENT", label: "Eventos" },
];

export function VaultIntelTab({ clientCpf }: VaultIntelTabProps) {
  const [posts, setPosts] = useState<IntelPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const storiesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPosts();
  }, [clientCpf]);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .rpc("get_vault_intel_posts", { p_cpf: clientCpf });
      if (!error && data) {
        setPosts(data as unknown as IntelPost[]);
      }
    } catch (error) {
      console.error("Error fetching drops:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Agora";
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const scrollStories = (direction: "left" | "right") => {
    if (!storiesRef.current) return;
    const scrollAmount = 280;
    storiesRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const filteredPosts = filter === "all" ? posts : posts.filter((p) => p.type === filter);
  const storyPosts = posts.slice(0, 8); // Latest 8 for stories
  const editorialPosts = filteredPosts;

  // Strip HTML and truncate
  const getExcerpt = (html: string, maxLen = 120) => {
    const text = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ");
    return text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Stories skeleton */}
        <div className="flex gap-3 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-36 h-48 rounded-2xl bg-muted/30 animate-pulse shrink-0" />
          ))}
        </div>
        {/* Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stories Carousel */}
      {storyPosts.length > 0 && (
        <div className="relative group">
          {/* Scroll buttons */}
          <button
            onClick={() => scrollStories("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1/2"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scrollStories("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity translate-x-1/2"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div
            ref={storiesRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2"
          >
            {storyPosts.map((post, i) => {
              const config = typeConfig[post.type];
              return (
                <motion.button
                  key={post.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                  className={cn(
                    "relative w-36 h-48 rounded-2xl shrink-0 snap-start overflow-hidden cursor-pointer group/story",
                    "ring-2 ring-offset-2 ring-offset-background transition-all duration-300",
                    expandedPost === post.id ? config.ring : "ring-transparent hover:ring-muted-foreground/20"
                  )}
                >
                  {/* Gradient background */}
                  <div className={cn("absolute inset-0 bg-gradient-to-br", config.gradient, "opacity-90")} />
                  
                  {/* Content overlay */}
                  <div className="absolute inset-0 flex flex-col justify-between p-3 text-white">
                    <div className="flex items-center justify-between">
                      <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                        <config.icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-[10px] font-medium bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5">
                        {formatDate(post.published_at)}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-tight line-clamp-3 text-left">
                        {post.title}
                      </p>
                      {post.visibility !== "ALL" && (
                        <span className="text-[9px] mt-1 inline-block bg-white/20 rounded px-1.5 py-0.5">
                          {post.visibility === "BLACK_ONLY" ? "🔒 Black" : "🔒 Privilege+"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hover shine */}
                  <div className="absolute inset-0 bg-white/0 group-hover/story:bg-white/10 transition-colors" />
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Expanded Story Content */}
      {expandedPost && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          {(() => {
            const post = posts.find((p) => p.id === expandedPost);
            if (!post) return null;
            const config = typeConfig[post.type];
            return (
              <Card className="overflow-hidden border-border/30">
                <div className={cn("h-1 bg-gradient-to-r", config.gradient)} />
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={cn("bg-gradient-to-r text-white border-0", config.gradient)}>
                      <config.icon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(post.published_at)}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-3">{post.title}</h3>
                  <div
                    className="text-sm text-muted-foreground prose prose-sm prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 text-muted-foreground"
                    onClick={() => setExpandedPost(null)}
                  >
                    Fechar
                  </Button>
                </CardContent>
              </Card>
            );
          })()}
        </motion.div>
      )}

      {/* Filter pills */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
              filter === opt.value
                ? "bg-foreground text-background"
                : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Editorial Grid */}
      {editorialPosts.length === 0 ? (
        <Card className="border-dashed border-border/30">
          <CardContent className="py-16 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
            <p className="text-muted-foreground text-sm font-medium">Nenhum conteúdo disponível</p>
            <p className="text-xs text-muted-foreground mt-1">
              {filter !== "all" ? "Tente outro filtro" : "Em breve teremos novidades exclusivas"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {editorialPosts.map((post, index) => {
            const config = typeConfig[post.type];
            const isFirst = index === 0 && filter === "all";

            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className={cn(isFirst && "md:col-span-2")}
              >
                <Card
                  className={cn(
                    "group overflow-hidden cursor-pointer border-border/20 hover:border-border/40 transition-all duration-300",
                    "hover:shadow-lg hover:shadow-primary/5"
                  )}
                  onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                >
                  {/* Top gradient accent */}
                  <div className={cn("h-1 bg-gradient-to-r", config.gradient)} />

                  <CardContent className={cn("p-5", isFirst && "md:p-6")}>
                    <div className="flex items-start gap-4">
                      {/* Type icon */}
                      <div className={cn(
                        "shrink-0 p-2.5 rounded-xl bg-gradient-to-br",
                        config.gradient,
                        "text-white shadow-lg"
                      )}>
                        <config.icon className={cn("h-5 w-5", isFirst && "md:h-6 md:w-6")} />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Meta row */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className="text-[10px] border-border/30"
                          >
                            {config.label}
                          </Badge>
                          {post.visibility !== "ALL" && (
                            <Badge
                              variant="outline"
                              className="text-[10px] border-primary/30 text-primary"
                            >
                              {post.visibility === "BLACK_ONLY" ? "Black" : "Privilege+"}
                            </Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 ml-auto">
                            <Clock className="h-3 w-3" />
                            {formatDate(post.published_at)}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className={cn(
                          "font-bold leading-snug mb-2 group-hover:text-primary transition-colors",
                          isFirst ? "text-lg md:text-xl" : "text-base"
                        )}>
                          {post.title}
                        </h3>

                        {/* Excerpt */}
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                          {getExcerpt(post.content, isFirst ? 200 : 120)}
                        </p>

                        {/* Read more */}
                        <div className="flex items-center gap-1 mt-3 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          Ler mais
                          <ArrowRight className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}