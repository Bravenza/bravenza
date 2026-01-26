import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Mail, 
  ArrowRight, 
  FileText, 
  CheckCircle, 
  CreditCard, 
  Package, 
  Truck, 
  Search, 
  ShoppingBag,
  AlertCircle,
  Clock,
  Plane,
  Home,
  Eye
} from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface EmailTemplate {
  id: string;
  name: string;
  trigger: string;
  description: string;
  icon: React.ReactNode;
  status: "active" | "pending" | "optional";
  subject: string;
  variables: string[];
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "budget_sent",
    name: "Orçamento Enviado",
    trigger: "Quando admin envia orçamento",
    description: "Email com detalhes do orçamento e link para aprovação",
    icon: <FileText className="h-5 w-5" />,
    status: "active",
    subject: "Seu orçamento está pronto - {order_id}",
    variables: ["client_name", "order_id", "product_name", "total_price", "sinal_value", "balance_value", "approval_link", "expires_at"],
  },
  {
    id: "budget_approved",
    name: "Orçamento Aprovado",
    trigger: "Quando cliente aprova orçamento",
    description: "Confirmação de aprovação com instruções de pagamento do sinal",
    icon: <CheckCircle className="h-5 w-5" />,
    status: "active",
    subject: "Orçamento aprovado! Próximo passo: Pagamento do sinal - {order_id}",
    variables: ["client_name", "order_id", "sinal_value", "pix_qr_code", "pix_copy_paste"],
  },
  {
    id: "sinal_confirmed",
    name: "Sinal Confirmado",
    trigger: "Quando pagamento do sinal é confirmado",
    description: "Confirmação de pagamento e início da busca do produto",
    icon: <CreditCard className="h-5 w-5" />,
    status: "active",
    subject: "Pagamento confirmado! Iniciando busca - {order_id}",
    variables: ["client_name", "order_id", "product_name", "sla_vault_due_date"],
  },
  {
    id: "product_found",
    name: "Produto Encontrado",
    trigger: "Status: PURCHASE_COMPLETED",
    description: "Notificação de que o produto foi encontrado e comprado",
    icon: <ShoppingBag className="h-5 w-5" />,
    status: "active",
    subject: "Ótima notícia! Seu produto foi encontrado - {order_id}",
    variables: ["client_name", "order_id", "product_name"],
  },
  {
    id: "package_shipped",
    name: "Pacote Enviado",
    trigger: "Status: PACKAGE_EN_ROUTE",
    description: "Produto enviado para o Brasil com código de rastreio internacional",
    icon: <Plane className="h-5 w-5" />,
    status: "active",
    subject: "Seu pacote está a caminho do Brasil! - {order_id}",
    variables: ["client_name", "order_id", "international_tracking"],
  },
  {
    id: "arrived_inspection",
    name: "Chegou & Inspeção OK",
    trigger: "Status: INSPECTION_APPROVED",
    description: "Produto chegou ao Brasil e passou na inspeção de qualidade",
    icon: <Search className="h-5 w-5" />,
    status: "active",
    subject: "Produto aprovado na inspeção! - {order_id}",
    variables: ["client_name", "order_id", "product_name"],
  },
  {
    id: "balance_due",
    name: "Saldo Disponível",
    trigger: "Status: BALANCE_DUE",
    description: "Solicitação de pagamento do saldo restante",
    icon: <AlertCircle className="h-5 w-5" />,
    status: "active",
    subject: "Pague o saldo e receba seu produto! - {order_id}",
    variables: ["client_name", "order_id", "balance_value", "payment_link"],
  },
  {
    id: "balance_confirmed",
    name: "Saldo Confirmado",
    trigger: "Quando pagamento do saldo é confirmado",
    description: "Confirmação de pagamento total e preparação para envio",
    icon: <CreditCard className="h-5 w-5" />,
    status: "active",
    subject: "Pagamento completo! Preparando envio - {order_id}",
    variables: ["client_name", "order_id", "product_name"],
  },
  {
    id: "dispatched",
    name: "Enviado para Entrega",
    trigger: "Status: DISPATCHED",
    description: "Produto enviado via transportadora nacional",
    icon: <Truck className="h-5 w-5" />,
    status: "active",
    subject: "Seu pedido está a caminho! - {order_id}",
    variables: ["client_name", "order_id", "national_tracking", "national_carrier"],
  },
  {
    id: "delivered",
    name: "Entregue",
    trigger: "Status: DELIVERED",
    description: "Confirmação de entrega e agradecimento",
    icon: <Home className="h-5 w-5" />,
    status: "active",
    subject: "Pedido entregue! Obrigado pela confiança - {order_id}",
    variables: ["client_name", "order_id", "product_name"],
  },
  {
    id: "balance_reminder",
    name: "Lembrete de Pagamento",
    trigger: "3 dias após BALANCE_DUE sem pagamento",
    description: "Lembrete amigável sobre pagamento pendente",
    icon: <Clock className="h-5 w-5" />,
    status: "optional",
    subject: "Lembrete: Pagamento pendente - {order_id}",
    variables: ["client_name", "order_id", "balance_value", "payment_link"],
  },
];

export default function EmailFlowPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Mail className="h-8 w-8" />
          Fluxo de Emails
        </h1>
        <p className="text-muted-foreground mt-2">
          Visualize e gerencie os emails automáticos enviados aos clientes em cada etapa do pedido.
        </p>
      </div>

      {/* Visual Flow */}
      <Card>
        <CardHeader>
          <CardTitle>Jornada do Cliente</CardTitle>
          <CardDescription>
            Cada mudança de status importante dispara um email automático
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Flow Diagram */}
            <div className="flex flex-wrap gap-4 items-start">
              {EMAIL_TEMPLATES.filter(t => t.status !== "optional").map((template, index) => (
                <div key={template.id} className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedTemplate(template)}
                    className="flex flex-col items-center p-4 rounded-lg border-2 border-primary/20 bg-card hover:border-primary hover:bg-primary/5 transition-all min-w-[120px] cursor-pointer"
                  >
                    <div className="p-3 rounded-full bg-primary/10 text-primary mb-2">
                      {template.icon}
                    </div>
                    <span className="text-xs font-medium text-center leading-tight">
                      {template.name}
                    </span>
                    <Badge 
                      variant={template.status === "active" ? "default" : "secondary"} 
                      className="mt-2 text-[10px]"
                    >
                      {template.status === "active" ? "Ativo" : "Pendente"}
                    </Badge>
                  </button>
                  {index < EMAIL_TEMPLATES.filter(t => t.status !== "optional").length - 1 && (
                    <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      <Card>
        <CardHeader>
          <CardTitle>Templates de Email</CardTitle>
          <CardDescription>
            Clique em um template para ver os detalhes e preview
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {EMAIL_TEMPLATES.map((template) => (
            <div
              key={template.id}
              onClick={() => setSelectedTemplate(template)}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {template.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{template.name}</h3>
                    <Badge 
                      variant={template.status === "active" ? "default" : template.status === "optional" ? "outline" : "secondary"}
                    >
                      {template.status === "active" ? "Ativo" : template.status === "optional" ? "Opcional" : "Pendente"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{template.trigger}</p>
                  <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Template Preview Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTemplate?.icon}
              {selectedTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Gatilho:</label>
                <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                  {selectedTemplate.trigger}
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Assunto do Email:</label>
                <p className="text-sm bg-muted p-2 rounded font-mono">
                  {selectedTemplate.subject}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Variáveis disponíveis:</label>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.variables.map((v) => (
                    <Badge key={v} variant="outline" className="font-mono text-xs">
                      {"{" + v + "}"}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Preview do Email:</label>
                <EmailPreview template={selectedTemplate} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmailPreview({ template }: { template: EmailTemplate }) {
  const getPreviewContent = (templateId: string) => {
    const previews: Record<string, React.ReactNode> = {
      budget_sent: (
        <div className="bg-[#0a0a0a] text-white rounded-lg overflow-hidden text-sm">
          <div className="bg-gradient-to-r from-[#d4af37] via-[#f4e5a3] to-[#d4af37] p-6 text-center">
            <h2 className="text-xl font-bold text-[#0a0a0a]">BRAZ VAULT</h2>
            <p className="text-[#333] text-xs">Seu orçamento está pronto!</p>
          </div>
          <div className="p-6 space-y-4">
            <p>Olá, <strong>João</strong>!</p>
            <p className="text-gray-400 text-xs">
              Preparamos o orçamento do seu pedido <span className="text-[#d4af37] font-bold">BV-260126-001</span>.
            </p>
            <div className="bg-[#252525] rounded-lg p-4 space-y-2">
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-400">Valor Total</span>
                <span className="text-[#d4af37] font-bold">R$ 1.500,00</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Sinal (50%)</span>
                <span>R$ 750,00</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Saldo (50%)</span>
                <span>R$ 750,00</span>
              </div>
            </div>
            <div className="text-center">
              <button className="bg-gradient-to-r from-[#d4af37] via-[#f4e5a3] to-[#d4af37] text-[#0a0a0a] px-6 py-2 rounded font-bold text-xs">
                Ver Orçamento e Aprovar
              </button>
            </div>
            <p className="text-orange-400 text-xs text-center">
              ⏰ Este orçamento expira em 29/01/2026
            </p>
          </div>
        </div>
      ),
      budget_approved: (
        <div className="bg-[#0a0a0a] text-white rounded-lg overflow-hidden text-sm">
          <div className="bg-gradient-to-r from-[#d4af37] via-[#f4e5a3] to-[#d4af37] p-6 text-center">
            <h2 className="text-xl font-bold text-[#0a0a0a]">BRAZ VAULT</h2>
            <p className="text-[#333] text-xs">Orçamento Aprovado! ✓</p>
          </div>
          <div className="p-6 space-y-4">
            <p>Olá, <strong>João</strong>!</p>
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-3">
              <p className="text-green-400 text-xs">✓ Seu orçamento foi aprovado com sucesso!</p>
            </div>
            <p className="text-gray-400 text-xs">
              Para iniciarmos a busca do seu produto, efetue o pagamento do sinal:
            </p>
            <div className="bg-[#252525] rounded-lg p-4 text-center space-y-3">
              <p className="text-[#d4af37] text-xl font-bold">R$ 750,00</p>
              <div className="bg-white p-4 rounded inline-block">
                <div className="w-24 h-24 bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                  QR Code Pix
                </div>
              </div>
              <p className="text-xs text-gray-400">Ou copie o código Pix:</p>
              <code className="text-xs bg-[#333] p-2 rounded block overflow-hidden">
                00020126580014br.gov.bcb...
              </code>
            </div>
          </div>
        </div>
      ),
      sinal_confirmed: (
        <div className="bg-[#0a0a0a] text-white rounded-lg overflow-hidden text-sm">
          <div className="bg-gradient-to-r from-[#d4af37] via-[#f4e5a3] to-[#d4af37] p-6 text-center">
            <h2 className="text-xl font-bold text-[#0a0a0a]">BRAZ VAULT</h2>
            <p className="text-[#333] text-xs">Pagamento Confirmado! 💰</p>
          </div>
          <div className="p-6 space-y-4">
            <p>Olá, <strong>João</strong>!</p>
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-3">
              <p className="text-green-400 text-xs">✓ Pagamento do sinal confirmado!</p>
            </div>
            <p className="text-gray-400 text-xs">
              Iniciamos a busca do seu <span className="text-white">Nike Air Force 1</span>.
            </p>
            <div className="bg-[#252525] rounded-lg p-4">
              <p className="text-xs text-gray-400">Previsão de conclusão:</p>
              <p className="text-[#d4af37] font-bold">25 de Fevereiro de 2026</p>
            </div>
            <p className="text-gray-400 text-xs">
              Você receberá atualizações por email a cada nova etapa do processo.
            </p>
          </div>
        </div>
      ),
      dispatched: (
        <div className="bg-[#0a0a0a] text-white rounded-lg overflow-hidden text-sm">
          <div className="bg-gradient-to-r from-[#d4af37] via-[#f4e5a3] to-[#d4af37] p-6 text-center">
            <h2 className="text-xl font-bold text-[#0a0a0a]">BRAZ VAULT</h2>
            <p className="text-[#333] text-xs">Pedido Enviado! 🚚</p>
          </div>
          <div className="p-6 space-y-4">
            <p>Olá, <strong>João</strong>!</p>
            <p className="text-gray-400 text-xs">
              Seu pedido <span className="text-[#d4af37]">BV-260126-001</span> está a caminho!
            </p>
            <div className="bg-[#252525] rounded-lg p-4 space-y-2">
              <p className="text-xs text-gray-400">Código de Rastreio:</p>
              <p className="text-white font-mono font-bold">BR123456789BR</p>
              <p className="text-xs text-gray-400">Transportadora: Correios</p>
            </div>
            <div className="text-center">
              <button className="bg-gradient-to-r from-[#d4af37] via-[#f4e5a3] to-[#d4af37] text-[#0a0a0a] px-6 py-2 rounded font-bold text-xs">
                Rastrear Pedido
              </button>
            </div>
          </div>
        </div>
      ),
      delivered: (
        <div className="bg-[#0a0a0a] text-white rounded-lg overflow-hidden text-sm">
          <div className="bg-gradient-to-r from-[#d4af37] via-[#f4e5a3] to-[#d4af37] p-6 text-center">
            <h2 className="text-xl font-bold text-[#0a0a0a]">BRAZ VAULT</h2>
            <p className="text-[#333] text-xs">Pedido Entregue! 🎉</p>
          </div>
          <div className="p-6 space-y-4">
            <p>Olá, <strong>João</strong>!</p>
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 text-center">
              <p className="text-green-400">✓ Pedido entregue com sucesso!</p>
            </div>
            <p className="text-gray-400 text-xs text-center">
              Obrigado por confiar na Braz Vault! Esperamos que você aproveite seu
              <span className="text-white"> Nike Air Force 1</span>.
            </p>
            <div className="text-center pt-4">
              <p className="text-xs text-gray-500">Alguma dúvida? Entre em contato conosco.</p>
            </div>
          </div>
        </div>
      ),
    };

    return previews[templateId] || (
      <div className="bg-[#0a0a0a] text-white rounded-lg overflow-hidden text-sm p-6">
        <p className="text-gray-400 text-center">Preview em desenvolvimento...</p>
      </div>
    );
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {getPreviewContent(template.id)}
    </div>
  );
}