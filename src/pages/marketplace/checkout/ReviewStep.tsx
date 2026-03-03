import { Store, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CartGroup } from "@/hooks/useMarketplaceCart";
import { conditionLabel, fmt } from "./types";

interface ReviewStepProps {
  group: CartGroup;
  onNext: () => void;
}

export function ReviewStep({ group, onNext }: ReviewStepProps) {
  return (
    <div className="bg-background rounded-2xl border border-border/20 p-5 space-y-4">
      <div className="flex items-center gap-2.5">
        <Store className="h-5 w-5 text-primary" />
        <div>
          <h2 className="font-bold text-base">Revise seus itens</h2>
          <p className="text-xs text-muted-foreground">Vendedor: {group.sellerName}</p>
        </div>
      </div>

      <div className="space-y-3">
        {group.items.map((item) => {
          const offer = item.offer;
          if (!offer) return null;
          const name = offer.product ? `${offer.product.brand} ${offer.product.model}` : "Produto";
          const image = offer.photos?.[0] || offer.product?.images?.[0];
          return (
            <div key={item.id} className="flex gap-3.5 p-3 rounded-xl bg-secondary/30 border border-border/10">
              <div className="w-[72px] h-[72px] rounded-xl bg-white overflow-hidden shrink-0">
                {image ? (
                  <img src={image} alt={name} className="w-full h-full object-contain p-1.5" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl opacity-10">👟</div>
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div>
                  <p className="text-sm font-semibold truncate">{name}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-border/30">
                      Tam. {offer.size}
                    </Badge>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-border/30">
                      {conditionLabel[offer.condition] || offer.condition}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm font-bold text-primary">
                  R$ {fmt(offer.price)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <Button onClick={onNext} className="w-full btn-gold gap-2 h-12 text-sm font-bold rounded-xl" size="lg">
        Continuar para endereço
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
