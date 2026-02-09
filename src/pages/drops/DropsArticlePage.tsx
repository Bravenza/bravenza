import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowLeft, Clock, Calendar, ExternalLink, Share2,
  Radar, BookOpen, AlertTriangle, Sparkles, Bookmark, Heart,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useClientSession } from "@/hooks/useClientSession";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";

interface DropsPost {
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

const typeConfig = {
  RADAR: { icon: Radar, label: "Radar", gradient: "from-blue-600 to-cyan-500", color: "text-blue-400" },
  GUIDE: { icon: BookOpen, label: "Guia", gradient: "from-emerald-600 to-teal-500", color: "text-emerald-400" },
  ALERT: { icon: AlertTriangle, label: "Alerta", gradient: "from-amber-600 to-orange-500", color: "text-amber-400" },
  EVENT: { icon: Sparkles, label: "Evento", gradient: "from-purple-600 to-pink-500", color: "text-purple-400" },
};

const placeholderGradients: Record<string, string> = {
  RADAR: "from-blue-900 via-blue-800 to-cyan-900",
  GUIDE: "from-emerald-900 via-emerald-800 to-teal-900",
  ALERT: "from-amber-900 via-orange-800 to-red-900",
  EVENT: "from-purple-900 via-purple-800 to-pink-900",
};

export default function DropsArticlePage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { profile, isLoading: sessionLoading } = useClientSession();
  const [post, setPost] = useState<DropsPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [relatedPosts, setRelatedPosts] = useState<DropsPost[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  // Reading progress
  const { scrollYProgress } = useScroll();
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  // Parallax for hero
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, 80]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 1.1]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0.3]);

  useEffect(() => {
    if (postId && profile?.cpf) fetchPost();
  }, [postId, profile?.cpf]);

  const fetchPost = async () => {
    if (!profile?.cpf || !postId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_vault_intel_posts", { p_cpf: profile.cpf });
      if (!error && data) {
        const allPosts = data as unknown as DropsPost[];
        const found = allPosts.find((p) => p.id === postId);
        if (found) {
          setPost(found);
          setRelatedPosts(allPosts.filter((p) => p.id !== postId).slice(0, 3));
        }
      }
    } catch (err) {
      console.error("Error fetching post:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFullDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  const handleShare = useCallback(async () => {
    if (navigator.share && post) {
      try {
        await navigator.share({ title: post.title, url: window.location.href });
      } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado!");
    }
  }, [post]);

  if (sessionLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-[55vh] bg-muted/10 animate-pulse" />
        <div className="max-w-3xl mx-auto px-4 -mt-16 relative z-10 space-y-4">
          <div className="h-10 w-72 bg-muted/15 rounded-lg animate-pulse" />
          <div className="h-4 w-full bg-muted/10 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-muted/10 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Artigo não encontrado</p>
        <Button variant="outline" onClick={() => navigate("/minha-conta?tab=drops")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para Drops
        </Button>
      </div>
    );
  }

  const config = typeConfig[post.type];
  const TypeIcon = config.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Reading progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] bg-primary z-[60] origin-left"
        style={{ width: progressWidth }}
      />

      {/* Fixed top bar - glassmorphism */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/40 backdrop-blur-2xl border-b border-border/10">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <button
            onClick={() => navigate("/minha-conta?tab=drops")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Drops</span>
          </button>
          <Link to="/">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-9 w-9 transition-colors", isBookmarked && "text-primary")}
              onClick={() => { setIsBookmarked(!isBookmarked); toast.success(isBookmarked ? "Removido dos salvos" : "Salvo!"); }}
            >
              <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-primary")} />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero cover with parallax */}
      <motion.div
        className="relative h-[50vh] sm:h-[60vh] overflow-hidden"
        style={{ y: heroY }}
      >
        <motion.div className="absolute inset-0" style={{ scale: heroScale, opacity: heroOpacity }}>
          {post.cover_image ? (
            <img
              src={post.cover_image}
              alt={post.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className={cn("absolute inset-0 bg-gradient-to-br", placeholderGradients[post.type])} />
          )}
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 z-10">
          <motion.div
            className="max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className={cn("p-2.5 rounded-2xl bg-gradient-to-br shadow-lg", config.gradient)}>
                <TypeIcon className="h-4 w-4 text-white" />
              </div>
              <Badge className={cn("bg-gradient-to-r text-white border-0 text-xs font-semibold", config.gradient)}>
                {config.label}
              </Badge>
              {post.visibility !== "ALL" && (
                <Badge className="bg-white/10 backdrop-blur-md text-white border-0 text-xs">
                  🔒 {post.visibility === "BLACK_ONLY" ? "Black" : "Privilege+"}
                </Badge>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-[1.1] tracking-tight mb-6">
              {post.title}
            </h1>
            <div className="flex items-center gap-5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {formatFullDate(post.published_at)}
              </span>
              {post.read_time_min && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {post.read_time_min} min de leitura
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Article body */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Excerpt */}
        {post.excerpt && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-12 font-light italic border-l-2 border-primary/30 pl-6"
          >
            {post.excerpt}
          </motion.p>
        )}

        {/* Rich HTML content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="drops-article-content"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Media gallery */}
        {post.media_urls && post.media_urls.length > 0 && (
          <div className="mt-12 space-y-5">
            <h3 className="text-lg font-bold text-foreground tracking-tight">Galeria</h3>
            <div className={cn(
              "grid gap-3",
              post.media_urls.length === 1
                ? "grid-cols-1"
                : post.media_urls.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-2 md:grid-cols-3"
            )}>
              {post.media_urls.map((url, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative rounded-2xl overflow-hidden aspect-square bg-muted/10 group cursor-pointer"
                >
                  <img
                    src={url}
                    alt={`Imagem ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Video */}
        {post.video_url && (
          <div className="mt-12">
            <div className="relative rounded-3xl overflow-hidden aspect-video bg-muted/10 shadow-2xl">
              {post.video_url.includes("youtube") || post.video_url.includes("youtu.be") ? (
                <iframe
                  src={post.video_url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video src={post.video_url} controls className="w-full h-full object-cover" />
              )}
            </div>
          </div>
        )}

        {/* External link CTA */}
        {post.external_link && (
          <div className="mt-12 p-7 rounded-3xl bg-gradient-to-r from-primary/8 to-primary/3 border border-primary/15">
            <p className="text-sm text-muted-foreground mb-4">Saiba mais sobre este assunto</p>
            <a
              href={post.external_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98]"
            >
              <ExternalLink className="h-4 w-4" />
              Acessar conteúdo externo
            </a>
          </div>
        )}

        {/* Reaction bar */}
        <div className="mt-14 flex items-center justify-center gap-4">
          <button
            onClick={() => { setIsLiked(!isLiked); toast.success(isLiked ? "Curtida removida" : "Curtido! ❤️"); }}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-300",
              isLiked
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-muted/10 border-border/20 text-muted-foreground hover:bg-muted/20"
            )}
          >
            <Heart className={cn("h-4 w-4", isLiked && "fill-red-400")} />
            <span className="text-sm font-medium">{isLiked ? "Curtido" : "Curtir"}</span>
          </button>
          <button
            onClick={() => { setIsBookmarked(!isBookmarked); toast.success(isBookmarked ? "Removido" : "Salvo!"); }}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-300",
              isBookmarked
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-muted/10 border-border/20 text-muted-foreground hover:bg-muted/20"
            )}
          >
            <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-primary")} />
            <span className="text-sm font-medium">{isBookmarked ? "Salvo" : "Salvar"}</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border bg-muted/10 border-border/20 text-muted-foreground hover:bg-muted/20 transition-all"
          >
            <Share2 className="h-4 w-4" />
            <span className="text-sm font-medium">Compartilhar</span>
          </button>
        </div>

        {/* Divider */}
        <div className="mt-16 mb-12 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

        {/* Related articles */}
        {relatedPosts.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-8 tracking-tight">Leia também</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {relatedPosts.map((related) => {
                const relConfig = typeConfig[related.type];
                return (
                  <Link key={related.id} to={`/drops/${related.id}`} className="group block">
                    <div className="relative rounded-2xl overflow-hidden aspect-[4/3] mb-3">
                      {related.cover_image ? (
                        <img
                          src={related.cover_image}
                          alt={related.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className={cn("w-full h-full bg-gradient-to-br", placeholderGradients[related.type])} />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-3 left-3">
                        <Badge className={cn("bg-gradient-to-r text-white border-0 text-[10px]", relConfig.gradient)}>
                          {relConfig.label}
                        </Badge>
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors tracking-tight">
                      {related.title}
                    </h3>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Back */}
        <div className="mt-14 text-center">
          <Button
            variant="outline"
            onClick={() => navigate("/minha-conta?tab=drops")}
            className="rounded-2xl px-6 border-border/20 hover:border-border/40"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Drops
          </Button>
        </div>
      </article>
    </div>
  );
}
