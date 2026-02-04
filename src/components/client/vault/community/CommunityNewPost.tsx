import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Image as ImageIcon, X, Send, Video, 
  MessageSquare, Sparkles, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { RichTextEditor } from "./RichTextEditor";

interface CommunityNewPostProps {
  memberId: string;
  onPostCreated: () => void;
}

interface MediaFile {
  file: File;
  preview: string;
  type: "image" | "video";
}

const postTypes = [
  { value: "SHOWCASE", label: "Showcase", icon: Sparkles, description: "Exiba sua coleção", color: "text-emerald-400" },
  { value: "DISCUSSION", label: "Discussão", icon: MessageSquare, description: "Inicie uma conversa", color: "text-blue-400" },
];

const MAX_FILES = 10;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function CommunityNewPost({ memberId, onPostCreated }: CommunityNewPostProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  const [postData, setPostData] = useState({
    type: "DISCUSSION",
    title: "",
    content: "",
  });
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const files = Array.from(e.target.files || []);
    
    if (mediaFiles.length + files.length > MAX_FILES) {
      toast({
        title: "Limite de arquivos",
        description: `Máximo de ${MAX_FILES} arquivos por publicação`,
        variant: "destructive",
      });
      return;
    }

    const validFiles: MediaFile[] = [];
    
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "Arquivo muito grande",
          description: `${file.name} excede o limite de 50MB`,
          variant: "destructive",
        });
        continue;
      }

      const preview = URL.createObjectURL(file);
      validFiles.push({ file, preview, type });
    }

    setMediaFiles(prev => [...prev, ...validFiles]);
    
    // Reset input
    if (e.target) e.target.value = "";
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const uploadMedia = async (): Promise<{ urls: string[]; types: string[] }> => {
    const urls: string[] = [];
    const types: string[] = [];

    for (let i = 0; i < mediaFiles.length; i++) {
      const { file, type } = mediaFiles[i];
      const fileName = `${memberId}/${Date.now()}_${i}_${file.name}`;
      
      const { error } = await supabase.storage
        .from("community-media")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error);
        throw new Error(`Falha ao enviar ${file.name}`);
      }

      const { data: urlData } = supabase.storage
        .from("community-media")
        .getPublicUrl(fileName);

      urls.push(urlData.publicUrl);
      types.push(type);

      setUploadProgress(((i + 1) / mediaFiles.length) * 100);
    }

    return { urls, types };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!postData.title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Adicione um título para sua publicação",
        variant: "destructive",
      });
      return;
    }

    if (postData.type === "SHOWCASE" && mediaFiles.length === 0) {
      toast({
        title: "Adicione mídia",
        description: "Showcase requer pelo menos uma imagem ou vídeo",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    
    try {
      let attachments: string[] = [];
      let mediaTypes: string[] = [];

      // Upload media files if any
      if (mediaFiles.length > 0) {
        const uploaded = await uploadMedia();
        attachments = uploaded.urls;
        mediaTypes = uploaded.types;
      }

      // Create post - now publishes immediately
      const { error } = await supabase
        .from("vault_community_posts")
        .insert({
          user_id: memberId,
          type: postData.type as any,
          title: postData.title.trim(),
          content: postData.content.trim() || null,
          attachments,
          media_types: mediaTypes,
          status: "PUBLISHED",
        });

      if (error) throw error;

      toast({
        title: "Publicado! 🎉",
        description: "Sua publicação está disponível na comunidade",
      });

      // Cleanup
      mediaFiles.forEach(m => URL.revokeObjectURL(m.preview));
      setPostData({ type: "DISCUSSION", title: "", content: "" });
      setMediaFiles([]);
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
      setUploadProgress(0);
    }
  };

  const selectedType = postTypes.find(t => t.value === postData.type);
  const TypeIcon = selectedType?.icon || MessageSquare;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 btn-gold relative z-10">
          <Plus className="h-4 w-4" />
          Nova publicação
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TypeIcon className={cn("h-5 w-5", selectedType?.color)} />
            Criar publicação
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
                    className={cn(
                      "p-3 rounded-xl border-2 transition-all text-left group",
                      isSelected 
                        ? "border-primary bg-primary/10" 
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Icon className={cn(
                      "h-5 w-5 mb-1.5 transition-colors",
                      isSelected ? type.color : "text-muted-foreground group-hover:" + type.color
                    )} />
                    <p className="font-medium text-sm">{type.label}</p>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={postData.title}
              onChange={(e) => setPostData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={postData.type === "SHOWCASE" ? "Ex: Minha coleção de Jordan 1" : "Ex: Dicas para autenticação"}
              maxLength={100}
              className="text-base"
            />
            <p className="text-xs text-muted-foreground text-right">{postData.title.length}/100</p>
          </div>

          {/* Content with Rich Text Editor */}
          <div className="space-y-2">
            <Label>Descrição</Label>
            <RichTextEditor
              value={postData.content}
              onChange={(content) => setPostData(prev => ({ ...prev, content }))}
              placeholder="Conte mais sobre sua publicação... Use **negrito**, _itálico_, emojis e mais!"
              maxLength={2000}
              minHeight="120px"
            />
          </div>

          {/* Media Upload */}
          <div className="space-y-3">
            <Label>Mídia {postData.type === "SHOWCASE" && "*"}</Label>
            
            {/* Upload buttons */}
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e, "image")}
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e, "video")}
              />
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={mediaFiles.length >= MAX_FILES}
                className="gap-2"
              >
                <ImageIcon className="h-4 w-4" />
                Fotos
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => videoInputRef.current?.click()}
                disabled={mediaFiles.length >= MAX_FILES}
                className="gap-2"
              >
                <Video className="h-4 w-4" />
                Vídeos
              </Button>
            </div>

            {/* Media Preview Grid */}
            <AnimatePresence>
              {mediaFiles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-3 gap-2"
                >
                  {mediaFiles.map((media, i) => (
                    <motion.div
                      key={media.preview}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
                    >
                      {media.type === "video" ? (
                        <video
                          src={media.preview}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={media.preview}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                      
                      {/* Type indicator */}
                      {media.type === "video" && (
                        <div className="absolute bottom-1 left-1 bg-black/70 rounded px-1.5 py-0.5">
                          <Video className="h-3 w-3 text-white" />
                        </div>
                      )}
                      
                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => removeMedia(i)}
                        className="absolute top-1 right-1 bg-black/70 hover:bg-black rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </motion.div>
                  ))}
                  
                  {/* Add more button */}
                  {mediaFiles.length < MAX_FILES && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center transition-colors"
                    >
                      <Plus className="h-6 w-6 text-muted-foreground" />
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-xs text-muted-foreground">
              {mediaFiles.length}/{MAX_FILES} arquivos • Máx. 50MB cada • Imagens e vídeos
            </p>
          </div>

          {/* Upload Progress */}
          {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-1">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                Enviando mídia... {Math.round(uploadProgress)}%
              </p>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Publicações aparecem imediatamente na comunidade
            </p>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {uploadProgress > 0 ? "Enviando..." : "Publicando..."}
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
