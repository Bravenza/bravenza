import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User, Mail, Phone, MapPin, Shield, Bell, Save, ArrowLeft,
  Loader2, Pencil, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SNEAKER_BRANDS } from "@/lib/sneaker-data";

const SHOE_SIZES = [
  "35", "35.5", "36", "36.5", "37", "37.5", "38", "38.5", "39", "39.5",
  "40", "40.5", "41", "41.5", "42", "42.5", "43", "43.5", "44", "44.5",
  "45", "45.5", "46", "47", "48"
];

export default function MarketplaceProfilePage() {
  const context = useOutletContext<{ cpf?: string; profile?: any }>();
  const navigate = useNavigate();
  const cpf = context?.cpf;
  const profile = context?.profile;

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
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  useEffect(() => {
    if (cpf) {
      fetchPreferences();
      fetchAddress();
      fetchEmail();
    }
  }, [cpf]);

  const fetchEmail = async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user?.email) setEmail(data.user.email);
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
    } catch (err) {
      console.error(err);
    }
    setPrefsLoading(false);
  };

  const fetchAddress = async () => {
    try {
      const { data } = await supabase
        .from("order_requests")
        .select("address_cep, address_street, address_number, address_complement, address_neighborhood, address_city, address_state")
        .eq("client_cpf", cpf!)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setAddress({
          cep: data.address_cep || "",
          street: data.address_street || "",
          number: data.address_number || "",
          complement: data.address_complement || "",
          neighborhood: data.address_neighborhood || "",
          city: data.address_city || "",
          state: data.address_state || "",
        });
      }
    } catch {}
  };

  const handleSaveProfile = async () => {
    if (!cpf) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("client_profiles")
        .update({ full_name: fullName, phone })
        .eq("cpf", cpf);
      if (error) throw error;
      toast.success("Dados atualizados!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    }
    setSavingProfile(false);
  };

  const handleSavePreferences = async () => {
    if (!cpf) return;
    setSavingPrefs(true);
    try {
      const { error } = await supabase.rpc("upsert_client_preferences", {
        p_cpf: cpf,
        p_preferred_sizes: preferredSizes,
        p_favorite_brands: favoriteBrands,
        p_preferred_colors: [],
        p_notification_email: notifEmail,
        p_notification_whatsapp: notifWhatsapp,
        p_notification_push: notifPush,
      });
      if (error) throw error;
      toast.success("Preferências salvas!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar preferências");
    }
    setSavingPrefs(false);
  };

  const toggleSize = (size: string) => {
    setPreferredSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const toggleBrand = (brand: string) => {
    setFavoriteBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  if (!cpf || cpf === "visitor") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <User className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold mb-2">Faça login para acessar seu perfil</h2>
        <Button onClick={() => navigate("/entrar")} className="mt-4">Entrar</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-28 md:pb-12 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Meu Perfil</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus dados, preferências e endereço</p>
        </div>
      </div>

      {/* ── Personal Data ── */}
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
                <Label>Telefone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" inputMode="tel" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input value={email} disabled className="mt-1 opacity-60" />
                <p className="text-[10px] text-muted-foreground mt-1">Email não pode ser alterado aqui</p>
              </div>
              <div>
                <Label>CPF</Label>
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

      {/* ── Address ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> Endereço
            </CardTitle>
            <CardDescription className="text-xs">
              Último endereço utilizado em pedidos
            </CardDescription>
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
                  <div>
                    <Label>Número</Label>
                    <Input value={address.number} disabled className="mt-1 opacity-60" />
                  </div>
                  <div>
                    <Label>Bairro</Label>
                    <Input value={address.neighborhood} disabled className="mt-1 opacity-60" />
                  </div>
                  <div>
                    <Label>Cidade/UF</Label>
                    <Input value={`${address.city}/${address.state}`} disabled className="mt-1 opacity-60" />
                  </div>
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

      {/* ── Preferences ── */}
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
                {/* Sizes */}
                <div>
                  <Label className="text-sm font-semibold">Tamanhos preferidos</Label>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {SHOE_SIZES.map((size) => (
                      <button
                        key={size}
                        onClick={() => toggleSize(size)}
                        className={cn(
                          "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border",
                          preferredSizes.includes(size)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/30 text-muted-foreground border-border/30 hover:border-primary/30"
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Brands */}
                <div>
                  <Label className="text-sm font-semibold">Marcas favoritas</Label>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {SNEAKER_BRANDS.slice(0, 20).map((brand) => (
                      <button
                        key={brand.value}
                        onClick={() => toggleBrand(brand.value)}
                        className={cn(
                          "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border",
                          favoriteBrands.includes(brand.value)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/30 text-muted-foreground border-border/30 hover:border-primary/30"
                        )}
                      >
                        {brand.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Notifications */}
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
  );
}
