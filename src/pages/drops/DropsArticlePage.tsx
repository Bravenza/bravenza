import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Clock, Calendar, ExternalLink, Share2,
  Radar, BookOpen, AlertTriangle, Sparkles, Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useClientSession } from "@/hooks/useClientSession";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { FormattedText } from "@/components/client/vault/community/FormattedText";
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

  useEffect(() => {
    if (postId && profile?.cpf) {
      fetchPost();
    }
  }, [postId, profile?.cpf]);

  const fetchPost = async () => {
    if (!profile?.cpf || !postId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .rpc("get_vault_intel_posts", { p_cpf: profile.cpf });

      if (!error && data) {
        const allPosts = data as unknown as DropsPost[];
        const found = allPosts.find((p) => p.id === postId);
        if (found) {
          setPost(found);
          // Get related posts of same type, excluding current
          setRelatedPosts(
            allPosts
              .filter((p) => p.id !== postId)
              .slice(0, 3)
          );
        }
      }
    } catch (err) {
      console.error("Error fetching post:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFullDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  const handleShare = async () => {
    if (navigator.share && post) {
      try {
        await navigator.share({ title: post.title, url: window.location.href });
      } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado!");
    }
  };

  if (sessionLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Skeleton hero */}
        <div className="h-[50vh] bg-muted/20 animate-pulse" />
        <div className="max-w-3xl mx-auto px-4 -mt-16 relative z-10 space-y-4">
          <div className="h-8 w-64 bg-muted/30 rounded animate-pulse" />
          <div className="h-4 w-full bg-muted/20 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-muted/20 rounded animate-pulse" />
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
      {/* Fixed top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/20">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <button
            onClick={() => navigate("/minha-conta?tab=drops")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Drops</span>
          </button>
          <Link to="/">
            <Logo size="sm" />
          </Link>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Hero cover */}
      <div className="relative h-[45vh] sm:h-[55vh] overflow-hidden">
        {post.cover_image ? (
          <img
            src={post.cover_image}
            alt={post.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className={cn("absolute inset-0 bg-gradient-to-br", placeholderGradients[post.type])} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className={cn("p-2 rounded-xl bg-gradient-to-br", config.gradient)}>
                <TypeIcon className="h-4 w-4 text-white" />
              </div>
              <Badge className={cn("bg-gradient-to-r text-white border-0 text-xs", config.gradient)}>
                {config.label}
              </Badge>
              {post.visibility !== "ALL" && (
                <Badge className="bg-white/10 backdrop-blur-sm text-white border-0 text-xs">
                  🔒 {post.visibility === "BLACK_ONLY" ? "Black" : "Privilege+"}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-foreground leading-tight mb-3">
              {post.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
          </div>
        </div>
      </div>

      {/* Article body */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-8 font-light italic border-l-2 border-primary/30 pl-5">
            {post.excerpt}
          </p>
        )}

        {/* Rich HTML content */}
        <div
          className="prose prose-lg prose-invert max-w-none
            prose-headings:text-foreground prose-headings:font-bold prose-headings:tracking-tight
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-foreground/80 prose-p:leading-relaxed prose-p:mb-5
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-strong:text-foreground prose-strong:font-semibold
            prose-blockquote:border-primary/40 prose-blockquote:text-muted-foreground prose-blockquote:italic prose-blockquote:bg-muted/10 prose-blockquote:rounded-r-xl prose-blockquote:py-3 prose-blockquote:px-5
            prose-img:rounded-2xl prose-img:shadow-xl prose-img:my-8
            prose-ul:space-y-2 prose-ol:space-y-2
            prose-li:text-foreground/80"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Media gallery */}
        {post.media_urls && post.media_urls.length > 0 && (
          <div className="mt-10 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Galeria</h3>
            <div className={cn(
              "grid gap-3",
              post.media_urls.length === 1 ? "grid-cols-1" : post.media_urls.length === 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3"
            )}>
              {post.media_urls.map((url, i) => (
                <div key={i} className="relative rounded-2xl overflow-hidden aspect-square bg-muted/20 group">
                  <img
                    src={url}
                    alt={`Imagem ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video */}
        {post.video_url && (
          <div className="mt-10">
            <div className="relative rounded-2xl overflow-hidden aspect-video bg-muted/20 shadow-xl">
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
          <div className="mt-10 p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <p className="text-sm text-muted-foreground mb-3">Saiba mais sobre este assunto</p>
            <a
              href={post.external_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Acessar conteúdo externo
            </a>
          </div>
        )}

        {/* Divider */}
        <div className="mt-14 mb-10 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Related articles */}
        {relatedPosts.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-6">Leia também</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedPosts.map((related) => {
                const relConfig = typeConfig[related.type];
                return (
                  <Link
                    key={related.id}
                    to={`/drops/${related.id}`}
                    className="group block"
                  >
                    <div className="relative rounded-2xl overflow-hidden aspect-[4/3] mb-3">
                      {related.cover_image ? (
                        <img
                          src={related.cover_image}
                          alt={related.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
                    <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                      {related.title}
                    </h3>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Back button */}
        <div className="mt-12 text-center">
          <Button
            variant="outline"
            onClick={() => navigate("/minha-conta?tab=drops")}
            className="rounded-xl"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Drops
          </Button>
        </div>
      </article>
    </div>
  );
}