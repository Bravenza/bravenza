import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Plus, Clock, CheckCircle2, Camera, Tag, Truck, DollarSign, XCircle, AlertTriangle } from "lucide-react";
import { ConsignmentRequestDialog } from "./ConsignmentRequestDialog";
import { cn } from "@/lib/utils";

interface ConsignmentListProps {
  sellerId: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  requested: { label: "Solicitado", icon: Clock, color: "bg-amber-500/15 text-amber-600" },
  shipping_instructions: { label: "Instruções enviadas", icon: Truck, color: "bg-blue-500/15 text-blue-600" },
  shipped_to_hub: { label: "Enviado ao Hub", icon: Truck, color: "bg-blue-500/15 text-blue-600" },
  received: { label: "Recebido no Hub", icon: Package, color: "bg-indigo-500/15 text-indigo-600" },
  inspecting: { label: "Em inspeção", icon: AlertTriangle, color: "bg-orange-500/15 text-orange-600" },
  photographed: { label: "Fotografado", icon: Camera, color: "bg-purple-500/15 text-purple-600" },
  listed: { label: "Anunciado", icon: Tag, color: "bg-emerald-500/15 text-emerald-600" },
  sold: { label: "Vendido", icon: CheckCircle2, color: "bg-green-500/15 text-green-600" },
  payout_pending: { label: "Pagamento pendente", icon: DollarSign, color: "bg-yellow-500/15 text-yellow-600" },
  paid: { label: "Pago", icon: DollarSign, color: "bg-green-500/15 text-green-700" },
  rejected: { label: "Reprovado", icon: XCircle, color: "bg-red-500/15 text-red-600" },
  cancelled: { label: "Cancelado", icon: XCircle, color: "bg-muted text-muted-foreground" },
};

const TIMELINE_STEPS = [
  "requested", "shipping_instructions", "shipped_to_hub", "received",
  "inspecting", "photographed", "listed", "sold", "payout_pending", "paid"
];

export function ConsignmentList({ sellerId }: ConsignmentListProps) {
  const [consignments, setConsignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetch = async () => {
    const { data } = await supabase
      .from("marketplace_consignments" as any)
      .select("*")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });
    setConsignments(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (sellerId) fetch();
  }, [sellerId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-base flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Bravenza Full
        </h3>
        <Button size="sm" className="btn-gold gap-1.5" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Nova solicitação
        </Button>
      </div>

      {consignments.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-border/50">
          <Package className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm mb-1">Nenhuma consignação ainda</p>
          <p className="text-muted-foreground/60 text-xs">
            Envie seu sneaker e nós cuidamos de tudo: fotos, autenticação, anúncio e envio.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {consignments.map((c: any) => {
            const statusConf = STATUS_CONFIG[c.status] || STATUS_CONFIG.requested;
            const StatusIcon = statusConf.icon;
            const currentStepIdx = TIMELINE_STEPS.indexOf(c.status);

            return (
              <div key={c.id} className="rounded-xl border border-border/50 bg-card p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-semibold text-sm">{c.brand} {c.model}</p>
                    <p className="text-xs text-muted-foreground">
                      Tam. {c.size} {c.size_system} · {c.colorway || "—"}
                    </p>
                  </div>
                  <Badge className={cn("text-xs gap-1", statusConf.color)}>
                    <StatusIcon className="h-3 w-3" />
                    {statusConf.label}
                  </Badge>
                </div>

                {/* Mini timeline */}
                {c.status !== "rejected" && c.status !== "cancelled" && (
                  <div className="flex items-center gap-0.5 mb-3">
                    {TIMELINE_STEPS.map((step, i) => (
                      <div
                        key={step}
                        className={cn(
                          "h-1.5 flex-1 rounded-full transition-colors",
                          i <= currentStepIdx ? "bg-primary" : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Preço sugerido: R$ {Number(c.suggested_price).toFixed(2)}</span>
                  {c.final_price && (
                    <span className="font-medium text-foreground">
                      Preço final: R$ {Number(c.final_price).toFixed(2)}
                    </span>
                  )}
                </div>

                {c.rejection_reason && (
                  <p className="mt-2 text-xs text-destructive bg-destructive/10 rounded-lg p-2">
                    {c.rejection_reason}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConsignmentRequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        sellerId={sellerId}
        onSuccess={fetch}
      />
    </div>
  );
}
