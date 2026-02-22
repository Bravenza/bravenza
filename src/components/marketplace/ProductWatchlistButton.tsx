import { useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface ProductWatchlistButtonProps {
  isWatching: boolean;
  maxPrice: number | null;
  onToggle: (maxPrice?: number | null) => Promise<void>;
  lowestPrice?: number | null;
}

export function ProductWatchlistButton({
  isWatching,
  maxPrice,
  onToggle,
  lowestPrice,
}: ProductWatchlistButtonProps) {
  const [open, setOpen] = useState(false);
  const [priceInput, setPriceInput] = useState(maxPrice?.toString() || "");
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (isWatching) {
        await onToggle(null);
      } else {
        const price = priceInput ? parseFloat(priceInput) : null;
        await onToggle(price);
      }
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  if (isWatching) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
        onClick={handleToggle}
        disabled={loading}
      >
        <BellRing className="h-4 w-4" />
        <span className="hidden sm:inline">Alertando</span>
        {maxPrice && (
          <span className="text-[10px] opacity-70">
            ≤ R$ {maxPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        )}
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline">Alertar preço</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-semibold">Alerta de preço</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Receba uma notificação quando o preço cair.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-price" className="text-xs">
              Preço máximo desejado (opcional)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                R$
              </span>
              <Input
                id="max-price"
                type="number"
                placeholder={lowestPrice ? String(Math.floor(lowestPrice * 0.9)) : "Ex: 800"}
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            {lowestPrice && (
              <p className="text-[10px] text-muted-foreground">
                Menor preço atual: R$ {lowestPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            )}
          </div>

          <Button
            size="sm"
            className="w-full btn-gold gap-1.5"
            onClick={handleToggle}
            disabled={loading}
          >
            <BellRing className="h-3.5 w-3.5" />
            Ativar alerta
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
