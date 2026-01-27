import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Settings, QrCode, CheckCircle2, XCircle, ExternalLink, Mail, MessageSquare, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface ApiConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  requiredSecrets: { key: string; label: string; placeholder: string }[];
  docsUrl?: string;
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

// Simple localStorage-based config storage (for demo purposes)
// In production, this should be stored securely in backend
const getStoredConfig = (key: string): string | null => {
  return localStorage.getItem(`config_${key}`);
};

const setStoredConfig = (key: string, value: string): void => {
  localStorage.setItem(`config_${key}`, value);
};

const isConfigured = (secrets: { key: string }[]): boolean => {
  return secrets.every(s => !!getStoredConfig(s.key));
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Configurações
        </h1>
        <p className="text-muted-foreground mt-2">
          Gerencie as integrações e APIs do sistema.
        </p>
      </div>

      <div className="grid gap-6">
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
      </div>
    </div>
  );
}

function ApiIntegrationCard({ config }: { config: ApiConfig }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [secretValues, setSecretValues] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [configured, setConfigured] = useState(() => isConfigured(config.requiredSecrets));

  const handleOpenDialog = () => {
    // Load existing values
    const existing: Record<string, string> = {};
    config.requiredSecrets.forEach(s => {
      const stored = getStoredConfig(s.key);
      if (stored) existing[s.key] = stored;
    });
    setSecretValues(existing);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    // Validate all fields are filled
    const allFilled = config.requiredSecrets.every(s => secretValues[s.key]?.trim());
    if (!allFilled) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // Save to localStorage
    config.requiredSecrets.forEach(s => {
      setStoredConfig(s.key, secretValues[s.key]);
    });

    setConfigured(true);
    setIsDialogOpen(false);
    toast.success(`${config.name} configurado com sucesso!`);
  };

  const handleRemove = () => {
    config.requiredSecrets.forEach(s => {
      localStorage.removeItem(`config_${s.key}`);
    });
    setSecretValues({});
    setConfigured(false);
    setIsDialogOpen(false);
    toast.success(`Configuração do ${config.name} removida`);
  };

  const toggleShowSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-muted rounded-lg">
            {config.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{config.name}</h3>
              <Badge variant={configured ? "default" : "secondary"}>
                {configured ? (
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
          </div>
        </div>
        <div className="flex items-center gap-2">
          {config.docsUrl && (
            <Button variant="ghost" size="sm" asChild>
              <a href={config.docsUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                Docs
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleOpenDialog}>
            {configured ? "Editar" : "Configurar"}
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {config.icon}
              Configurar {config.name}
            </DialogTitle>
            <DialogDescription>
              Insira as credenciais da API para ativar a integração.
              {config.docsUrl && (
                <a 
                  href={config.docsUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline ml-1"
                >
                  Ver documentação
                </a>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {config.requiredSecrets.map((secret) => (
              <div key={secret.key} className="space-y-2">
                <Label htmlFor={secret.key}>{secret.label}</Label>
                <div className="relative">
                  <Input
                    id={secret.key}
                    type={showSecrets[secret.key] ? "text" : "password"}
                    placeholder={secret.placeholder}
                    value={secretValues[secret.key] || ""}
                    onChange={(e) => setSecretValues(prev => ({ ...prev, [secret.key]: e.target.value }))}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => toggleShowSecret(secret.key)}
                  >
                    {showSecrets[secret.key] ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Variável: <code className="bg-muted px-1 rounded">{secret.key}</code>
                </p>
              </div>
            ))}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {configured && (
              <Button variant="destructive" onClick={handleRemove} className="sm:mr-auto">
                Remover
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
