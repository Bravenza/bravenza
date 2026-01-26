import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, CreditCard, QrCode, CheckCircle2, XCircle, ExternalLink } from "lucide-react";

interface ApiConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  requiredSecrets: string[];
  docsUrl?: string;
}

const API_CONFIGS: ApiConfig[] = [
  {
    id: "mercadopago",
    name: "Mercado Pago",
    description: "Geração automática de QR Code Pix para pagamento do sinal e saldo.",
    icon: <QrCode className="h-6 w-6" />,
    requiredSecrets: ["MERCADO_PAGO_ACCESS_TOKEN"],
    docsUrl: "https://www.mercadopago.com.br/developers/pt/docs",
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Pagamentos via cartão de crédito para o saldo restante dos pedidos.",
    icon: <CreditCard className="h-6 w-6" />,
    requiredSecrets: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
    docsUrl: "https://stripe.com/docs",
  },
];

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
            <ApiIntegrationCard
              config={{
                id: "email",
                name: "Email (SMTP/Resend)",
                description: "Envio automático de emails com orçamentos e atualizações de pedidos.",
                icon: <Settings className="h-6 w-6" />,
                requiredSecrets: ["RESEND_API_KEY"],
                docsUrl: "https://resend.com/docs",
              }}
            />
            <ApiIntegrationCard
              config={{
                id: "whatsapp",
                name: "WhatsApp Business API",
                description: "Envio de mensagens automáticas via WhatsApp (opcional).",
                icon: <Settings className="h-6 w-6" />,
                requiredSecrets: ["WHATSAPP_API_TOKEN", "WHATSAPP_PHONE_ID"],
                docsUrl: "https://developers.facebook.com/docs/whatsapp",
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ApiIntegrationCard({ config }: { config: ApiConfig }) {
  // For now, we show as "pending configuration"
  // In a real implementation, we'd check if secrets are configured
  const isConfigured = false;

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-muted rounded-lg">
          {config.icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{config.name}</h3>
            <Badge variant={isConfigured ? "default" : "secondary"}>
              {isConfigured ? (
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
          <p className="text-xs text-muted-foreground mt-1">
            Secrets necessários: {config.requiredSecrets.join(", ")}
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
        <Button variant="outline" size="sm" disabled>
          Configurar
        </Button>
      </div>
    </div>
  );
}
