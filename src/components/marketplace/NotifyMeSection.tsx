import { useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotifyMeSectionProps {
  sizes: string[];
  availableSizes: string[];
  onNotify: (size: string) => Promise<void>;
  watchingSize?: string | null;
  isLoggedIn: boolean;
}

export function NotifyMeSection({ sizes, availableSizes, onNotify, watchingSize, isLoggedIn }: NotifyMeSectionProps) {
  const unavailableSizes = sizes.filter(s => !availableSizes.includes(s));
  const [loading, setLoading] = useState<string | null>(null);
  const [notifiedSizes, setNotifiedSizes] = useState<Set<string>>(new Set());

  if (unavailableSizes.length === 0 || !isLoggedIn) return null;

  const handleNotify = async (size: string) => {
    setLoading(size);
    try {
      await onNotify(size);
      setNotifiedSizes(prev => new Set([...prev, size]));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mt-4 p-4 rounded-2xl bg-muted/10 border border-border/20">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="h-4 w-4 text-primary" />
        <span className="text-sm font-bold text-foreground">Não tem seu tamanho?</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Ative o alerta e seja notificado quando seu tamanho estiver disponível.
      </p>
      <div className="flex flex-wrap gap-2">
        {unavailableSizes.map(size => {
          const isNotified = notifiedSizes.has(size) || watchingSize === size;
          return (
            <Button
              key={size}
              variant="outline"
              size="sm"
              disabled={loading === size || isNotified}
              onClick={() => handleNotify(size)}
              className={cn(
                "text-xs h-8 rounded-xl gap-1",
                isNotified
                  ? "border-primary/30 text-primary bg-primary/5"
                  : "border-border/30 hover:border-primary/30"
              )}
            >
              {isNotified ? <BellRing className="h-3 w-3" /> : <Bell className="h-3 w-3" />}
              {size}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
