import { ReactNode } from "react";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";
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
import { cn } from "@/lib/utils";

export type ConfirmDialogVariant = "destructive" | "warning" | "default";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
  isLoading?: boolean;
  icon?: ReactNode;
}

const variantStyles: Record<ConfirmDialogVariant, {
  iconBg: string;
  iconColor: string;
  buttonClass: string;
  defaultIcon: ReactNode;
}> = {
  destructive: {
    iconBg: "bg-destructive/10",
    iconColor: "text-destructive",
    buttonClass: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    defaultIcon: <Trash2 className="h-5 w-5" />,
  },
  warning: {
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
    buttonClass: "bg-warning text-warning-foreground hover:bg-warning/90",
    defaultIcon: <AlertTriangle className="h-5 w-5" />,
  },
  default: {
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    buttonClass: "btn-gold",
    defaultIcon: <AlertTriangle className="h-5 w-5" />,
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "destructive",
  isLoading = false,
  icon,
}: ConfirmDialogProps) {
  const styles = variantStyles[variant];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="card-premium border-border">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div className={cn("p-3 rounded-lg", styles.iconBg)}>
              <span className={styles.iconColor}>
                {icon || styles.defaultIcon}
              </span>
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-foreground">
                {title}
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-2">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel disabled={isLoading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            className={cn(styles.buttonClass)}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
