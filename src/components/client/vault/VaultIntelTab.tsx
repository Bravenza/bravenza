import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Bookmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  DropsStories,
  DropsStoryViewer,
  DropsHeroCard,
  DropsEditorialCard,
  DropsFilters,
} from "./drops";
import type { DropsPost } from "./drops";

interface VaultIntelTabProps {
  clientCpf: string;
}

export function VaultIntelTab({ clientCpf }: VaultIntelTabProps) {
  const [posts, setPosts] = useState<DropsPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [storyOpen, setStoryOpen] = useState(false);
  const [storyIndex, setStoryIndex] = useState(0);
  const [favoriteBrands, setFavoriteBrands] = useState<string[]>([]);
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPosts();
    fetchPreferences();
    fetchSavedPosts();
  }, [clientCpf]);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_vault_intel_posts", { p_cpf: clientCpf });
      if (!error && data) setPosts(data as unknown as DropsPost[]);
    } catch (e) {
      console.error("Error fetching drops:", e);
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

  const fetchSavedPosts = async () => {
    try {
      const { data } = await supabase
        .from("vault_intel_bookmarks")
        .select("post_id")
        .eq("client_cpf", clientCpf);
      if (data) {
        setSavedPostIds(new Set(data.map((b: any) => b.post_id)));
      }
    } catch { /* silent */ }
  };

  const openStory = (index: number) => {
    setStoryIndex(index);
    setStoryOpen(true);
  };

  const filteredPosts = filter === "all" 
    ? posts 
    : filter === "saved" 
      ? posts.filter((p) => savedPostIds.has(p.id))
      : posts.filter((p) => p.type === filter);
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
  const storyPosts = posts
    .filter((p) => new Date(p.published_at).getTime() > twentyFourHoursAgo)
    .slice(0, 12);
  const featuredPost = filteredPosts.find((p) => p.is_featured);
  const editorialPosts = filteredPosts.filter((p) => p.id !== featuredPost?.id);

  // Personalized
  const personalizedPosts =
    favoriteBrands.length > 0
      ? filteredPosts.filter((p) => {
          const text = `${p.title} ${p.content}`.toLowerCase();
          return favoriteBrands.some((brand) => text.includes(brand));
        })
      : [];
  const personalizedIds = new Set(personalizedPosts.map((p) => p.id));
  const remainingEditorial = editorialPosts.filter((p) => !personalizedIds.has(p.id));
  const displayEditorial = personalizedPosts.length > 0 ? remainingEditorial : editorialPosts;

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Stories skeleton */}
        <div className="flex gap-5 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 shrink-0">
              <div className="w-[70px] h-[70px] rounded-full bg-muted/20 animate-pulse" />
              <div className="w-12 h-2 rounded bg-muted/10 animate-pulse" />
            </div>
          ))}
        </div>
        {/* Hero skeleton */}
        <div className="h-[340px] rounded-3xl bg-muted/15 animate-pulse" />
        {/* Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-muted/10 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stories */}
      <DropsStories posts={storyPosts} onOpenStory={openStory} />
      <DropsStoryViewer
        posts={storyPosts}
        initialIndex={storyIndex}
        open={storyOpen}
        onClose={() => setStoryOpen(false)}
      />

      {/* Filters */}
      <DropsFilters value={filter} onChange={setFilter} />

      {/* Featured Hero */}
      {featuredPost && <DropsHeroCard post={featuredPost} />}

      {/* Content */}
      {editorialPosts.length === 0 && !featuredPost ? (
        <Card className="border-dashed border-border/20 bg-card/50">
          <CardContent className="py-24 text-center">
            {filter === "saved" ? (
              <>
                <Bookmark className="h-16 w-16 text-muted-foreground mx-auto mb-5 opacity-15" />
                <p className="text-foreground font-semibold mb-1">Nenhum drop salvo</p>
                <p className="text-sm text-muted-foreground">
                  Salve artigos que te interessam para ler depois
                </p>
              </>
            ) : (
              <>
                <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-5 opacity-15" />
                <p className="text-foreground font-semibold mb-1">Nenhum drop disponível</p>
                <p className="text-sm text-muted-foreground">
                  {filter !== "all" ? "Tente outro filtro" : "Em breve teremos novidades exclusivas"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Personalized "Para Você" */}
          {personalizedPosts.length > 0 && (
            <div>
              <motion.h3
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm font-semibold mb-4 flex items-center gap-2 text-primary"
              >
                <Sparkles className="h-4 w-4" />
                Para você
              </motion.h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {personalizedPosts.slice(0, 4).map((post, i) => (
                  <DropsEditorialCard key={post.id} post={post} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Editorial grid - Apple Newsroom style with varied layout */}
          {displayEditorial.length > 0 && (
            <div>
              {personalizedPosts.length > 0 && (
                <h3 className="text-sm font-semibold mb-4 text-muted-foreground">
                  Mais drops
                </h3>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {displayEditorial.map((post, i) => {
                  // Alternate layout: every 3rd item is wide
                  const variant = i % 5 === 0 && i > 0 ? "wide" : "default";
                  return (
                    <DropsEditorialCard
                      key={post.id}
                      post={post}
                      index={i}
                      variant={variant}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
