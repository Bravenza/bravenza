import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck, Package, Clock, CheckCircle2, XCircle, AlertTriangle,
  Loader2, Camera, Eye, ChevronRight, Search, FileText, Upload,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mkv2-fulfill`;

async function getHeaders() {
  const { getMarketplaceHeaders } = await import("@/hooks/marketplace/api");
  return getMarketplaceHeaders();
}

interface HubOrder {
  id: string;
  order_code: string;
  buyer_name: string;
  buyer_cpf: string;
  buyer_address: string | null;
  sale_price: number;
  shipping_mode: string;
  status: string;
  hub_tracking_code: string | null;
  hub_received_at: string | null;
  hub_shipped_at: string | null;
  hub_tracking_to_buyer: string | null;
  inspection_id: string | null;
  inspection_result: string | null;
  created_at: string;
  listing?: {
    title: string;
    brand: string | null;
    model: string | null;
    size: string | null;
    photos: string[];
    condition: string;
  };
}

interface Inspection {
  id: string;
  order_id: string;
  status: string;
  result: string | null;
  checklist: Record<string, boolean> | null;
  inspection_photos: string[] | null;
  notes: string | null;
  rejection_reason: string | null;
  received_at: string | null;
  inspected_at: string | null;
}

const hubStatusConfig: Record<string, { label: string; color: string; icon: any }> = {
  paid: { label: "Aguardando envio ao Hub", color: "bg-warning/20 text-warning", icon: Clock },
  ship_to_hub_pending: { label: "Aguardando envio ao Hub", color: "bg-warning/20 text-warning", icon: Clock },
  in_transit_to_hub: { label: "Em trânsito → Hub", color: "bg-purple-500/20 text-purple-400", icon: Package },
  hub_received: { label: "Recebido no Hub", color: "bg-blue-500/20 text-blue-400", icon: CheckCircle2 },
  inspection_pending: { label: "Em inspeção", color: "bg-amber-500/20 text-amber-400", icon: Search },
  inspection_approved: { label: "Autêntico ✓", color: "bg-success/20 text-success", icon: CheckCircle2 },
  inspection_rejected: { label: "Réplica ✗", color: "bg-destructive/20 text-destructive", icon: XCircle },
  ship_to_buyer_pending: { label: "Pronto p/ envio", color: "bg-blue-500/20 text-blue-400", icon: Package },
  in_transit_to_buyer: { label: "Em trânsito → Comprador", color: "bg-purple-500/20 text-purple-400", icon: Package },
  delivered: { label: "Entregue", color: "bg-success/20 text-success", icon: CheckCircle2 },
  completed: { label: "Concluído", color: "bg-success/20 text-success", icon: CheckCircle2 },
};

const DEFAULT_CHECKLIST = {
  box_labels: false,
  stitching_finish: false,
  materials_print: false,
  inside_label: false,
  insole_sole: false,
  overall_condition: false,
};

const CHECKLIST_LABELS: Record<string, string> = {
  box_labels: "Caixa e etiquetas conferidas",
  stitching_finish: "Costuras e acabamento OK",
  materials_print: "Materiais e impressão OK",
  inside_label: "Inside label / box label conferidos",
  insole_sole: "Palmilha e solado conferidos",
  overall_condition: "Condição geral compatível com anúncio",
};

export default function MarketplaceInspectionPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<HubOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<HubOrder | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");

  // Inspection form
  const [checklist, setChecklist] = useState<Record<string, boolean>>({ ...DEFAULT_CHECKLIST });
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [inspectDialogOpen, setInspectDialogOpen] = useState(false);
  const [inspectionPhotos, setInspectionPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [buyerTrackingCode, setBuyerTrackingCode] = useState("");

  const fetchHubOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ action: "hub-orders" });
      const h = await getHeaders();
      const res = await fetch(`${FUNCTION_URL}?${params}`, { headers: h });
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error("Fetch hub orders error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchHubOrders(); }, [fetchHubOrders]);

  const updateHubStatus = async (orderId: string, status: string, extra?: Record<string, any>) => {
    setActionLoading(true);
    try {
      const h = await getHeaders();
      const res = await fetch(`${FUNCTION_URL}?action=hub-update-status`, {
        method: "PUT",
        headers: h,
        body: JSON.stringify({ order_id: orderId, status, ...extra }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar");
      toast({ title: "Status atualizado!" });
      fetchHubOrders();
      setDetailOpen(false);
    } catch (err) {
      toast({ title: "Erro", description: err instanceof Error ? err.message : "Erro ao atualizar", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const submitInspection = async (result: "approved" | "rejected") => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      const h = await getHeaders();
      const res = await fetch(`${FUNCTION_URL}?action=hub-inspect`, {
        method: "POST",
        headers: h,
        body: JSON.stringify({
          order_id: selectedOrder.id,
          result,
          checklist,
          notes: inspectionNotes,
          rejection_reason: result === "rejected" ? rejectionReason : null,
          inspection_photos: inspectionPhotos.length > 0 ? inspectionPhotos : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erro na inspeção");
      }
      const data = await res.json();
      if (result === "approved" && data.laudo_id) {
        toast({ title: `Autêntico! ✓`, description: `Laudo: ${data.laudo_id}` });
      } else {
        toast({ title: result === "approved" ? "Autêntico! ✓" : "Réplica identificada" });
      }
      setInspectDialogOpen(false);
      fetchHubOrders();
      setDetailOpen(false);
    } catch (err) {
      toast({ title: "Erro", description: err instanceof Error ? err.message : "Erro na inspeção", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const openInspectionForm = (order: HubOrder) => {
    setChecklist({ ...DEFAULT_CHECKLIST });
    setInspectionNotes("");
    setRejectionReason("");
    setInspectionPhotos([]);
    setInspectDialogOpen(true);
  };

  const pendingOrders = orders.filter(o => ["paid", "ship_to_hub_pending", "in_transit_to_hub"].includes(o.status));
  const atHubOrders = orders.filter(o => ["hub_received", "inspection_pending"].includes(o.status));
  const inspectedOrders = orders.filter(o => ["inspection_approved", "inspection_rejected", "ship_to_buyer_pending", "in_transit_to_buyer", "delivered", "completed"].includes(o.status));

  const getTabOrders = () => {
    if (activeTab === "pending") return pendingOrders;
    if (activeTab === "hub") return atHubOrders;
    return inspectedOrders;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          Hub PRO — Inspeções
        </h1>
        <p className="text-muted-foreground">Gerencie o fluxo de autenticação e envio do Hub Porto Alegre</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-premium">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-warning">{pendingOrders.length}</p>
            <p className="text-xs text-muted-foreground">Em trânsito → Hub</p>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{atHubOrders.length}</p>
            <p className="text-xs text-muted-foreground">No Hub (inspeção)</p>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">{inspectedOrders.filter(o => o.inspection_result === "approved").length}</p>
            <p className="text-xs text-muted-foreground">Autênticos</p>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{inspectedOrders.filter(o => o.inspection_result === "rejected").length}</p>
            <p className="text-xs text-muted-foreground">Réplicas</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">Em trânsito ({pendingOrders.length})</TabsTrigger>
          <TabsTrigger value="hub">No Hub ({atHubOrders.length})</TabsTrigger>
          <TabsTrigger value="done">Inspecionados ({inspectedOrders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : getTabOrders().length === 0 ? (
            <Card className="card-premium">
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-30" />
                <p className="font-medium">Nenhum pedido nesta fila</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {getTabOrders().map((order, i) => {
                const st = hubStatusConfig[order.status] || hubStatusConfig.paid;
                const StIcon = st.icon;
                return (
                  <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                    <Card
                      className="card-premium cursor-pointer hover:border-primary/40 transition-colors"
                      onClick={() => { setSelectedOrder(order); setDetailOpen(true); }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            {order.listing?.photos?.[0] && (
                              <img src={order.listing.photos[0]} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-sm line-clamp-1">{order.listing?.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {order.order_code} · {order.listing?.brand} · Tam. {order.listing?.size}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <p className="font-bold text-sm hidden sm:block">
                              R$ {order.sale_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </p>
                            <Badge className={`${st.color} text-xs gap-1`}>
                              <StIcon className="h-3 w-3" /> {st.label}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {selectedOrder && (() => {
            const st = hubStatusConfig[selectedOrder.status] || hubStatusConfig.paid;
            const StIcon = st.icon;
            return (
              <div className="space-y-5">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    {selectedOrder.order_code}
                    <Badge className={`${st.color} text-xs gap-1`}><StIcon className="h-3 w-3" />{st.label}</Badge>
                  </SheetTitle>
                </SheetHeader>

                {/* Product */}
                <div className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                  {selectedOrder.listing?.photos?.[0] && (
                    <img src={selectedOrder.listing.photos[0]} alt="" className="w-16 h-16 rounded-lg object-cover" />
                  )}
                  <div>
                    <p className="font-medium text-sm">{selectedOrder.listing?.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedOrder.listing?.brand} · {selectedOrder.listing?.model} · Tam. {selectedOrder.listing?.size} · {selectedOrder.listing?.condition}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Buyer */}
                <div className="text-sm space-y-1">
                  <p className="font-medium">Comprador</p>
                  <p>{selectedOrder.buyer_name}</p>
                  {selectedOrder.buyer_address && <p className="text-muted-foreground text-xs">{selectedOrder.buyer_address}</p>}
                </div>

                <Separator />

                {/* Hub Timeline */}
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="font-medium text-sm text-foreground">Timeline do Hub</p>
                  <p>📋 Pedido criado: {new Date(selectedOrder.created_at).toLocaleString("pt-BR")}</p>
                  {selectedOrder.hub_tracking_code && <p>📦 Rastreio → Hub: <span className="font-mono">{selectedOrder.hub_tracking_code}</span></p>}
                  {selectedOrder.hub_received_at && <p>✅ Recebido no Hub: {new Date(selectedOrder.hub_received_at).toLocaleString("pt-BR")}</p>}
                  {selectedOrder.inspection_result && (
                    <p>{selectedOrder.inspection_result === "approved" ? "✅" : "❌"} Inspeção: {selectedOrder.inspection_result === "approved" ? "Autêntico" : "Réplica"}
                    {(selectedOrder as any).laudo_id && <span className="ml-1 font-mono text-primary">· Laudo: {(selectedOrder as any).laudo_id}</span>}
                    </p>
                  )}
                  {selectedOrder.hub_tracking_to_buyer && <p>📦 Rastreio → Comprador: <span className="font-mono">{selectedOrder.hub_tracking_to_buyer}</span></p>}
                  {selectedOrder.hub_shipped_at && <p>🚀 Enviado ao comprador: {new Date(selectedOrder.hub_shipped_at).toLocaleString("pt-BR")}</p>}
                </div>

                <Separator />

                {/* Actions based on status */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Ações</p>

                  {/* Mark received at hub */}
                  {["paid", "ship_to_hub_pending", "in_transit_to_hub"].includes(selectedOrder.status) && (
                    <Button
                      className="w-full gap-2"
                      disabled={actionLoading}
                      onClick={() => updateHubStatus(selectedOrder.id, "hub_received")}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Confirmar recebimento no Hub
                    </Button>
                  )}

                  {/* Start inspection */}
                  {selectedOrder.status === "hub_received" && (
                    <Button
                      className="w-full gap-2 btn-gold"
                      disabled={actionLoading}
                      onClick={() => {
                        openInspectionForm(selectedOrder);
                      }}
                    >
                      <Search className="h-4 w-4" /> Iniciar inspeção
                    </Button>
                  )}

                  {/* Ship to buyer (after approval) */}
                  {["inspection_approved", "ship_to_buyer_pending"].includes(selectedOrder.status) && (
                    <div className="space-y-2">
                      <Input
                        placeholder="Código de rastreio → Comprador"
                        value={buyerTrackingCode}
                        onChange={(e) => setBuyerTrackingCode(e.target.value)}
                      />
                      <Button
                        className="w-full gap-2 btn-gold"
                        disabled={actionLoading || !buyerTrackingCode.trim()}
                        onClick={() => {
                          updateHubStatus(selectedOrder.id, "in_transit_to_buyer", {
                            hub_tracking_to_buyer: buyerTrackingCode.trim(),
                          });
                          setBuyerTrackingCode("");
                        }}
                      >
                        <Package className="h-4 w-4" /> Enviar ao comprador
                      </Button>
                    </div>
                  )}

                  {/* Rejection: refund */}
                  {selectedOrder.status === "inspection_rejected" && (
                    <div className="space-y-2">
                      <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm space-y-1">
                        <p className="font-medium text-destructive flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4" /> Item classificado como réplica
                        </p>
                        <p className="text-xs text-muted-foreground">
                          O comprador será reembolsado e o anúncio reativado. O vendedor será notificado para retirar o item.
                        </p>
                      </div>
                      <Button
                        className="w-full gap-2"
                        variant="destructive"
                        disabled={actionLoading}
                        onClick={() => updateHubStatus(selectedOrder.id, "cancelled", {
                          refund_amount: selectedOrder.sale_price,
                        })}
                      >
                        <XCircle className="h-4 w-4" /> Processar reembolso (R$ {selectedOrder.sale_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* Inspection Dialog */}
      <Dialog open={inspectDialogOpen} onOpenChange={setInspectDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Inspeção PRO
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Product info */}
            {selectedOrder?.listing && (
              <div className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                {selectedOrder.listing.photos?.[0] && (
                  <img src={selectedOrder.listing.photos[0]} alt="" className="w-14 h-14 rounded-lg object-cover" />
                )}
                <div>
                  <p className="font-medium text-sm">{selectedOrder.listing.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedOrder.listing.brand} · Tam. {selectedOrder.listing.size} · {selectedOrder.listing.condition}
                  </p>
                </div>
              </div>
            )}

            <Separator />

            {/* Checklist */}
            <div className="space-y-3">
              <p className="text-sm font-semibold">Checklist de autenticação</p>
              {Object.entries(CHECKLIST_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center gap-3">
                  <Checkbox
                    id={key}
                    checked={checklist[key] || false}
                    onCheckedChange={(v) => setChecklist(prev => ({ ...prev, [key]: !!v }))}
                  />
                  <Label htmlFor={key} className="text-sm cursor-pointer">{label}</Label>
                </div>
              ))}
            </div>

            <Separator />

            {/* Inspection Photos */}
            <div>
              <Label className="text-sm font-medium flex items-center gap-1">
                <Camera className="h-3.5 w-3.5" /> Fotos da inspeção
              </Label>
              <div className="mt-1.5 space-y-2">
                <div className="flex gap-2">
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-border rounded-lg hover:border-primary/50 transition text-sm text-muted-foreground">
                      <Upload className="h-4 w-4" />
                      {uploadingPhoto ? "Enviando..." : "Fazer upload de foto"}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      disabled={uploadingPhoto}
                      onChange={async (e) => {
                        const files = e.target.files;
                        if (!files || files.length === 0) return;
                        setUploadingPhoto(true);
                        try {
                          for (const file of Array.from(files)) {
                            const ext = file.name.split(".").pop() || "jpg";
                            const path = `${selectedOrder?.id || "unknown"}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
                            const { error: upErr } = await supabase.storage.from("inspection-photos").upload(path, file);
                            if (upErr) throw upErr;
                            const { data: pubData } = supabase.storage.from("inspection-photos").getPublicUrl(path);
                            if (pubData?.publicUrl) {
                              setInspectionPhotos(prev => [...prev, pubData.publicUrl]);
                            }
                          }
                          toast({ title: "Fotos enviadas!" });
                        } catch (err: any) {
                          toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
                        } finally {
                          setUploadingPhoto(false);
                          e.target.value = "";
                        }
                      }}
                    />
                  </label>
                </div>
                {inspectionPhotos.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {inspectionPhotos.map((url, i) => (
                      <div key={i} className="relative group">
                        <img src={url} alt={`Foto ${i + 1}`} className="w-14 h-14 rounded-lg object-cover border border-border/50" />
                        <button
                          onClick={() => setInspectionPhotos(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute -top-1 -right-1 bg-destructive text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground">{inspectionPhotos.length} foto(s) adicionada(s)</p>
              </div>
            </div>

            <Separator />

            {/* Notes */}
            <div>
              <Label className="text-sm font-medium">Observações</Label>
              <Textarea
                value={inspectionNotes}
                onChange={(e) => setInspectionNotes(e.target.value)}
                placeholder="Detalhes da inspeção..."
                rows={3}
                className="mt-1"
              />
            </div>

            {/* Rejection reason */}
            <div>
              <Label className="text-sm font-medium">Motivo de reprovação (se aplicável)</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Descreva o motivo..."
                rows={2}
                className="mt-1"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="destructive"
                className="flex-1 gap-1"
                disabled={actionLoading || !rejectionReason.trim()}
                onClick={() => submitInspection("rejected")}
              >
                <XCircle className="h-4 w-4" /> Reprovar
              </Button>
              <Button
                className="flex-1 gap-1 btn-gold"
                disabled={actionLoading || Object.values(checklist).filter(Boolean).length < 4}
                onClick={() => submitInspection("approved")}
              >
                <CheckCircle2 className="h-4 w-4" /> Aprovar
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground text-center">
              Mínimo 4 itens do checklist para aprovar. Motivo obrigatório para reprovar.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
