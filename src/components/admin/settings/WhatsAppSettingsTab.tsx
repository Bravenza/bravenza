import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  MessageSquare, 
  ArrowRight, 
  FileText, 
  CheckCircle, 
  CreditCard, 
  Package, 
  Truck, 
  Eye,
  Save,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface WhatsAppTemplate {
  id: string;
  name: string;
  trigger: string;
  description: string;
  icon: React.ReactNode;
  status: "active" | "pending" | "optional";
  messageTemplate: string;
  variables: string[];
}

const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: "budget_sent",
    name: "Orçamento Enviado",
    trigger: "Quando admin envia orçamento",
    description: "Mensagem com link para aprovação do orçamento",
    icon: <FileText className="h-5 w-5" />,
    status: "active",
    messageTemplate: `🔔 *Olá {client_name}!*

Seu orçamento para *{product_name}* está pronto!

💰 Valor: R$ {product_price}

Acesse o link abaixo para aprovar:
{budget_url}

_Bravenza - Sua loja de sneakers premium_`,
    variables: ["client_name", "product_name", "product_price", "budget_url"],
  },
  {
    id: "sinal_confirmed",
    name: "Sinal Confirmado",
    trigger: "Quando pagamento do sinal é confirmado",
    description: "Confirmação de pagamento e início da busca",
    icon: <CreditCard className="h-5 w-5" />,
    status: "active",
    messageTemplate: `✅ *Pagamento Confirmado!*

Olá {client_name}, recebemos o sinal do seu pedido *{order_id}*.

📦 Produto: {product_name}
💰 Sinal: R$ {sinal_value}

Já estamos trabalhando na sua encomenda!

_Bravenza - Sua loja de sneakers premium_`,
    variables: ["client_name", "order_id", "product_name", "sinal_value"],
  },
  {
    id: "balance_confirmed",
    name: "Saldo Confirmado",
    trigger: "Quando pagamento do saldo é confirmado",
    description: "Confirmação de pagamento total e preparação para envio",
    icon: <CreditCard className="h-5 w-5" />,
    status: "active",
    messageTemplate: `✅ *Pagamento Final Confirmado!*

Olá {client_name}, recebemos o pagamento completo do pedido *{order_id}*.

📦 Produto: {product_name}
💰 Saldo: R$ {balance_value}

Seu produto será enviado em breve!

_Bravenza - Sua loja de sneakers premium_`,
    variables: ["client_name", "order_id", "product_name", "balance_value"],
  },
  {
    id: "status_update",
    name: "Atualização de Status",
    trigger: "Quando status do pedido muda",
    description: "Notificação genérica de atualização de status",
    icon: <Package className="h-5 w-5" />,
    status: "active",
    messageTemplate: `📦 *Atualização do Pedido {order_id}*

Olá {client_name}!

Novo status: *{status_label}*
{notes}
{tracking}

_Bravenza - Sua loja de sneakers premium_`,
    variables: ["order_id", "client_name", "status_label", "notes", "tracking"],
  },
  {
    id: "dispatched",
    name: "Enviado para Entrega",
    trigger: "Status: DISPATCHED",
    description: "Produto enviado com código de rastreio",
    icon: <Truck className="h-5 w-5" />,
    status: "pending",
    messageTemplate: `🚚 *Seu Pedido Saiu Para Entrega!*

Olá {client_name}!

O pedido *{order_id}* está a caminho!

📦 Rastreio: {tracking_code}
🚛 Transportadora: {carrier}

Acompanhe a entrega pelo código acima.

_Bravenza - Sua loja de sneakers premium_`,
    variables: ["client_name", "order_id", "tracking_code", "carrier"],
  },
];

const STORAGE_KEY = "whatsapp_templates";

const loadTemplates = (): WhatsAppTemplate[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return WHATSAPP_TEMPLATES.map(t => ({
        ...t,
        messageTemplate: parsed[t.id] || t.messageTemplate,
      }));
    } catch {
      return WHATSAPP_TEMPLATES;
    }
  }
  return WHATSAPP_TEMPLATES;
};

const saveTemplate = (id: string, message: string) => {
  const stored = localStorage.getItem(STORAGE_KEY);
  const data = stored ? JSON.parse(stored) : {};
  data[id] = message;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export function WhatsAppSettingsTab() {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(loadTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [editedMessage, setEditedMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const handleOpenTemplate = (template: WhatsAppTemplate) => {
    setSelectedTemplate(template);
    setEditedMessage(template.messageTemplate);
    setIsEditing(false);
  };

  const handleSaveTemplate = () => {
    if (!selectedTemplate) return;
    
    saveTemplate(selectedTemplate.id, editedMessage);
    setTemplates(prev => prev.map(t => 
      t.id === selectedTemplate.id 
        ? { ...t, messageTemplate: editedMessage }
        : t
    ));
    setSelectedTemplate({ ...selectedTemplate, messageTemplate: editedMessage });
    setIsEditing(false);
    toast.success("Template salvo com sucesso!");
  };

  const handleResetTemplate = () => {
    if (!selectedTemplate) return;
    const original = WHATSAPP_TEMPLATES.find(t => t.id === selectedTemplate.id);
    if (original) {
      setEditedMessage(original.messageTemplate);
    }
  };

  const getPreviewMessage = (template: WhatsAppTemplate) => {
    return template.messageTemplate
      .replace("{client_name}", "João Silva")
      .replace("{product_name}", "Nike Air Force 1")
      .replace("{product_price}", "1.500,00")
      .replace("{budget_url}", "https://bravenza.lovable.app/orcamento/...")
      .replace("{order_id}", "BV-260126-001")
      .replace("{sinal_value}", "750,00")
      .replace("{balance_value}", "750,00")
      .replace("{status_label}", "Em Trânsito Nacional")
      .replace("{notes}", "📝 Previsão de entrega: 3-5 dias úteis")
      .replace("{tracking}", "🚚 Rastreio: BR123456789BR")
      .replace("{tracking_code}", "BR123456789BR")
      .replace("{carrier}", "Correios");
  };

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium">Integração com Twilio WhatsApp</p>
              <p className="text-sm text-muted-foreground">
                As mensagens são enviadas via Twilio WhatsApp API. Configure suas credenciais na aba "Geral".
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                <strong>Nota:</strong> Templates personalizados ficam salvos localmente. Para produção,
                considere usar os{" "}
                <a 
                  href="https://www.twilio.com/docs/content" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Content Templates do Twilio
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visual Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-500" />
            Jornada do Cliente via WhatsApp
          </CardTitle>
          <CardDescription>
            Cada evento importante dispara uma mensagem automática via WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-start">
            {templates.filter(t => t.status !== "optional").map((template, index) => (
              <div key={template.id} className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenTemplate(template)}
                  className="flex flex-col items-center p-4 rounded-lg border-2 border-green-500/20 bg-card hover:border-green-500 hover:bg-green-500/5 transition-all min-w-[120px] cursor-pointer"
                >
                  <div className="p-3 rounded-full bg-green-500/10 text-green-500 mb-2">
                    {template.icon}
                  </div>
                  <span className="text-xs font-medium text-center leading-tight">
                    {template.name}
                  </span>
                  <Badge 
                    variant={template.status === "active" ? "default" : "secondary"} 
                    className={`mt-2 text-[10px] ${template.status === "active" ? "bg-green-500 hover:bg-green-600" : ""}`}
                  >
                    {template.status === "active" ? "Ativo" : "Pendente"}
                  </Badge>
                </button>
                {index < templates.filter(t => t.status !== "optional").length - 1 && (
                  <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      <Card>
        <CardHeader>
          <CardTitle>Templates de Mensagem</CardTitle>
          <CardDescription>
            Clique em um template para visualizar, editar ou testar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {templates.map((template) => (
            <div
              key={template.id}
              onClick={() => handleOpenTemplate(template)}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                  {template.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{template.name}</h3>
                    <Badge 
                      variant={template.status === "active" ? "default" : template.status === "optional" ? "outline" : "secondary"}
                      className={template.status === "active" ? "bg-green-500 hover:bg-green-600" : ""}
                    >
                      {template.status === "active" ? "Ativo" : template.status === "optional" ? "Opcional" : "Pendente"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{template.trigger}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4 mr-1" />
                Ver/Editar
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Template Editor Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-500">
              {selectedTemplate?.icon}
              {selectedTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Gatilho:</Label>
                  <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                    {selectedTemplate.trigger}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Mensagem:</Label>
                    {!isEditing && (
                      <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                        Editar
                      </Button>
                    )}
                  </div>
                  {isEditing ? (
                    <Textarea
                      value={editedMessage}
                      onChange={(e) => setEditedMessage(e.target.value)}
                      className="font-mono text-sm min-h-[200px]"
                    />
                  ) : (
                    <pre className="text-sm bg-muted p-3 rounded whitespace-pre-wrap font-mono">
                      {selectedTemplate.messageTemplate}
                    </pre>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Variáveis disponíveis:</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.variables.map((v) => (
                      <Badge key={v} variant="outline" className="font-mono text-xs">
                        {"{" + v + "}"}
                      </Badge>
                    ))}
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleResetTemplate}>
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Resetar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={handleSaveTemplate} className="bg-green-500 hover:bg-green-600">
                      <Save className="h-4 w-4 mr-1" />
                      Salvar
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Preview no WhatsApp:</Label>
                <div className="bg-[#075E54] rounded-lg p-4">
                  <div className="bg-[#DCF8C6] text-black rounded-lg p-3 max-w-[280px] ml-auto shadow">
                    <pre className="whitespace-pre-wrap text-sm font-sans">
                      {getPreviewMessage(isEditing ? { ...selectedTemplate, messageTemplate: editedMessage } : selectedTemplate)}
                    </pre>
                    <p className="text-[10px] text-gray-500 text-right mt-1">12:34 ✓✓</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
