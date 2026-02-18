import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers, CheckSquare, Square, Pencil, Pause, Play, Trash2,
  DollarSign, Truck, Tag, X, Loader2, AlertTriangle, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { MarketplaceListing } from "@/hooks/useMarketplace";

interface BatchEditListingsProps {
  listings: MarketplaceListing[];
  onUpdate: (data: any) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onRefresh: () => void;
}

type BatchAction = "price" | "status" | "shipping" | "delete";

const conditions = [
  { value: "novo", label: "Novo" },
  { value: "usado_excelente", label: "Excelente" },
  { value: "usado_bom", label: "Bom" },
  { value: "usado_regular", label: "Regular" },
];

const statusLabels: Record<string, string> = {
  active: "Ativo",
  paused: "Pausado",
  sold: "Vendido",
  reserved: "Reservado",
};

export function BatchEditListings({ listings, onUpdate, onDelete, onRefresh }: BatchEditListingsProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchMode, setBatchMode] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<BatchAction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Batch fields
  const [batchPrice, setBatchPrice] = useState("");
  const [batchPriceMode, setBatchPriceMode] = useState<"fixed" | "percent_up" | "percent_down">("fixed");
  const [batchStatus, setBatchStatus] = useState<"active" | "paused">("paused");
  const [batchShipping, setBatchShipping] = useState("direct");
  const [batchShippingCost, setBatchShippingCost] = useState("");

  const editableListings = useMemo(
    () => listings.filter(l => l.status === "active" || l.status === "paused"),
    [listings]
  );

  const selectedListings = useMemo(
    () => editableListings.filter(l => selectedIds.has(l.id)),
    [editableListings, selectedIds]
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === editableListings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(editableListings.map(l => l.id)));
    }
  };

  const openAction = (action: BatchAction) => {
    if (selectedIds.size === 0) {
      toast.error("Selecione pelo menos um anúncio");
      return;
    }
    setCurrentAction(action);
    setBatchPrice("");
    setBatchPriceMode("fixed");
    setBatchStatus("paused");
    setBatchShipping("direct");
    setBatchShippingCost("");
    setActionDialogOpen(true);
  };

  const executeAction = async () => {
    if (!currentAction || selectedIds.size === 0) return;
    setIsProcessing(true);
    setProgress({ current: 0, total: selectedIds.size });

    let successCount = 0;
    const ids = Array.from(selectedIds);

    for (let i = 0; i < ids.length; i++) {
      const listing = editableListings.find(l => l.id === ids[i]);
      if (!listing) continue;

      try {
        let success = false;

        if (currentAction === "delete") {
          success = await onDelete(ids[i]);
        } else {
          const updateData: Record<string, any> = { id: ids[i] };

          if (currentAction === "price") {
            const priceVal = parseFloat(batchPrice);
            if (isNaN(priceVal) || priceVal <= 0) continue;
            if (batchPriceMode === "fixed") {
              updateData.price = priceVal;
            } else if (batchPriceMode === "percent_up") {
              updateData.price = Math.round(listing.price * (1 + priceVal / 100) * 100) / 100;
            } else {
              updateData.price = Math.round(listing.price * (1 - priceVal / 100) * 100) / 100;
            }
            // Auto-enforce bravenza for >= 2000
            if (updateData.price >= 2000) updateData.shipping_mode = "bravenza";
          } else if (currentAction === "status") {
            updateData.status = batchStatus;
          } else if (currentAction === "shipping") {
            updateData.shipping_mode = batchShipping;
            if (batchShippingCost) updateData.shipping_cost_estimate = parseFloat(batchShippingCost);
          }

          success = await onUpdate(updateData);
        }

        if (success) successCount++;
      } catch (err) {
        console.error(`Batch error for ${ids[i]}:`, err);
      }

      setProgress({ current: i + 1, total: ids.length });
      // Yield to UI thread
      await new Promise(r => setTimeout(r, 50));
    }

    setIsProcessing(false);
    setActionDialogOpen(false);
    setSelectedIds(new Set());

    if (successCount > 0) {
      toast.success(`${successCount} anúncio${successCount > 1 ? "s" : ""} atualizado${successCount > 1 ? "s" : ""}`);
      onRefresh();
    } else {
      toast.error("Nenhum anúncio foi atualizado");
    }
  };

  if (!batchMode) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs"
        onClick={() => setBatchMode(true)}
      >
        <Layers className="h-3.5 w-3.5" />
        Edição em lote
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      {/* Batch toolbar */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-16 z-30 rounded-2xl border border-primary/20 bg-card/95 backdrop-blur-xl p-3 shadow-lg"
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => { setBatchMode(false); setSelectedIds(new Set()); }}
            >
              <X className="h-3.5 w-3.5" />
              Sair
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <button
              onClick={toggleAll}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {selectedIds.size === editableListings.length ? (
                <CheckSquare className="h-4 w-4 text-primary" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              {selectedIds.size === editableListings.length ? "Desmarcar" : "Selecionar"} todos
            </button>
            <Badge variant="outline" className="text-[10px]">
              {selectedIds.size} selecionado{selectedIds.size !== 1 ? "s" : ""}
            </Badge>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => openAction("price")}
              disabled={selectedIds.size === 0}
            >
              <DollarSign className="h-3.5 w-3.5" />
              Preço
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => openAction("status")}
              disabled={selectedIds.size === 0}
            >
              <Pause className="h-3.5 w-3.5" />
              Status
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => openAction("shipping")}
              disabled={selectedIds.size === 0}
            >
              <Truck className="h-3.5 w-3.5" />
              Envio
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => openAction("delete")}
              disabled={selectedIds.size === 0}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Excluir
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Selectable listing grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {editableListings.map((listing) => {
          const isSelected = selectedIds.has(listing.id);
          return (
            <motion.div
              key={listing.id}
              layout
              className={cn(
                "relative rounded-xl border p-3 cursor-pointer transition-all duration-200",
                isSelected
                  ? "border-primary/50 bg-primary/5 shadow-sm"
                  : "border-border/30 hover:border-border/60"
              )}
              onClick={() => toggleSelect(listing.id)}
            >
              <div className="flex gap-3">
                <div className="relative">
                  <Checkbox
                    checked={isSelected}
                    className="absolute -top-1 -left-1 z-10"
                    onCheckedChange={() => toggleSelect(listing.id)}
                  />
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {listing.photos?.[0] ? (
                      <img src={listing.photos[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                        <Tag className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{listing.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-bold text-primary">
                      R$ {listing.price.toLocaleString("pt-BR")}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn("text-[9px] px-1.5 py-0",
                        listing.status === "active" ? "border-success/50 text-success" : "border-warning/50 text-warning"
                      )}
                    >
                      {statusLabels[listing.status] || listing.status}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                    {listing.size && `Tam. ${listing.size}`}
                    {listing.condition && ` • ${conditions.find(c => c.value === listing.condition)?.label || listing.condition}`}
                    {` • ${listing.shipping_mode === "bravenza" ? "Via Bravenza" : "Envio direto"}`}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={(v) => { if (!isProcessing) setActionDialogOpen(v); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentAction === "price" && "Alterar preço em lote"}
              {currentAction === "status" && "Alterar status em lote"}
              {currentAction === "shipping" && "Alterar envio em lote"}
              {currentAction === "delete" && "Excluir anúncios"}
            </DialogTitle>
            <DialogDescription>
              Aplicar a {selectedIds.size} anúncio{selectedIds.size > 1 ? "s" : ""} selecionado{selectedIds.size > 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>

          {isProcessing ? (
            <div className="py-8 text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <div>
                <p className="text-sm font-medium">Processando...</p>
                <p className="text-xs text-muted-foreground">
                  {progress.current}/{progress.total} concluídos
                </p>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {/* Price action */}
              {currentAction === "price" && (
                <>
                  <div>
                    <Label>Modo de alteração</Label>
                    <Select value={batchPriceMode} onValueChange={(v: any) => setBatchPriceMode(v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Preço fixo (R$)</SelectItem>
                        <SelectItem value="percent_up">Aumentar %</SelectItem>
                        <SelectItem value="percent_down">Reduzir %</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>
                      {batchPriceMode === "fixed" ? "Novo preço (R$)" : "Porcentagem (%)"}
                    </Label>
                    <Input
                      type="number"
                      value={batchPrice}
                      onChange={(e) => setBatchPrice(e.target.value)}
                      placeholder={batchPriceMode === "fixed" ? "Ex: 599.90" : "Ex: 10"}
                      className="mt-1"
                    />
                  </div>
                  {batchPriceMode !== "fixed" && batchPrice && (
                    <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
                      Exemplo: R$ 500 → R$ {batchPriceMode === "percent_up"
                        ? (500 * (1 + parseFloat(batchPrice || "0") / 100)).toFixed(2)
                        : (500 * (1 - parseFloat(batchPrice || "0") / 100)).toFixed(2)
                      }
                    </div>
                  )}
                </>
              )}

              {/* Status action */}
              {currentAction === "status" && (
                <div>
                  <Label>Novo status</Label>
                  <Select value={batchStatus} onValueChange={(v: any) => setBatchStatus(v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="paused">Pausado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Shipping action */}
              {currentAction === "shipping" && (
                <>
                  <div>
                    <Label>Modo de envio</Label>
                    <Select value={batchShipping} onValueChange={setBatchShipping}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="direct">Envio direto</SelectItem>
                        <SelectItem value="bravenza">Via Bravenza</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Frete estimado (R$)</Label>
                    <Input
                      type="number"
                      value={batchShippingCost}
                      onChange={(e) => setBatchShippingCost(e.target.value)}
                      placeholder="Opcional"
                      className="mt-1"
                    />
                  </div>
                </>
              )}

              {/* Delete confirmation */}
              {currentAction === "delete" && (
                <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-center space-y-2">
                  <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
                  <p className="text-sm font-medium">
                    Tem certeza que deseja excluir {selectedIds.size} anúncio{selectedIds.size > 1 ? "s" : ""}?
                  </p>
                  <p className="text-xs text-muted-foreground">Esta ação não pode ser desfeita.</p>
                </div>
              )}

              <Button
                className={cn("w-full gap-2", currentAction === "delete" ? "bg-destructive hover:bg-destructive/90" : "btn-gold")}
                onClick={executeAction}
                disabled={
                  (currentAction === "price" && (!batchPrice || parseFloat(batchPrice) <= 0))
                }
              >
                {currentAction === "delete" ? (
                  <><Trash2 className="h-4 w-4" /> Confirmar exclusão</>
                ) : (
                  <><Pencil className="h-4 w-4" /> Aplicar alterações</>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
