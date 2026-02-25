import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPriceBR } from "@/lib/budget-calculator";
import { motion, AnimatePresence } from "framer-motion";

interface StickyBuyBarProps {
  price: number | null;
  size: string | null;
  visible: boolean;
  onBuy: () => void;
}

export function StickyBuyBar({ price, size, visible, onBuy }: StickyBuyBarProps) {
  return (
    <AnimatePresence>
      {visible && price && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-[52px] left-0 right-0 z-40 lg:hidden border-t border-border/30 bg-background/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
        >
          <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto gap-3">
            <div>
              <p className="text-lg font-black text-foreground tracking-tight">
                {formatPriceBR(price)}
              </p>
              {size && (
                <p className="text-[10px] text-muted-foreground">
                  Tam. {size}
                </p>
              )}
            </div>
            <Button
              className="btn-gold gap-2 px-6 h-11 text-sm font-bold rounded-xl flex-shrink-0"
              onClick={onBuy}
            >
              <ShoppingCart className="h-4 w-4" />
              Comprar agora
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
