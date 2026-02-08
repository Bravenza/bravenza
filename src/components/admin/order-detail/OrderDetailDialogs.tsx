import { ArrowRight, Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ORDER_STATUS_LABELS } from "@/lib/constants";

interface StatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextStatuses: string[];
  newStatus: string;
  onStatusChange: (status: string) => void;
  statusNotes: string;
  onNotesChange: (notes: string) => void;
  onConfirm: () => void;
  isSaving: boolean;
}

export function StatusChangeDialog({
  open,
  onOpenChange,
  nextStatuses,
  newStatus,
  onStatusChange,
  statusNotes,
  onNotesChange,
  onConfirm,
  isSaving,
}: StatusDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Avançar Status</DialogTitle>
          <DialogDescription>Selecione o próximo status do pedido</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Novo status</Label>
            <Select value={newStatus} onValueChange={onStatusChange}>
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
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Adicione uma nota sobre esta transição..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="btn-gold" onClick={onConfirm} disabled={!newStatus || isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  onDelete: () => void;
  isSaving: boolean;
}

export function DeleteOrderDialog({ open, onOpenChange, orderId, onDelete, isSaving }: DeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir pedido?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. O pedido {orderId} será permanentemente removido do sistema.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface DangerZoneProps {
  currentStatus: string;
  isSaving: boolean;
  onMarkAsLost: () => void;
  onDelete: () => void;
}

export function DangerZone({ currentStatus, isSaving, onMarkAsLost, onDelete }: DangerZoneProps) {
  return (
    <Card className="card-premium border-destructive/30">
      <CardHeader>
        <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        {currentStatus !== "LOST" && currentStatus !== "DELIVERED" && (
          <Button
            variant="outline"
            size="sm"
            className="border-orange-500/50 text-orange-500 hover:bg-orange-500/10"
            onClick={onMarkAsLost}
            disabled={isSaving}
          >
            <X className="mr-2 h-4 w-4" />
            Marcar como Perdido
          </Button>
        )}
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir Pedido
        </Button>
      </CardContent>
    </Card>
  );
}
