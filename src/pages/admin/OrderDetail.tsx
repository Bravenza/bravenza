import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  Edit,
  ArrowRight,
  Save,
  Loader2,
  Trash2,
  X,
  Mail,
  User,
  DollarSign,
  FileText,
  Truck,
  CreditCard,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  ORDER_STATUS_LABELS,
  getStatusesForType,
  getStatusIndex,
  formatDateTime,
} from "@/lib/constants";
import { sendAllStatusNotifications } from "@/lib/email-notifications";
import {
  OrderProgressStepper,
  ClientProductTab,
  CostsTab,
  BudgetTab,
  LogisticsTab,
  PaymentsTab,
  Order,
  HistoryItem,
} from "@/components/admin/order-detail";
import { OrderDetailHeader } from "@/components/admin/order-detail/OrderDetailHeader";
import { StatusChangeDialog, DeleteOrderDialog, DangerZone } from "@/components/admin/order-detail/OrderDetailDialogs";

const OrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [activeTab, setActiveTab] = useState("cliente");

  const [editData, setEditData] = useState<Partial<Order>>({});

  const fetchOrder = async () => {
    try {
      // Parallel fetch for order and history
      const [orderRes, historyRes] = await Promise.all([
        supabase
          .from("orders")
          .select("*")
          .eq("order_id", orderId)
          .single(),
        supabase
          .from("order_history")
          .select("*")
          .eq("order_id", orderId)
          .order("created_at", { ascending: true }),
      ]);

      if (orderRes.error) throw orderRes.error;

      setOrder(orderRes.data as Order);
      setEditData(orderRes.data as Order);

      if (!historyRes.error) {
        setHistory(historyRes.data || []);
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o pedido.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId) return;
    fetchOrder();
  }, [orderId, toast]);

  const handleSave = async () => {
    if (!order) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("orders")
        .update({
          client_name: editData.client_name,
          client_email: editData.client_email,
          client_phone: editData.client_phone,
          client_address: editData.client_address,
          product_brand: editData.product_brand,
          product_model: editData.product_model,
          product_name: editData.product_name,
          product_size: editData.product_size,
          product_color: editData.product_color,
          product_reference: editData.product_reference,
          product_link: editData.product_link,
          product_cost: editData.product_cost,
          product_price: editData.product_price,
          shipping_cost: editData.shipping_cost,
          other_costs: editData.other_costs,
          sinal_value: editData.sinal_value,
          sinal_paid: editData.sinal_paid,
          balance_value: editData.balance_value,
          balance_paid: editData.balance_paid,
          international_tracking: editData.international_tracking,
          international_carrier: editData.international_carrier,
          national_tracking: editData.national_tracking,
          national_carrier: editData.national_carrier,
          internal_notes: editData.internal_notes,
          inspection_photos: editData.inspection_photos,
        })
        .eq("order_id", order.order_id);

      if (error) throw error;

      setOrder({ ...order, ...editData });
      setIsEditing(false);
      toast({
        title: "Salvo!",
        description: "Pedido atualizado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível salvar.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async () => {
    if (!order || !newStatus) return;

    setIsSaving(true);

    try {
      const updates: Record<string, any> = {
        current_status: newStatus,
      };

      if (newStatus === "ARRIVED_BRAZIL") {
        const balanceDue = new Date();
        balanceDue.setHours(balanceDue.getHours() + 24);
        updates.balance_due_date = balanceDue.toISOString();
      }

      const { error: updateError } = await supabase
        .from("orders")
        .update(updates)
        .eq("order_id", order.order_id);

      if (updateError) throw updateError;

      const { error: historyError } = await supabase
        .from("order_history")
        .insert({
          order_id: order.order_id,
          status: newStatus as any,
          notes: statusNotes || null,
        });

      if (historyError) throw historyError;

      try {
        await supabase.from("notifications").insert({
          type: "order_status_update",
          target: "client",
          target_client_cpf: order.client_cpf,
          title: `Atualização do pedido ${order.order_id}`,
          message: `Seu pedido foi atualizado para: ${ORDER_STATUS_LABELS[newStatus]}`,
          reference_type: "order",
          reference_id: order.order_id,
        });
      } catch (notifError) {
        console.error("Error creating notification:", notifError);
      }

      const notifResult = await sendAllStatusNotifications(newStatus, {
        order_id: order.order_id,
        client_name: order.client_name,
        client_email: order.client_email,
        client_phone: order.client_phone,
        product_name: order.product_name,
        product_price: order.product_price,
        sinal_value: order.sinal_value,
        balance_value: order.balance_value,
        international_tracking: order.international_tracking,
        national_tracking: order.national_tracking,
        national_carrier: order.national_carrier,
      });

      setOrder({ ...order, ...updates });
      setHistory([
        ...history,
        {
          id: Date.now().toString(),
          status: newStatus,
          notes: statusNotes,
          created_at: new Date().toISOString(),
        },
      ]);
      setShowStatusModal(false);
      setNewStatus("");
      setStatusNotes("");

      const notifications = [];
      if (notifResult.email && order.client_email) notifications.push("email");
      if (notifResult.whatsapp && order.client_phone) notifications.push("WhatsApp");
      
      if (notifications.length > 0) {
        toast({
          title: "Status atualizado!",
          description: (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>Cliente notificado via {notifications.join(" e ")}.</span>
            </div>
          ),
        });
      } else {
        toast({
          title: "Status atualizado!",
          description: `Pedido atualizado para ${ORDER_STATUS_LABELS[newStatus]}.`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!order) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("order_id", order.order_id);

      if (error) throw error;

      toast({
        title: "Pedido excluído",
        description: "O pedido foi removido do sistema.",
      });

      navigate("/admin/pedidos");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkAsLost = async () => {
    if (!order) return;

    setIsSaving(true);

    try {
      const { error: updateError } = await supabase
        .from("orders")
        .update({ current_status: "LOST" })
        .eq("order_id", order.order_id);

      if (updateError) throw updateError;

      const { error: historyError } = await supabase
        .from("order_history")
        .insert({
          order_id: order.order_id,
          status: "LOST" as any,
          notes: "Pedido marcado como perdido pelo administrador",
        });

      if (historyError) throw historyError;

      setOrder({ ...order, current_status: "LOST" });
      setHistory([
        ...history,
        {
          id: Date.now().toString(),
          status: "LOST",
          notes: "Pedido marcado como perdido pelo administrador",
          created_at: new Date().toISOString(),
        },
      ]);

      toast({
        title: "Pedido marcado como perdido",
        description: "O pedido foi arquivado como negociação perdida.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Calcular progresso das etapas para o stepper
  const getStepperSteps = () => {
    if (!order) return [];

    const hasCost = order.product_cost != null && order.product_cost > 0;
    const hasPrice = order.product_price != null && order.product_price > 0;
    const hasBudgetSent = order.budget_status === "SENT" || order.budget_status === "APPROVED";
    const hasBudgetApproved = order.budget_status === "APPROVED";
    const hasTracking = order.national_tracking || order.international_tracking;

    return [
      {
        id: "cliente",
        label: "Cliente",
        description: "Dados do cliente e produto",
        isComplete: !!order.client_name && !!order.product_name,
      },
      {
        id: "custos",
        label: "Custos",
        description: "Defina custos e preço de venda",
        isComplete: hasCost && hasPrice,
        hasWarning: !hasCost,
        warningMessage: "Defina o custo do produto",
      },
      {
        id: "orcamento",
        label: "Orçamento",
        description: "Envie e acompanhe o orçamento",
        isComplete: hasBudgetApproved,
        hasWarning: !hasBudgetSent && hasPrice,
        warningMessage: "Orçamento pronto para enviar",
      },
      {
        id: "logistica",
        label: "Logística",
        description: "Rastreamento e envio",
        isComplete: hasTracking && order.current_status === "DELIVERED",
      },
      {
        id: "pagamentos",
        label: "Pagamentos",
        description: "Status financeiro do pedido",
        isComplete: order.sinal_paid && order.balance_paid,
      },
    ];
  };

  if (isLoading) {
    return (
      <div className="space-y-6" role="status" aria-live="polite">
        <span className="sr-only">Carregando detalhes do pedido…</span>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Pedido não encontrado</p>
        <Link to="/admin/pedidos">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </div>
    );
  }

  const statuses = getStatusesForType(order.order_type);
  const currentIndex = getStatusIndex(order.current_status, order.order_type);
  const nextStatuses = statuses.slice(currentIndex + 1);
  const stepperSteps = getStepperSteps();

  return (
    <div className="space-y-6">
      <OrderDetailHeader
        orderId={order.order_id}
        createdAt={order.created_at}
        isEditing={isEditing}
        isSaving={isSaving}
        hasNextStatuses={nextStatuses.length > 0}
        onEdit={() => setIsEditing(true)}
        onCancelEdit={() => { setIsEditing(false); setEditData(order); }}
        onSave={handleSave}
        onAdvanceStatus={() => setShowStatusModal(true)}
      />

      {/* Current status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-premium-gold p-6"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center pulse-gold">
            <Package className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status Atual</p>
            <h2 className="text-xl md:text-2xl font-bold text-primary">
              {ORDER_STATUS_LABELS[order.current_status] || order.current_status}
            </h2>
          </div>
        </div>
      </motion.div>

      {/* Progress Stepper */}
      <Card className="card-premium">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Progresso do Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderProgressStepper
            steps={stepperSteps}
            currentStep={activeTab}
            onStepClick={(stepId) => setActiveTab(stepId)}
          />
        </CardContent>
      </Card>

      {/* Tabs Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Mobile: Scrollable tabs */}
        <div className="md:hidden overflow-x-auto pb-2 -mx-4 px-4">
          <TabsList className="inline-flex w-max gap-1 h-auto bg-muted/50 p-1">
            <TabsTrigger value="cliente" className="flex items-center gap-2 px-4 py-2.5 whitespace-nowrap">
              <User className="h-4 w-4" />
              <span className="text-sm">Cliente</span>
            </TabsTrigger>
            <TabsTrigger value="custos" className="flex items-center gap-2 px-4 py-2.5 whitespace-nowrap">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Custos</span>
            </TabsTrigger>
            <TabsTrigger value="orcamento" className="flex items-center gap-2 px-4 py-2.5 whitespace-nowrap">
              <FileText className="h-4 w-4" />
              <span className="text-sm">Orçamento</span>
            </TabsTrigger>
            <TabsTrigger value="logistica" className="flex items-center gap-2 px-4 py-2.5 whitespace-nowrap">
              <Truck className="h-4 w-4" />
              <span className="text-sm">Logística</span>
            </TabsTrigger>
            <TabsTrigger value="pagamentos" className="flex items-center gap-2 px-4 py-2.5 whitespace-nowrap">
              <CreditCard className="h-4 w-4" />
              <span className="text-sm">Pagamentos</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        {/* Desktop: Grid tabs */}
        <TabsList className="hidden md:grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="cliente" className="flex flex-col gap-1 py-3">
            <User className="h-4 w-4" />
            <span className="text-xs">Cliente</span>
          </TabsTrigger>
          <TabsTrigger value="custos" className="flex flex-col gap-1 py-3">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs">Custos</span>
          </TabsTrigger>
          <TabsTrigger value="orcamento" className="flex flex-col gap-1 py-3">
            <FileText className="h-4 w-4" />
            <span className="text-xs">Orçamento</span>
          </TabsTrigger>
          <TabsTrigger value="logistica" className="flex flex-col gap-1 py-3">
            <Truck className="h-4 w-4" />
            <span className="text-xs">Logística</span>
          </TabsTrigger>
          <TabsTrigger value="pagamentos" className="flex flex-col gap-1 py-3">
            <CreditCard className="h-4 w-4" />
            <span className="text-xs">Pagamentos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cliente">
          <ClientProductTab
            order={order}
            editData={editData}
            setEditData={setEditData}
            isEditing={isEditing}
          />
        </TabsContent>

        <TabsContent value="custos">
          <CostsTab
            order={order}
            editData={editData}
            setEditData={setEditData}
            isEditing={isEditing}
          />
        </TabsContent>

        <TabsContent value="orcamento">
          <BudgetTab
            order={order}
            onUpdate={fetchOrder}
          />
        </TabsContent>

        <TabsContent value="logistica">
          <LogisticsTab
            order={order}
            editData={editData}
            setEditData={setEditData}
            setOrder={setOrder}
            isEditing={isEditing}
          />
        </TabsContent>

        <TabsContent value="pagamentos">
          <PaymentsTab order={order} history={history} onOrderUpdate={fetchOrder} />
        </TabsContent>
      </Tabs>

      <DangerZone
        currentStatus={order.current_status}
        isSaving={isSaving}
        onMarkAsLost={handleMarkAsLost}
        onDelete={() => setShowDeleteDialog(true)}
      />

      <StatusChangeDialog
        open={showStatusModal}
        onOpenChange={setShowStatusModal}
        nextStatuses={nextStatuses}
        newStatus={newStatus}
        onStatusChange={setNewStatus}
        statusNotes={statusNotes}
        onNotesChange={setStatusNotes}
        onConfirm={handleStatusChange}
        isSaving={isSaving}
      />

      <DeleteOrderDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        orderId={order.order_id}
        onDelete={handleDelete}
        isSaving={isSaving}
      />
    </div>
  );
};

export default OrderDetail;
