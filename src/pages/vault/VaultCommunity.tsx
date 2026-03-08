import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Users, MessageSquare, Image, Plus, Send, Heart, 
  ToggleLeft, ToggleRight, Crown, Shield, Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useClientSession } from "@/hooks/useClientSession";

interface CommunityPost {
  id: string;
  author_name: string;
  author_tier: "member" | "collector" | "elite";
  type: "SHOWCASE" | "DISCUSSION" | "POLL";
  title: string;
  content: string;
  attachments: string[];
  created_at: string;
}

interface VaultMember {
  id: string;
  community_opt_in?: boolean;
}

const tierIcons = {
  member: Shield,
  collector: Crown,
  elite: Sparkles,
};

const tierColors = {
  member: "text-muted-foreground",
  collector: "text-primary",
  elite: "text-foreground",
};

export default function VaultCommunity() {
  const { profile } = useClientSession();
  const session = profile ? { cpf: profile.cpf, client_name: profile.full_name } : null;
  const context = useOutletContext<{ member: VaultMember | null; refreshMember: () => void }>();
  const { toast } = useToast();
  
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOptedIn, setIsOptedIn] = useState(false);
  const [isUpdatingOptIn, setIsUpdatingOptIn] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newPost, setNewPost] = useState({
    type: "DISCUSSION",
    title: "",
    content: "",
  });

  useEffect(() => {
    if (session?.cpf) {
      checkOptIn();
      fetchPosts();
    }
  }, [session?.cpf]);

  const checkOptIn = async () => {
    if (!session?.cpf) return;
    
    const { data } = await supabase
      .rpc("get_vault_member", { p_cpf: session.cpf });
    
    if (data && data.length > 0) {
      setIsOptedIn(data[0].community_opt_in || false);
    }
  };

  const fetchPosts = async () => {
    if (!session?.cpf) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .rpc("get_vault_community_posts", { p_cpf: session.cpf });
      
      if (!error && data) {
        setPosts(data as unknown as CommunityPost[]);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptInToggle = async () => {
    if (!session?.cpf) return;
    
    setIsUpdatingOptIn(true);
    
    try {
      const { error } = await supabase
        .rpc("update_vault_community_opt_in", { p_cpf: session.cpf, p_opt_in: !isOptedIn });
      
      if (error) throw error;
      
      setIsOptedIn(!isOptedIn);
      toast({
        title: !isOptedIn ? "Você entrou na comunidade!" : "Você saiu da comunidade",
        description: !isOptedIn ? "Agora você pode ver e criar publicações" : "Você não verá mais publicações da comunidade",
      });
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

  const handleCreatePost = async () => {
    if (!newPost.title || !newPost.content) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha título e conteúdo",
        variant: "destructive",
      });
      return;
    }

    const member = context?.member;
    if (!member) return;

    setIsSubmitting(true);
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error("Sessão expirada");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vault-community`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            action: "create-post",
            member_id: member.id,
            type: newPost.type,
            title: newPost.title,
            content: newPost.content,
          }),
        }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Erro ao publicar");

      toast({
        title: "Publicação enviada!",
        description: "Sua publicação será revisada antes de aparecer",
      });

      setShowPostDialog(false);
      setNewPost({ type: "DISCUSSION", title: "", content: "" });
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Erro ao publicar",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  };

  if (!isOptedIn) {
    return (
      <div className="space-y-6 pb-20 md:pb-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto text-center py-12"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Users className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Comunidade Vault</h1>
          <p className="text-muted-foreground mb-6">
            Conecte-se com outros membros do Vault Club. Compartilhe sua coleção, 
            participe de discussões e descubra novidades.
          </p>
          
          <Card className="bg-card border-border mb-6">
            <CardContent className="p-6">
              <ul className="text-sm text-left space-y-3">
                <li className="flex items-start gap-2">
                  <Image className="h-4 w-4 text-primary mt-0.5" />
                  <span className="text-foreground/90">Showcase: exiba seus sneakers do Vault</span>
                </li>
                <li className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 text-primary mt-0.5" />
                  <span className="text-foreground/90">Discussões sobre mercado e tendências</span>
                </li>
                <li className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-primary mt-0.5" />
                  <span className="text-foreground/90">Networking com colecionadores</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Button
            onClick={handleOptInToggle}
            disabled={isUpdatingOptIn}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isUpdatingOptIn ? "Entrando..." : "Entrar na comunidade"}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Comunidade</h1>
          <p className="text-muted-foreground text-sm">
            Conecte-se com outros membros do Vault
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="opt-in"
              checked={isOptedIn}
              onCheckedChange={handleOptInToggle}
              disabled={isUpdatingOptIn}
            />
            <Label htmlFor="opt-in" className="text-sm text-muted-foreground">
              Participando
            </Label>
          </div>
          
          <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="h-4 w-4" />
                Publicar
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Nova publicação</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <Tabs value={newPost.type} onValueChange={(v) => setNewPost({ ...newPost, type: v })}>
                  <TabsList className="w-full">
                    <TabsTrigger value="DISCUSSION" className="flex-1">Discussão</TabsTrigger>
                    <TabsTrigger value="SHOWCASE" className="flex-1">Showcase</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    placeholder="Título da publicação"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Conteúdo</Label>
                  <Textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    className="min-h-[120px]"
                    placeholder="Escreva sua publicação..."
                  />
                </div>

                <Button
                  onClick={handleCreatePost}
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isSubmitting ? "Enviando..." : "Publicar"}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Publicações são revisadas antes de aparecer
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Posts Feed */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : posts.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma publicação ainda</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Seja o primeiro a publicar!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post, index) => {
            const TierIcon = tierIcons[post.author_tier];
            const tierColor = tierColors[post.author_tier];
            
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-card border-border">
                  <CardContent className="p-6">
                    {/* Author */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                        <TierIcon className={`h-5 w-5 ${tierColor}`} />
                      </div>
                      <div>
                        <p className="font-medium">{post.author_name}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(post.created_at)}</p>
                      </div>
                      <Badge variant="outline" className="ml-auto border-border text-muted-foreground text-xs">
                        {post.type === "SHOWCASE" ? "Showcase" : "Discussão"}
                      </Badge>
                    </div>

                    {/* Content */}
                    <h3 className="font-semibold mb-2">{post.title}</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{post.content}</p>

                    {/* Attachments */}
                    {post.attachments && post.attachments.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {post.attachments.map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt=""
                            className="rounded-lg object-cover aspect-square"
                          />
                        ))}
                      </div>
                    )}
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