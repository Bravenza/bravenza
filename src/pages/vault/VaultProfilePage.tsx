import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Camera, Instagram, Facebook, Linkedin, Twitter, 
  Globe, MapPin, Save, Loader2, ArrowLeft, Shield, Crown, Sparkles,
  User, Check, ShoppingBag, Box
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useClientSession } from "@/hooks/useClientSession";
import { supabase } from "@/integrations/supabase/client";

interface VaultItem {
  id: string;
  title: string;
  brand: string | null;
  model: string | null;
  size: string | null;
  inspection_photos: string[] | null;
  verified_status: string | null;
}

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
  tier: string;
  followers_count: number;
  following_count: number;
  joined_at: string;
}

const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const tierConfig: Record<string, { icon: typeof Shield; label: string; color: string; bg: string }> = {
  member: { icon: Shield, label: "Member", color: "text-muted-foreground", bg: "bg-secondary" },
  collector: { icon: Crown, label: "Privilege", color: "text-primary", bg: "bg-primary/10" },
  privilege: { icon: Crown, label: "Privilege", color: "text-primary", bg: "bg-primary/10" },
  elite: { icon: Sparkles, label: "Black", color: "text-foreground", bg: "bg-foreground/10" },
  black: { icon: Sparkles, label: "Black", color: "text-foreground", bg: "bg-foreground/10" },
};

export default function VaultProfilePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile: clientProfile, isLoading: isSessionLoading } = useClientSession();
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  
  const [formData, setFormData] = useState({
    display_name: "",
    avatar_url: "",
    city: "",
    state: "",
    bio: "",
    instagram_url: "",
    facebook_url: "",
    linkedin_url: "",
    twitter_url: "",
    is_profile_public: true,
  });

  useEffect(() => {
    if (!isSessionLoading && clientProfile?.cpf) {
      fetchProfile();
    } else if (!isSessionLoading && !clientProfile) {
      navigate("/minha-conta");
    }
  }, [isSessionLoading, clientProfile]);

  const fetchProfile = async () => {
    if (!clientProfile?.cpf) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await (supabase.rpc as any)("get_own_community_profile", {
        p_cpf: clientProfile.cpf,
      });

      if (error) throw error;

      const result = data as any;
      if (result?.success && result.profile) {
        setProfile(result.profile);
        setFormData({
          display_name: result.profile.display_name || "",
          avatar_url: result.profile.avatar_url || "",
          city: result.profile.city || "",
          state: result.profile.state || "",
          bio: result.profile.bio || "",
          instagram_url: result.profile.instagram_url || "",
          facebook_url: result.profile.facebook_url || "",
          linkedin_url: result.profile.linkedin_url || "",
          twitter_url: result.profile.twitter_url || "",
          is_profile_public: result.profile.is_profile_public ?? true,
        });
      } else {
        toast({
          title: "Perfil não encontrado",
          description: result?.error || "Você precisa ser membro do Vault Club para ter um perfil.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Erro ao carregar perfil",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }

    // Fetch vault items (collection)
    try {
      const { data: itemsData } = await supabase
        .from("vault_items" as any)
        .select("id, title, brand, model, size, inspection_photos, verified_status")
        .eq("user_id", clientProfile.vault_member_id || "")
        .order("created_at", { ascending: false })
        .limit(12);
      
      if (itemsData) setVaultItems(itemsData as unknown as VaultItem[]);
    } catch (_) {}
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

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
      const fileName = `${profile.id}-avatar-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("community-media")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("community-media")
        .getPublicUrl(filePath);

      handleChange("avatar_url", publicUrl);
      
      toast({
        title: "Foto enviada!",
        description: "Não esqueça de salvar as alterações",
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
    if (!clientProfile?.cpf) return;
    
    setIsSaving(true);
    try {
      const { data, error } = await (supabase.rpc as any)("update_member_profile", {
        p_cpf: clientProfile.cpf,
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

      const result = data as any;
      if (result?.success) {
        toast({
          title: "Perfil atualizado! ✨",
          description: "Suas alterações foram salvas",
        });
        setHasChanges(false);
        fetchProfile();
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

  if (isSessionLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center theme-light">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 theme-light">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Perfil não disponível</h2>
            <p className="text-muted-foreground mb-4">
              Você precisa ser membro do Vault Club para editar seu perfil da comunidade.
            </p>
            <Button onClick={() => navigate("/vault")}>
              Conhecer o Vault Club
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tier = profile.tier || "member";
  const tierData = tierConfig[tier] || tierConfig.member;
  const TierIcon = tierData.icon;

  return (
    <div className="min-h-screen bg-background theme-light">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          
          <h1 className="font-semibold">Editar Perfil</h1>
          
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="gap-2"
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

      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Avatar Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <Avatar className="w-28 h-28 border-4 border-border">
                  {formData.avatar_url ? (
                    <AvatarImage src={formData.avatar_url} alt="Avatar" />
                  ) : null}
                  <AvatarFallback className={`text-2xl font-bold ${tierData.bg}`}>
                    {getInitials(formData.display_name || "?")}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute bottom-0 right-0 p-2.5 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-lg">
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5" />
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
              
              <Badge variant="outline" className={`${tierData.color} border-current gap-1`}>
                <TierIcon className="h-3 w-3" />
                {tierData.label}
              </Badge>
              
              <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                <span><strong className="text-foreground">{profile.followers_count}</strong> seguidores</span>
                <span><strong className="text-foreground">{profile.following_count}</strong> seguindo</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome de exibição</Label>
              <Input
                value={formData.display_name}
                onChange={(e) => handleChange("display_name", e.target.value)}
                placeholder="Como você quer ser chamado"
              />
            </div>

            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea
                value={formData.bio}
                onChange={(e) => handleChange("bio", e.target.value)}
                placeholder="Conte um pouco sobre você e sua coleção..."
                className="resize-none"
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formData.bio.length}/200
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Localização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="Sua cidade"
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <select
                  value={formData.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Selecione</option>
                  {BRAZILIAN_STATES.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Redes Sociais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={formData.instagram_url}
                onChange={(e) => handleChange("instagram_url", e.target.value)}
                placeholder="instagram.com/seuperfil"
                className="pl-10"
              />
            </div>
            
            <div className="relative">
              <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={formData.facebook_url}
                onChange={(e) => handleChange("facebook_url", e.target.value)}
                placeholder="facebook.com/seuperfil"
                className="pl-10"
              />
            </div>
            
            <div className="relative">
              <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={formData.linkedin_url}
                onChange={(e) => handleChange("linkedin_url", e.target.value)}
                placeholder="linkedin.com/in/seuperfil"
                className="pl-10"
              />
            </div>
            
            <div className="relative">
              <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={formData.twitter_url}
                onChange={(e) => handleChange("twitter_url", e.target.value)}
                placeholder="twitter.com/seuperfil"
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Privacidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
              <div>
                <p className="font-medium">Perfil público</p>
                <p className="text-sm text-muted-foreground">
                  Outros membros podem ver sua coleção e informações
                </p>
              </div>
              <Switch
                checked={formData.is_profile_public}
                onCheckedChange={(checked) => handleChange("is_profile_public", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* My Collection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Box className="h-5 w-5 text-primary" />
              Minha Coleção
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vaultItems.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum sneaker na coleção ainda</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Seus sneakers verificados aparecerão aqui
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {vaultItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.04 }}
                    className="group relative"
                  >
                    <div className="aspect-square rounded-xl overflow-hidden bg-secondary/30 border border-border/30">
                      {item.inspection_photos?.[0] ? (
                        <img
                          src={item.inspection_photos[0]}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-6 w-6 text-muted-foreground/20" />
                        </div>
                      )}
                      {item.verified_status === "VERIFIED" && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary/90 flex items-center justify-center shadow-sm">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="mt-1.5 px-0.5">
                      <p className="text-xs font-medium truncate">{item.brand || item.title}</p>
                      {item.size && (
                        <p className="text-[10px] text-muted-foreground">Tam. {item.size}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button (Mobile) */}
        <div className="pb-6">
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="w-full gap-2"
            size="lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                {hasChanges ? "Salvar alterações" : "Perfil salvo"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
