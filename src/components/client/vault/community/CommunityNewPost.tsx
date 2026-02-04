import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Image as ImageIcon, X, Send, 
  MessageSquare, Sparkles, Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CommunityNewPostProps {
  memberId: string;
  onPostCreated: () => void;
}

const postTypes = [
  { value: "DISCUSSION", label: "Discussão", icon: MessageSquare, description: "Inicie uma conversa" },
  { value: "SHOWCASE", label: "Showcase", icon: Sparkles, description: "Exiba sua coleção" },
];

export function CommunityNewPost({ memberId, onPostCreated }: CommunityNewPostProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [postData, setPostData] = useState({
    type: "DISCUSSION",
    title: "",
    content: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!postData.title.trim() || !postData.content.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha título e conteúdo",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from("vault_community_posts")
        .insert({
          user_id: memberId,
          type: postData.type as any,
          title: postData.title.trim(),
          content: postData.content.trim(),
          status: "PENDING_REVIEW",
        });

      if (error) throw error;

      toast({
        title: "Publicação enviada! 🎉",
        description: "Será revisada e publicada em breve",
      });

      setPostData({ type: "DISCUSSION", title: "", content: "" });
      setOpen(false);
      onPostCreated();
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

  const selectedType = postTypes.find(t => t.value === postData.type);
  const TypeIcon = selectedType?.icon || MessageSquare;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 btn-gold">
          <Plus className="h-4 w-4" />
          Nova publicação
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TypeIcon className="h-5 w-5 text-primary" />
            Nova publicação
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Post Type Selection */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Tipo de publicação</Label>
            <div className="grid grid-cols-2 gap-2">
              {postTypes.map(type => {
                const Icon = type.icon;
                const isSelected = postData.type === type.value;
                
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setPostData(prev => ({ ...prev, type: type.value }))}
                    className={`
                      p-3 rounded-xl border-2 transition-all text-left
                      ${isSelected 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'}
                    `}
                  >
                    <Icon className={`h-5 w-5 mb-1.5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    <p className="font-medium text-sm">{type.label}</p>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={postData.title}
              onChange={(e) => setPostData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={postData.type === "SHOWCASE" ? "Ex: Minha coleção de Jordan 1" : "Ex: Dicas para autenticação"}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground text-right">{postData.title.length}/100</p>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo</Label>
            <Textarea
              id="content"
              value={postData.content}
              onChange={(e) => setPostData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Escreva sua publicação..."
              className="min-h-[120px] resize-none"
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">{postData.content.length}/2000</p>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              Publicações são revisadas antes de aparecer
            </p>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Publicar
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
