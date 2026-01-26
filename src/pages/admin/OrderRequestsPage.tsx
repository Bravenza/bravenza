import { useState } from "react";
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
  User, MapPin, Package, ExternalLink, Loader2, Image, Clock
} from "lucide-react";

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
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<OrderRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  // Fetch requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ["order-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_requests")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as OrderRequest[];
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

  // Filter requests
  const filteredRequests = requests?.filter(req => {
    const search = searchTerm.toLowerCase();
    return (
      req.client_name.toLowerCase().includes(search) ||
      req.client_cpf.includes(search) ||
      req.client_email.toLowerCase().includes(search) ||
      req.product_brand?.toLowerCase().includes(search) ||
      req.product_model?.toLowerCase().includes(search)
    );
  });

  const pendingCount = requests?.filter(r => r.status === "pending").length || 0;

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
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="h-8 w-8" />
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
                    // TODO: Navigate to create order page with pre-filled data
                    toast.info("Funcionalidade de conversão será implementada em breve!");
                  }}
                  disabled={selectedRequest.status === "converted" || selectedRequest.status === "rejected"}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Criar Pedido
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}