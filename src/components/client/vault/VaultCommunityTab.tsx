import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, MessageSquare, RefreshCw, Loader2, Image, Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  CommunityPostCard,
  CommunityOnlineUsers,
  CommunityTrending,
  CommunityNewPost,
  CommunityProfile,
  CommunityFeedTabs,
  CommunityProfileHeader,
  type CommunityPost,
} from "./community";

interface VaultMember {
  id: string;
  community_opt_in?: boolean;
  following_count?: number;
}

interface VaultCommunityTabProps {
  clientCpf: string;
  member: VaultMember | null;
}

export function VaultCommunityTab({ clientCpf, member }: VaultCommunityTabProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOptedIn, setIsOptedIn] = useState(false);
  const [isUpdatingOptIn, setIsUpdatingOptIn] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [feedType, setFeedType] = useState<"for_you" | "following">("for_you");
  const [followingCount, setFollowingCount] = useState(0);
  const [memberProfile, setMemberProfile] = useState<{ avatar_url?: string | null; display_name?: string } | null>(null);

  useEffect(() => {
    checkOptIn();
  }, [clientCpf]);

  useEffect(() => {
    if (isOptedIn) {
      fetchPosts();
      setupRealtime();
      fetchMemberProfile();
    }
  }, [isOptedIn]);

  const checkOptIn = async () => {
    const { data } = await supabase.rpc("get_vault_member", { p_cpf: clientCpf });
    if (data && data.length > 0) {
      setIsOptedIn(data[0].community_opt_in || false);
      setFollowingCount((data[0] as any).following_count || 0);
    }
    setIsLoading(false);
  };

  const fetchMemberProfile = async () => {
    if (!member) return;
    const { data } = await supabase
      .from("vault_members")
      .select("avatar_url, display_name")
      .eq("id", member.id)
      .maybeSingle();
    if (data) setMemberProfile(data);
  };

  const setupRealtime = () => {
    const channel = supabase
      .channel("community_feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "vault_community_posts" }, () => {
        fetchPosts(true);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  };

  const fetchPosts = async (refresh = false, type?: "for_you" | "following") => {
    if (refresh) { setIsRefreshing(true); setOffset(0); }
    const currentFeedType = type || feedType;
    try {
      const currentOffset = refresh ? 0 : offset;
      const rpcName = currentFeedType === "following" ? "get_following_feed" : "get_vault_community_feed";
      const { data, error } = await (supabase.rpc as any)(rpcName, {
        p_cpf: clientCpf, p_limit: 20, p_offset: currentOffset,
      });
      if (!error && data) {
        const newPosts = data as unknown as CommunityPost[];
        if (refresh) { setPosts(newPosts); } else { setPosts(prev => [...prev, ...newPosts]); }
        setHasMore(newPosts.length === 20);
        setOffset(currentOffset + newPosts.length);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleFeedTypeChange = (type: "for_you" | "following") => {
    setFeedType(type);
    setPosts([]);
    setOffset(0);
    setHasMore(true);
    fetchPosts(true, type);
  };

  const handleProfileClick = (memberId: string) => setSelectedProfileId(memberId);

  const handleOptInToggle = async () => {
    setIsUpdatingOptIn(true);
    try {
      const { error } = await supabase.rpc("update_vault_community_opt_in", {
        p_cpf: clientCpf, p_opt_in: !isOptedIn,
      });
      if (error) throw error;
      const newOptIn = !isOptedIn;
      setIsOptedIn(newOptIn);
      toast({
        title: newOptIn ? "Bem-vindo à comunidade! 🎉" : "Você saiu da comunidade",
        description: newOptIn ? "Agora você pode interagir com outros membros" : "Você não verá mais publicações",
      });
      if (newOptIn) {
        fetchPosts(true);
        try {
          const { sendMarketplaceEmail } = await import("@/lib/marketplace-email-notifications");
          const { data: memberData } = await supabase
            .from("vault_members")
            .select("client_name, client_email")
            .eq("client_cpf", clientCpf)
            .maybeSingle();
          if (memberData?.client_email) {
            sendMarketplaceEmail({ type: "community_welcome", recipient_name: memberData.client_name, recipient_email: memberData.client_email });
          }
        } catch {}
      }
    } catch {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    } finally {
      setIsUpdatingOptIn(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const { data, error } = await supabase.rpc("toggle_post_like", { p_post_id: postId, p_cpf: clientCpf });
      const response = data as { success?: boolean; liked?: boolean; likes_count?: number } | null;
      if (error) return { success: false };
      if (response?.success) {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, has_liked: response.liked ?? p.has_liked, likes_count: response.likes_count ?? p.likes_count } : p));
        return { success: true, liked: response.liked, likes_count: response.likes_count };
      }
      return { success: false };
    } catch { return { success: false }; }
  };

  const handleReaction = async (postId: string, reactionType: string) => {
    try {
      const { data, error } = await supabase.rpc("toggle_post_reaction", { p_post_id: postId, p_cpf: clientCpf, p_reaction_type: reactionType });
      const response = data as { success?: boolean; added?: boolean; summary?: Record<string, number> } | null;
      if (error) return { success: false };
      if (response?.success) {
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            const userReactions = p.user_reactions || [];
            const newUserReactions = response.added ? [...userReactions, reactionType] : userReactions.filter(r => r !== reactionType);
            return { ...p, user_reactions: newUserReactions, reactions_summary: response.summary ?? p.reactions_summary };
          }
          return p;
        }));
        return { success: true, added: response.added, summary: response.summary };
      }
      return { success: false };
    } catch { return { success: false }; }
  };

  const handleLoadMore = () => { if (!isLoading && hasMore) fetchPosts(); };
  const handleRefresh = () => fetchPosts(true);
  const handlePostCreated = () => fetchPosts(true);

  // Onboarding
  if (!isOptedIn && !isLoading) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto text-center py-12">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/5 to-primary/20 blur-3xl rounded-full" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mx-auto border border-primary/15">
            <Users className="h-10 w-10 text-primary/60" />
          </div>
        </div>

        <h2 className="text-xl font-bold mb-2 tracking-tight">Comunidade Vault</h2>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed max-w-xs mx-auto">
          Conecte-se com colecionadores de elite. Compartilhe, discuta e descubra.
        </p>

        <div className="flex justify-center gap-6 mb-8 text-center">
          {[
            { icon: Image, label: "Showcase" },
            { icon: MessageSquare, label: "Discussões" },
            { icon: Users, label: "Networking" },
          ].map((f, i) => (
            <motion.div key={f.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }}>
              <div className="w-12 h-12 rounded-2xl bg-muted/20 flex items-center justify-center mx-auto mb-2">
                <f.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className="text-[11px] text-muted-foreground">{f.label}</span>
            </motion.div>
          ))}
        </div>

        <Button size="lg" onClick={handleOptInToggle} disabled={isUpdatingOptIn} className="btn-gold rounded-full px-8">
          {isUpdatingOptIn ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Entrando...</> : "Entrar na comunidade"}
        </Button>
        <p className="text-[10px] text-muted-foreground/50 mt-4">Você pode sair a qualquer momento</p>
      </motion.div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Main community view
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8">
      {/* Main feed column */}
      <div className="max-w-xl mx-auto w-full lg:max-w-none space-y-0">
        {/* Profile header */}
        {member && (
          <CommunityProfileHeader
            memberId={member.id}
            onProfileClick={handleProfileClick}
          />
        )}

        {/* Feed tabs */}
        <CommunityFeedTabs
          activeTab={feedType}
          onTabChange={handleFeedTypeChange}
          followingCount={followingCount}
        />

        {/* Inline composer */}
        <div className="py-4">
          {member && (
            <CommunityNewPost 
              memberId={member.id} 
              onPostCreated={handlePostCreated}
              avatarUrl={memberProfile?.avatar_url}
              displayName={memberProfile?.display_name}
            />
          )}
        </div>

        {/* Refresh indicator */}
        {isRefreshing && (
          <div className="flex justify-center py-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}

        {/* Feed */}
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="h-10 w-10 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {feedType === "following" ? "Nenhuma publicação de quem você segue" : "Nenhuma publicação ainda"}
            </p>
            <p className="text-xs text-muted-foreground/60">
              {feedType === "following" ? "Siga outros membros para ver suas publicações" : "Seja o primeiro a publicar!"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/15">
            <AnimatePresence mode="popLayout">
              {posts.map((post) => (
                <div key={post.id} className="py-3">
                  <CommunityPostCard
                    post={post}
                    clientCpf={clientCpf}
                    onLike={handleLike}
                    onReaction={handleReaction}
                    onAuthorClick={handleProfileClick}
                  />
                </div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Load more */}
        {hasMore && posts.length > 0 && (
          <div className="text-center py-6">
            <Button variant="ghost" size="sm" onClick={handleLoadMore} disabled={isLoading} className="text-xs text-muted-foreground">
              {isLoading ? <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Carregando...</> : "Carregar mais"}
            </Button>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <aside className="hidden lg:block space-y-8 sticky top-24 self-start">
        {/* Opt-in control */}
        <div className="flex items-center gap-2">
          <Switch id="community-opt-in" checked={isOptedIn} onCheckedChange={handleOptInToggle} disabled={isUpdatingOptIn} />
          <Label htmlFor="community-opt-in" className="text-[11px] text-muted-foreground">Participando</Label>
        </div>

        <CommunityOnlineUsers clientCpf={clientCpf} onProfileClick={handleProfileClick} />
        <CommunityTrending onProfileClick={handleProfileClick} />

        {/* Footer links */}
        <div className="text-[10px] text-muted-foreground/30 space-x-2">
          <span>Regras</span>
          <span>·</span>
          <span>Privacidade</span>
          <span>·</span>
          <span>© Bravenza 2026</span>
        </div>
      </aside>

      {/* Profile modal */}
      {selectedProfileId && (
        <CommunityProfile
          memberId={selectedProfileId}
          clientCpf={clientCpf}
          onClose={() => setSelectedProfileId(null)}
          onFollowChange={() => { checkOptIn(); fetchPosts(true); }}
        />
      )}
    </div>
  );
}
