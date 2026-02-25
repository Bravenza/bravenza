import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle, CheckCircle2, Clock, Loader2, Package,
  MessageCircle, DollarSign, XCircle, Scale,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const ORDERS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mkv2-order-ops`;
const FULFILL_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mkv2-fulfill`;

interface Dispute {
  id: string;
  order_code: string;
  buyer_cpf: string;
  buyer_name: string;
  seller_id: string;
  sale_price: number;
  fee_amount: number;
  seller_payout: number;
  status: string;
  dispute_status: string;
  dispute_reason: string | null;
  dispute_resolution: string | null;
  dispute_opened_at: string | null;
  dispute_resolved_at: string | null;
  admin_notes: string | null;
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

const disputeStatusConfig: Record<string, { label: string; color: string; icon: any }> = {
  open: { label: "Aberta", color: "bg-destructive/20 text-destructive", icon: AlertTriangle },
  resolved: { label: "Resolvida", color: "bg-success/20 text-success", icon: CheckCircle2 },
  closed: { label: "Fechada", color: "bg-muted text-muted-foreground", icon: XCircle },
};

export default function MarketplaceDisputesPage() {
  const { toast } = useToast();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [resolution, setResolution] = useState("refund_buyer");
  const [refundAmount, setRefundAmount] = useState("");
  const [resolveNotes, setResolveNotes] = useState("");

  // Chat
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatMsg, setChatMsg] = useState("");

  const fetchDisputes = async () => {
    setIsLoading(true);
    try {
      const { getMarketplaceHeaders } = await import("@/hooks/marketplace/api");
      const h = await getMarketplaceHeaders();
      const res = await fetch(`${ORDERS_URL}?action=admin-disputes`, { headers: h });
      const data = await res.json();
      let list = data.disputes || [];
      if (filter === "open") list = list.filter((d: Dispute) => d.dispute_status === "open");
      else if (filter === "resolved") list = list.filter((d: Dispute) => d.dispute_status === "resolved");
      setDisputes(list);
    } catch (err) {
      console.error("Fetch disputes error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDisputes(); }, [filter]);

  const fetchChat = async (orderId: string) => {
    try {
      const { getMarketplaceHeaders } = await import("@/hooks/marketplace/api");
      const h = await getMarketplaceHeaders();
      const res = await fetch(`${FULFILL_URL}?action=chat-messages&order_id=${orderId}`, { headers: h });
      const data = await res.json();
      setChatMessages(data.messages || []);
    } catch (err) { console.error(err); }
  };

  const sendAdminMsg = async () => {
    if (!selectedDispute || !chatMsg.trim()) return;
    try {
      const { getMarketplaceHeaders } = await import("@/hooks/marketplace/api");
      const h = await getMarketplaceHeaders();
      await fetch(`${FULFILL_URL}?action=send-message`, {
        method: "POST",
        headers: h,
        body: JSON.stringify({ order_id: selectedDispute.id, sender_name: "Admin Bravenza", message: chatMsg.trim(), is_admin: true }),
      });
      setChatMsg("");
      fetchChat(selectedDispute.id);
    } catch (err) { console.error(err); }
  };

  const resolveDispute = async () => {
    if (!selectedDispute) return;
    setActionLoading(true);
    try {
      const { getMarketplaceHeaders } = await import("@/hooks/marketplace/api");
      const h = await getMarketplaceHeaders();
      const res = await fetch(`${FULFILL_URL}?action=resolve-dispute`, {
        method: "PUT",
        headers: h,
        body: JSON.stringify({
          order_id: selectedDispute.id,
          resolution,
          refund_amount: refundAmount ? parseFloat(refundAmount) : 0,
          admin_notes: resolveNotes,
        }),
      });
      if (!res.ok) throw new Error("Erro ao resolver disputa");
      toast({ title: "Disputa resolvida!" });
      setResolveOpen(false);
      setDetailOpen(false);
      fetchDisputes();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const openCount = disputes.filter(d => d.dispute_status === "open").length;
  const resolvedCount = disputes.filter(d => d.dispute_status === "resolved").length;
  const totalValue = disputes.filter(d => d.dispute_status === "open").reduce((s, d) => s + d.sale_price, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Scale className="h-6 w-6 text-primary" />
          Gestão de Disputas
        </h1>
        <p className="text-muted-foreground">Resolva contestações entre compradores e vendedores</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-premium">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{disputes.length}</p>
            <p className="text-xs text-muted-foreground">Total disputas</p>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-4 text-center">
            <p className={`text-2xl font-bold ${openCount > 0 ? "text-destructive" : "text-success"}`}>{openCount}</p>
            <p className="text-xs text-muted-foreground">Abertas</p>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">{resolvedCount}</p>
            <p className="text-xs text-muted-foreground">Resolvidas</p>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-warning">
              R$ {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">Valor em disputa</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          <SelectItem value="open">Abertas</SelectItem>
          <SelectItem value="resolved">Resolvidas</SelectItem>
        </SelectContent>
      </Select>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : disputes.length === 0 ? (
        <Card className="card-premium">
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-success mb-4 opacity-40" />
            <p className="font-medium">Nenhuma disputa encontrada</p>
            <p className="text-sm text-muted-foreground">Tudo tranquilo por aqui 🎉</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {disputes.map((d, i) => {
            const st = disputeStatusConfig[d.dispute_status] || disputeStatusConfig.open;
            const StIcon = st.icon;
            const daysOpen = d.dispute_opened_at
              ? Math.floor((Date.now() - new Date(d.dispute_opened_at).getTime()) / (1000 * 60 * 60 * 24))
              : 0;
            return (
              <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                <Card
                  className={`card-premium cursor-pointer hover:border-primary/40 transition-colors ${d.dispute_status === "open" && daysOpen > 3 ? "border-destructive/40" : ""}`}
                  onClick={() => { setSelectedDispute(d); setDetailOpen(true); fetchChat(d.id); }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {d.listing?.photos?.[0] && <img src={d.listing.photos[0]} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
                        <div className="min-w-0">
                          <p className="font-medium text-sm line-clamp-1">{d.listing?.title}</p>
                          <p className="text-xs text-muted-foreground">{d.order_code} · {d.buyer_name}</p>
                          {d.dispute_reason && <p className="text-xs text-destructive line-clamp-1 mt-0.5">{d.dispute_reason}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {d.dispute_status === "open" && daysOpen > 3 && (
                          <Badge variant="outline" className="border-destructive/50 text-destructive text-[10px]">
                            {daysOpen}d aberta
                          </Badge>
                        )}
                        <div className="text-right hidden sm:block">
                          <p className="font-bold text-sm">R$ {d.sale_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                        </div>
                        <Badge className={`${st.color} text-xs gap-1`}><StIcon className="h-3 w-3" />{st.label}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {selectedDispute && (
            <div className="space-y-5">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {selectedDispute.order_code}
                  <Badge className={`${(disputeStatusConfig[selectedDispute.dispute_status] || disputeStatusConfig.open).color} text-xs`}>
                    {(disputeStatusConfig[selectedDispute.dispute_status] || disputeStatusConfig.open).label}
                  </Badge>
                </SheetTitle>
              </SheetHeader>

              {/* Product */}
              <div className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                {selectedDispute.listing?.photos?.[0] && <img src={selectedDispute.listing.photos[0]} alt="" className="w-16 h-16 rounded-lg object-cover" />}
                <div>
                  <p className="font-medium text-sm">{selectedDispute.listing?.title}</p>
                  <p className="text-xs text-muted-foreground">{selectedDispute.listing?.brand} · Tam. {selectedDispute.listing?.size}</p>
                </div>
              </div>

              {/* Dispute info */}
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg space-y-2 text-sm">
                <p className="font-medium text-destructive flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Motivo da disputa</p>
                <p className="text-muted-foreground">{selectedDispute.dispute_reason || "Não informado"}</p>
                {selectedDispute.dispute_opened_at && (
                  <p className="text-xs text-muted-foreground">Aberta em: {new Date(selectedDispute.dispute_opened_at).toLocaleString("pt-BR")}</p>
                )}
                {selectedDispute.dispute_resolution && (
                  <div className="mt-2 p-2 bg-success/10 rounded text-success text-xs">
                    <p className="font-medium">Resolução: {selectedDispute.dispute_resolution}</p>
                    {selectedDispute.dispute_resolved_at && <p>Em: {new Date(selectedDispute.dispute_resolved_at).toLocaleString("pt-BR")}</p>}
                  </div>
                )}
              </div>

              <Separator />

              {/* Financial */}
              <div className="space-y-2 text-sm">
                <p className="font-medium">Financeiro</p>
                <div className="flex justify-between"><span className="text-muted-foreground">Valor da venda</span><span className="font-medium">R$ {selectedDispute.sale_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between text-primary"><span>Comissão</span><span>R$ {selectedDispute.fee_amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between font-bold"><span>Repasse vendedor</span><span>R$ {selectedDispute.seller_payout.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
              </div>

              <Separator />

              {/* Chat Timeline */}
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-1"><MessageCircle className="h-4 w-4" /> Mensagens ({chatMessages.length})</p>
                <div className="max-h-48 overflow-y-auto space-y-2 p-2 bg-muted/20 rounded-lg">
                  {chatMessages.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Sem mensagens</p>
                  ) : chatMessages.map((msg: any) => (
                    <div key={msg.id} className={`text-xs p-2 rounded-lg ${msg.is_admin ? "bg-primary/10 text-primary" : "bg-card"}`}>
                      <span className="font-medium">{msg.sender_name}</span>
                      <span className="text-muted-foreground ml-2">{new Date(msg.created_at).toLocaleString("pt-BR")}</span>
                      <p className="mt-0.5">{msg.message}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Mensagem como Admin..." value={chatMsg} onChange={(e) => setChatMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendAdminMsg()} />
                  <Button size="sm" onClick={sendAdminMsg} disabled={!chatMsg.trim()}>Enviar</Button>
                </div>
              </div>

              <Separator />

              {/* Actions */}
              {selectedDispute.dispute_status === "open" && (
                <Button className="w-full gap-2 btn-gold" onClick={() => { setResolution("refund_buyer"); setRefundAmount(""); setResolveNotes(""); setResolveOpen(true); }}>
                  <Scale className="h-4 w-4" /> Resolver Disputa
                </Button>
              )}

              {selectedDispute.admin_notes && (
                <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
                  <span className="font-medium">Notas admin:</span> {selectedDispute.admin_notes}
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Resolve Dialog */}
      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Resolver Disputa</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Resolução</label>
              <Select value={resolution} onValueChange={setResolution}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="refund_buyer">Reembolso total ao comprador</SelectItem>
                  <SelectItem value="partial_refund">Reembolso parcial</SelectItem>
                  <SelectItem value="release_seller">Liberar pagamento ao vendedor</SelectItem>
                  <SelectItem value="cancel">Cancelar pedido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {resolution === "partial_refund" && (
              <div>
                <label className="text-sm font-medium">Valor do reembolso (R$)</label>
                <Input type="number" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} placeholder="0.00" />
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Notas</label>
              <Textarea value={resolveNotes} onChange={(e) => setResolveNotes(e.target.value)} placeholder="Detalhes da resolução..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveOpen(false)}>Cancelar</Button>
            <Button className="btn-gold" disabled={actionLoading} onClick={resolveDispute}>
              Confirmar Resolução
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
