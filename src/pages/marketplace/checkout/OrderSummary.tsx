import { ShoppingCart, Truck, ShieldCheck, Lock, Tag } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import type { CartGroup } from "@/hooks/useMarketplaceCart";
import { fmt, type Step } from "./types";

interface OrderSummaryProps {
  group: CartGroup;
  step: Step;
  itemsSubtotal: number;
  shippingCost: number;
  cardInterestRate: number;
  displayTotalPrice: number;
  baseTotalPrice: number;
  couponDiscount?: number;
}

export function OrderSummaryDesktop({ group, step, itemsSubtotal, shippingCost, cardInterestRate, displayTotalPrice, baseTotalPrice, couponDiscount = 0 }: OrderSummaryProps) {
  if (step === "processing" || step === "success") return null;

  return (
    <div className="hidden lg:block">
      <div className="sticky top-20 bg-background rounded-2xl border border-border/20 p-5 space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-primary" />
          Resumo do pedido
        </h3>

        <div className="space-y-3">
          {group.items.map(item => {
            const offer = item.offer;
            if (!offer) return null;
            const name = offer.product ? `${offer.product.brand} ${offer.product.model}` : "Produto";
            return (
              <div key={item.id} className="flex items-center gap-2.5 text-sm">
                <span className="flex-1 truncate text-muted-foreground">{name} ({offer.size})</span>
                <span className="font-medium whitespace-nowrap">R$ {fmt(offer.price)}</span>
              </div>
            );
          })}
        </div>

        <Separator />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal ({group.items.length} {group.items.length === 1 ? "item" : "itens"})</span>
            <span>R$ {fmt(itemsSubtotal)}</span>
          </div>
          {shippingCost > 0 ? (
            <div className="flex justify-between text-muted-foreground">
              <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> Frete</span>
              <span>R$ {fmt(shippingCost)}</span>
            </div>
          ) : step !== "review" && (
            <div className="flex justify-between text-muted-foreground/50">
              <span>Frete</span>
              <span>A calcular</span>
            </div>
          )}
          {cardInterestRate > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Juros cartão</span>
              <span>R$ {fmt(displayTotalPrice - baseTotalPrice)}</span>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex justify-between items-baseline">
          <span className="font-bold">Total</span>
          <span className="text-xl font-black text-primary">R$ {fmt(displayTotalPrice)}</span>
        </div>

        <div className="pt-3 border-t border-border/10 space-y-2">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
            Compra protegida por 7 dias úteis
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Lock className="h-3.5 w-3.5 text-primary shrink-0" />
            Pagamento 100% seguro
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrderSummaryMobile({ group, step, shippingCost, displayTotalPrice }: Pick<OrderSummaryProps, "group" | "step" | "shippingCost" | "displayTotalPrice">) {
  if (step === "processing" || step === "success") return null;

  return (
    <div className="lg:hidden mt-6 bg-background rounded-2xl border border-border/20 p-4">
      <div className="flex justify-between items-baseline">
        <span className="text-sm text-muted-foreground">{group.items.length} {group.items.length === 1 ? "item" : "itens"} · {group.sellerName}</span>
        <span className="text-lg font-black text-primary">R$ {fmt(displayTotalPrice)}</span>
      </div>
      {shippingCost === 0 && step !== "review" && (
        <p className="text-[10px] text-muted-foreground/60 text-right">+ frete</p>
      )}
    </div>
  );
}
