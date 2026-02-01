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
import { useClientAuth } from "@/hooks/useClientAuth";

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
  member: "text-zinc-400",
  collector: "text-amber-400",
  elite: "text-white",
};

export default function VaultCommunity() {
  const { session } = useClientAuth();
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
      .from("vault_members")
      .select("community_opt_in")
      .eq("client_cpf", session.cpf)
      .maybeSingle();
    
    if (data) {
      setIsOptedIn(data.community_opt_in || false);
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
        .from("vault_members")
        .update({ community_opt_in: !isOptedIn })
        .eq("client_cpf", session.cpf);
      
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
      <div className="space-y-6 pb-20 md:pb-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto text-center py-12"
        >
          <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
            <Users className="h-10 w-10 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Comunidade Vault</h1>
          <p className="text-zinc-400 mb-6">
            Conecte-se com outros membros do Vault Club. Compartilhe sua coleção, 
            participe de discussões e descubra novidades.
          </p>
          
          <Card className="bg-zinc-900 border-zinc-800 mb-6">
            <CardContent className="pt-6">
              <ul className="text-sm text-left space-y-3">
                <li className="flex items-start gap-2">
                  <Image className="h-4 w-4 text-amber-500 mt-0.5" />
                  <span className="text-zinc-300">Showcase: exiba seus tênis do Vault</span>
                </li>
                <li className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 text-amber-500 mt-0.5" />
                  <span className="text-zinc-300">Discussões sobre mercado e tendências</span>
                </li>
                <li className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-amber-500 mt-0.5" />
                  <span className="text-zinc-300">Networking com colecionadores</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Button
            onClick={handleOptInToggle}
            disabled={isUpdatingOptIn}
            className="bg-amber-500 hover:bg-amber-600 text-black"
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
          <p className="text-zinc-400 text-sm">
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
            <Label htmlFor="opt-in" className="text-sm text-zinc-400">
              Participando
            </Label>
          </div>
          
          <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
            <DialogTrigger asChild>
              <Button className="bg-amber-500 hover:bg-amber-600 text-black">
                <Plus className="h-4 w-4 mr-2" />
                Publicar
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800">
              <DialogHeader>
                <DialogTitle>Nova publicação</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <Tabs value={newPost.type} onValueChange={(v) => setNewPost({ ...newPost, type: v })}>
                  <TabsList className="w-full bg-zinc-800">
                    <TabsTrigger value="DISCUSSION" className="flex-1">Discussão</TabsTrigger>
                    <TabsTrigger value="SHOWCASE" className="flex-1">Showcase</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    className="bg-zinc-800 border-zinc-700"
                    placeholder="Título da publicação"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Conteúdo</Label>
                  <Textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 min-h-[120px]"
                    placeholder="Escreva sua publicação..."
                  />
                </div>

                <Button
                  onClick={handleCreatePost}
                  disabled={isSubmitting}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black"
                >
                  {isSubmitting ? "Enviando..." : "Publicar"}
                </Button>

                <p className="text-xs text-zinc-500 text-center">
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
        </div>
      ) : posts.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400">Nenhuma publicação ainda</p>
            <p className="text-sm text-zinc-500 mt-1">
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
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="pt-4">
                    {/* Author */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                        <TierIcon className={`h-5 w-5 ${tierColor}`} />
                      </div>
                      <div>
                        <p className="font-medium">{post.author_name}</p>
                        <p className="text-xs text-zinc-500">{formatDate(post.created_at)}</p>
                      </div>
                      <Badge variant="outline" className="ml-auto border-zinc-700 text-zinc-400 text-xs">
                        {post.type === "SHOWCASE" ? "Showcase" : "Discussão"}
                      </Badge>
                    </div>

                    {/* Content */}
                    <h3 className="font-semibold mb-2">{post.title}</h3>
                    <p className="text-sm text-zinc-400 whitespace-pre-wrap">{post.content}</p>

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