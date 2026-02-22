import { ShoppingCart, Trash2, Store, ChevronRight, X, ShoppingBag } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useMarketplaceCart, type CartItem, type CartGroup } from "@/hooks/useMarketplaceCart";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function CartItemRow({ item, onRemove }: { item: CartItem; onRemove: (offerId: string) => void }) {
  const offer = item.offer;
  if (!offer) return null;
  const name = offer.product ? `${offer.product.brand} ${offer.product.model}` : "Produto";
  const image = offer.photos?.[0] || offer.product?.images?.[0];
  const conditionLabel: Record<string, string> = {
    novo: "Novo",
    usado_excelente: "Excelente",
    usado_bom: "Bom",
    usado_regular: "Regular",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      className="flex gap-3 py-3"
    >
      <div className="w-16 h-16 rounded-xl bg-white overflow-hidden shrink-0 border border-border/20">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-contain p-1" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl opacity-20">👟</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">Tam. {offer.size}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{conditionLabel[offer.condition] || offer.condition}</span>
        </div>
        <p className="text-sm font-bold text-primary mt-1">
          R$ {offer.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={() => onRemove(item.offer_id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </motion.div>
  );
}

function SellerGroup({ group, onRemove, onCheckoutGroup }: { group: CartGroup; onRemove: (offerId: string) => void; onCheckoutGroup: (group: CartGroup) => void }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 py-2">
        <Store className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{group.sellerName}</span>
        <Badge variant="outline" className="text-[10px] ml-auto">{group.items.length} {group.items.length === 1 ? "item" : "itens"}</Badge>
      </div>
      <AnimatePresence mode="popLayout">
        {group.items.map(item => (
          <CartItemRow key={item.id} item={item} onRemove={onRemove} />
        ))}
      </AnimatePresence>
      <div className="flex items-center justify-between pt-2">
        <span className="text-sm text-muted-foreground">Subtotal</span>
        <span className="text-sm font-bold">R$ {group.subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
      </div>
      <Button
        className="w-full btn-gold gap-2 h-10 text-sm"
        onClick={() => onCheckoutGroup(group)}
      >
        Finalizar compra <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface CartDrawerProps {
  onCheckoutGroup: (group: CartGroup) => void;
}

export function CartDrawer({ onCheckoutGroup }: CartDrawerProps) {
  const { items, count, removeFromCart, clearCart, groupedBySeller, isLoading } = useMarketplaceCart();
  const [open, setOpen] = useState(false);

  const totalValue = items.reduce((sum, i) => sum + (i.offer?.price || 0), 0);

  const handleCheckoutGroup = (group: CartGroup) => {
    setOpen(false);
    onCheckoutGroup(group);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
          <ShoppingCart className="h-4 w-4" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {count}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-border/20">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="h-4 w-4 text-primary" />
              Carrinho
              {count > 0 && <Badge variant="secondary" className="text-xs">{count}</Badge>}
            </SheetTitle>
            {count > 0 && (
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" onClick={clearCart}>
                Limpar
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
          ) : count === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground/20 mb-4" />
              <h3 className="font-medium mb-1">Carrinho vazio</h3>
              <p className="text-sm text-muted-foreground max-w-[200px]">
                Explore o marketplace e adicione itens ao seu carrinho
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedBySeller.map(group => (
                <div key={group.sellerId}>
                  <SellerGroup group={group} onRemove={removeFromCart} onCheckoutGroup={handleCheckoutGroup} />
                  <Separator className="mt-4" />
                </div>
              ))}
            </div>
          )}
        </div>

        {count > 0 && (
          <div className="border-t border-border/20 px-4 py-4 bg-card">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Total ({count} {count === 1 ? "item" : "itens"})</span>
              <span className="text-lg font-bold">R$ {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              * Cada vendedor gera um pedido separado. Frete calculado no checkout.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** Floating cart button for mobile — shows count badge */
export function FloatingCartButton({ onCheckoutGroup }: CartDrawerProps) {
  const { count } = useMarketplaceCart();
  if (count === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 z-40 md:hidden">
      <CartDrawer onCheckoutGroup={onCheckoutGroup} />
    </div>
  );
}
