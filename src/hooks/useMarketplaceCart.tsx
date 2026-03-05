import { useState, useEffect, useCallback, createContext, useContext, forwardRef, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CartItem {
  id: string;
  offer_id: string;
  product_id: string;
  added_at: string;
  // Joined data
  offer?: {
    id: string;
    price: number;
    size: string;
    condition: string;
    photos: string[];
    shipping_mode: string;
    seller_id: string;
    status: string;
    interest_free_installments?: number;
    product?: {
      brand: string;
      model: string;
      slug: string | null;
      images: string[] | null;
    };
    seller?: {
      id: string;
      member?: { client_name: string };
    };
  };
}

export interface CartGroup {
  sellerId: string;
  sellerName: string;
  items: CartItem[];
  subtotal: number;
}

interface CartContextType {
  items: CartItem[];
  count: number;
  isLoading: boolean;
  addToCart: (offerId: string, productId: string) => Promise<boolean>;
  removeFromCart: (offerId: string) => Promise<boolean>;
  clearCart: () => Promise<void>;
  isInCart: (offerId: string) => boolean;
  refresh: () => Promise<void>;
  groupedBySeller: CartGroup[];
}

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider = forwardRef<HTMLDivElement, { cpf: string | null; children: ReactNode }>(function CartProvider({ cpf, children }, _ref) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!cpf) { setItems([]); return; }
    setIsLoading(true);
    try {
      // Single query using the pre-joined view (replaces 4 sequential queries)
      const { data, error } = await supabase
        .from("marketplace_cart_details" as any)
        .select("*")
        .eq("user_cpf", cpf)
        .eq("offer_status", "active")
        .order("added_at", { ascending: false });

      if (error) throw error;

      const enriched: CartItem[] = (data || []).map((row: any) => ({
        id: row.id,
        offer_id: row.offer_id,
        product_id: row.product_id,
        added_at: row.added_at,
        offer: {
          id: row.offer_id,
          price: row.offer_price,
          size: row.offer_size,
          condition: row.offer_condition,
          photos: row.offer_photos,
          shipping_mode: row.offer_shipping_mode,
          seller_id: row.offer_seller_id,
          status: row.offer_status,
          interest_free_installments: row.offer_interest_free_installments || 0,
          product: {
            brand: row.product_brand,
            model: row.product_model,
            slug: row.product_slug,
            images: row.product_images,
          },
          seller: {
            id: row.offer_seller_id,
            member: row.seller_name ? { client_name: row.seller_name } : undefined,
          },
        },
      }));

      setItems(enriched);
    } catch (e) {
      console.error("Cart fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [cpf]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = useCallback(async (offerId: string, productId: string) => {
    if (!cpf) { toast.error("Faça login para adicionar ao carrinho"); return false; }
    try {
      const { error } = await supabase
        .from("marketplace_cart_items")
        .insert({ user_cpf: cpf, offer_id: offerId, product_id: productId });
      if (error) {
        if (error.code === "23505") { toast.info("Item já está no carrinho"); return false; }
        throw error;
      }
      toast.success("Adicionado ao carrinho");
      await fetchCart();
      return true;
    } catch (e) {
      toast.error("Erro ao adicionar ao carrinho");
      return false;
    }
  }, [cpf, fetchCart]);

  const removeFromCart = useCallback(async (offerId: string) => {
    if (!cpf) return false;
    try {
      await supabase
        .from("marketplace_cart_items")
        .delete()
        .eq("user_cpf", cpf)
        .eq("offer_id", offerId);
      await fetchCart();
      return true;
    } catch {
      toast.error("Erro ao remover do carrinho");
      return false;
    }
  }, [cpf, fetchCart]);

  const clearCart = useCallback(async () => {
    if (!cpf) return;
    await supabase.from("marketplace_cart_items").delete().eq("user_cpf", cpf);
    setItems([]);
  }, [cpf]);

  const isInCart = useCallback((offerId: string) => items.some(i => i.offer_id === offerId), [items]);

  const groupedBySeller: CartGroup[] = (() => {
    const groups: Record<string, CartGroup> = {};
    items.forEach(item => {
      const sid = item.offer?.seller_id || "unknown";
      const sname = item.offer?.seller?.member?.client_name || "Vendedor";
      if (!groups[sid]) groups[sid] = { sellerId: sid, sellerName: sname, items: [], subtotal: 0 };
      groups[sid].items.push(item);
      groups[sid].subtotal += item.offer?.price || 0;
    });
    return Object.values(groups);
  })();

  return (
    <CartContext.Provider value={{
      items, count: items.length, isLoading,
      addToCart, removeFromCart, clearCart, isInCart,
      refresh: fetchCart, groupedBySeller,
    }}>
      {children}
    </CartContext.Provider>
  );
});

export function useMarketplaceCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useMarketplaceCart must be used within CartProvider");
  return ctx;
}
