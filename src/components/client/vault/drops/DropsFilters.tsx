import { cn } from "@/lib/utils";

const filterOptions = [
  { value: "all", label: "Todos" },
  { value: "RADAR", label: "Radar" },
  { value: "GUIDE", label: "Guias" },
  { value: "ALERT", label: "Alertas" },
  { value: "EVENT", label: "Eventos" },
];

interface DropsFiltersProps {
  value: string;
  onChange: (value: string) => void;
}

export function DropsFilters({ value, onChange }: DropsFiltersProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
      {filterOptions.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-4 py-2.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 min-h-[44px]",
            value === opt.value
              ? "bg-foreground text-background shadow-sm"
              : "bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
