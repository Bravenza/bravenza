import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Camera, Save, Store, Image as ImageIcon, Type, Loader2, Eye, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

import { marketplaceRequest } from "@/hooks/marketplace/api";

interface StoreCustomizationPanelProps {
  cpf: string;
}

export function StoreCustomizationPanel({ cpf }: StoreCustomizationPanelProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const [sellerId, setSellerId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [tagline, setTagline] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    fetchStorefront();
  }, [cpf]);

  const fetchStorefront = async () => {
    try {
      const data = await marketplaceRequest("", "my-storefront");
      if (data.storefront) {
        setAvatarUrl(data.storefront.avatar_url || "");
        setBannerUrl(data.storefront.banner || "");
        setTagline(data.storefront.tagline || "");
        setBio(data.storefront.bio || "");
        setSellerId(data.storefront.seller_id || null);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File, type: "avatar" | "banner") => {
    const ext = file.name.split(".").pop();
    const path = `sellers/${cpf}/${type}-${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage
      .from("marketplace")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("marketplace").getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx. 5MB)");
      return;
    }
    setUploadingAvatar(true);
    try {
      const url = await uploadImage(file, "avatar");
      setAvatarUrl(url);
      toast.success("Foto de perfil atualizada!");
    } catch {
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx. 10MB)");
      return;
    }
    setUploadingBanner(true);
    try {
      const url = await uploadImage(file, "banner");
      setBannerUrl(url);
      toast.success("Capa atualizada!");
    } catch {
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await marketplaceRequest("", "update-storefront", "PUT", {
        avatar_url: avatarUrl || null,
        banner: bannerUrl || null,
        tagline: tagline || null,
        bio: bio || null,
      });
      toast.success("Loja personalizada com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-border/20">
        <CardContent className="p-8 flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Preview Banner + Avatar */}
      <Card className="border-border/20 overflow-hidden">
        <div className="relative">
          {/* Banner */}
          <div
            className="h-40 md:h-52 bg-gradient-to-br from-primary/10 via-card to-background relative cursor-pointer group"
            onClick={() => bannerRef.current?.click()}
          >
            {bannerUrl ? (
              <img src={bannerUrl} alt="Capa" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="h-10 w-10 text-muted-foreground/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {uploadingBanner ? (
                <Loader2 className="h-6 w-6 animate-spin text-foreground" />
              ) : (
                <>
                  <Camera className="h-5 w-5 text-foreground" />
                  <span className="text-sm font-medium text-foreground">Alterar capa</span>
                </>
              )}
            </div>
            <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
          </div>

          {/* Avatar */}
          <div className="absolute -bottom-12 left-6">
            <button
              onClick={() => avatarRef.current?.click()}
              className="w-24 h-24 rounded-2xl bg-card border-4 border-background shadow-lg flex items-center justify-center overflow-hidden group relative"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-muted-foreground/30" />
              )}
              <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {uploadingAvatar ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Camera className="h-5 w-5 text-foreground" />
                )}
              </div>
            </button>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
        </div>

        <CardContent className="pt-16 pb-6 px-6">
          <p className="text-xs text-muted-foreground">
            Clique na capa ou no avatar para trocar as imagens da sua loja.
          </p>
        </CardContent>
      </Card>

      {/* Text fields */}
      <Card className="border-border/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Type className="h-4 w-4 text-primary" />
            Informações da loja
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tagline" className="text-xs">Frase de destaque</Label>
            <Input
              id="tagline"
              placeholder="Ex: Sneakers autênticos, preço justo."
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              maxLength={100}
              className="bg-muted/30 border-border/30"
            />
            <p className="text-[10px] text-muted-foreground text-right">{tagline.length}/100</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio" className="text-xs">Bio / Sobre a loja</Label>
            <Textarea
              id="bio"
              placeholder="Conte um pouco sobre você e seus sneakers..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={4}
              className="bg-muted/30 border-border/30 resize-none"
            />
            <p className="text-[10px] text-muted-foreground text-right">{bio.length}/500</p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving} className="btn-gold gap-2 flex-1">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar alterações
        </Button>
        {sellerId && (
          <Button
            variant="outline"
            onClick={() => navigate(`/marketplace/seller/${sellerId}`)}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            Ver loja pública
          </Button>
        )}
      </div>
    </div>
  );
}
