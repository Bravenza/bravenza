import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Radar, BookOpen, AlertTriangle, Calendar,
  ChevronLeft, ChevronRight, Clock, X, ExternalLink,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface IntelPost {
  id: string;
  type: "RADAR" | "GUIDE" | "ALERT" | "EVENT";
  title: string;
  content: string;
  excerpt: string | null;
  cover_image: string | null;
  media_urls: string[] | null;
  video_url: string | null;
  external_link: string | null;
  read_time_min: number | null;
  is_featured: boolean | null;
  visibility: "ALL" | "PRIVILEGE_PLUS" | "BLACK_ONLY";
  published_at: string;
}

interface VaultIntelTabProps {
  clientCpf: string;
}

const typeConfig = {
  RADAR: { icon: Radar, label: "Radar", gradient: "from-blue-600 to-cyan-500", color: "text-blue-400", bg: "bg-blue-500/10" },
  GUIDE: { icon: BookOpen, label: "Guia", gradient: "from-emerald-600 to-teal-500", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  ALERT: { icon: AlertTriangle, label: "Alerta", gradient: "from-amber-600 to-orange-500", color: "text-amber-400", bg: "bg-amber-500/10" },
  EVENT: { icon: Calendar, label: "Evento", gradient: "from-purple-600 to-pink-500", color: "text-purple-400", bg: "bg-purple-500/10" },
};

const filterOptions = [
  { value: "all", label: "Todos" },
  { value: "RADAR", label: "Radar" },
  { value: "GUIDE", label: "Guias" },
  { value: "ALERT", label: "Alertas" },
  { value: "EVENT", label: "Eventos" },
];

const placeholderGradients: Record<string, string> = {
  RADAR: "from-blue-900 via-blue-800 to-cyan-900",
  GUIDE: "from-emerald-900 via-emerald-800 to-teal-900",
  ALERT: "from-amber-900 via-orange-800 to-red-900",
  EVENT: "from-purple-900 via-purple-800 to-pink-900",
};

export function VaultIntelTab({ clientCpf }: VaultIntelTabProps) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<IntelPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [storyViewOpen, setStoryViewOpen] = useState(false);
  const [storyIndex, setStoryIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const [favoriteBrands, setFavoriteBrands] = useState<string[]>([]);
  const storiesRef = useRef<HTMLDivElement>(null);
  const storyTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchPosts();
    fetchPreferences();
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

  const fetchPreferences = async () => {
    try {
      const { data } = await supabase
        .from("client_preferences")
        .select("favorite_brands")
        .eq("client_cpf", clientCpf)
        .maybeSingle();
      if (data?.favorite_brands) {
        setFavoriteBrands(data.favorite_brands.map((b: string) => b.toLowerCase()));
      }
    } catch { /* silent */ }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffHours < 1) return "Agora";
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const getExcerpt = (post: IntelPost, maxLen = 120) => {
    if (post.excerpt) return post.excerpt;
    const text = post.content.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ");
    return text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
  };

  const scrollStories = (direction: "left" | "right") => {
    if (!storiesRef.current) return;
    storiesRef.current.scrollBy({ left: direction === "left" ? -200 : 200, behavior: "smooth" });
  };

  // Story viewer
  const openStory = (index: number) => { setStoryIndex(index); setStoryViewOpen(true); setStoryProgress(0); };
  const closeStory = () => { setStoryViewOpen(false); if (storyTimerRef.current) clearInterval(storyTimerRef.current); };
  const nextStory = () => { if (storyIndex < storyPosts.length - 1) { setStoryIndex(i => i + 1); setStoryProgress(0); } else closeStory(); };
  const prevStory = () => { if (storyIndex > 0) { setStoryIndex(i => i - 1); setStoryProgress(0); } };

  useEffect(() => {
    if (!storyViewOpen) return;
    setStoryProgress(0);
    const interval = setInterval(() => {
      setStoryProgress(p => { if (p >= 100) { nextStory(); return 0; } return p + 1; });
    }, 80);
    storyTimerRef.current = interval;
    return () => clearInterval(interval);
  }, [storyViewOpen, storyIndex]);

  const filteredPosts = filter === "all" ? posts : posts.filter(p => p.type === filter);
  const storyPosts = posts.slice(0, 12);
  const featuredPost = filteredPosts.find(p => p.is_featured);
  const editorialPosts = filteredPosts.filter(p => p.id !== featuredPost?.id);

  // Personalized: posts mentioning user's favorite brands
  const personalizedPosts = favoriteBrands.length > 0
    ? filteredPosts.filter(p => {
        const text = `${p.title} ${p.content}`.toLowerCase();
        return favoriteBrands.some(brand => text.includes(brand));
      })
    : [];
  const personalizedIds = new Set(personalizedPosts.map(p => p.id));
  const remainingEditorial = editorialPosts.filter(p => !personalizedIds.has(p.id));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-4 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 shrink-0">
              <div className="w-[68px] h-[68px] rounded-full bg-muted/30 animate-pulse" />
              <div className="w-12 h-2 rounded bg-muted/20 animate-pulse" />
            </div>
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-muted/20 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-muted/20 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ===== STORIES ROW ===== */}
      {storyPosts.length > 0 && (
        <div className="relative group">
          <button onClick={() => scrollStories("left")} className="absolute left-0 top-[34px] -translate-y-1/2 z-10 p-1 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1/2">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => scrollStories("right")} className="absolute right-0 top-[34px] -translate-y-1/2 z-10 p-1 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity translate-x-1/2">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <div ref={storiesRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 px-1">
            {storyPosts.map((post, i) => {
              const config = typeConfig[post.type];
              return (
                <motion.button key={post.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }} onClick={() => openStory(i)} className="flex flex-col items-center gap-1.5 shrink-0 group/story">
                  <div className={cn("p-[3px] rounded-full bg-gradient-to-br", config.gradient)}>
                    <div className="w-[62px] h-[62px] rounded-full bg-background p-[2px]">
                      {post.cover_image ? (
                        <img src={post.cover_image} alt={post.title} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <div className={cn("w-full h-full rounded-full bg-gradient-to-br flex items-center justify-center", config.gradient)}>
                          <config.icon className="h-5 w-5 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground max-w-[72px] truncate group-hover/story:text-foreground transition-colors">
                    {config.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== STORY FULLSCREEN VIEWER ===== */}
      <AnimatePresence>
        {storyViewOpen && storyPosts[storyIndex] && (() => {
          const post = storyPosts[storyIndex];
          const config = typeConfig[post.type];
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black"
              onClick={(e) => {
                const rect = (e.target as HTMLElement).getBoundingClientRect();
                const x = e.clientX - rect.left;
                if (x < rect.width / 3) prevStory();
                else if (x > (rect.width * 2) / 3) nextStory();
              }}
            >
              {/* Progress bars */}
              <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-3 pt-[max(12px,env(safe-area-inset-top))]">
                {storyPosts.map((_, i) => (
                  <div key={i} className="flex-1 h-[2px] rounded-full bg-white/20 overflow-hidden">
                    <div className="h-full bg-white rounded-full transition-all duration-100"
                      style={{ width: i < storyIndex ? "100%" : i === storyIndex ? `${storyProgress}%` : "0%" }} />
                  </div>
                ))}
              </div>

              {/* Close */}
              <button onClick={(e) => { e.stopPropagation(); closeStory(); }}
                className="absolute top-[max(40px,calc(env(safe-area-inset-top)+28px))] right-4 z-20 p-2 rounded-full bg-white/10 backdrop-blur-sm">
                <X className="h-5 w-5 text-white" />
              </button>

              {/* Header */}
              <div className="absolute top-[max(40px,calc(env(safe-area-inset-top)+28px))] left-4 z-10 flex items-center gap-3">
                <div className={cn("p-2 rounded-full bg-gradient-to-br", config.gradient)}>
                  <config.icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{config.label}</p>
                  <p className="text-white/60 text-xs">{formatDate(post.published_at)}</p>
                </div>
              </div>

              {/* BG image */}
              {post.cover_image ? (
                <img src={post.cover_image} alt={post.title} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className={cn("absolute inset-0 bg-gradient-to-b", placeholderGradients[post.type])} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/50" />

              {/* Content overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 pb-[max(24px,calc(env(safe-area-inset-bottom)+16px))] z-10">
                {post.visibility !== "ALL" && (
                  <Badge className="mb-3 bg-white/10 backdrop-blur-sm text-white border-0">
                    🔒 {post.visibility === "BLACK_ONLY" ? "Black" : "Privilege+"}
                  </Badge>
                )}
                <h2 className="text-white text-xl font-bold leading-tight mb-3">{post.title}</h2>
                <p className="text-white/70 text-sm leading-relaxed line-clamp-3">{getExcerpt(post, 200)}</p>
                {/* Read full article */}
                <button
                  onClick={(e) => { e.stopPropagation(); closeStory(); navigate(`/drops/${post.id}`); }}
                  className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition"
                >
                  Ler matéria completa <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Nav hints */}
              {storyIndex > 0 && <ChevronLeft className="absolute top-1/2 left-4 -translate-y-1/2 z-10 h-8 w-8 text-white/30" />}
              {storyIndex < storyPosts.length - 1 && <ChevronRight className="absolute top-1/2 right-4 -translate-y-1/2 z-10 h-8 w-8 text-white/30" />}
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ===== FILTER PILLS ===== */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {filterOptions.map(opt => (
          <button key={opt.value} onClick={() => setFilter(opt.value)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
              filter === opt.value ? "bg-foreground text-background" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
            )}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* ===== FEATURED POST (Hero) ===== */}
      {featuredPost && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card
            className="overflow-hidden cursor-pointer group border-0 shadow-xl"
            onClick={() => navigate(`/drops/${featuredPost.id}`)}
          >
            <div className="relative h-56 md:h-72 overflow-hidden">
              {featuredPost.cover_image ? (
                <img src={featuredPost.cover_image} alt={featuredPost.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              ) : (
                <div className={cn("absolute inset-0 bg-gradient-to-br", placeholderGradients[featuredPost.type])} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={cn("bg-gradient-to-r text-white border-0 text-[10px]", typeConfig[featuredPost.type].gradient)}>
                    {typeConfig[featuredPost.type].label}
                  </Badge>
                  <span className="text-white/50 text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {featuredPost.read_time_min || 2} min
                  </span>
                  {featuredPost.visibility !== "ALL" && (
                    <Badge className="bg-white/10 backdrop-blur-sm text-white/80 border-0 text-[10px]">
                      🔒 {featuredPost.visibility === "BLACK_ONLY" ? "Black" : "Privilege+"}
                    </Badge>
                  )}
                </div>
                <h2 className="text-white text-xl md:text-2xl font-bold leading-tight mb-2 group-hover:text-primary transition-colors">
                  {featuredPost.title}
                </h2>
                <p className="text-white/60 text-sm leading-relaxed line-clamp-2 max-w-xl">
                  {getExcerpt(featuredPost, 180)}
                </p>
              </div>
              <div className="absolute top-4 left-4">
                <Badge className="bg-primary text-primary-foreground text-[10px]">
                  <Sparkles className="h-3 w-3 mr-1" /> Destaque
                </Badge>
              </div>
              {/* Read CTA */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-1 text-xs text-white bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  Ler matéria <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ===== EDITORIAL GRID ===== */}
      {editorialPosts.length === 0 && !featuredPost ? (
        <Card className="border-dashed border-border/30">
          <CardContent className="py-20 text-center">
            <Sparkles className="h-14 w-14 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-foreground font-medium mb-1">Nenhum drop disponível</p>
            <p className="text-sm text-muted-foreground">
              {filter !== "all" ? "Tente outro filtro" : "Em breve teremos novidades exclusivas para você"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Personalized "Para você" section */}
          {personalizedPosts.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
                Para você
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {personalizedPosts.slice(0, 4).map((post, index) => {
                  const config = typeConfig[post.type];
                  return (
                    <motion.div key={post.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
                      <Card
                        className="group overflow-hidden cursor-pointer border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 ring-1 ring-primary/10"
                        onClick={() => navigate(`/drops/${post.id}`)}
                      >
                        <div className="relative h-36 overflow-hidden">
                          {post.cover_image ? (
                            <img src={post.cover_image} alt={post.title}
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                          ) : (
                            <div className={cn("absolute inset-0 bg-gradient-to-br", placeholderGradients[post.type])} />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          <div className="absolute bottom-3 left-3 right-3">
                            <h3 className="text-white text-sm font-bold leading-snug line-clamp-2">{post.title}</h3>
                          </div>
                        </div>
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] border-primary/20 text-primary">Recomendado</Badge>
                            <Badge variant="outline" className="text-[10px] border-border/20">{config.label}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(personalizedPosts.length > 0 ? remainingEditorial : editorialPosts).map((post, index) => {
            const config = typeConfig[post.type];
            return (
              <motion.div key={post.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
                <Card
                  className="group overflow-hidden cursor-pointer border-border/15 hover:border-border/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
                  onClick={() => navigate(`/drops/${post.id}`)}
                >
                  {/* Cover image */}
                  <div className="relative h-44 overflow-hidden">
                    {post.cover_image ? (
                      <img src={post.cover_image} alt={post.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className={cn("absolute inset-0 bg-gradient-to-br", placeholderGradients[post.type])} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <div className={cn("p-1.5 rounded-lg bg-gradient-to-br", config.gradient)}>
                        <config.icon className="h-3.5 w-3.5 text-white" />
                      </div>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="text-[10px] text-white/70 bg-black/30 backdrop-blur-sm rounded-full px-2 py-0.5">
                        {formatDate(post.published_at)}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-white text-sm font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                    </div>
                    {/* Hover CTA */}
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-1 text-[10px] text-white bg-white/10 backdrop-blur-sm px-2 py-1 rounded-full">
                        Ler <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-[10px] border-border/20">{config.label}</Badge>
                      {post.read_time_min && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Clock className="h-3 w-3" /> {post.read_time_min} min
                        </span>
                      )}
                      {post.visibility !== "ALL" && (
                        <Badge variant="outline" className="text-[10px] border-primary/20 text-primary ml-auto">
                          {post.visibility === "BLACK_ONLY" ? "Black" : "Privilege+"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {getExcerpt(post)}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
        </>
      )}
    </div>
  );
}