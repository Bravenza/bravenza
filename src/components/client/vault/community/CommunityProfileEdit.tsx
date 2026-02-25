import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Camera, Instagram, Facebook, Linkedin, Twitter, 
  Globe, MapPin, Save, Loader2
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { typedRpc, type UpdateMemberProfileResult } from "@/integrations/supabase/typed-rpc";

interface ProfileData {
  id: string;
  display_name: string;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
  bio: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  is_profile_public: boolean;
}

interface CommunityProfileEditProps {
  clientCpf: string;
  currentProfile: ProfileData;
  onClose: () => void;
  onSave: () => void;
}

const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export function CommunityProfileEdit({ 
  clientCpf, 
  currentProfile, 
  onClose, 
  onSave 
}: CommunityProfileEditProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    display_name: currentProfile.display_name || "",
    avatar_url: currentProfile.avatar_url || "",
    city: currentProfile.city || "",
    state: currentProfile.state || "",
    bio: currentProfile.bio || "",
    instagram_url: currentProfile.instagram_url || "",
    facebook_url: currentProfile.facebook_url || "",
    linkedin_url: currentProfile.linkedin_url || "",
    twitter_url: currentProfile.twitter_url || "",
    is_profile_public: currentProfile.is_profile_public ?? true,
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "Máximo 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${currentProfile.id}-avatar-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("community-media")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("community-media")
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      
      toast({
        title: "Foto atualizada!",
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Erro ao enviar foto",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data, error } = await typedRpc<UpdateMemberProfileResult>("update_member_profile", {
        p_cpf: clientCpf,
        p_display_name: formData.display_name || null,
        p_avatar_url: formData.avatar_url || null,
        p_city: formData.city || null,
        p_state: formData.state || null,
        p_bio: formData.bio || null,
        p_instagram_url: formData.instagram_url || null,
        p_facebook_url: formData.facebook_url || null,
        p_linkedin_url: formData.linkedin_url || null,
        p_twitter_url: formData.twitter_url || null,
        p_is_profile_public: formData.is_profile_public,
      });

      if (error) throw error;

      const result = data;
      if (result?.success) {
        toast({
          title: "Perfil atualizado!",
        });
        onSave();
      } else {
        throw new Error(result?.error || "Erro desconhecido");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Erro ao salvar",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Avatar */}
          <div className="flex justify-center">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-border">
                {formData.avatar_url ? (
                  <AvatarImage src={formData.avatar_url} alt="Avatar" />
                ) : null}
                <AvatarFallback className="text-xl font-bold bg-secondary">
                  {getInitials(formData.display_name || "?")}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label>Nome de exibição</Label>
            <Input
              value={formData.display_name}
              onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
              placeholder="Seu nome"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Conte um pouco sobre você..."
              className="resize-none"
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.bio.length}/200
            </p>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                Cidade
              </Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Sua cidade"
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <select
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Selecione</option>
                {BRAZILIAN_STATES.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-3">
            <Label className="flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" />
              Redes Sociais
            </Label>
            
            <div className="relative">
              <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={formData.instagram_url}
                onChange={(e) => setFormData(prev => ({ ...prev, instagram_url: e.target.value }))}
                placeholder="instagram.com/seuperfil"
                className="pl-10"
              />
            </div>
            
            <div className="relative">
              <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={formData.facebook_url}
                onChange={(e) => setFormData(prev => ({ ...prev, facebook_url: e.target.value }))}
                placeholder="facebook.com/seuperfil"
                className="pl-10"
              />
            </div>
            
            <div className="relative">
              <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={formData.linkedin_url}
                onChange={(e) => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                placeholder="linkedin.com/in/seuperfil"
                className="pl-10"
              />
            </div>
            
            <div className="relative">
              <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={formData.twitter_url}
                onChange={(e) => setFormData(prev => ({ ...prev, twitter_url: e.target.value }))}
                placeholder="twitter.com/seuperfil"
                className="pl-10"
              />
            </div>
          </div>

          {/* Privacy */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div>
              <p className="font-medium text-sm">Perfil público</p>
              <p className="text-xs text-muted-foreground">
                Outros membros podem ver sua coleção
              </p>
            </div>
            <Switch
              checked={formData.is_profile_public}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, is_profile_public: checked }))
              }
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
