import { cn } from "@/lib/utils";

interface SpecRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  even?: boolean;
  onClick?: () => void;
}

export function SpecRow({ icon, label, value, even, onClick }: SpecRowProps) {
  return (
    <div className={cn(
      "flex items-center justify-between gap-4 px-4 py-2.5 text-sm",
      even ? "bg-muted/10" : "bg-transparent"
    )}>
      <span className="flex items-center gap-2 text-muted-foreground shrink-0">
        {icon}
        {label}
      </span>
      {onClick ? (
        <button onClick={onClick} className="font-medium text-primary hover:underline text-right truncate min-w-0">
          {value} →
        </button>
      ) : (
        <span className="font-medium text-foreground text-right truncate min-w-0">{value}</span>
      )}
    </div>
  );
}
