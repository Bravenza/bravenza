import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, QrCode, CheckCircle2, XCircle, ExternalLink, Mail, MessageSquare, Percent, Users, Loader2, HelpCircle, Activity, Truck, Info, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EmailSettingsTab } from "@/components/admin/settings/EmailSettingsTab";
import { WhatsAppSettingsTab } from "@/components/admin/settings/WhatsAppSettingsTab";
import { FAQSettingsTab } from "@/components/admin/settings/FAQSettingsTab";
import { LogsSettingsTab } from "@/components/admin/settings/LogsSettingsTab";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SecuritySettingsTab } from "@/components/admin/settings/SecuritySettingsTab";
import { AdminSettingsTab } from "@/components/admin/settings/AdminSettingsTab";

interface ApiConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  requiredSecrets: { key: string; label: string; placeholder: string }[];
  docsUrl?: string;
  configuredSecrets?: string[]; // Secrets that are confirmed configured in backend
}

const API_CONFIGS: ApiConfig[] = [
  {
    id: "mercadopago",
    name: "Mercado Pago",
    description: "Pagamentos via Pix (sinal) e Cartão de Crédito até 12x (saldo).",
    icon: <QrCode className="h-6 w-6" />,
    requiredSecrets: [
      { key: "MERCADO_PAGO_ACCESS_TOKEN", label: "Access Token", placeholder: "APP_USR-..." }
    ],
    configuredSecrets: ["MERCADO_PAGO_ACCESS_TOKEN"],
    docsUrl: "https://www.mercadopago.com.br/developers/pt/docs",
  },
];

const NOTIFICATION_CONFIGS: ApiConfig[] = [
  {
    id: "email",
    name: "Email (Resend)",
    description: "Envio automático de emails com orçamentos e atualizações de pedidos.",
    icon: <Mail className="h-6 w-6" />,
    requiredSecrets: [
      { key: "RESEND_API_KEY", label: "API Key", placeholder: "re_..." }
    ],
    configuredSecrets: ["RESEND_API_KEY"],
    docsUrl: "https://resend.com/docs",
  },
  {
    id: "whatsapp",
    name: "WhatsApp (Twilio)",
    description: "Envio de mensagens automáticas via WhatsApp usando Twilio.",
    icon: <MessageSquare className="h-6 w-6" />,
    requiredSecrets: [
      { key: "TWILIO_ACCOUNT_SID", label: "Account SID", placeholder: "ACxxxxxxxxxxxxxxx" },
      { key: "TWILIO_AUTH_TOKEN", label: "Auth Token", placeholder: "Token de autenticação" },
      { key: "TWILIO_WHATSAPP_NUMBER", label: "WhatsApp Number", placeholder: "+14155238886" }
    ],
    docsUrl: "https://www.twilio.com/docs/whatsapp",
  },
];

const LOGISTICS_CONFIGS: ApiConfig[] = [
  {
    id: "superfrete",
    name: "SuperFrete",
    description: "Cotação de frete, geração de etiquetas e rastreamento para entregas nacionais (PAC, SEDEX, Jadlog, etc).",
    icon: <Truck className="h-6 w-6" />,
    requiredSecrets: [
      { key: "SUPERFRETE_API_TOKEN", label: "API Token", placeholder: "Token da API SuperFrete" }
    ],
    configuredSecrets: ["SUPERFRETE_API_TOKEN"],
    docsUrl: "https://docs.superfrete.com",
  },
];

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
        if (data) {
          setValue(String(data.value).replace(/"/g, ""));
        }
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
    } catch (err: any) {
      console.error("Error saving setting:", err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  return { value, setValue, isLoading, isSaving, saveSetting };
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Configurações
        </h1>
        <p className="text-muted-foreground mt-2">
          Gerencie as integrações, APIs, templates e configurações do sistema.
        </p>
      </div>

      <Tabs defaultValue="geral" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 h-auto flex-wrap overflow-x-auto">
          <TabsTrigger value="geral" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="seguranca" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="emails" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Emails
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="faq" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            FAQ
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="admins" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Administradores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-6">
          <Alert className="border-primary/20 bg-primary/5">
            <Info className="h-4 w-4" />
            <AlertTitle>Gerenciamento de API Keys</AlertTitle>
            <AlertDescription className="text-sm">
              As API keys são gerenciadas de forma segura pelo Lovable Cloud. Para adicionar ou atualizar uma chave, 
              basta solicitar ao assistente Lovable: <strong>"adicione a API key do Mercado Pago"</strong> ou 
              <strong>"configure o secret RESEND_API_KEY"</strong>. O assistente irá abrir um formulário seguro 
              para você inserir a chave, que será armazenada diretamente no backend.
            </AlertDescription>
          </Alert>

          <ReferralSettingsCard />

          <Card>
            <CardHeader>
              <CardTitle>Integrações de Pagamento</CardTitle>
              <CardDescription>
                Configure as APIs necessárias para processar pagamentos na plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {API_CONFIGS.map((api) => (
                <ApiIntegrationCard key={api.id} config={api} />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>
                Configure as APIs para envio de notificações aos clientes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {NOTIFICATION_CONFIGS.map((api) => (
                <ApiIntegrationCard key={api.id} config={api} />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Logística</CardTitle>
              <CardDescription>
                Configure as APIs para cotação de frete, geração de etiquetas e rastreamento de entregas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {LOGISTICS_CONFIGS.map((api) => (
                <ApiIntegrationCard key={api.id} config={api} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emails">
          <EmailSettingsTab />
        </TabsContent>

        <TabsContent value="seguranca">
          <SecuritySettingsTab />
        </TabsContent>

        <TabsContent value="whatsapp">
          <WhatsAppSettingsTab />
        </TabsContent>

        <TabsContent value="faq">
          <FAQSettingsTab />
        </TabsContent>

        <TabsContent value="logs">
          <LogsSettingsTab />
        </TabsContent>

        <TabsContent value="admins">
          <AdminSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReferralSettingsCard() {
  const { value, isLoading, isSaving, saveSetting } = useSystemSetting("referral_cashback_percentage", "5");
  const [editValue, setEditValue] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = async () => {
    const numValue = parseFloat(editValue);
    if (isNaN(numValue) || numValue < 0 || numValue > 100) {
      toast.error("Digite um valor entre 0 e 100");
      return;
    }

    try {
      await saveSetting(editValue);
      setIsEditing(false);
      toast.success("Porcentagem de cashback atualizada!");
    } catch (err) {
      toast.error("Erro ao salvar configuração");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Programa de Indicação
        </CardTitle>
        <CardDescription>
          Configure as regras do programa de indicação e cashback para clientes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg bg-card">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-muted rounded-lg shrink-0">
              <Percent className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold">Cashback por Indicação</h3>
                <Badge variant="default">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Ativo
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Porcentagem de desconto que o cliente indicador recebe quando a indicação é convertida.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isEditing ? (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-20 pr-6"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setEditValue(value); }}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <>
                <span className="text-2xl font-bold text-primary">{value}%</span>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  Editar
                </Button>
              </>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          💡 Este valor será aplicado automaticamente a todas as novas indicações. Indicações existentes mantêm seus valores originais.
        </p>
      </CardContent>
    </Card>
  );
}

function ApiIntegrationCard({ config }: { config: ApiConfig }) {
  // Check if the integration has configured secrets in the backend
  const isConfiguredInBackend = config.configuredSecrets && config.configuredSecrets.length > 0;
  const missingSecrets = config.requiredSecrets.filter(
    s => !config.configuredSecrets?.includes(s.key)
  );
  const hasAllSecrets = missingSecrets.length === 0 && isConfiguredInBackend;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-lg bg-card">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-muted rounded-lg shrink-0">
          {config.icon}
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold">{config.name}</h3>
            <Badge variant={hasAllSecrets ? "default" : "secondary"}>
              {hasAllSecrets ? (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Configurado
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  Pendente
                </>
              )}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {config.description}
          </p>
          {!hasAllSecrets && missingSecrets.length > 0 && (
            <p className="text-xs text-warning mt-1">
              Secrets pendentes: {missingSecrets.map(s => s.key).join(", ")}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {config.docsUrl && (
          <Button variant="ghost" size="sm" asChild>
            <a href={config.docsUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-1" />
              Docs
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
