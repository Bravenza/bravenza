import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Eye,
  Loader2, Package, Flag, ThumbsUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mkv2-discover`;

interface ModerationOffer {
  id: string;
  price: number;
  size: string;
  condition: string;
  description: string | null;
  photos: string[] | null;
  status: string;
  created_at: string;
  views_count: number;
  has_receipt: boolean;
  defects: string | null;
  product?: {
    brand: string;
    model: string;
    images: string[] | null;
  };
  seller?: {
    id: string;
    plan_id: string | null;
    kyc_status: string | null;
    member?: {
      client_name: string;
      client_cpf: string;
    };
  };
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending_review: { label: "Pendente", color: "bg-warning/20 text-warning" },
  active: { label: "Ativo", color: "bg-success/20 text-success" },
  rejected: { label: "Rejeitado", color: "bg-destructive/20 text-destructive" },
  flagged: { label: "Sinalizado", color: "bg-warning/20 text-warning" },
  sold: { label: "Vendido", color: "bg-primary/20 text-primary" },
  draft: { label: "Rascunho", color: "bg-muted text-muted-foreground" },
};

export default function MarketplaceModerationPage() {
  const { toast } = useToast();
  const [offers, setOffers] = useState<ModerationOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending_review");
  const [selectedOffer, setSelectedOffer] = useState<ModerationOffer | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const fetchOffers = async () => {
    setIsLoading(true);
    try {
      const { getMarketplaceHeaders } = await import("@/hooks/marketplace/api");
      const h = await getMarketplaceHeaders();
      const params = new URLSearchParams({ action: "admin-pending-offers", status: statusFilter });
      const res = await fetch(`${FUNCTION_URL}?${params}`, { headers: h });
      const data = await res.json();
      setOffers(data.offers || []);
    } catch (err) {
      console.error("Fetch moderation offers error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchOffers(); }, [statusFilter]);

  const moderateOffer = async (offerId: string, action: string, reason?: string) => {
    setActionLoading(true);
    try {
      const { getMarketplaceHeaders } = await import("@/hooks/marketplace/api");
      const h = await getMarketplaceHeaders();
      const res = await fetch(`${FUNCTION_URL}?action=admin-moderate-offer`, {
        method: "PUT",
        headers: h,
        body: JSON.stringify({ offer_id: offerId, action, reason }),
      });
      if (!res.ok) throw new Error("Erro ao moderar");
      const label = action === "approve" ? "aprovado" : action === "reject" ? "rejeitado" : "sinalizado";
      toast({ title: `Anúncio ${label}!` });
      fetchOffers();
      setDetailOpen(false);
      setRejectOpen(false);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = offers.filter(o => o.status === "pending_review").length;
  const flaggedCount = offers.filter(o => o.status === "flagged").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          Moderação de Anúncios
        </h1>
        <p className="text-muted-foreground">Aprove, rejeite ou sinalize ofertas de vendedores</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-premium">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{offers.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-warning">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-warning">{flaggedCount}</p>
            <p className="text-xs text-muted-foreground">Sinalizados</p>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">{offers.filter(o => o.status === "active").length}</p>
            <p className="text-xs text-muted-foreground">Aprovados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-52"><SelectValue placeholder="Filtrar" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="pending_review">Pendentes</SelectItem>
          <SelectItem value="flagged">Sinalizados</SelectItem>
          <SelectItem value="active">Aprovados</SelectItem>
          <SelectItem value="rejected">Rejeitados</SelectItem>
          <SelectItem value="all">Todos</SelectItem>
        </SelectContent>
      </Select>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : offers.length === 0 ? (
        <Card className="card-premium">
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-30" />
            <p className="font-medium">Nenhuma oferta nesta fila</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {offers.map((offer, i) => {
            const st = statusConfig[offer.status] || statusConfig.pending_review;
            const img = offer.photos?.[0] || offer.product?.images?.[0];
            return (
              <motion.div key={offer.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                <Card
                  className="card-premium cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => { setSelectedOffer(offer); setDetailOpen(true); }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {img && <img src={img} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
                        <div className="min-w-0">
                          <p className="font-medium text-sm line-clamp-1">
                            {offer.product?.brand} {offer.product?.model} — Tam. {offer.size}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {offer.seller?.member?.client_name} · {offer.condition} · {new Date(offer.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <p className="font-bold text-sm hidden sm:block">
                          R$ {offer.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                        <Badge className={`${st.color} text-xs`}>{st.label}</Badge>
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
          {selectedOffer && (
            <div className="space-y-5">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  Revisão de Anúncio
                  <Badge className={`${(statusConfig[selectedOffer.status] || statusConfig.pending_review).color} text-xs`}>
                    {(statusConfig[selectedOffer.status] || statusConfig.pending_review).label}
                  </Badge>
                </SheetTitle>
              </SheetHeader>

              {/* Photos */}
              {(selectedOffer.photos?.length || 0) > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {selectedOffer.photos!.map((url, i) => (
                    <img key={i} src={url} alt="" className="rounded-lg object-cover aspect-square w-full" />
                  ))}
                </div>
              )}

              {/* Product Info */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Produto</span><span className="font-medium">{selectedOffer.product?.brand} {selectedOffer.product?.model}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tamanho</span><span>{selectedOffer.size}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Condição</span><span>{selectedOffer.condition}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Preço</span><span className="font-bold">R$ {selectedOffer.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Nota fiscal</span><span>{selectedOffer.has_receipt ? "✅ Sim" : "❌ Não"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Views</span><span>{selectedOffer.views_count}</span></div>
              </div>

              {selectedOffer.description && (
                <>
                  <Separator />
                  <div className="text-sm">
                    <p className="font-medium mb-1">Descrição</p>
                    <p className="text-muted-foreground">{selectedOffer.description}</p>
                  </div>
                </>
              )}

              {selectedOffer.defects && (
                <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg text-sm">
                  <p className="font-medium text-warning flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Defeitos declarados</p>
                  <p className="text-muted-foreground mt-1">{selectedOffer.defects}</p>
                </div>
              )}

              <Separator />

              {/* Seller Info */}
              <div className="text-sm space-y-1">
                <p className="font-medium">Vendedor</p>
                <p>{selectedOffer.seller?.member?.client_name}</p>
                <p className="text-muted-foreground">Plano: {selectedOffer.seller?.plan_id || "free"} · KYC: {selectedOffer.seller?.kyc_status || "—"}</p>
              </div>

              <Separator />

              {/* Actions */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Ações de Moderação</p>
                {selectedOffer.status !== "active" && (
                  <Button
                    className="w-full gap-2 bg-success hover:bg-success/90"
                    disabled={actionLoading}
                    onClick={() => moderateOffer(selectedOffer.id, "approve")}
                  >
                    <ThumbsUp className="h-4 w-4" /> Aprovar
                  </Button>
                )}
                {selectedOffer.status !== "rejected" && (
                  <Button
                    variant="destructive"
                    className="w-full gap-2"
                    disabled={actionLoading}
                    onClick={() => { setRejectReason(""); setRejectOpen(true); }}
                  >
                    <XCircle className="h-4 w-4" /> Rejeitar
                  </Button>
                )}
                {selectedOffer.status !== "flagged" && (
                  <Button
                    variant="outline"
                    className="w-full gap-2 border-warning/50 text-warning hover:bg-warning/10"
                    disabled={actionLoading}
                    onClick={() => moderateOffer(selectedOffer.id, "flag", "Sinalizado para revisão detalhada")}
                  >
                    <Flag className="h-4 w-4" /> Sinalizar
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rejeitar Anúncio</DialogTitle></DialogHeader>
          <Textarea
            placeholder="Motivo da rejeição..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={actionLoading || !rejectReason.trim()}
              onClick={() => selectedOffer && moderateOffer(selectedOffer.id, "reject", rejectReason)}
            >
              Confirmar rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
