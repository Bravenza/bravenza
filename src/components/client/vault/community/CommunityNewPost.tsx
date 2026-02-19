import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Image as ImageIcon, X, Video, 
  Sparkles, Loader2, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { WysiwygEditor } from "./WysiwygEditor";

interface CommunityNewPostProps {
  memberId: string;
  onPostCreated: () => void;
  avatarUrl?: string | null;
  displayName?: string;
  variant?: "inline" | "button";
}

interface MediaFile {
  file: File;
  preview: string;
  type: "image" | "video";
}

const MAX_FILES = 10;
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export function CommunityNewPost({ memberId, onPostCreated, avatarUrl, displayName, variant = "inline" }: CommunityNewPostProps) {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
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

  // Button variant for empty states
  if (variant === "button") {
    return (
      <Button className="gap-2 btn-gold" onClick={() => { /* parent should handle */ }}>
        <Sparkles className="h-4 w-4" />
        Nova publicação
      </Button>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const files = Array.from(e.target.files || []);
    if (mediaFiles.length + files.length > MAX_FILES) {
      toast({ title: "Limite de arquivos", description: `Máximo de ${MAX_FILES} arquivos`, variant: "destructive" });
      return;
    }
    const validFiles: MediaFile[] = [];
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: "Arquivo muito grande", description: `${file.name} excede 50MB`, variant: "destructive" });
        continue;
      }
      validFiles.push({ file, preview: URL.createObjectURL(file), type });
    }
    setMediaFiles(prev => [...prev, ...validFiles]);
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
      const { error } = await supabase.storage.from("community-media").upload(fileName, file, { cacheControl: "3600", upsert: false });
      if (error) throw new Error(`Falha ao enviar ${file.name}`);
      const { data: urlData } = supabase.storage.from("community-media").getPublicUrl(fileName);
      urls.push(urlData.publicUrl);
      types.push(type);
      setUploadProgress(((i + 1) / mediaFiles.length) * 100);
    }
    return { urls, types };
  };

  const handleSubmit = async () => {
    if (!postData.title.trim()) {
      toast({ title: "Adicione um título", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    setUploadProgress(0);
    try {
      let attachments: string[] = [];
      let mediaTypes: string[] = [];
      if (mediaFiles.length > 0) {
        const uploaded = await uploadMedia();
        attachments = uploaded.urls;
        mediaTypes = uploaded.types;
      }
      const { error } = await supabase.from("vault_community_posts").insert({
        user_id: memberId,
        type: postData.type as any,
        title: postData.title.trim(),
        content: postData.content.trim() || null,
        attachments,
        media_types: mediaTypes,
        status: "PUBLISHED",
      });
      if (error) throw error;
      toast({ title: "Publicado! 🎉" });
      mediaFiles.forEach(m => URL.revokeObjectURL(m.preview));
      setPostData({ type: "DISCUSSION", title: "", content: "" });
      setMediaFiles([]);
      setIsExpanded(false);
      onPostCreated();
    } catch {
      toast({ title: "Erro ao publicar", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const initials = displayName?.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() || "?";

  return (
    <div className="rounded-2xl bg-card/80 backdrop-blur-md border border-border/40 shadow-sm shadow-black/5 p-4 hover:bg-card/95 hover:border-border/60 transition-all duration-200">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="shrink-0 mt-1">
          <Avatar className="h-10 w-10">
            {avatarUrl && <AvatarImage src={avatarUrl} />}
            <AvatarFallback className="text-xs font-semibold bg-secondary">{initials}</AvatarFallback>
          </Avatar>
        </div>

        {/* Composer */}
        <div className="flex-1 min-w-0">
          {!isExpanded ? (
            <button
              onClick={() => setIsExpanded(true)}
              className="w-full text-left text-muted-foreground/60 text-sm py-2.5 hover:text-muted-foreground transition-colors"
            >
              O que está pensando?
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-3"
            >
              {/* Type selector */}
              <div className="flex gap-2">
                {[
                  { value: "DISCUSSION", label: "Discussão", icon: MessageSquare },
                  { value: "SHOWCASE", label: "Showcase", icon: Sparkles },
                ].map(t => (
                  <button
                    key={t.value}
                    onClick={() => setPostData(prev => ({ ...prev, type: t.value }))}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                      postData.type === t.value
                        ? "bg-foreground text-background"
                        : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <t.icon className="h-3 w-3" />
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Title */}
              <Input
                value={postData.title}
                onChange={(e) => setPostData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Título da publicação"
                maxLength={100}
                className="bg-transparent border-0 border-b border-border/20 rounded-none px-0 text-base font-semibold placeholder:font-normal focus-visible:ring-0 focus-visible:border-primary/40"
                autoFocus
              />

              {/* Content */}
              <WysiwygEditor
                value={postData.content}
                onChange={(content) => setPostData(prev => ({ ...prev, content }))}
                placeholder="Conte mais..."
                maxLength={2000}
                minHeight="80px"
              />

              {/* Media preview */}
              <AnimatePresence>
                {mediaFiles.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex gap-2 overflow-x-auto pb-1"
                  >
                    {mediaFiles.map((media, i) => (
                      <div key={media.preview} className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-muted">
                        {media.type === "video" ? (
                          <video src={media.preview} className="w-full h-full object-cover" />
                        ) : (
                          <img src={media.preview} alt="" className="w-full h-full object-cover" />
                        )}
                        <button
                          onClick={() => removeMedia(i)}
                          className="absolute top-1 right-1 bg-background/80 backdrop-blur-sm rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Upload progress */}
              {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
                <Progress value={uploadProgress} className="h-1" />
              )}

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFileSelect(e, "image")} />
                  <input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden" onChange={(e) => handleFileSelect(e, "video")} />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={mediaFiles.length >= MAX_FILES}
                    className="p-2 rounded-full hover:bg-muted/30 transition-colors text-primary disabled:opacity-30"
                  >
                    <ImageIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    disabled={mediaFiles.length >= MAX_FILES}
                    className="p-2 rounded-full hover:bg-muted/30 transition-colors text-primary disabled:opacity-30"
                  >
                    <Video className="h-5 w-5" />
                  </button>
                  <span className="text-[10px] text-muted-foreground/40 ml-1">
                    {mediaFiles.length > 0 && `${mediaFiles.length}/${MAX_FILES}`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setIsExpanded(false); setPostData({ type: "DISCUSSION", title: "", content: "" }); setMediaFiles([]); }}
                    className="text-xs"
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !postData.title.trim()}
                    className="rounded-full px-5 text-xs font-semibold"
                  >
                    {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Publicar"}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
