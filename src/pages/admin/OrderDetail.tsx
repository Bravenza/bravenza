import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  User,
  CreditCard,
  Truck,
  Clock,
  Edit,
  ArrowRight,
  Save,
  Loader2,
  Trash2,
  CheckCircle2,
  X,
  Mail,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/hooks/use-toast";
import {
  ORDER_STATUS_LABELS,
  getStatusesForType,
  getStatusIndex,
  formatDate,
  formatDateTime,
  formatCurrency,
  formatCPF,
  formatPhone,
  cleanPhone,
  OrderType,
} from "@/lib/constants";
import { BudgetActions } from "@/components/admin/BudgetActions";
import { sendStatusChangeEmail, sendPaymentConfirmationEmail } from "@/lib/email-notifications";
import { SNEAKER_BRANDS, getModelsForBrand, getBrandLabel, getModelLabel, findBrandKey, findModelKey } from "@/lib/sneaker-data";

const SHOE_SIZES = [
  "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"
];

const BRAZILIAN_STATES = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];

interface Order {
  order_id: string;
  order_type: OrderType;
  current_status: string;
  client_name: string;
  client_cpf: string;
  client_email: string | null;
  client_phone: string | null;
  client_address: string | null;
  product_brand: string | null;
  product_model: string | null;
  product_name: string;
  product_size: string | null;
  product_color: string | null;
  product_reference: string | null;
  product_link: string | null;
  product_price: number | null;
  product_currency: string;
  sinal_value: number | null;
  sinal_paid: boolean;
  balance_value: number | null;
  balance_paid: boolean;
  international_tracking: string | null;
  national_tracking: string | null;
  international_carrier: string | null;
  national_carrier: string | null;
  sla_vault_due_date: string | null;
  balance_due_date: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  budget_status: string | null;
  budget_sent_at: string | null;
  budget_approved_at: string | null;
  budget_rejected_at: string | null;
  budget_expires_at: string | null;
  budget_approval_token: string | null;
}

interface HistoryItem {
  id: string;
  status: string;
  notes: string | null;
  created_at: string;
}

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

  const [editData, setEditData] = useState<Partial<Order>>({});
  
  // Estados para seletores de marca/modelo
  const [selectedBrandKey, setSelectedBrandKey] = useState("");
  const [selectedModelKey, setSelectedModelKey] = useState("");
  const [showCustomBrand, setShowCustomBrand] = useState(false);
  const [showCustomModel, setShowCustomModel] = useState(false);
  
  // Estados para campos de endereço granulares
  const [addressFields, setAddressFields] = useState({
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  // Modelos disponíveis baseado na marca selecionada
  const availableModels = getModelsForBrand(selectedBrandKey);

  // Inicializar seletores quando entrar em modo de edição
  useEffect(() => {
    if (isEditing && order) {
      const brandKey = findBrandKey(order.product_brand);
      const modelKey = findModelKey(brandKey, order.product_model);
      
      setSelectedBrandKey(brandKey);
      setSelectedModelKey(modelKey);
      setShowCustomBrand(brandKey === "other");
      setShowCustomModel(modelKey === "other");
      
      // Parsear o endereço existente para os campos granulares
      parseAddressToFields(order.client_address);
    }
  }, [isEditing, order]);

  // Função para parsear endereço existente
  const parseAddressToFields = (address: string | null) => {
    if (!address) {
      setAddressFields({
        cep: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
      });
      return;
    }
    
    // Tentar extrair CEP do endereço
    const cepMatch = address.match(/CEP:\s*(\d{5}-?\d{3})/i);
    const cep = cepMatch ? cepMatch[1].replace("-", "") : "";
    
    // Tentar extrair partes do endereço
    // Formato esperado: "Rua X, nº 123, complemento, Bairro, Cidade - UF, CEP: 00000-000"
    const parts = address.split(",").map(p => p.trim());
    
    let street = "", number = "", complement = "", neighborhood = "", city = "", state = "";
    
    if (parts.length >= 1) {
      street = parts[0];
    }
    if (parts.length >= 2) {
      const numMatch = parts[1].match(/n[º°]?\s*(\S+)/i);
      if (numMatch) {
        number = numMatch[1];
      }
    }
    if (parts.length >= 4) {
      // Se tem 4+ partes, a 3ª pode ser complemento ou bairro
      const lastPart = parts[parts.length - 1];
      const hasCep = lastPart.toLowerCase().includes("cep");
      
      if (hasCep && parts.length >= 5) {
        neighborhood = parts[2];
        const cityStateMatch = parts[parts.length - 2].match(/(.+)\s*-\s*(\w{2})/);
        if (cityStateMatch) {
          city = cityStateMatch[1].trim();
          state = cityStateMatch[2].trim();
        }
        if (parts.length >= 6) {
          complement = parts[2];
          neighborhood = parts[3];
        }
      } else if (parts.length >= 3) {
        neighborhood = parts[2];
        const cityStateMatch = parts[parts.length - 1].match(/(.+)\s*-\s*(\w{2})/);
        if (cityStateMatch) {
          city = cityStateMatch[1].trim();
          state = cityStateMatch[2].trim();
        }
      }
    }
    
    setAddressFields({
      cep,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
    });
  };

  // Buscar endereço via CEP
  const handleCepChange = async (value: string) => {
    const cleanedCep = value.replace(/\D/g, "");
    setAddressFields(prev => ({ ...prev, cep: cleanedCep }));
    
    if (cleanedCep.length === 8) {
      setIsFetchingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setAddressFields(prev => ({
            ...prev,
            street: data.logradouro || "",
            neighborhood: data.bairro || "",
            city: data.localidade || "",
            state: data.uf || "",
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      } finally {
        setIsFetchingCep(false);
      }
    }
  };

  // Atualizar editData.client_address quando os campos de endereço mudarem
  useEffect(() => {
    if (isEditing) {
      const parts = [
        addressFields.street,
        addressFields.number ? `nº ${addressFields.number}` : "",
        addressFields.complement,
        addressFields.neighborhood,
        addressFields.city && addressFields.state ? `${addressFields.city} - ${addressFields.state}` : "",
        addressFields.cep ? `CEP: ${addressFields.cep.replace(/(\d{5})(\d{3})/, "$1-$2")}` : "",
      ].filter(Boolean);
      
      const fullAddress = parts.join(", ");
      setEditData(prev => ({ ...prev, client_address: fullAddress }));
    }
  }, [isEditing, addressFields]);

  // Handler para mudança de marca
  const handleBrandChange = (value: string) => {
    setSelectedBrandKey(value);
    setSelectedModelKey("");
    setShowCustomModel(false);
    
    if (value === "other") {
      setShowCustomBrand(true);
      setEditData((prev) => ({ ...prev, product_brand: "", product_model: "" }));
    } else {
      setShowCustomBrand(false);
      const brandLabel = getBrandLabel(value);
      setEditData((prev) => ({ ...prev, product_brand: brandLabel, product_model: "" }));
    }
  };

  // Handler para mudança de modelo
  const handleModelChange = (value: string) => {
    setSelectedModelKey(value);
    
    if (value === "other") {
      setShowCustomModel(true);
      setEditData((prev) => ({ ...prev, product_model: "" }));
    } else {
      setShowCustomModel(false);
      const modelLabel = getModelLabel(selectedBrandKey, value);
      setEditData((prev) => ({ ...prev, product_model: modelLabel }));
    }
  };

  // Atualizar nome do produto automaticamente
  useEffect(() => {
    if (isEditing && editData.product_brand && editData.product_model) {
      const color = editData.product_color ? ` ${editData.product_color}` : "";
      const generatedName = `${editData.product_brand} ${editData.product_model}${color}`;
      setEditData((prev) => ({ ...prev, product_name: generatedName }));
    }
  }, [isEditing, editData.product_brand, editData.product_model, editData.product_color]);

  // Handler para telefone formatado
  const handlePhoneChange = (value: string) => {
    const cleaned = cleanPhone(value);
    if (cleaned.length <= 11) {
      setEditData((prev) => ({ ...prev, client_phone: formatPhone(cleaned) }));
    }
  };

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("*")
          .eq("order_id", orderId)
          .single();

        if (orderError) throw orderError;

        setOrder(orderData as Order);
        setEditData(orderData as Order);

        const { data: historyData, error: historyError } = await supabase
          .from("order_history")
          .select("*")
          .eq("order_id", orderId)
          .order("created_at", { ascending: true });

        if (!historyError) {
          setHistory(historyData || []);
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
          product_price: editData.product_price,
          sinal_value: editData.sinal_value,
          sinal_paid: editData.sinal_paid,
          balance_value: editData.balance_value,
          balance_paid: editData.balance_paid,
          international_tracking: editData.international_tracking,
          international_carrier: editData.international_carrier,
          national_tracking: editData.national_tracking,
          national_carrier: editData.national_carrier,
          internal_notes: editData.internal_notes,
        })
        .eq("order_id", order.order_id);

      if (error) throw error;

      setOrder({ ...order, ...editData });
      setIsEditing(false);
      toast({
        title: "Salvo!",
        description: "Pedido atualizado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar.",
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

      // Auto-calculate balance due date when ARRIVED
      if (newStatus === "ARRIVED") {
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

      // Send automatic email notification for status change
      const emailResult = await sendStatusChangeEmail(newStatus, {
        order_id: order.order_id,
        client_name: order.client_name,
        client_email: order.client_email,
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

      // Show toast with email status
      if (emailResult.success && order.client_email) {
        toast({
          title: "Status atualizado!",
          description: (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>Pedido atualizado e cliente notificado por email.</span>
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/admin/pedidos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{order.order_id}</h1>
              <Badge
                variant="outline"
                className={
                  order.order_type === "VAULT"
                    ? "border-primary text-primary"
                    : "border-success text-success"
                }
              >
                {order.order_type}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Criado em {formatDateTime(order.created_at)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditData(order);
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button
                className="btn-gold"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salvar
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
              {nextStatuses.length > 0 && (
                <Button
                  className="btn-gold"
                  onClick={() => setShowStatusModal(true)}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Avançar Status
                </Button>
              )}
            </>
          )}
        </div>
      </div>

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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input
                        value={editData.client_name || ""}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            client_name: e.target.value,
                          }))
                        }
                        className="bg-secondary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CPF</Label>
                      <Input
                        value={formatCPF(order.client_cpf)}
                        disabled
                        className="bg-secondary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={editData.client_email || ""}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            client_email: e.target.value,
                          }))
                        }
                        className="bg-secondary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefone</Label>
                      <Input
                        value={editData.client_phone || ""}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder="(00) 00000-0000"
                        className="bg-secondary/50"
                      />
                    </div>
                  </div>
                  {/* Endereço Granular */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-base font-semibold">Endereço de Entrega</Label>
                      {isFetchingCep && (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      )}
                    </div>
                    
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>CEP *</Label>
                        <Input
                          value={addressFields.cep.replace(/(\d{5})(\d{3})/, "$1-$2")}
                          onChange={(e) => handleCepChange(e.target.value)}
                          placeholder="00000-000"
                          maxLength={9}
                          className="bg-secondary/50"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Rua *</Label>
                        <Input
                          value={addressFields.street}
                          onChange={(e) =>
                            setAddressFields((prev) => ({
                              ...prev,
                              street: e.target.value,
                            }))
                          }
                          placeholder="Nome da rua"
                          className="bg-secondary/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Número *</Label>
                        <Input
                          value={addressFields.number}
                          onChange={(e) =>
                            setAddressFields((prev) => ({
                              ...prev,
                              number: e.target.value,
                            }))
                          }
                          placeholder="123"
                          className="bg-secondary/50"
                        />
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Complemento</Label>
                        <Input
                          value={addressFields.complement}
                          onChange={(e) =>
                            setAddressFields((prev) => ({
                              ...prev,
                              complement: e.target.value,
                            }))
                          }
                          placeholder="Apto, Bloco..."
                          className="bg-secondary/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Bairro *</Label>
                        <Input
                          value={addressFields.neighborhood}
                          onChange={(e) =>
                            setAddressFields((prev) => ({
                              ...prev,
                              neighborhood: e.target.value,
                            }))
                          }
                          placeholder="Bairro"
                          className="bg-secondary/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cidade *</Label>
                        <Input
                          value={addressFields.city}
                          onChange={(e) =>
                            setAddressFields((prev) => ({
                              ...prev,
                              city: e.target.value,
                            }))
                          }
                          placeholder="Cidade"
                          className="bg-secondary/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Estado *</Label>
                        <Select
                          value={addressFields.state}
                          onValueChange={(value) =>
                            setAddressFields((prev) => ({
                              ...prev,
                              state: value,
                            }))
                          }
                        >
                          <SelectTrigger className="bg-secondary/50">
                            <SelectValue placeholder="Selecione o estado" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border border-border z-50">
                            {BRAZILIAN_STATES.map((state) => (
                              <SelectItem key={state.value} value={state.value}>
                                {state.value} - {state.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-medium">{order.client_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CPF</p>
                    <p className="font-medium">{formatCPF(order.client_cpf)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{order.client_email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{order.client_phone || "-"}</p>
                  </div>
                  {order.client_address && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground">Endereço</p>
                      <p className="font-medium">{order.client_address}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Tênis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Marca Selector */}
                    <div className="space-y-2">
                      <Label>Marca *</Label>
                      <Select value={selectedBrandKey} onValueChange={handleBrandChange}>
                        <SelectTrigger className="bg-secondary/50">
                          <SelectValue placeholder="Selecione a marca" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border border-border z-50">
                          {SNEAKER_BRANDS.map((brand) => (
                            <SelectItem key={brand.value} value={brand.value}>
                              {brand.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {showCustomBrand && (
                        <Input
                          value={editData.product_brand || ""}
                          onChange={(e) =>
                            setEditData((prev) => ({
                              ...prev,
                              product_brand: e.target.value,
                            }))
                          }
                          placeholder="Digite a marca..."
                          className="bg-secondary/50 mt-2"
                        />
                      )}
                    </div>

                    {/* Modelo Selector */}
                    <div className="space-y-2">
                      <Label>Modelo *</Label>
                      <Select 
                        value={selectedModelKey} 
                        onValueChange={handleModelChange}
                        disabled={!selectedBrandKey}
                      >
                        <SelectTrigger className="bg-secondary/50">
                          <SelectValue placeholder={selectedBrandKey ? "Selecione o modelo" : "Selecione a marca primeiro"} />
                        </SelectTrigger>
                        <SelectContent className="bg-background border border-border z-50">
                          {availableModels.map((model) => (
                            <SelectItem key={model.value} value={model.value}>
                              {model.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {showCustomModel && (
                        <Input
                          value={editData.product_model || ""}
                          onChange={(e) =>
                            setEditData((prev) => ({
                              ...prev,
                              product_model: e.target.value,
                            }))
                          }
                          placeholder="Digite o modelo..."
                          className="bg-secondary/50 mt-2"
                        />
                      )}
                    </div>

                    {/* Nome completo (auto-gerado) */}
                    <div className="space-y-2">
                      <Label>Nome completo *</Label>
                      <Input
                        value={editData.product_name || ""}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            product_name: e.target.value,
                          }))
                        }
                        placeholder="Nike Air Force 1 Low White"
                        className="bg-secondary/50"
                      />
                      <p className="text-xs text-muted-foreground">
                        Gerado automaticamente a partir da marca, modelo e cor
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Tamanho Selector */}
                    <div className="space-y-2">
                      <Label>Tamanho *</Label>
                      <Select 
                        value={editData.product_size || ""} 
                        onValueChange={(value) => setEditData((prev) => ({ ...prev, product_size: value }))}
                      >
                        <SelectTrigger className="bg-secondary/50">
                          <SelectValue placeholder="Selecione o tamanho" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border border-border z-50">
                          {SHOE_SIZES.map((size) => (
                            <SelectItem key={size} value={size}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Cor/Colorway</Label>
                      <Input
                        value={editData.product_color || ""}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            product_color: e.target.value,
                          }))
                        }
                        placeholder="Branco, Preto/Vermelho..."
                        className="bg-secondary/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>SKU/Referência</Label>
                      <Input
                        value={editData.product_reference || ""}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            product_reference: e.target.value,
                          }))
                        }
                        placeholder="CW2288-111"
                        className="bg-secondary/50"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Link de Referência</Label>
                      <Input
                        type="url"
                        value={editData.product_link || ""}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            product_link: e.target.value,
                          }))
                        }
                        placeholder="https://..."
                        className="bg-secondary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Valor Total (R$) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editData.product_price || ""}
                        onChange={(e) => {
                          const price = parseFloat(e.target.value) || 0;
                          const halfPrice = price / 2;
                          setEditData((prev) => ({
                            ...prev,
                            product_price: price || null,
                            sinal_value: halfPrice || null,
                            balance_value: halfPrice || null,
                          }));
                        }}
                        placeholder="0,00"
                        className="bg-secondary/50"
                      />
                      <p className="text-xs text-muted-foreground">
                        Sinal e Saldo serão calculados automaticamente (50% cada)
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Marca</p>
                    <p className="font-medium">{order.product_brand || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Modelo</p>
                    <p className="font-medium">{order.product_model || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-medium">{order.product_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tamanho</p>
                    <p className="font-medium">{order.product_size || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cor</p>
                    <p className="font-medium">{order.product_color || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">SKU/Ref</p>
                    <p className="font-medium">{order.product_reference || "-"}</p>
                  </div>
                  {order.product_link && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground">Link</p>
                      <a 
                        href={order.product_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline truncate block"
                      >
                        {order.product_link}
                      </a>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                    <p className="font-medium text-primary text-lg">
                      {order.product_price
                        ? formatCurrency(order.product_price)
                        : "-"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isEditing && (
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 mb-4">
                  <p className="text-sm text-primary">
                    💡 Sinal = 50% do valor total | Saldo = 50% restante (pago na chegada)
                  </p>
                </div>
              )}
              {isEditing ? (
                <div className="space-y-4">
                  <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-sm text-primary">
                      💡 Os valores são calculados automaticamente: Sinal = 50% | Saldo = 50%
                    </p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-secondary/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">Sinal (50%)</p>
                      <p className="font-bold text-lg text-primary">
                        {editData.sinal_value
                          ? formatCurrency(editData.sinal_value)
                          : editData.product_price
                          ? formatCurrency(editData.product_price / 2)
                          : "-"}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {order.sinal_paid ? (
                          <Badge className="bg-success/20 text-success">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Pago
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Aguardando pagamento</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Status atualizado via confirmação de pagamento
                      </p>
                    </div>
                    <div className="p-4 bg-secondary/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">Saldo (50%)</p>
                      <p className="font-bold text-lg text-primary">
                        {editData.balance_value
                          ? formatCurrency(editData.balance_value)
                          : editData.product_price
                          ? formatCurrency(editData.product_price / 2)
                          : "-"}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {order.balance_paid ? (
                          <Badge className="bg-success/20 text-success">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Pago
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Aguardando pagamento</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Status atualizado via confirmação de pagamento
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-secondary/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Sinal (50%)</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-bold text-lg">
                        {order.sinal_value
                          ? formatCurrency(order.sinal_value)
                          : "-"}
                      </p>
                      {order.sinal_paid ? (
                        <Badge className="bg-success/20 text-success">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Pago
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Pendente</Badge>
                      )}
                    </div>
                  </div>
                  <div className="p-4 bg-secondary/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Saldo (50%)</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-bold text-lg">
                        {order.balance_value
                          ? formatCurrency(order.balance_value)
                          : "-"}
                      </p>
                      {order.balance_paid ? (
                        <Badge className="bg-success/20 text-success">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Pago
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Pendente</Badge>
                      )}
                    </div>
                  </div>
                  {order.balance_due_date && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground">
                        Vencimento do saldo
                      </p>
                      <p className="font-medium text-warning">
                        {formatDateTime(order.balance_due_date)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Logistics */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                Logística
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Rastreio Internacional</Label>
                    <Input
                      value={editData.international_tracking || ""}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          international_tracking: e.target.value,
                        }))
                      }
                      placeholder="Código de rastreio internacional"
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Transportadora Internacional</Label>
                    <Input
                      value={editData.international_carrier || ""}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          international_carrier: e.target.value,
                        }))
                      }
                      placeholder="Ex: DHL, FedEx, UPS..."
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rastreio Nacional</Label>
                    <Input
                      value={editData.national_tracking || ""}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          national_tracking: e.target.value,
                        }))
                      }
                      placeholder="Código de rastreio nacional"
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Transportadora Nacional</Label>
                    <Input
                      value={editData.national_carrier || ""}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          national_carrier: e.target.value,
                        }))
                      }
                      placeholder="Ex: Correios, Jadlog, Loggi..."
                      className="bg-secondary/50"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Rastreio Internacional
                    </p>
                    <p className="font-medium">
                      {order.international_tracking || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Transportadora Internacional
                    </p>
                    <p className="font-medium">
                      {order.international_carrier || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Rastreio Nacional
                    </p>
                    <p className="font-medium">
                      {order.national_tracking || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Transportadora Nacional
                    </p>
                    <p className="font-medium">
                      {order.national_carrier || "-"}
                    </p>
                  </div>
                  {order.sla_vault_due_date && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground">
                        Prazo VAULT 30
                      </p>
                      <p className="font-medium text-primary">
                        {formatDate(order.sla_vault_due_date)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle>Observações Internas</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={editData.internal_notes || ""}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      internal_notes: e.target.value,
                    }))
                  }
                  placeholder="Observações internas..."
                  className="bg-secondary/50"
                  rows={3}
                />
              ) : (
                <p className="text-muted-foreground">
                  {order.internal_notes || "Nenhuma observação."}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Budget and History */}
        <div className="space-y-6">
          {/* Budget Actions */}
          <BudgetActions
            orderId={order.order_id}
            orderType={order.order_type}
            budgetStatus={order.budget_status}
            budgetSentAt={order.budget_sent_at}
            budgetApprovedAt={order.budget_approved_at}
            budgetRejectedAt={order.budget_rejected_at}
            budgetExpiresAt={order.budget_expires_at}
            budgetApprovalToken={order.budget_approval_token}
            productPrice={order.product_price}
            sinalValue={order.sinal_value}
            balanceValue={order.balance_value}
            clientEmail={order.client_email}
            clientName={order.client_name}
            onUpdate={() => {
              // Refetch order data
              window.location.reload();
            }}
          />

          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Histórico
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Nenhum histórico registrado.
                </p>
              ) : (
                <div className="space-y-4">
                  {history.map((item, index) => (
                    <div
                      key={item.id}
                      className="relative pl-4 pb-4 border-l border-border last:pb-0"
                    >
                      <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-primary" />
                      <p className="font-medium text-sm">
                        {ORDER_STATUS_LABELS[item.status] || item.status}
                      </p>
                      {item.notes && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.notes}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateTime(item.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Danger zone */}
          <Card className="card-premium border-destructive/30">
            <CardHeader>
              <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir Pedido
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status change modal */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avançar Status</DialogTitle>
            <DialogDescription>
              Selecione o próximo status do pedido
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Novo status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {nextStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {ORDER_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observações (opcional)</Label>
              <Textarea
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Adicione uma nota sobre esta transição..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStatusModal(false)}
            >
              Cancelar
            </Button>
            <Button
              className="btn-gold"
              onClick={handleStatusChange}
              disabled={!newStatus || isSaving}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O pedido {order.order_id} será
              permanentemente removido do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrderDetail;
