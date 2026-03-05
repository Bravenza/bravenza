import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

interface CartItem {
  product_name?: string;
  name?: string;
  price: number;
  size?: string;
  offer_id?: string;
}

/**
 * Hook to detect cart abandonment during checkout.
 * Records abandonment when user leaves checkout without completing,
 * and clears it when checkout succeeds.
 */
export function useCartAbandonment(cpf: string | null, cartItems: CartItem[]) {
  const hasRecordedRef = useRef(false);
  const checkoutCompletedRef = useRef(false);

  // Record abandonment on unmount (user left checkout page)
  const recordAbandonment = useCallback(async () => {
    if (!cpf || cartItems.length === 0 || checkoutCompletedRef.current) return;

    try {
      const snapshot = cartItems.map((item) => ({
        name: item.product_name || item.name || "Produto",
        price: item.price,
        size: item.size || "",
        offer_id: item.offer_id || "",
      }));

      const total = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);

      await supabase.functions.invoke("cart-recovery", {
        body: {
          action: "record",
          cpf,
          cart_snapshot: snapshot,
          cart_total: total,
          item_count: cartItems.length,
        },
      });

      logger.log("[CartAbandonment] Recorded abandonment");
    } catch (err) {
      console.error("[CartAbandonment] Failed to record:", err);
    }
  }, [cpf, cartItems]);

  // Mark checkout as complete (call this on success)
  const markCompleted = useCallback(async () => {
    checkoutCompletedRef.current = true;
    if (!cpf) return;

    try {
      await supabase.functions.invoke("cart-recovery", {
        body: { action: "clear", cpf },
      });
      logger.log("[CartAbandonment] Cleared abandonment record");
    } catch (err) {
      console.error("[CartAbandonment] Failed to clear:", err);
    }
  }, [cpf]);

  // Record when user navigates away from checkout
  useEffect(() => {
    // Use beforeunload for tab close / navigate away
    const handleBeforeUnload = () => {
      if (!cpf || cartItems.length === 0 || checkoutCompletedRef.current) return;
      // Use sendBeacon for reliability during page unload
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cart-recovery`;
      const body = JSON.stringify({
        action: "record",
        cpf,
        cart_snapshot: cartItems.map((item) => ({
          name: item.product_name || item.name || "Produto",
          price: item.price,
          size: item.size || "",
        })),
        cart_total: cartItems.reduce((sum, item) => sum + (item.price || 0), 0),
        item_count: cartItems.length,
      });
      navigator.sendBeacon(url, body);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // On unmount (React navigation away from checkout), record abandonment
      if (!checkoutCompletedRef.current && cartItems.length > 0) {
        recordAbandonment();
      }
    };
  }, [cpf, cartItems, recordAbandonment]);

  return { markCompleted };
}
