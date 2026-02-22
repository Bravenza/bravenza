import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";
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

export function CartProvider({ cpf, children }: { cpf: string | null; children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!cpf) { setItems([]); return; }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("marketplace_cart_items")
        .select("id, offer_id, product_id, added_at")
        .eq("user_cpf", cpf)
        .order("added_at", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setItems([]);
        setIsLoading(false);
        return;
      }

      // Fetch offer details
      const offerIds = data.map(d => d.offer_id);
      const { data: offers } = await supabase
        .from("marketplace_offers")
        .select("id, price, size, condition, photos, shipping_mode, seller_id, status, product_id")
        .in("id", offerIds);

      // Fetch product details
      const productIds = [...new Set(data.map(d => d.product_id))];
      const { data: products } = await supabase
        .from("marketplace_products")
        .select("id, brand, model, slug, images")
        .in("id", productIds);

      // Fetch seller details
      const sellerIds = [...new Set((offers || []).map(o => o.seller_id))];
      const { data: sellers } = await supabase
        .from("vault_seller_profiles")
        .select("id, member_id")
        .in("id", sellerIds);

      const memberIds = (sellers || []).map(s => s.member_id);
      const { data: members } = await supabase
        .from("vault_members")
        .select("id, client_name")
        .in("id", memberIds);

      const enriched: CartItem[] = data.map(item => {
        const offer = (offers || []).find(o => o.id === item.offer_id);
        const product = (products || []).find(p => p.id === item.product_id);
        const seller = (sellers || []).find(s => s.id === offer?.seller_id);
        const member = (members || []).find(m => m.id === seller?.member_id);
        return {
          ...item,
          offer: offer ? {
            ...offer,
            product: product || undefined,
            seller: seller ? { id: seller.id, member: member ? { client_name: member.client_name } : undefined } : undefined,
          } : undefined,
        };
      });

      // Filter out sold/inactive offers
      setItems(enriched.filter(i => i.offer?.status === "active"));
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
    } catch (e: any) {
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
}

export function useMarketplaceCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useMarketplaceCart must be used within CartProvider");
  return ctx;
}
