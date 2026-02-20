import { useState, useEffect } from "react";
import { Settings, Save, Check, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SNEAKER_BRANDS } from "@/lib/sneaker-data";
import { cn } from "@/lib/utils";

const SHOE_SIZES = [
  "35", "35.5", "36", "36.5", "37", "37.5", "38", "38.5", "39", "39.5",
  "40", "40.5", "41", "41.5", "42", "42.5", "43", "43.5", "44", "44.5",
  "45", "45.5", "46", "47", "48"
];

interface PreferencesData {
  preferred_sizes: string[];
  favorite_brands: string[];
  preferred_colors: string[];
  notification_email: boolean;
  notification_whatsapp: boolean;
  notification_push: boolean;
}

interface ClientPreferencesProps {
  clientCpf: string;
  clientName: string;
  embedded?: boolean;
}

export function ClientPreferences({ clientCpf, clientName, embedded = false }: ClientPreferencesProps) {
  const [preferences, setPreferences] = useState<PreferencesData>({
    preferred_sizes: [],
    favorite_brands: [],
    preferred_colors: [],
    notification_email: true,
    notification_whatsapp: true,
    notification_push: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newColor, setNewColor] = useState("");

  useEffect(() => {
    fetchPreferences();
  }, [clientCpf]);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase.rpc("get_client_preferences", {
        p_cpf: clientCpf,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setPreferences({
          preferred_sizes: data[0].preferred_sizes || [],
          favorite_brands: data[0].favorite_brands || [],
          preferred_colors: data[0].preferred_colors || [],
          notification_email: data[0].notification_email ?? true,
          notification_whatsapp: data[0].notification_whatsapp ?? true,
          notification_push: data[0].notification_push ?? true,
        });
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.rpc("upsert_client_preferences", {
        p_cpf: clientCpf,
        p_preferred_sizes: preferences.preferred_sizes,
        p_favorite_brands: preferences.favorite_brands,
        p_preferred_colors: preferences.preferred_colors,
        p_notification_email: preferences.notification_email,
        p_notification_whatsapp: preferences.notification_whatsapp,
        p_notification_push: preferences.notification_push,
      });

      if (error) throw error;

      toast.success("Preferências salvas com sucesso!");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Erro ao salvar preferências");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSize = (size: string) => {
    setPreferences((prev) => ({
      ...prev,
      preferred_sizes: prev.preferred_sizes.includes(size)
        ? prev.preferred_sizes.filter((s) => s !== size)
        : [...prev.preferred_sizes, size],
    }));
  };

  const toggleBrand = (brand: string) => {
    setPreferences((prev) => ({
      ...prev,
      favorite_brands: prev.favorite_brands.includes(brand)
        ? prev.favorite_brands.filter((b) => b !== brand)
        : [...prev.favorite_brands, brand],
    }));
  };

  const addColor = () => {
    if (newColor.trim() && !preferences.preferred_colors.includes(newColor.trim())) {
      setPreferences((prev) => ({
        ...prev,
        preferred_colors: [...prev.preferred_colors, newColor.trim()],
      }));
      setNewColor("");
    }
  };

  const removeColor = (color: string) => {
    setPreferences((prev) => ({
      ...prev,
      preferred_colors: prev.preferred_colors.filter((c) => c !== color),
    }));
  };

  if (isLoading) {
    return (
      <div className={cn(
        "py-8 text-center",
        !embedded && "border border-border/50 rounded-lg bg-card/50"
      )}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
      </div>
    );
  }

  const content = (
    <div className="space-y-6">
      {/* Preferred Sizes */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Tamanhos preferidos</Label>
        <div className="flex flex-wrap gap-2">
          {SHOE_SIZES.map((size) => (
            <Badge
              key={size}
              variant={preferences.preferred_sizes.includes(size) ? "default" : "outline"}
              className="cursor-pointer transition-all hover:scale-105"
              onClick={() => toggleSize(size)}
            >
              {preferences.preferred_sizes.includes(size) && (
                <Check className="h-3 w-3 mr-1" />
              )}
              {size}
            </Badge>
          ))}
        </div>
      </div>

      {/* Favorite Brands */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Marcas favoritas</Label>
        <div className="flex flex-wrap gap-2">
          {SNEAKER_BRANDS.slice(0, 12).map((brand) => (
            <Badge
              key={brand.value}
              variant={preferences.favorite_brands.includes(brand.label) ? "default" : "outline"}
              className="cursor-pointer transition-all hover:scale-105"
              onClick={() => toggleBrand(brand.label)}
            >
              {preferences.favorite_brands.includes(brand.label) && (
                <Check className="h-3 w-3 mr-1" />
              )}
              {brand.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Preferred Colors */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Cores preferidas</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {preferences.preferred_colors.map((color) => (
            <Badge
              key={color}
              variant="secondary"
              className="cursor-pointer"
            >
              {color}
              <X 
                className="h-3 w-3 ml-1 hover:text-destructive" 
                onClick={() => removeColor(color)}
              />
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Adicionar cor..."
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addColor()}
            className="max-w-[200px]"
          />
          <Button variant="outline" size="icon" onClick={addColor}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="space-y-4 pt-4 border-t border-border/50">
        <Label className="text-sm font-medium">Canais de notificação</Label>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="email-notif" className="text-sm">E-mail</Label>
            <p className="text-xs text-muted-foreground">
              Receber atualizações por e-mail
            </p>
          </div>
          <Switch
            id="email-notif"
            checked={preferences.notification_email}
            onCheckedChange={(checked) =>
              setPreferences((prev) => ({ ...prev, notification_email: checked }))
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="whatsapp-notif" className="text-sm">WhatsApp</Label>
            <p className="text-xs text-muted-foreground">
              Receber atualizações por WhatsApp
            </p>
          </div>
          <Switch
            id="whatsapp-notif"
            checked={preferences.notification_whatsapp}
            onCheckedChange={(checked) =>
              setPreferences((prev) => ({ ...prev, notification_whatsapp: checked }))
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="push-notif" className="text-sm">Push (App)</Label>
            <p className="text-xs text-muted-foreground">
              Receber notificações no celular
            </p>
          </div>
          <Switch
            id="push-notif"
            checked={preferences.notification_push}
            onCheckedChange={(checked) =>
              setPreferences((prev) => ({ ...prev, notification_push: checked }))
            }
          />
        </div>
      </div>

      {/* Granular Notification Categories */}
      {(preferences.notification_email || preferences.notification_push || preferences.notification_whatsapp) && (
        <div className="space-y-3 pt-3 border-t border-border/30">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Categorias de notificação
          </Label>
          <p className="text-[11px] text-muted-foreground">
            Escolha quais tipos de atualização deseja receber nos canais ativos acima
          </p>

          {[
            { id: "notif_drops", label: "Novos Drops & Lançamentos", desc: "Alertas sobre novos conteúdos e lançamentos" },
            { id: "notif_matches", label: "Matches & Curadoria", desc: "Atualizações sobre buscas e Match Room" },
            { id: "notif_community", label: "Comunidade", desc: "Curtidas, comentários e novos seguidores" },
            { id: "notif_marketplace", label: "Marketplace", desc: "Ofertas, vendas e atualizações de pedidos" },
            { id: "notif_promotions", label: "Promoções & Ofertas", desc: "Cupons, cashback e oportunidades exclusivas" },
          ].map((cat) => (
            <div key={cat.id} className="flex items-center justify-between py-1">
              <div className="space-y-0.5">
                <Label htmlFor={cat.id} className="text-sm">{cat.label}</Label>
                <p className="text-[11px] text-muted-foreground">{cat.desc}</p>
              </div>
              <Switch
                id={cat.id}
                defaultChecked={true}
              />
            </div>
          ))}
        </div>
      )}

      <Button 
        className="w-full btn-gold" 
        onClick={savePreferences}
        disabled={isSaving}
      >
        {isSaving ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
            Salvando...
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Salvar Preferências
          </>
        )}
      </Button>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Minhas Preferências
        </CardTitle>
        <CardDescription>
          Personalize sua experiência e receba recomendações melhores
        </CardDescription>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}
