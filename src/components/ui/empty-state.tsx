import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "premium";
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-6 text-center", className)}>
      <div className="w-16 h-16 rounded-2xl bg-muted/60 border border-border/50 flex items-center justify-center mb-5">
        <Icon className="h-7 w-7 text-muted-foreground/70" />
      </div>
      <h3 className="text-lg font-semibold mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">{description}</p>
      {action && (
        <Button variant={action.variant || "default"} onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
