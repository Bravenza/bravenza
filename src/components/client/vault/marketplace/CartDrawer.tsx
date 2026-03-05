import { ShoppingCart, Trash2, Store, ChevronRight, ShoppingBag, Sparkles, Shield, Package } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMarketplaceCart, type CartItem, type CartGroup } from "@/hooks/useMarketplaceCart";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const conditionLabel: Record<string, string> = {
  novo: "Novo",
  usado_excelente: "Excelente",
  usado_bom: "Bom",
  usado_regular: "Regular",
};

function CartItemRow({ item, onRemove, index }: { item: CartItem; onRemove: (offerId: string) => void; index: number }) {
  const offer = item.offer;
  if (!offer) return null;
  const name = offer.product ? `${offer.product.brand} ${offer.product.model}` : "Produto";
  const image = offer.photos?.[0] || offer.product?.images?.[0];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 80, height: 0, marginBottom: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 400, damping: 30 }}
      className="group relative flex gap-3.5 p-3 rounded-2xl bg-secondary/30 border border-border/10 hover:border-primary/20 transition-all duration-300"
    >
      {/* Image */}
      <div className="w-[72px] h-[72px] rounded-xl bg-white overflow-hidden shrink-0 shadow-sm">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-contain p-1.5" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl opacity-10">👟</div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <p className="text-sm font-semibold truncate leading-tight">{name}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-medium border-border/30">
              {offer.size}
            </Badge>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-medium border-border/30">
              {conditionLabel[offer.condition] || offer.condition}
            </Badge>
          </div>
        </div>
        <p className="text-sm font-bold text-primary tracking-tight">
          R$ {offer.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </p>
      </div>

      {/* Remove */}
      <button
        aria-label="Remover item do carrinho"
        onClick={() => onRemove(item.offer_id)}
        className="absolute top-2 right-2 h-6 w-6 rounded-full bg-destructive/10 text-destructive/60 hover:bg-destructive/20 hover:text-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </motion.div>
  );
}

function SellerGroup({ group, onRemove, onCheckoutGroup }: { group: CartGroup; onRemove: (offerId: string) => void; onCheckoutGroup: (group: CartGroup) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Seller header */}
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
          <Store className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate">{group.sellerName}</p>
          <p className="text-[10px] text-muted-foreground">{group.items.length} {group.items.length === 1 ? "item" : "itens"}</p>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {group.items.map((item, i) => (
            <CartItemRow key={item.id} item={item} onRemove={onRemove} index={i} />
          ))}
        </AnimatePresence>
      </div>

      {/* Subtotal + CTA */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl p-4 space-y-3 border border-primary/10">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Subtotal do vendedor</span>
          <span className="text-base font-bold">
            R$ {group.subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <Button
          className="w-full btn-gold gap-2 h-11 text-sm font-bold rounded-xl shadow-[0_4px_16px_-4px_hsl(var(--primary)/0.4)]"
          onClick={() => onCheckoutGroup(group)}
        >
          Finalizar compra
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}

export function CartDrawer() {
  const { items, count, removeFromCart, clearCart, groupedBySeller, isLoading } = useMarketplaceCart();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const totalValue = items.reduce((sum, i) => sum + (i.offer?.price || 0), 0);

  const handleCheckoutGroup = (group: CartGroup) => {
    setOpen(false);
    navigate("/marketplace/checkout", { state: { group } });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full hover:bg-secondary/60 transition-colors active:scale-95" aria-label="Abrir carrinho">
          <ShoppingCart className="h-4 w-4" />
          <AnimatePresence>
            {count > 0 && (
              <motion.span
                key="badge"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 h-[18px] min-w-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
              >
                {count}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:max-w-[420px] flex flex-col p-0 border-l border-border/10 bg-background"
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-display tracking-tight">Carrinho</h2>
                <p className="text-[11px] text-muted-foreground">
                  {count === 0 ? "Nenhum item" : `${count} ${count === 1 ? "item" : "itens"}`}
                </p>
              </div>
            </div>
            {count > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground h-8 hover:text-destructive"
                onClick={clearCart}
              >
                Limpar tudo
              </Button>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent"
              />
            </div>
          ) : count === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative mb-6"
              >
                <div className="h-24 w-24 rounded-3xl bg-secondary/50 flex items-center justify-center">
                  <ShoppingBag className="h-10 w-10 text-muted-foreground/30" />
                </div>
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-2 -right-2 h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center"
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                </motion.div>
              </motion.div>
              <h3 className="font-display font-bold text-base mb-1.5">Seu carrinho está vazio</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[240px]">
                Explore o marketplace e adicione sneakers ao seu carrinho para comprá-los juntos
              </p>
              <Button
                variant="outline"
                className="mt-6 rounded-xl gap-2 text-sm h-10"
                onClick={() => { setOpen(false); navigate("/app"); }}
              >
                Explorar marketplace
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="px-5 py-4 space-y-6">
              {groupedBySeller.map((group, i) => (
                <div key={group.sellerId}>
                  <SellerGroup
                    group={group}
                    onRemove={removeFromCart}
                    onCheckoutGroup={handleCheckoutGroup}
                  />
                  {i < groupedBySeller.length - 1 && (
                    <div className="h-px bg-gradient-to-r from-transparent via-border/30 to-transparent mt-6" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {count > 0 && (
          <div className="border-t border-border/20">
            {/* Trust signals */}
            <div className="flex items-center justify-center gap-4 py-3 bg-secondary/20">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Shield className="h-3 w-3 text-primary" />
                Compra protegida
              </div>
              <div className="h-3 w-px bg-border/30" />
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Package className="h-3 w-3 text-primary" />
                Autenticação garantida
              </div>
            </div>

            {/* Total */}
            <div className="px-5 py-4 bg-card">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-muted-foreground">Total estimado</span>
                  <p className="text-[10px] text-muted-foreground/60">Frete calculado no checkout</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black font-display tracking-tight">
                    R$ {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** Floating cart button for mobile — shows count badge */
export function FloatingCartButton() {
  const { count } = useMarketplaceCart();
  if (count === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 z-40 md:hidden">
      <CartDrawer />
    </div>
  );
}
