import { cn } from "@/lib/utils";

export interface PillTabItem {
  id: string;
  label: string;
  icon?: React.ElementType;
}

interface PillTabsProps {
  items: PillTabItem[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function PillTabs({ items, value, onValueChange, className }: PillTabsProps) {
  return (
    <div className={cn("flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1", className)}>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onValueChange(item.id)}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0",
            value === item.id
              ? "bg-foreground text-background shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          {item.icon && <item.icon className="h-3.5 w-3.5" />}
          {item.label}
        </button>
      ))}
    </div>
  );
}
