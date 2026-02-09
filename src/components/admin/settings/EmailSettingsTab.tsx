import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, ArrowRight, FileText, CheckCircle, CreditCard, Package, Truck, Search, 
  ShoppingBag, AlertCircle, Clock, Plane, Home, Eye, Users, MessageSquare,
  ShieldCheck, DollarSign, Bell, UserPlus, Flag, Star, XCircle, RefreshCw, UserCheck
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
  category: "orders" | "marketplace" | "community" | "automated";
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  // === ORDERS ===
  { id: "budget_sent", name: "Orçamento Enviado", trigger: "Quando admin envia orçamento", description: "Email com detalhes do orçamento e link para aprovação", icon: <FileText className="h-5 w-5" />, status: "active", subject: "Seu orçamento está pronto - {order_id}", variables: ["client_name", "order_id", "product_name", "total_price", "sinal_value", "balance_value", "approval_link", "expires_at"], category: "orders" },
  { id: "budget_approved", name: "Orçamento Aprovado", trigger: "Quando cliente aprova orçamento", description: "Confirmação de aprovação com instruções de pagamento do sinal", icon: <CheckCircle className="h-5 w-5" />, status: "active", subject: "Orçamento aprovado! Próximo passo: Pagamento do sinal - {order_id}", variables: ["client_name", "order_id", "sinal_value", "pix_qr_code", "pix_copy_paste"], category: "orders" },
  { id: "sinal_confirmed", name: "Sinal Confirmado", trigger: "Quando pagamento do sinal é confirmado", description: "Confirmação de pagamento e início da busca do produto", icon: <CreditCard className="h-5 w-5" />, status: "active", subject: "Pagamento confirmado! Iniciando busca - {order_id}", variables: ["client_name", "order_id", "product_name", "sla_vault_due_date"], category: "orders" },
  { id: "product_found", name: "Produto Encontrado", trigger: "Status: PURCHASE_COMPLETED", description: "Notificação de que o produto foi encontrado e comprado", icon: <ShoppingBag className="h-5 w-5" />, status: "active", subject: "Ótima notícia! Seu produto foi encontrado - {order_id}", variables: ["client_name", "order_id", "product_name"], category: "orders" },
  { id: "package_shipped", name: "Pacote Enviado", trigger: "Status: PACKAGE_EN_ROUTE", description: "Produto enviado para o Brasil com código de rastreio internacional", icon: <Plane className="h-5 w-5" />, status: "active", subject: "Seu pacote está a caminho do Brasil! - {order_id}", variables: ["client_name", "order_id", "international_tracking"], category: "orders" },
  { id: "arrived_inspection", name: "Chegou & Inspeção OK", trigger: "Status: INSPECTION_APPROVED", description: "Produto chegou ao Brasil e passou na inspeção de qualidade", icon: <Search className="h-5 w-5" />, status: "active", subject: "Produto aprovado na inspeção! - {order_id}", variables: ["client_name", "order_id", "product_name"], category: "orders" },
  { id: "balance_due", name: "Saldo Disponível", trigger: "Status: BALANCE_DUE", description: "Solicitação de pagamento do saldo restante", icon: <AlertCircle className="h-5 w-5" />, status: "active", subject: "Pague o saldo e receba seu produto! - {order_id}", variables: ["client_name", "order_id", "balance_value", "payment_link"], category: "orders" },
  { id: "balance_confirmed", name: "Saldo Confirmado", trigger: "Quando pagamento do saldo é confirmado", description: "Confirmação de pagamento total e preparação para envio", icon: <CreditCard className="h-5 w-5" />, status: "active", subject: "Pagamento completo! Preparando envio - {order_id}", variables: ["client_name", "order_id", "product_name"], category: "orders" },
  { id: "dispatched", name: "Enviado para Entrega", trigger: "Status: DISPATCHED", description: "Produto enviado via transportadora nacional", icon: <Truck className="h-5 w-5" />, status: "active", subject: "Seu pedido está a caminho! - {order_id}", variables: ["client_name", "order_id", "national_tracking", "national_carrier"], category: "orders" },
  { id: "delivered", name: "Entregue", trigger: "Status: DELIVERED", description: "Confirmação de entrega e agradecimento", icon: <Home className="h-5 w-5" />, status: "active", subject: "Pedido entregue! Obrigado pela confiança - {order_id}", variables: ["client_name", "order_id", "product_name"], category: "orders" },
  // === MARKETPLACE ===
  { id: "mk_purchase_confirmed", name: "Compra Confirmada", trigger: "Quando comprador finaliza checkout", description: "Confirmação de compra com detalhes do produto e próximos passos", icon: <ShoppingBag className="h-5 w-5" />, status: "active", subject: "Compra confirmada! - {order_code}", variables: ["recipient_name", "order_code", "product_name", "size", "condition", "price", "shipping_mode"], category: "marketplace" },
  { id: "mk_new_sale", name: "Nova Venda", trigger: "Quando vendedor recebe uma compra", description: "Notificação de nova venda com instruções de envio", icon: <DollarSign className="h-5 w-5" />, status: "active", subject: "Nova venda! - {order_code}", variables: ["recipient_name", "order_code", "product_name", "size", "price", "buyer_name", "shipping_mode"], category: "marketplace" },
  { id: "mk_seller_shipped", name: "Vendedor Enviou", trigger: "Quando vendedor marca como enviado", description: "Notificação ao comprador de que o produto foi despachado", icon: <Truck className="h-5 w-5" />, status: "active", subject: "Produto enviado! - {order_code}", variables: ["recipient_name", "order_code", "product_name", "tracking_code", "carrier", "shipping_mode"], category: "marketplace" },
  { id: "mk_delivery_confirmed", name: "Entrega Confirmada", trigger: "Quando entrega é confirmada", description: "Confirmação de entrega com informações de proteção de compra", icon: <CheckCircle className="h-5 w-5" />, status: "active", subject: "Entrega confirmada! - {order_code}", variables: ["recipient_name", "order_code", "product_name"], category: "marketplace" },
  { id: "mk_inspection_result", name: "Resultado da Inspeção", trigger: "Após inspeção no Hub Bravenza", description: "Resultado da inspeção de autenticidade (aprovado/reprovado)", icon: <ShieldCheck className="h-5 w-5" />, status: "active", subject: "Resultado da inspeção - {order_code}", variables: ["recipient_name", "order_code", "inspection_result", "rejection_reason"], category: "marketplace" },
  { id: "mk_payout_released", name: "Payout Liberado", trigger: "Após proteção expirar sem disputa", description: "Notificação ao vendedor de que o pagamento foi liberado", icon: <DollarSign className="h-5 w-5" />, status: "active", subject: "Pagamento liberado! - {order_code}", variables: ["recipient_name", "order_code", "payout_amount", "payout_method"], category: "marketplace" },
  { id: "mk_dispute_opened", name: "Disputa Aberta", trigger: "Quando comprador ou vendedor abre disputa", description: "Notificação à parte contrária sobre abertura de disputa", icon: <AlertCircle className="h-5 w-5" />, status: "active", subject: "Disputa aberta - {order_code}", variables: ["recipient_name", "order_code", "dispute_reason", "dispute_opened_by"], category: "marketplace" },
  { id: "mk_dispute_resolved", name: "Disputa Resolvida", trigger: "Quando admin resolve disputa", description: "Resultado da mediação enviado a ambas as partes", icon: <CheckCircle className="h-5 w-5" />, status: "active", subject: "Disputa resolvida - {order_code}", variables: ["recipient_name", "order_code", "dispute_resolution"], category: "marketplace" },
  { id: "mk_watchlist_match", name: "Watchlist Match", trigger: "Quando nova oferta combina com watchlist", description: "Alerta ao comprador de que um produto desejado está disponível", icon: <Bell className="h-5 w-5" />, status: "active", subject: "Produto da sua lista disponível!", variables: ["recipient_name", "watchlist_product_name", "watchlist_price", "watchlist_size"], category: "marketplace" },
  { id: "mk_offer_received", name: "Oferta Recebida", trigger: "Quando vendedor recebe oferta", description: "Notificação de nova oferta com valor e comprador", icon: <DollarSign className="h-5 w-5" />, status: "active", subject: "Nova oferta recebida!", variables: ["recipient_name", "listing_title", "offer_price", "buyer_name"], category: "marketplace" },
  { id: "mk_offer_accepted", name: "Oferta Aceita", trigger: "Quando vendedor aceita oferta", description: "Confirmação ao comprador de que sua oferta foi aceita", icon: <CheckCircle className="h-5 w-5" />, status: "active", subject: "Sua oferta foi aceita!", variables: ["recipient_name", "listing_title", "offer_price"], category: "marketplace" },
  { id: "mk_offer_counter", name: "Contra-Proposta", trigger: "Quando vendedor faz contra-proposta", description: "Notificação ao comprador com novo valor proposto", icon: <RefreshCw className="h-5 w-5" />, status: "active", subject: "Contra-proposta recebida!", variables: ["recipient_name", "listing_title", "offer_price", "counter_price", "counter_message"], category: "marketplace" },
  { id: "mk_order_cancelled", name: "Pedido Cancelado", trigger: "Quando pedido é cancelado", description: "Notificação a ambas as partes sobre cancelamento e reembolso", icon: <XCircle className="h-5 w-5" />, status: "active", subject: "Pedido cancelado - {order_code}", variables: ["recipient_name", "order_code", "product_name", "cancel_reason", "refund_amount"], category: "marketplace" },
  { id: "mk_shipping_reminder", name: "Lembrete de Envio", trigger: "3+ dias após pagamento sem envio (cron)", description: "Alerta ao vendedor sobre envio pendente", icon: <Clock className="h-5 w-5" />, status: "active", subject: "Envio pendente! - {order_code}", variables: ["recipient_name", "order_code", "shipping_mode", "days_pending"], category: "marketplace" },
  { id: "mk_protection_expiring", name: "Proteção Expirando", trigger: "2 dias antes da proteção expirar (cron)", description: "Alerta ao comprador sobre janela de disputa expirando", icon: <ShieldCheck className="h-5 w-5" />, status: "active", subject: "Proteção expirando - {order_code}", variables: ["recipient_name", "order_code", "protection_expires_at"], category: "marketplace" },
  { id: "mk_review_request", name: "Avaliação Marketplace", trigger: "Após payout liberado", description: "Solicita avaliação do comprador sobre a transação", icon: <Star className="h-5 w-5" />, status: "active", subject: "Avalie sua compra! - {order_code}", variables: ["recipient_name", "order_code", "review_link"], category: "marketplace" },
  // === COMMUNITY ===
  { id: "community_welcome", name: "Bem-vindo à Comunidade", trigger: "Quando membro entra na comunidade", description: "Email de boas-vindas com funcionalidades disponíveis", icon: <UserPlus className="h-5 w-5" />, status: "active", subject: "Bem-vindo à Comunidade Bravenza!", variables: ["recipient_name"], category: "community" },
  { id: "community_post_reported", name: "Post Reportado", trigger: "Quando post é reportado", description: "Notificação para admins sobre conteúdo reportado", icon: <Flag className="h-5 w-5" />, status: "active", subject: "Post reportado na comunidade", variables: ["recipient_name", "post_title", "report_reason", "reporter_name"], category: "community" },
  { id: "community_new_follower", name: "Novo Seguidor", trigger: "Quando alguém segue um membro", description: "Notificação ao membro sobre novo seguidor", icon: <UserCheck className="h-5 w-5" />, status: "active", subject: "Novo seguidor na comunidade!", variables: ["recipient_name", "follower_name"], category: "community" },
  { id: "community_post_comment", name: "Novo Comentário", trigger: "Quando alguém comenta em um post", description: "Notificação ao autor sobre novo comentário", icon: <MessageSquare className="h-5 w-5" />, status: "active", subject: "Novo comentário no seu post!", variables: ["recipient_name", "comment_author", "post_title", "comment_preview"], category: "community" },
  // === ORDERS (Importação) ===
  { id: "order_request_received", name: "Solicitação Recebida", trigger: "Quando cliente envia solicitação de pedido", description: "Confirmação de recebimento da solicitação", icon: <FileText className="h-5 w-5" />, status: "active", subject: "Solicitação recebida!", variables: ["recipient_name", "product_brand", "product_model", "shoe_size"], category: "orders" },
  { id: "budget_rejected", name: "Orçamento Recusado", trigger: "Quando cliente rejeita orçamento", description: "Confirmação e convite para nova solicitação", icon: <XCircle className="h-5 w-5" />, status: "active", subject: "Orçamento recusado - {order_id}", variables: ["recipient_name", "order_id"], category: "orders" },
  // === AUTOMATED ===
  { id: "budget_expiring", name: "Orçamento Expirando", trigger: "1 dia antes do orçamento expirar", description: "Lembrete automático de que o orçamento está prestes a expirar", icon: <Clock className="h-5 w-5" />, status: "active", subject: "Seu orçamento expira amanhã! - {order_id}", variables: ["client_name", "order_id", "product_name", "total_price", "expires_at", "approval_link"], category: "automated" },
  { id: "sinal_reminder", name: "Lembrete de Sinal", trigger: "2 dias após aprovação sem pagamento", description: "Lembrete automático para pagamento do sinal pendente", icon: <AlertCircle className="h-5 w-5" />, status: "active", subject: "Lembrete: Pagamento do sinal pendente - {order_id}", variables: ["client_name", "order_id", "product_name", "sinal_value", "payment_link"], category: "automated" },
  { id: "balance_reminder", name: "Lembrete de Saldo", trigger: "3 dias após BALANCE_DUE sem pagamento", description: "Lembrete amigável sobre pagamento do saldo pendente", icon: <Clock className="h-5 w-5" />, status: "active", subject: "Lembrete: Pagamento pendente - {order_id}", variables: ["client_name", "order_id", "balance_value", "payment_link"], category: "automated" },
  { id: "review_request", name: "Avaliação Pós-Entrega", trigger: "3 dias após DELIVERED", description: "Solicitação de avaliação do cliente após recebimento", icon: <CheckCircle className="h-5 w-5" />, status: "active", subject: "Como foi sua experiência? - {order_id}", variables: ["client_name", "order_id", "product_name", "review_link"], category: "automated" },
  { id: "referral_confirmed", name: "Indicação Confirmada", trigger: "Quando indicação é validada", description: "Notificação ao cliente que indicou sobre o desconto ganho", icon: <Package className="h-5 w-5" />, status: "active", subject: "Parabéns! Sua indicação foi confirmada 🎉", variables: ["client_name", "referral_code", "referred_name", "discount_percentage"], category: "automated" },
  { id: "cashback_expiring", name: "Cashback Expirando", trigger: "7 dias antes da expiração do cashback", description: "Lembrete de uso do cashback antes de expirar", icon: <Clock className="h-5 w-5" />, status: "active", subject: "Seu cashback expira em breve!", variables: ["client_name", "cashback_amount", "days_until_expiration"], category: "automated" },
  { id: "vault_welcome", name: "Boas-Vindas Vault Club", trigger: "Quando membro é aprovado no Vault Club", description: "Email de boas-vindas exclusivo para novos membros do Vault", icon: <Package className="h-5 w-5" />, status: "active", subject: "Bem-vindo ao Vault Club! 🎩", variables: ["client_name", "tier", "max_hunts", "max_wishlist"], category: "automated" },
];

const CATEGORY_LABELS = {
  orders: { label: "Pedidos", icon: <FileText className="h-4 w-4" />, count: 0 },
  marketplace: { label: "Marketplace", icon: <ShoppingBag className="h-4 w-4" />, count: 0 },
  community: { label: "Comunidade", icon: <Users className="h-4 w-4" />, count: 0 },
  automated: { label: "Automáticos", icon: <Clock className="h-4 w-4" />, count: 0 },
};

// Count templates per category
EMAIL_TEMPLATES.forEach(t => CATEGORY_LABELS[t.category].count++);

export function EmailSettingsTab() {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(CATEGORY_LABELS).map(([key, val]) => (
          <Card key={key} className="card-premium">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">{val.icon}</div>
              <div>
                <p className="text-2xl font-bold">{val.count}</p>
                <p className="text-xs text-muted-foreground">{val.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabbed Templates */}
      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="orders" className="text-xs sm:text-sm">Pedidos</TabsTrigger>
          <TabsTrigger value="marketplace" className="text-xs sm:text-sm">Marketplace</TabsTrigger>
          <TabsTrigger value="community" className="text-xs sm:text-sm">Comunidade</TabsTrigger>
          <TabsTrigger value="automated" className="text-xs sm:text-sm">Automáticos</TabsTrigger>
        </TabsList>

        {(["orders", "marketplace", "community", "automated"] as const).map(category => (
          <TabsContent key={category} value={category}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {CATEGORY_LABELS[category].icon}
                  Templates — {CATEGORY_LABELS[category].label}
                </CardTitle>
                <CardDescription>
                  {category === "orders" && "Emails enviados em cada etapa da jornada do pedido"}
                  {category === "marketplace" && "Emails de compra, venda, envio e disputas do marketplace"}
                  {category === "community" && "Emails de boas-vindas e moderação da comunidade"}
                  {category === "automated" && "Lembretes e notificações automáticas programadas"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {EMAIL_TEMPLATES.filter(t => t.category === category).map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {template.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm">{template.name}</h3>
                          <Badge variant={template.status === "active" ? "default" : "secondary"} className="text-[10px]">
                            {template.status === "active" ? "Ativo" : "Pendente"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{template.trigger}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 hidden sm:block">{template.description}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="shrink-0">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Visual Flow for orders */}
            {category === "orders" && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-sm">Fluxo Visual da Jornada</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3 items-center">
                    {EMAIL_TEMPLATES.filter(t => t.category === "orders").map((t, i, arr) => (
                      <div key={t.id} className="flex items-center gap-2">
                        <button onClick={() => setSelectedTemplate(t)} className="flex flex-col items-center p-3 rounded-lg border border-primary/20 hover:border-primary hover:bg-primary/5 transition-all min-w-[90px] cursor-pointer">
                          <div className="p-2 rounded-full bg-primary/10 text-primary mb-1">{t.icon}</div>
                          <span className="text-[10px] font-medium text-center leading-tight">{t.name}</span>
                        </button>
                        {i < arr.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Visual Flow for marketplace */}
            {category === "marketplace" && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-sm">Fluxo da Transação</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3 items-center">
                    {EMAIL_TEMPLATES.filter(t => t.category === "marketplace" && !["mk_watchlist_match", "mk_dispute_opened"].includes(t.id)).map((t, i, arr) => (
                      <div key={t.id} className="flex items-center gap-2">
                        <button onClick={() => setSelectedTemplate(t)} className="flex flex-col items-center p-3 rounded-lg border border-primary/20 hover:border-primary hover:bg-primary/5 transition-all min-w-[90px] cursor-pointer">
                          <div className="p-2 rounded-full bg-primary/10 text-primary mb-1">{t.icon}</div>
                          <span className="text-[10px] font-medium text-center leading-tight">{t.name}</span>
                        </button>
                        {i < arr.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Template Preview Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTemplate?.icon}
              {selectedTemplate?.name}
              <Badge variant="outline" className="text-[10px] ml-2">
                {selectedTemplate?.category === "orders" ? "Pedidos" : selectedTemplate?.category === "marketplace" ? "Marketplace" : selectedTemplate?.category === "community" ? "Comunidade" : "Automático"}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Gatilho</label>
                  <p className="text-sm bg-muted p-2 rounded">{selectedTemplate.trigger}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Edge Function</label>
                  <p className="text-sm bg-muted p-2 rounded font-mono">
                    {selectedTemplate.category === "marketplace" || selectedTemplate.category === "community" 
                      ? "send-marketplace-email" 
                      : "send-order-email"}
                  </p>
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Assunto</label>
                <p className="text-sm bg-muted p-2 rounded font-mono">{selectedTemplate.subject}</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Variáveis</label>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTemplate.variables.map((v) => (
                    <Badge key={v} variant="outline" className="font-mono text-[10px]">
                      {"{" + v + "}"}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Preview</label>
                <EmailPreview templateId={selectedTemplate.id} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmailPreview({ templateId }: { templateId: string }) {
  const previewCard = (header: string, subtitle: string, content: React.ReactNode) => (
    <div className="bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] rounded-lg overflow-hidden text-sm border border-border">
      <div className="bg-gradient-to-r from-[hsl(var(--primary))] via-[hsl(var(--primary)/0.8)] to-[hsl(var(--primary))] p-5 text-center">
        <h2 className="text-lg font-bold text-[hsl(var(--primary-foreground))]">{header}</h2>
        <p className="text-[hsl(var(--primary-foreground)/0.8)] text-xs">{subtitle}</p>
      </div>
      <div className="p-5 space-y-3">
        <p className="text-sm">Olá, <strong>João</strong>!</p>
        {content}
      </div>
    </div>
  );

  const infoPair = (label: string, value: string) => (
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );

  const previews: Record<string, React.ReactNode> = {
    // Orders
    budget_sent: previewCard("BRAVENZA", "Seu orçamento está pronto!", <>
      <p className="text-muted-foreground text-xs">Preparamos o orçamento do pedido <span className="text-primary font-bold">BV-260126-001</span>.</p>
      <div className="bg-muted rounded-lg p-3 space-y-2">
        {infoPair("Valor Total", "R$ 1.500,00")}
        {infoPair("Sinal (50%)", "R$ 750,00")}
        {infoPair("Saldo (50%)", "R$ 750,00")}
      </div>
      <div className="text-center"><button className="bg-primary text-primary-foreground px-4 py-1.5 rounded text-xs font-bold">Ver Orçamento e Aprovar</button></div>
    </>),
    budget_approved: previewCard("BRAVENZA", "Orçamento Aprovado! ✓", <>
      <div className="bg-green-900/30 border border-green-700 rounded p-2"><p className="text-green-400 text-xs">✓ Aprovado com sucesso!</p></div>
      <div className="bg-muted rounded-lg p-3 text-center"><p className="text-primary font-bold text-lg">R$ 750,00</p><p className="text-xs text-muted-foreground">Sinal via Pix</p></div>
    </>),
    sinal_confirmed: previewCard("BRAVENZA", "Pagamento Confirmado! 💰", <>
      <div className="bg-green-900/30 border border-green-700 rounded p-2"><p className="text-green-400 text-xs">✓ Pagamento do sinal confirmado!</p></div>
      <p className="text-muted-foreground text-xs">Iniciamos a busca do seu <span className="font-medium text-foreground">Nike Air Force 1</span>.</p>
      <div className="bg-muted rounded-lg p-3"><p className="text-xs text-muted-foreground">Previsão:</p><p className="text-primary font-bold">25/02/2026</p></div>
    </>),
    product_found: previewCard("BRAVENZA", "Produto Encontrado! 🎯", <>
      <div className="bg-green-900/30 border border-green-700 rounded p-2"><p className="text-green-400 text-xs">✓ Encontramos seu produto!</p></div>
      <p className="text-muted-foreground text-xs">Agora aguardamos o envio para o Brasil.</p>
    </>),
    package_shipped: previewCard("BRAVENZA", "Pacote Enviado! ✈️", <>
      <p className="text-muted-foreground text-xs">Seu pacote está a caminho do Brasil!</p>
      <div className="bg-muted rounded-lg p-3"><p className="text-xs text-muted-foreground">Rastreio:</p><p className="font-mono font-bold">LX123456789CN</p></div>
    </>),
    arrived_inspection: previewCard("BRAVENZA", "Inspeção Aprovada! ✓", <>
      <div className="bg-green-900/30 border border-green-700 rounded p-2"><p className="text-green-400 text-xs">✓ Aprovado na inspeção!</p></div>
      <p className="text-muted-foreground text-xs">Pague o saldo para liberarmos o envio.</p>
    </>),
    balance_due: previewCard("BRAVENZA", "Pagamento do Saldo 💳", <>
      <div className="bg-muted rounded-lg p-3 text-center"><p className="text-xs text-muted-foreground">Saldo:</p><p className="text-primary font-bold text-lg">R$ 750,00</p></div>
      <div className="text-center"><button className="bg-primary text-primary-foreground px-4 py-1.5 rounded text-xs font-bold">Pagar Saldo</button></div>
    </>),
    balance_confirmed: previewCard("BRAVENZA", "Pagamento Completo! 🎉", <>
      <div className="bg-green-900/30 border border-green-700 rounded p-2"><p className="text-green-400 text-xs">✓ Pagamento completo!</p></div>
      <p className="text-muted-foreground text-xs">Seu produto será enviado em breve.</p>
    </>),
    dispatched: previewCard("BRAVENZA", "Pedido Enviado! 🚚", <>
      <p className="text-muted-foreground text-xs">Pedido <span className="text-primary">BV-260126-001</span> a caminho!</p>
      <div className="bg-muted rounded-lg p-3">{infoPair("Rastreio", "BR123456789BR")}{infoPair("Transportadora", "Correios")}</div>
    </>),
    delivered: previewCard("BRAVENZA", "Pedido Entregue! 🎉", <>
      <div className="bg-green-900/30 border border-green-700 rounded p-2 text-center"><p className="text-green-400">✓ Entregue com sucesso!</p></div>
      <div className="text-center"><button className="bg-primary text-primary-foreground px-4 py-1.5 rounded text-xs font-bold">Avaliar ⭐</button></div>
    </>),
    // Marketplace
    mk_purchase_confirmed: previewCard("MARKETPLACE", "Compra Confirmada! 🛒", <>
      <div className="bg-green-900/30 border border-green-700 rounded p-2"><p className="text-green-400 text-xs">✓ Compra confirmada!</p></div>
      <div className="bg-muted rounded-lg p-3 space-y-2">
        {infoPair("Produto", "Air Jordan 1 Retro High")}
        {infoPair("Tamanho", "42 BR")}
        {infoPair("Condição", "Novo")}
        <div className="border-t border-border pt-2">{infoPair("Total", "R$ 1.200,00")}</div>
      </div>
      <p className="text-muted-foreground text-xs">O vendedor enviará ao Hub para inspeção.</p>
    </>),
    mk_new_sale: previewCard("MARKETPLACE", "Nova Venda! 🎉", <>
      <div className="bg-green-900/30 border border-green-700 rounded p-2"><p className="text-green-400 text-xs">✓ Parabéns! Você vendeu!</p></div>
      <div className="bg-muted rounded-lg p-3 space-y-2">
        {infoPair("Produto", "Air Jordan 1 Retro High")}
        {infoPair("Valor", "R$ 1.200,00")}
        {infoPair("Comprador", "Maria S.")}
      </div>
      <p className="text-orange-500 text-xs text-center">⏰ Envie em até 3 dias úteis</p>
    </>),
    mk_seller_shipped: previewCard("MARKETPLACE", "Produto Enviado! 📦", <>
      <p className="text-muted-foreground text-xs">O vendedor enviou seu pedido <span className="text-primary">MK-001</span>.</p>
      <div className="bg-muted rounded-lg p-3">{infoPair("Rastreio", "BR987654321BR")}{infoPair("Transportadora", "Correios")}</div>
      <p className="text-muted-foreground text-xs">Será inspecionado no Hub antes do envio a você.</p>
    </>),
    mk_delivery_confirmed: previewCard("MARKETPLACE", "Entrega Confirmada! ✅", <>
      <div className="bg-green-900/30 border border-green-700 rounded p-2"><p className="text-green-400 text-xs">✓ Entrega confirmada!</p></div>
      <div className="bg-muted rounded-lg p-3 text-center"><p className="text-sm">🛡️ <strong className="text-primary">7 dias</strong> de proteção de compra</p></div>
    </>),
    mk_inspection_result: previewCard("MARKETPLACE", "Inspeção Aprovada! ✓", <>
      <div className="bg-green-900/30 border border-green-700 rounded p-2"><p className="text-green-400 text-xs">✓ Aprovado na inspeção do Hub!</p></div>
      <p className="text-muted-foreground text-xs">O produto será enviado a você em breve.</p>
    </>),
    mk_payout_released: previewCard("MARKETPLACE", "Pagamento Liberado! 💰", <>
      <div className="bg-green-900/30 border border-green-700 rounded p-2"><p className="text-green-400 text-xs">✓ Pagamento liberado!</p></div>
      <div className="bg-muted rounded-lg p-3 text-center"><p className="text-xs text-muted-foreground">Valor:</p><p className="text-primary font-bold text-lg">R$ 1.080,00</p><p className="text-xs text-muted-foreground">Transferência em até 2 dias úteis</p></div>
    </>),
    mk_dispute_opened: previewCard("MARKETPLACE", "Disputa Aberta ⚠️", <>
      <div className="bg-orange-500/10 border border-orange-500/30 rounded p-2"><p className="text-orange-500 text-xs">⚠️ Disputa aberta para pedido MK-001</p></div>
      <div className="bg-muted rounded-lg p-3">{infoPair("Motivo", "Produto diferente do anunciado")}{infoPair("Aberto por", "Comprador")}</div>
      <p className="text-muted-foreground text-xs">Nossa equipe irá mediar a situação.</p>
    </>),
    mk_watchlist_match: previewCard("MARKETPLACE", "Produto Disponível! 🔔", <>
      <p className="text-muted-foreground text-xs">Um produto da sua watchlist está disponível!</p>
      <div className="bg-muted rounded-lg p-3 space-y-2">
        {infoPair("Produto", "Nike Dunk Low Panda")}
        {infoPair("Tamanho", "41 BR")}
        {infoPair("Preço", "R$ 650,00")}
      </div>
      <p className="text-orange-500 text-xs text-center">⏰ Produtos populares esgotam rápido!</p>
      <div className="text-center"><button className="bg-primary text-primary-foreground px-4 py-1.5 rounded text-xs font-bold">Ver Anúncio</button></div>
    </>),
    // Community
    community_welcome: previewCard("COMUNIDADE", "Bem-vindo! 👋", <>
      <div className="bg-green-900/30 border border-green-700 rounded p-2"><p className="text-green-400 text-xs">✓ Você agora faz parte da comunidade!</p></div>
      <div className="bg-muted rounded-lg p-3 space-y-1">
        <p className="text-xs font-semibold">O que você pode fazer:</p>
        <p className="text-xs text-muted-foreground">✓ Publicar fotos e textos</p>
        <p className="text-xs text-muted-foreground">✓ Conectar-se com membros</p>
        <p className="text-xs text-muted-foreground">✓ Participar de discussões</p>
      </div>
    </>),
    community_post_reported: previewCard("ADMIN", "Post Reportado 🚩", <>
      <div className="bg-orange-500/10 border border-orange-500/30 rounded p-2"><p className="text-orange-500 text-xs">⚠️ Post reportado na comunidade</p></div>
      <div className="bg-muted rounded-lg p-3 space-y-2">
        {infoPair("Post", "Review do Jordan 4...")}
        {infoPair("Reportado por", "Carlos M.")}
        {infoPair("Motivo", "Conteúdo inadequado")}
      </div>
    </>),
    // Automated
    budget_expiring: previewCard("BRAVENZA", "⏰ Orçamento Expirando!", <>
      <p className="text-orange-500 text-xs">Seu orçamento expira em <strong>24 horas</strong>!</p>
      <div className="bg-muted rounded-lg p-3 text-center"><p className="text-primary font-bold">R$ 1.500,00</p><p className="text-xs text-muted-foreground">Pedido: BV-260126-001</p></div>
      <div className="text-center"><button className="bg-orange-500 text-white px-4 py-1.5 rounded text-xs font-bold">Aprovar Agora</button></div>
    </>),
    sinal_reminder: previewCard("BRAVENZA", "💳 Lembrete de Pagamento", <>
      <p className="text-muted-foreground text-xs">Você aprovou o orçamento mas o sinal ainda está pendente.</p>
      <div className="bg-muted rounded-lg p-3 text-center"><p className="text-primary font-bold text-lg">R$ 750,00</p></div>
    </>),
    balance_reminder: previewCard("BRAVENZA", "⏰ Lembrete de Saldo", <>
      <p className="text-orange-500 text-xs">Saldo pendente para o pedido <strong>BV-260126-001</strong>.</p>
      <div className="bg-muted rounded-lg p-3 text-center"><p className="text-primary font-bold text-lg">R$ 750,00</p></div>
    </>),
    review_request: previewCard("BRAVENZA", "Como foi sua experiência? ⭐", <>
      <p className="text-muted-foreground text-xs">Seu pedido foi entregue há alguns dias. Avalie!</p>
      <div className="text-center"><button className="bg-primary text-primary-foreground px-4 py-1.5 rounded text-xs font-bold">Avaliar ⭐⭐⭐⭐⭐</button></div>
    </>),
    referral_confirmed: previewCard("BRAVENZA", "Indicação Confirmada! 🎁", <>
      <div className="bg-green-900/30 border border-green-700 rounded p-2"><p className="text-green-400 text-xs">✓ Indicação confirmada!</p></div>
      <div className="bg-muted rounded-lg p-3 text-center"><p className="text-primary font-bold text-lg">5% OFF</p><p className="text-xs text-muted-foreground">no próximo pedido</p></div>
      <div className="bg-muted rounded p-2 text-center"><p className="text-xs text-muted-foreground">Código:</p><p className="font-mono font-bold">BRVZABC123</p></div>
    </>),
    cashback_expiring: previewCard("BRAVENZA", "⏰ Cashback Expirando!", <>
      <div className="bg-orange-500/10 border border-orange-500/30 rounded p-2"><p className="text-orange-500 text-xs">Seu cashback expira em 7 dias!</p></div>
      <div className="bg-muted rounded-lg p-3 text-center"><p className="text-primary font-bold text-lg">5% OFF</p></div>
    </>),
    vault_welcome: previewCard("VAULT CLUB", "Bem-vindo ao Clube! 🎩", <>
      <div className="bg-muted rounded-lg p-3 space-y-1">
        <p className="text-xs font-semibold text-center">Seus benefícios:</p>
        <p className="text-xs text-muted-foreground">✓ Curadoria exclusiva</p>
        <p className="text-xs text-muted-foreground">✓ Match Room</p>
        <p className="text-xs text-muted-foreground">✓ 3 buscas ativas</p>
        <p className="text-xs text-muted-foreground">✓ Vault Intel</p>
      </div>
      <div className="text-center"><button className="bg-primary text-primary-foreground px-4 py-1.5 rounded text-xs font-bold">Acessar Vault Club</button></div>
    </>),
  };

  return previews[templateId] || (
    <div className="bg-muted p-4 rounded text-center text-sm text-muted-foreground">
      Preview não disponível
    </div>
  );
}
