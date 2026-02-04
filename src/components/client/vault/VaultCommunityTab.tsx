import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Image, MessageSquare, RefreshCw, Loader2, Settings, LogOut, UserCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  CommunityPostCard,
  CommunityComments,
  CommunityOnlineUsers,
  CommunityTrending,
  CommunityNewPost,
  CommunityProfile,
  CommunityFeedTabs,
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
  
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOptedIn, setIsOptedIn] = useState(false);
  const [isUpdatingOptIn, setIsUpdatingOptIn] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [feedType, setFeedType] = useState<"for_you" | "following">("for_you");
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    checkOptIn();
  }, [clientCpf]);

  useEffect(() => {
    if (isOptedIn) {
      fetchPosts();
      setupRealtime();
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

  const setupRealtime = () => {
    const channel = supabase
      .channel("community_feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "vault_community_posts" },
        () => {
          // Refresh feed when new post is added
          fetchPosts(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchPosts = async (refresh = false, type?: "for_you" | "following") => {
    if (refresh) {
      setIsRefreshing(true);
      setOffset(0);
    }

    const currentFeedType = type || feedType;

    try {
      const currentOffset = refresh ? 0 : offset;
      
      // Use different RPC based on feed type
      const rpcName = currentFeedType === "following" ? "get_following_feed" : "get_vault_community_feed";
      const { data, error } = await (supabase.rpc as any)(rpcName, {
        p_cpf: clientCpf,
        p_limit: 20,
        p_offset: currentOffset,
      });

      if (!error && data) {
        const newPosts = data as unknown as CommunityPost[];
        if (refresh) {
          setPosts(newPosts);
        } else {
          setPosts(prev => [...prev, ...newPosts]);
        }
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

  const handleProfileClick = (memberId: string) => {
    setSelectedProfileId(memberId);
  };

  const handleOptInToggle = async () => {
    setIsUpdatingOptIn(true);
    
    try {
      const { error } = await supabase.rpc("update_vault_community_opt_in", {
        p_cpf: clientCpf,
        p_opt_in: !isOptedIn,
      });
      
      if (error) throw error;
      
      const newOptIn = !isOptedIn;
      setIsOptedIn(newOptIn);
      
      toast({
        title: newOptIn ? "Bem-vindo à comunidade! 🎉" : "Você saiu da comunidade",
        description: newOptIn 
          ? "Agora você pode interagir com outros membros" 
          : "Você não verá mais publicações",
      });

      if (newOptIn) {
        fetchPosts(true);
      }
    } catch (error) {
      console.error("Error updating opt-in:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingOptIn(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await supabase.rpc("toggle_post_like", {
        p_post_id: postId,
        p_cpf: clientCpf,
      });
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleReaction = async (postId: string, reactionType: string) => {
    try {
      await supabase.rpc("toggle_post_reaction", {
        p_post_id: postId,
        p_cpf: clientCpf,
        p_reaction_type: reactionType,
      });
    } catch (error) {
      console.error("Error toggling reaction:", error);
    }
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      fetchPosts();
    }
  };

  const handleRefresh = () => {
    fetchPosts(true);
  };

  const handlePostCreated = () => {
    fetchPosts(true);
  };

  // Onboarding view for users not opted in
  if (!isOptedIn && !isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto text-center py-8"
      >
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 blur-3xl rounded-full" />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto border border-primary/20">
            <Users className="h-12 w-12 text-primary" />
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-2">Comunidade Vault</h2>
        <p className="text-muted-foreground mb-6">
          Conecte-se com colecionadores de elite. Compartilhe sua coleção, 
          participe de discussões e descubra peças incríveis.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: Image, title: "Showcase", desc: "Exiba seus sneakers e receba feedback" },
            { icon: MessageSquare, title: "Discussões", desc: "Participe de conversas sobre o mercado" },
            { icon: Users, title: "Networking", desc: "Conheça outros colecionadores" },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
            >
              <Card className="card-premium h-full">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{feature.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Button
          size="lg"
          onClick={handleOptInToggle}
          disabled={isUpdatingOptIn}
          className="btn-gold"
        >
          {isUpdatingOptIn ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Entrando...
            </>
          ) : (
            "Entrar na comunidade"
          )}
        </Button>

        <p className="text-xs text-muted-foreground mt-4">
          Você pode sair a qualquer momento nas configurações
        </p>
      </motion.div>
    );
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="card-premium">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-11 w-11 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-20 w-full" />
                <div className="flex gap-4">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="hidden lg:block space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  // Main community view
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="community-opt-in"
              checked={isOptedIn}
              onCheckedChange={handleOptInToggle}
              disabled={isUpdatingOptIn}
            />
            <Label htmlFor="community-opt-in" className="text-sm text-muted-foreground">
              Participando
            </Label>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          {member && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleProfileClick(member.id)}
              className="gap-2"
            >
              <UserCircle className="h-4 w-4" />
              Meu Perfil
            </Button>
          )}
        </div>

        {member && (
          <CommunityNewPost 
            memberId={member.id} 
            onPostCreated={handlePostCreated}
          />
        )}
      </div>

      {/* Feed Tabs */}
      <CommunityFeedTabs
        activeTab={feedType}
        onTabChange={handleFeedTypeChange}
        followingCount={followingCount}
      />

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* Feed */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <Card className="card-premium border-dashed">
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">
                  {feedType === "following" 
                    ? "Nenhuma publicação de quem você segue" 
                    : "Nenhuma publicação ainda"
                  }
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {feedType === "following"
                    ? "Siga outros membros para ver suas publicações aqui"
                    : "Seja o primeiro a publicar algo incrível!"
                  }
                </p>
                {feedType === "for_you" && member && (
                  <CommunityNewPost 
                    memberId={member.id} 
                    onPostCreated={handlePostCreated}
                  />
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <AnimatePresence mode="popLayout">
                {posts.map((post) => (
                  <CommunityPostCard
                    key={post.id}
                    post={post}
                    clientCpf={clientCpf}
                    onLike={handleLike}
                    onReaction={handleReaction}
                    onComment={setSelectedPostId}
                    onAuthorClick={handleProfileClick}
                  />
                ))}
              </AnimatePresence>

              {hasMore && (
                <div className="text-center py-4">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Carregando...
                      </>
                    ) : (
                      "Carregar mais"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block space-y-4">
          <CommunityOnlineUsers clientCpf={clientCpf} onProfileClick={handleProfileClick} />
          <CommunityTrending onProfileClick={handleProfileClick} />
        </div>
      </div>

      {/* Comments drawer */}
      <AnimatePresence>
        {selectedPostId && (
          <CommunityComments
            postId={selectedPostId}
            clientCpf={clientCpf}
            onClose={() => setSelectedPostId(null)}
          />
        )}
      </AnimatePresence>

      {/* Profile modal */}
      {selectedProfileId && (
        <CommunityProfile
          memberId={selectedProfileId}
          clientCpf={clientCpf}
          onClose={() => setSelectedProfileId(null)}
          onFollowChange={() => {
            checkOptIn();
            fetchPosts(true);
          }}
        />
      )}
    </div>
  );
}
