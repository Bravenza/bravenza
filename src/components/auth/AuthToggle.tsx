import { cn } from "@/lib/utils";

interface AuthToggleProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: { value: string; label: string }[];
}

export function AuthToggle({ activeTab, onTabChange, tabs }: AuthToggleProps) {
  return (
    <div className="flex rounded-lg bg-secondary/50 border border-border/50 p-1 gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onTabChange(tab.value)}
          className={cn(
            "flex-1 py-2.5 text-sm font-medium rounded-md transition-all duration-200 text-center",
            activeTab === tab.value
              ? "bg-card text-foreground shadow-sm border border-border/50"
              : "text-muted-foreground hover:text-foreground/80 border border-transparent"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
