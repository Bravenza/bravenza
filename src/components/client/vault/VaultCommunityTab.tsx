import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, MessageSquare, Image, Plus, 
  Crown, Shield, Sparkles
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

interface VaultCommunityTabProps {
  clientCpf: string;
  member: VaultMember | null;
}

const tierIcons = {
  member: Shield,
  collector: Crown,
  elite: Sparkles,
};

const tierColors = {
  member: "text-muted-foreground",
  collector: "text-amber-500",
  elite: "text-primary",
};

export function VaultCommunityTab({ clientCpf, member }: VaultCommunityTabProps) {
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
    checkOptIn();
    fetchPosts();
  }, [clientCpf]);

  const checkOptIn = async () => {
    const { data } = await supabase
      .rpc("get_vault_member", { p_cpf: clientCpf });
    
    if (data && data.length > 0) {
      setIsOptedIn(data[0].community_opt_in || false);
    }
  };

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .rpc("get_vault_community_posts", { p_cpf: clientCpf });
      
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
    setIsUpdatingOptIn(true);
    
    try {
      const { error } = await supabase
        .rpc("update_vault_community_opt_in", { p_cpf: clientCpf, p_opt_in: !isOptedIn });
      
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

    if (!member) return;

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from("vault_community_posts")
        .insert({
          user_id: member.id,
          type: newPost.type as any,
          title: newPost.title,
          content: newPost.content,
          status: "PENDING_REVIEW",
        });

      if (error) throw error;

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
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Users className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Comunidade Vault</h3>
        <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
          Conecte-se com outros membros do Vault Club. Compartilhe sua coleção 
          e participe de discussões.
        </p>
        
        <Card className="mb-4 max-w-md mx-auto">
          <CardContent className="pt-6">
            <ul className="text-sm text-left space-y-3">
              <li className="flex items-start gap-2">
                <Image className="h-4 w-4 text-primary mt-0.5" />
                <span>Showcase: exiba seus tênis do Vault</span>
              </li>
              <li className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 text-primary mt-0.5" />
                <span>Discussões sobre mercado e tendências</span>
              </li>
              <li className="flex items-start gap-2">
                <Users className="h-4 w-4 text-primary mt-0.5" />
                <span>Networking com colecionadores</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Button
          onClick={handleOptInToggle}
          disabled={isUpdatingOptIn}
        >
          {isUpdatingOptIn ? "Entrando..." : "Entrar na comunidade"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Publicar
            </Button>
          </DialogTrigger>
          <DialogContent>
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
                className="w-full"
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

      {/* Posts Feed */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : posts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nenhuma publicação ainda</p>
            <p className="text-xs text-muted-foreground mt-1">
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
                <Card>
                  <CardContent className="pt-4">
                    {/* Author */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <TierIcon className={`h-5 w-5 ${tierColor}`} />
                      </div>
                      <div>
                        <p className="font-medium">{post.author_name}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(post.created_at)}</p>
                      </div>
                      <Badge variant="outline" className="ml-auto text-xs">
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
