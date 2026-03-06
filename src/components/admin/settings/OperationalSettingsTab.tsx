import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Percent, MapPin, Phone, Globe, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useViaCep } from "@/hooks/useViaCep";

function useSystemSetting(key: string, defaultValue: string = "") {
  const [value, setValue] = useState<string>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchSetting() {
      try {
        const { data, error } = await supabase
          .from("system_settings")
          .select("value")
          .eq("key", key)
          .maybeSingle();
        if (error) throw error;
        if (data) setValue(String(data.value).replace(/"/g, ""));
      } catch (err) {
        console.error("Error fetching setting:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSetting();
  }, [key]);

  const saveSetting = async (newValue: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("system_settings")
        .upsert(
          { key, value: newValue, updated_at: new Date().toISOString() },
          { onConflict: "key" }
        );
      if (error) throw error;
      setValue(newValue);
      return true;
    } catch (err) {
      console.error("Error saving setting:", err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  return { value, setValue, isLoading, isSaving, saveSetting };
}

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  settingKey: string;
  defaultValue?: string;
  type?: "percent" | "cep" | "phone" | "url";
  validate?: (v: string) => string | null;
  formatDisplay?: (v: string) => string;
}

function SettingRow({ icon, label, description, settingKey, defaultValue = "", type, validate, formatDisplay }: SettingRowProps) {
  const { value, isLoading, isSaving, saveSetting } = useSystemSetting(settingKey, defaultValue);
  const [editValue, setEditValue] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [cepCity, setCepCity] = useState("");

  const onCepResult = useCallback((data: { localidade?: string; uf?: string }) => {
    if (data.localidade && data.uf) setCepCity(`${data.localidade} - ${data.uf}`);
  }, []);

  const { lookup: lookupCep, isLoading: isCepLoading } = useViaCep(onCepResult);

  useEffect(() => {
    setEditValue(value);
    if (type === "cep" && value.replace(/\D/g, "").length === 8) {
      lookupCep(value);
    }
  }, [value]);

  const handleSave = async () => {
    if (validate) {
      const err = validate(editValue);
      if (err) { toast.error(err); return; }
    }
    try {
      await saveSetting(editValue);
      setIsEditing(false);
      toast.success(`${label} atualizado com sucesso!`);
      if (type === "cep") lookupCep(editValue);
    } catch {
      toast.error("Erro ao salvar configuração");
    }
  };

  const formatCep = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 8);
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
  };

  const displayed = formatDisplay ? formatDisplay(value) : value;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg bg-card">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-muted rounded-lg shrink-0">{icon}</div>
        <div>
          <h3 className="font-semibold">{label}</h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
          {type === "cep" && cepCity && !isEditing && (
            <p className="text-xs text-primary mt-1">📍 {cepCity}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isEditing ? (
          <div className="flex items-center gap-2">
            {type === "percent" ? (
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="10"
                  step="0.01"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-24 pr-6"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
            ) : type === "cep" ? (
              <Input
                value={formatCep(editValue)}
                onChange={(e) => setEditValue(e.target.value.replace(/\D/g, "").slice(0, 8))}
                placeholder="00000-000"
                className="w-32"
              />
            ) : (
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-48"
              />
            )}
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setEditValue(value); }}>
              Cancelar
            </Button>
          </div>
        ) : (
          <>
            <span className="text-lg font-bold text-primary">{displayed}</span>
            {type === "cep" && isCepLoading && <Loader2 className="h-3 w-3 animate-spin" />}
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Editar</Button>
          </>
        )}
      </div>
    </div>
  );
}

export function OperationalSettingsTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Taxas de Pagamento
          </CardTitle>
          <CardDescription>Configure as taxas aplicadas sobre cada método de pagamento.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingRow
            icon={<Percent className="h-6 w-6" />}
            label="Taxa PIX"
            description="Percentual cobrado sobre pagamentos via PIX. Impacta o cálculo do sinal."
            settingKey="payment_fee_pix"
            defaultValue="0.99"
            type="percent"
            validate={(v) => {
              const n = parseFloat(v);
              if (isNaN(n) || n < 0 || n > 10) return "Digite um valor entre 0 e 10";
              return null;
            }}
            formatDisplay={(v) => `${v}%`}
          />
          <SettingRow
            icon={<Percent className="h-6 w-6" />}
            label="Taxa Cartão de Crédito"
            description="Percentual cobrado sobre pagamentos via cartão de crédito. Impacta o cálculo do saldo."
            settingKey="payment_fee_credit_card"
            defaultValue="4.99"
            type="percent"
            validate={(v) => {
              const n = parseFloat(v);
              if (isNaN(n) || n < 0 || n > 10) return "Digite um valor entre 0 e 10";
              return null;
            }}
            formatDisplay={(v) => `${v}%`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Logística
          </CardTitle>
          <CardDescription>Configurações de endereço e frete do armazém.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingRow
            icon={<MapPin className="h-6 w-6" />}
            label="CEP do Armazém"
            description="Usado para calcular o custo de frete Hub PRO para compradores."
            settingKey="bravenza_warehouse_cep"
            defaultValue=""
            type="cep"
            validate={(v) => {
              if (v.replace(/\D/g, "").length !== 8) return "CEP deve ter 8 dígitos";
              return null;
            }}
            formatDisplay={(v) => {
              const d = v.replace(/\D/g, "");
              return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d || "Não configurado";
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Comunicação
          </CardTitle>
          <CardDescription>Configurações de contato e URLs públicas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingRow
            icon={<Phone className="h-6 w-6" />}
            label="Número WhatsApp"
            description="Número usado nos links de WhatsApp do site. Formato internacional sem +."
            settingKey="whatsapp_number"
            defaultValue="5551981055425"
            validate={(v) => {
              if (!/^\d{10,15}$/.test(v)) return "Número inválido. Use apenas dígitos (10 a 15).";
              return null;
            }}
          />
          <SettingRow
            icon={<Globe className="h-6 w-6" />}
            label="URL Pública do Site"
            description="URL base usada em links de compartilhamento, emails e QR codes."
            settingKey="public_base_url"
            defaultValue="https://bravenza.com.br"
            type="url"
            validate={(v) => {
              try { new URL(v); return null; } catch { return "URL inválida"; }
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
