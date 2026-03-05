import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User, Mail, Phone, MapPin, Shield, Bell, Save, ArrowLeft,
  Loader2, Check, Box, Heart, Star, Settings2, Camera, AlertCircle, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PillTabs } from "@/components/ui/pill-tabs";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SNEAKER_BRANDS } from "@/lib/sneaker-data";
import { ClosetStatsBar } from "@/components/vault/closet/ClosetStatsBar";
import { ClosetCollectionTab } from "@/components/vault/closet/ClosetCollectionTab";
import { ClosetFavoritesTab } from "@/components/vault/closet/ClosetFavoritesTab";
import { ClosetReviewsTab } from "@/components/vault/closet/ClosetReviewsTab";
import { useClientSession } from "@/hooks/useClientSession";

/** Validates CPF using the standard Brazilian algorithm */
function isValidCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  return remainder === parseInt(digits[10]);
}

/** Validates email format */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/** Validates Brazilian phone (10-11 digits: DDD + number) */
function isValidBrPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 || digits.length === 11;
}

function ValidationBadge({ valid, label }: { valid: boolean; label: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full",
      valid ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"
    )}>
      {valid ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
      {label}
    </span>
  );
}

const SHOE_SIZES = [
  "35", "35.5", "36", "36.5", "37", "37.5", "38", "38.5", "39", "39.5",
  "40", "40.5", "41", "41.5", "42", "42.5", "43", "43.5", "44", "44.5",
  "45", "45.5", "46", "47", "48"
];

interface VaultItem {
  id: string;
  vault_id: string;
  title: string;
  brand: string;
  model: string;
  colorway: string;
  size: string;
  verified_status: "VERIFIED" | "PENDING" | "REVOKED";
  inspection_photos: string[];
  certificate_pdf_url: string | null;
  qr_private_url: string | null;
  purchase_value: number;
  purchase_date: string;
  marketplace_product_id?: string | null;
  purchase_price?: number | null;
  market_price?: number | null;
}

export default function MarketplaceProfilePage() {
  const context = useOutletContext<{ cpf?: string; profile?: any }>();
  const navigate = useNavigate();
  const { isVaultMember } = useClientSession();
  const cpf = context?.cpf;
  const profile = context?.profile;

  const [activeTab, setActiveTab] = useState("colecao");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Profile data
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Preferences
  const [preferredSizes, setPreferredSizes] = useState<string[]>([]);
  const [favoriteBrands, setFavoriteBrands] = useState<string[]>([]);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifWhatsapp, setNotifWhatsapp] = useState(true);
  const [notifPush, setNotifPush] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsLoading, setPrefsLoading] = useState(true);

  // Address
  const [address, setAddress] = useState({
    cep: "", street: "", number: "", complement: "",
    neighborhood: "", city: "", state: "",
  });

  // Closet data
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [vaultLoading, setVaultLoading] = useState(true);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  useEffect(() => {
    if (cpf) {
      fetchPreferences();
      fetchAddress();
      fetchEmail();
      fetchVaultItems();
      fetchCounts();
    }
  }, [cpf]);

  const fetchEmail = async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user?.email) setEmail(data.user.email);
  };

  const fetchVaultItems = async () => {
    if (!cpf) return;
    setVaultLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_vault_member_items", { p_cpf: cpf });
      if (!error && data) setVaultItems(data as unknown as VaultItem[]);
    } catch {}
    setVaultLoading(false);
  };

  const fetchCounts = async () => {
    if (!cpf) return;
    try {
      const [watchlistRes, reviewsRes] = await Promise.all([
        supabase.from("marketplace_watchlist").select("id", { count: "exact", head: true }).eq("user_cpf", cpf).eq("is_active", true),
        supabase.from("marketplace_product_reviews").select("id", { count: "exact", head: true }).eq("reviewer_cpf", cpf).eq("is_visible", true),
      ]);
      setFavoritesCount(watchlistRes.count || 0);
      setReviewsCount(reviewsRes.count || 0);
    } catch {}
  };

  const fetchPreferences = async () => {
    setPrefsLoading(true);
    try {
      const { data } = await supabase.rpc("get_client_preferences", { p_cpf: cpf! });
      if (data?.[0]) {
        const p = data[0] as any;
        setPreferredSizes(p.preferred_sizes || []);
        setFavoriteBrands(p.favorite_brands || []);
        setNotifEmail(p.notification_email ?? true);
        setNotifWhatsapp(p.notification_whatsapp ?? true);
        setNotifPush(p.notification_push ?? true);
      }
    } catch (err) { console.error(err); }
    setPrefsLoading(false);
  };

  const fetchAddress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // First try default address from client_addresses
      const { data: addrData } = await supabase
        .from("client_addresses")
        .select("cep, street, number, complement, neighborhood, city, state")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .limit(1)
        .maybeSingle();
      if (addrData) {
        setAddress({
          cep: addrData.cep || "", street: addrData.street || "",
          number: addrData.number || "", complement: addrData.complement || "",
          neighborhood: addrData.neighborhood || "", city: addrData.city || "",
          state: addrData.state || "",
        });
        return;
      }
      // Fallback: last order_request
      const { data } = await supabase
        .from("order_requests")
        .select("address_cep, address_street, address_number, address_complement, address_neighborhood, address_city, address_state")
        .eq("client_cpf", cpf!)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (data) {
        setAddress({
          cep: data.address_cep || "", street: data.address_street || "",
          number: data.address_number || "", complement: data.address_complement || "",
          neighborhood: data.address_neighborhood || "", city: data.address_city || "",
          state: data.address_state || "",
        });
      }
    } catch {}
  };

  const handleSaveProfile = async () => {
    if (!cpf) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase.from("client_profiles").update({ full_name: fullName, phone }).eq("cpf", cpf);
      if (error) throw error;
      toast.success("Dados atualizados!");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erro ao salvar"); }
    setSavingProfile(false);
  };

  const handleSavePreferences = async () => {
    if (!cpf) return;
    setSavingPrefs(true);
    try {
      const { error } = await supabase.rpc("upsert_client_preferences", {
        p_cpf: cpf, p_preferred_sizes: preferredSizes, p_favorite_brands: favoriteBrands,
        p_preferred_colors: [], p_notification_email: notifEmail,
        p_notification_whatsapp: notifWhatsapp, p_notification_push: notifPush,
      });
      if (error) throw error;
      toast.success("Preferências salvas!");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erro ao salvar preferências"); }
    setSavingPrefs(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !cpf) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx. 5MB)");
      return;
    }
    setUploadingAvatar(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(data.path);
      const publicUrl = urlData.publicUrl;
      const { error: updateError } = await supabase
        .from("client_profiles")
        .update({ avatar_url: publicUrl })
        .eq("cpf", cpf);
      if (updateError) throw updateError;
      setAvatarUrl(publicUrl);
      toast.success("Foto de perfil atualizada!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar imagem");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const toggleSize = (size: string) => setPreferredSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  const toggleBrand = (brand: string) => setFavoriteBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);

  if (!cpf || cpf === "visitor") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <User className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold mb-2">Faça login para acessar seu perfil</h2>
        <Button onClick={() => navigate("/entrar")} className="mt-4">Entrar</Button>
      </div>
    );
  }

  const totalValue = vaultItems.reduce((s, i) => s + (i.purchase_price || i.purchase_value || 0), 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-28 md:pb-12 space-y-5">
      {/* Profile Cover + Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border/30 bg-card">
        {/* Cover gradient with BRAVENZA watermark */}
        <div className="h-28 md:h-36 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none">
            <span className="text-[5rem] md:text-[7rem] font-black tracking-[0.2em] text-primary/[0.06] uppercase whitespace-nowrap">
              BRAVENZA
            </span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
        </div>

        <div className="px-5 pb-5 -mt-10 relative z-10">
          <div className="flex items-end gap-4">
            <div className="relative group">
              <Avatar className="h-16 w-16 border-4 border-card shadow-lg cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                <AvatarImage src={avatarUrl || undefined} alt={fullName} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div
                className="absolute inset-0 rounded-full bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                onClick={() => avatarInputRef.current?.click()}
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-5 w-5 animate-spin text-foreground" />
                ) : (
                  <Camera className="h-5 w-5 text-foreground" />
                )}
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <h1 className="text-xl font-black tracking-tight truncate">{fullName || "Meu Perfil"}</h1>
              <p className="text-sm text-muted-foreground">
                {cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.***.$3-**")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <ClosetStatsBar
        collectionCount={vaultItems.length}
        favoritesCount={favoritesCount}
        reviewsCount={reviewsCount}
        totalValue={totalValue}
      />

      {/* Main Tabs */}
      <div className="space-y-6">
        <PillTabs
          items={[
            { id: "colecao", label: "Coleção", icon: Box },
            { id: "favoritos", label: "Favoritos", icon: Heart },
            { id: "avaliacoes", label: "Avaliações", icon: Star },
            { id: "dados", label: "Dados", icon: Settings2 },
          ]}
          value={activeTab}
          onValueChange={setActiveTab}
        />

        {/* ── Coleção Tab ── */}
        {activeTab === "colecao" && (
          <ClosetCollectionTab
            items={vaultItems}
            isLoading={vaultLoading}
            onItemAdded={fetchVaultItems}
            cpf={cpf}
            memberId={profile?.vault_member_id || ""}
          />
        )}

        {/* ── Favoritos Tab ── */}
        {activeTab === "favoritos" && (
          <ClosetFavoritesTab cpf={cpf} />
        )}

        {/* ── Avaliações Tab ── */}
        {activeTab === "avaliacoes" && (
          <ClosetReviewsTab cpf={cpf} />
        )}

        {/* ── Meus Dados Tab ── */}
        {activeTab === "dados" && (
          <div className="space-y-6">
            {/* Personal Data */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" /> Dados pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Nome completo</Label>
                      <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <Label>Telefone</Label>
                        <ValidationBadge valid={isValidBrPhone(phone)} label={isValidBrPhone(phone) ? "Válido" : "Inválido"} />
                      </div>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" inputMode="tel" placeholder="(51) 98105-5425" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <Label>Email</Label>
                        <ValidationBadge valid={isValidEmail(email)} label={isValidEmail(email) ? "Válido" : "Inválido"} />
                      </div>
                      <Input value={email} disabled className="mt-1 opacity-60" />
                      <button onClick={() => navigate("/app/seguranca")} className="text-[10px] text-primary hover:underline mt-1 inline-flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Alterar email ou senha
                      </button>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <Label>CPF</Label>
                        <ValidationBadge valid={isValidCpf(cpf || "")} label={isValidCpf(cpf || "") ? "Válido" : "Inválido"} />
                      </div>
                      <Input value={cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") || ""} disabled className="mt-1 opacity-60" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSaveProfile} disabled={savingProfile} size="sm" className="gap-2">
                      {savingProfile ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Salvar dados
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Address */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" /> Endereço
                  </CardTitle>
                  <CardDescription className="text-xs">Último endereço utilizado em pedidos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {address.cep ? (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div>
                          <Label>CEP</Label>
                          <Input value={address.cep} disabled className="mt-1 opacity-60" />
                        </div>
                        <div className="col-span-2">
                          <Label>Rua</Label>
                          <Input value={address.street} disabled className="mt-1 opacity-60" />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div><Label>Número</Label><Input value={address.number} disabled className="mt-1 opacity-60" /></div>
                        <div><Label>Bairro</Label><Input value={address.neighborhood} disabled className="mt-1 opacity-60" /></div>
                        <div><Label>Cidade/UF</Label><Input value={`${address.city}/${address.state}`} disabled className="mt-1 opacity-60" /></div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      Nenhum endereço cadastrado. Será preenchido no seu próximo pedido.
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Preferences */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" /> Preferências
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {prefsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      <div>
                        <Label className="text-sm font-semibold">Tamanhos preferidos</Label>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {SHOE_SIZES.map((size) => (
                            <button key={size} onClick={() => toggleSize(size)} aria-pressed={preferredSizes.includes(size)} className={cn(
                               "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border",
                               preferredSizes.includes(size) ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 text-muted-foreground border-border/30 hover:border-primary/30"
                             )}>{size}</button>
                          ))}
                        </div>
                      </div>
                      <Separator />
                      <div>
                        <Label className="text-sm font-semibold">Marcas favoritas</Label>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {SNEAKER_BRANDS.slice(0, 20).map((brand) => (
                            <button key={brand.value} onClick={() => toggleBrand(brand.value)} aria-pressed={favoriteBrands.includes(brand.value)} className={cn(
                               "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border",
                               favoriteBrands.includes(brand.value) ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 text-muted-foreground border-border/30 hover:border-primary/30"
                             )}>{brand.label}</button>
                          ))}
                        </div>
                      </div>
                      <Separator />
                      <div>
                        <Label className="text-sm font-semibold mb-3 block">Notificações</Label>
                        <div className="space-y-3">
                          {[
                            { label: "Email", icon: Mail, value: notifEmail, setter: setNotifEmail },
                            { label: "WhatsApp", icon: Phone, value: notifWhatsapp, setter: setNotifWhatsapp },
                            { label: "Push", icon: Bell, value: notifPush, setter: setNotifPush },
                          ].map(({ label, icon: Icon, value, setter }) => (
                            <div key={label} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{label}</span>
                              </div>
                              <Switch checked={value} onCheckedChange={setter} />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button onClick={handleSavePreferences} disabled={savingPrefs} size="sm" className="gap-2">
                          {savingPrefs ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                          Salvar preferências
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
