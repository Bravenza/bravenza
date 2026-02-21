import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ClipboardList, Search, Eye, CheckCircle2, XCircle, ArrowRight, 
  User, MapPin, Package, ExternalLink, Loader2, Image, Clock, Gift
} from "lucide-react";
import { generateOrderId, cleanCPF } from "@/lib/constants";

interface OrderRequest {
  id: string;
  client_name: string;
  client_cpf: string;
  client_email: string;
  client_phone: string;
  address_cep: string;
  address_street: string;
  address_number: string;
  address_complement: string | null;
  address_neighborhood: string;
  address_city: string;
  address_state: string;
  shoe_size: string;
  product_brand: string | null;
  product_model: string | null;
  product_color: string | null;
  product_link: string | null;
  reference_image_url: string | null;
  additional_notes: string | null;
  referral_code: string | null;
  status: string;
  admin_notes: string | null;
  converted_order_id: string | null;
  created_at: string;
  reviewed_at: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "secondary" },
  reviewed: { label: "Analisado", variant: "outline" },
  converted: { label: "Convertido", variant: "default" },
  rejected: { label: "Rejeitado", variant: "destructive" },
};

export default function OrderRequestsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<OrderRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  // Fetch requests via RPC with server-side pagination
  const { data: rpcData, isLoading } = useQuery({
    queryKey: ["order-requests", searchTerm, page],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_order_requests" as any, {
        p_search: searchTerm,
        p_offset: page * PAGE_SIZE,
        p_limit: PAGE_SIZE,
      });
      
      if (error) throw error;
      return data as { total: number; pending_count: number; requests: OrderRequest[] };
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { error } = await supabase
        .from("order_requests")
        .update({ 
          status, 
          admin_notes: notes,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-requests"] });
      toast.success("Status atualizado com sucesso!");
      setIsDetailOpen(false);
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  // Convert to order mutation
  const convertToOrderMutation = useMutation({
    mutationFn: async (request: OrderRequest) => {
      const orderId = generateOrderId();
      const now = new Date();
      const slaDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Build full address
      const addressParts = [
        request.address_street,
        request.address_number ? `nº ${request.address_number}` : "",
        request.address_complement,
        request.address_neighborhood,
        `${request.address_city} - ${request.address_state}`,
        `CEP: ${request.address_cep}`,
      ].filter(Boolean).join(", ");

      // Build product name
      const productName = [
        request.product_brand,
        request.product_model,
        request.product_color,
      ].filter(Boolean).join(" ") || "Produto a definir";

      // Create order
      const { error: orderError } = await supabase
        .from("orders")
        .insert({
          order_id: orderId,
          order_type: "VAULT" as const,
          current_status: "REQUEST_RECEIVED" as const,
          client_name: request.client_name,
          client_cpf: cleanCPF(request.client_cpf),
          client_email: request.client_email,
          client_phone: request.client_phone,
          client_address: addressParts,
          product_brand: request.product_brand || null,
          product_model: request.product_model || null,
          product_name: productName,
          product_size: request.shoe_size,
          product_color: request.product_color || null,
          product_link: request.product_link || null,
          reference_image_url: request.reference_image_url || null,
          product_price: 0, // Admin will set price later
          sinal_value: 0,
          balance_value: 0,
          budget_status: "PENDING" as const,
          sla_vault_due_date: slaDate.toISOString().split("T")[0],
          internal_notes: request.additional_notes || null,
        });

      if (orderError) throw orderError;

      // Add initial history entry
      const { error: historyError } = await supabase
        .from("order_history")
        .insert({
          order_id: orderId,
          status: "REQUEST_RECEIVED" as const,
          notes: `Solicitação recebida de ${request.client_name}`,
        });

      if (historyError) throw historyError;

      // Process referral code if present - update referral with the referred_order_id
      if (request.referral_code) {
        const { error: referralError } = await supabase
          .from("referrals")
          .update({
            status: "converted",
            referred_cpf: cleanCPF(request.client_cpf),
            referred_name: request.client_name,
            referred_order_id: orderId,
          })
          .eq("referral_code", request.referral_code)
          .in("status", ["pending", "converted"]);

        if (referralError) {
          console.error("Error updating referral:", referralError);
          // Don't throw - order was created successfully
        }
      }

      // Update request status
      const { error: updateError } = await supabase
        .from("order_requests")
        .update({
          status: "converted",
          converted_order_id: orderId,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes || null,
        })
        .eq("id", request.id);

      if (updateError) throw updateError;

      return orderId;
    },
    onSuccess: (orderId) => {
      queryClient.invalidateQueries({ queryKey: ["order-requests"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Pedido criado com sucesso!");
      setIsDetailOpen(false);
      // Navigate to the new order to set the price
      navigate(`/admin/pedidos/${orderId}`);
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar pedido: ${error.message}`);
    },
  });

  const filteredRequests = rpcData?.requests || [];
  const pendingCount = rpcData?.pending_count || 0;
  const totalCount = rpcData?.total || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const openDetail = (request: OrderRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.admin_notes || "");
    setIsDetailOpen(true);
  };

  const handleMarkReviewed = () => {
    if (!selectedRequest) return;
    updateStatusMutation.mutate({ 
      id: selectedRequest.id, 
      status: "reviewed",
      notes: adminNotes 
    });
  };

  const handleReject = () => {
    if (!selectedRequest) return;
    updateStatusMutation.mutate({ 
      id: selectedRequest.id, 
      status: "rejected",
      notes: adminNotes 
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            Solicitações de Orçamento
            {pendingCount > 0 && (
              <Badge variant="default" className="ml-2">{pendingCount} novas</Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie as solicitações recebidas dos clientes
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, CPF, email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredRequests?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">Nenhuma solicitação encontrada</h3>
            <p className="text-muted-foreground mt-1">
              As novas solicitações aparecerão aqui
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRequests?.map((request) => (
            <Card key={request.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {request.reference_image_url ? (
                      <img 
                        src={request.reference_image_url} 
                        alt="Referência" 
                        className="w-16 h-16 object-cover rounded-lg border border-border"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{request.client_name}</h3>
                        <Badge variant={STATUS_CONFIG[request.status]?.variant || "secondary"}>
                          {STATUS_CONFIG[request.status]?.label || request.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {request.product_brand && request.product_model 
                          ? `${request.product_brand} ${request.product_model}` 
                          : "Produto não especificado"
                        }
                        {request.shoe_size && ` • Tam ${request.shoe_size}`}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(request.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openDetail(request)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} de {totalCount}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle>Detalhes da Solicitação</DialogTitle>
                <DialogDescription>
                  Recebida em {format(new Date(selectedRequest.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Reference Image */}
                {selectedRequest.reference_image_url && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Image className="h-4 w-4 text-primary" />
                      Imagem de Referência
                    </h4>
                    <img 
                      src={selectedRequest.reference_image_url} 
                      alt="Referência" 
                      className="w-full max-h-64 object-contain rounded-lg border border-border bg-muted"
                    />
                  </div>
                )}

                {/* Client Info */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Dados do Cliente
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Nome:</span> {selectedRequest.client_name}</div>
                    <div><span className="text-muted-foreground">CPF:</span> {selectedRequest.client_cpf}</div>
                    <div><span className="text-muted-foreground">Email:</span> {selectedRequest.client_email}</div>
                    <div><span className="text-muted-foreground">Telefone:</span> {selectedRequest.client_phone}</div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Endereço de Entrega
                  </h4>
                  <p className="text-sm">
                    {selectedRequest.address_street}, {selectedRequest.address_number}
                    {selectedRequest.address_complement && ` - ${selectedRequest.address_complement}`}
                    <br />
                    {selectedRequest.address_neighborhood}, {selectedRequest.address_city}/{selectedRequest.address_state}
                    <br />
                    CEP: {selectedRequest.address_cep}
                  </p>
                </div>

                {/* Product */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    Informações do Produto
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Tamanho:</span> {selectedRequest.shoe_size}</div>
                    <div><span className="text-muted-foreground">Marca:</span> {selectedRequest.product_brand || "-"}</div>
                    <div><span className="text-muted-foreground">Modelo:</span> {selectedRequest.product_model || "-"}</div>
                    <div><span className="text-muted-foreground">Cor:</span> {selectedRequest.product_color || "-"}</div>
                  </div>
                  {selectedRequest.product_link && (
                    <a 
                      href={selectedRequest.product_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Ver Link de Referência
                    </a>
                  )}
                </div>

                {/* Referral Code */}
                {selectedRequest.referral_code && (
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                    <h4 className="font-medium mb-1 flex items-center gap-2 text-primary">
                      <Gift className="h-4 w-4" />
                      Código de Indicação Utilizado
                    </h4>
                    <p className="text-sm font-mono font-semibold">{selectedRequest.referral_code}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ao criar o pedido, o indicador receberá o desconto automaticamente.
                    </p>
                  </div>
                )}

                {/* Notes */}
                {selectedRequest.additional_notes && (
                  <div>
                    <h4 className="font-medium mb-2">Observações do Cliente</h4>
                    <p className="text-sm bg-muted p-3 rounded-lg">{selectedRequest.additional_notes}</p>
                  </div>
                )}

                {/* Admin Notes */}
                <div>
                  <h4 className="font-medium mb-2">Notas do Admin</h4>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Adicione notas internas sobre esta solicitação..."
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                {selectedRequest.status === "pending" && (
                  <>
                    <Button 
                      variant="destructive" 
                      onClick={handleReject}
                      disabled={updateStatusMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeitar
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleMarkReviewed}
                      disabled={updateStatusMutation.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Marcar como Analisado
                    </Button>
                  </>
                )}
                <Button 
                  onClick={() => {
                    if (selectedRequest) {
                      convertToOrderMutation.mutate(selectedRequest);
                    }
                  }}
                  disabled={
                    selectedRequest.status === "converted" || 
                    selectedRequest.status === "rejected" ||
                    convertToOrderMutation.isPending
                  }
                >
                  {convertToOrderMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4 mr-2" />
                  )}
                  {selectedRequest.status === "converted" 
                    ? `Pedido: ${selectedRequest.converted_order_id}` 
                    : "Criar Pedido"
                  }
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}