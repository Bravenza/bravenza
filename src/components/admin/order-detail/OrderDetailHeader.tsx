import { Link } from "react-router-dom";
import { ArrowLeft, Edit, ArrowRight, Save, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/constants";

interface OrderDetailHeaderProps {
  orderId: string;
  createdAt: string;
  isEditing: boolean;
  isSaving: boolean;
  hasNextStatuses: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onAdvanceStatus: () => void;
}

export function OrderDetailHeader({
  orderId,
  createdAt,
  isEditing,
  isSaving,
  hasNextStatuses,
  onEdit,
  onCancelEdit,
  onSave,
  onAdvanceStatus,
}: OrderDetailHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <Link to="/admin/pedidos">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{orderId}</h1>
          </div>
          <p className="text-muted-foreground">
            Criado em {formatDateTime(createdAt)}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        {isEditing ? (
          <>
            <Button variant="outline" onClick={onCancelEdit}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button className="btn-gold" onClick={onSave} disabled={isSaving}>
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
            <Button variant="outline" onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            {hasNextStatuses && (
              <Button className="btn-gold" onClick={onAdvanceStatus}>
                <ArrowRight className="mr-2 h-4 w-4" />
                Avançar Status
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
