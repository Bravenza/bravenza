import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export interface MarketplaceListing {
  id: string;
  seller_id: string;
  vault_item_id: string | null;
  title: string;
  description: string | null;
  brand: string | null;
  model: string | null;
  colorway: string | null;
  size: string | null;
  condition: string;
  photos: string[];
  price: number;
  original_purchase_price: number | null;
  shipping_mode: string;
  shipping_cost_estimate: number;
  is_vault_certified: boolean;
  status: string;
  views_count: number;
  favorites_count: number;
  published_at: string | null;
  created_at: string;
  is_favorited?: boolean;
  seller?: {
    id: string;
    average_rating: number | null;
    total_sales_count: number;
    current_fee_percent: number;
    bio: string | null;
    member: {
      client_name: string;
      tier: string;
    };
  };
}

export interface MarketplaceOrder {
  id: string;
  order_code: string;
  listing_id: string;
  buyer_cpf: string;
  buyer_name: string;
  seller_id: string;
  sale_price: number;
  fee_percent: number;
  fee_amount: number;
  seller_payout: number;
  shipping_mode: string;
  shipping_cost: number;
  tracking_code: string | null;
  status: string;
  payment_method: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  protection_ends_at: string | null;
  payout_released_at: string | null;
  payout_method: string | null;
  buyer_rating: number | null;
  buyer_review: string | null;
  created_at: string;
  admin_notes: string | null;
  dispute_status: string | null;
  // PRO hub fields
  hub_tracking_code: string | null;
  hub_received_at: string | null;
  hub_shipped_at: string | null;
  hub_tracking_to_buyer: string | null;
  inspection_id: string | null;
  inspection_result: string | null;
  listing?: {
    title: string;
    brand: string | null;
    model: string | null;
    size: string | null;
    photos: string[];
    condition: string;
    is_vault_certified?: boolean;
  };
}

export interface SellerProfile {
  id: string;
  member_id: string;
  total_sales_count: number;
  total_sales_value: number;
  current_fee_percent: number;
  average_rating: number | null;
  ratings_count: number;
  bio: string | null;
  is_active: boolean;
}

const FUNCTION_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

const ACTION_TO_FUNCTION: Record<string, string> = {
  "listings": "mk-hub", "listing-detail": "mk-hub", "my-listings": "mk-hub",
  "create-listing": "mk-hub", "update-listing": "mk-hub", "delete-listing": "mk-hub",
  "toggle-favorite": "mk-hub", "seller-profile": "mk-hub", "seller-public-profile": "mk-hub",
  "create-order": "mk-hub", "confirm-payment": "mk-hub", "my-orders": "mk-hub",
  "my-sales": "mk-hub", "update-order-status": "mk-hub", "resolve-dispute": "mk-hub",
  "rate-seller": "mk-hub", "admin-orders": "mk-hub", "open-dispute": "mk-hub",
  "chat-messages": "mk-hub", "send-message": "mk-hub",
  "make-offer": "mk-hub", "listing-offers": "mk-hub", "my-offers": "mk-hub", "respond-offer": "mk-hub",
  "seller-onboarding": "mk-hub", "seller-onboarding-status": "mk-hub",
  "price-drop-suggestions": "mk-hub",
  "seller-analytics": "mk-hub", "my-coupons": "mk-hub", "create-coupon": "mk-hub",
  "update-coupon": "mk-hub", "delete-coupon": "mk-hub", "validate-coupon": "mk-hub",
  "use-coupon": "mk-hub", "activity-feed": "mk-hub", "log-activity": "mk-hub",
};

async function marketplaceRequest(
  cpf: string,
  action: string,
  method: string = "GET",
  body?: any,
  extraParams?: Record<string, string>
) {
  const fnName = ACTION_TO_FUNCTION[action] || "marketplace-listings";
  const params = new URLSearchParams({ action, ...extraParams });
  const url = `${FUNCTION_BASE}/${fnName}?${params}`;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-client-cpf": cpf,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
    throw new Error(err.error || "Erro na requisição");
  }

  return res.json();
}

export function useMarketplace(cpf: string | null) {
  const { toast } = useToast();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [myListings, setMyListings] = useState<MarketplaceListing[]>([]);
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [currentListing, setCurrentListing] = useState<MarketplaceListing | null>(null);
  const [myOrders, setMyOrders] = useState<MarketplaceOrder[]>([]);
  const [mySales, setMySales] = useState<MarketplaceOrder[]>([]);

  const fetchListings = useCallback(
    async (filters?: { search?: string; brand?: string; size?: string; condition?: string; priceMin?: number; priceMax?: number; sort?: string; page?: number; favoritesOnly?: boolean; modality?: string; trustedOnly?: boolean }) => {
      if (!cpf) return;
      setIsLoading(true);
      try {
        const params: Record<string, string> = {};
        if (filters?.search) params.search = filters.search;
        if (filters?.brand) params.brand = filters.brand;
        if (filters?.size) params.size = filters.size;
        if (filters?.condition) params.condition = filters.condition;
        if (filters?.priceMin) params.price_min = String(filters.priceMin);
        if (filters?.priceMax) params.price_max = String(filters.priceMax);
        if (filters?.sort) params.sort = filters.sort;
        if (filters?.page) params.page = String(filters.page);
        if (filters?.favoritesOnly) params.favorites_only = "true";
        if (filters?.modality) params.modality = filters.modality;
        if (filters?.trustedOnly) params.trusted_only = "true";

        const data = await marketplaceRequest(cpf, "listings", "GET", undefined, params);
        setListings(data.listings || []);
        setTotal(data.total || 0);
      } catch (err: any) {
        console.error("Fetch listings error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [cpf]
  );

  const fetchMyListings = useCallback(async () => {
    if (!cpf) return;
    setIsLoading(true);
    try {
      const data = await marketplaceRequest(cpf, "my-listings");
      setMyListings(data.listings || []);
      setSeller(data.seller || null);
    } catch (err: any) {
      console.error("Fetch my listings error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [cpf]);

  const fetchListingDetail = useCallback(
    async (id: string) => {
      if (!cpf) return null;
      setIsLoading(true);
      try {
        const data = await marketplaceRequest(cpf, "listing-detail", "GET", undefined, { id });
        setCurrentListing(data);
        return data;
      } catch (err: any) {
        console.error("Fetch detail error:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [cpf]
  );

  const createListing = useCallback(
    async (body: any) => {
      if (!cpf) return null;
      try {
        const data = await marketplaceRequest(cpf, "create-listing", "POST", body);
        toast({ title: "Anúncio criado!", description: "Seu anúncio já está ativo no marketplace." });
        return data.listing;
      } catch (err: any) {
        toast({ title: "Erro ao criar anúncio", description: err.message, variant: "destructive" });
        return null;
      }
    },
    [cpf, toast]
  );

  const updateListing = useCallback(
    async (body: any) => {
      if (!cpf) return false;
      try {
        await marketplaceRequest(cpf, "update-listing", "PUT", body);
        toast({ title: "Anúncio atualizado!" });
        return true;
      } catch (err: any) {
        toast({ title: "Erro ao atualizar", description: err.message, variant: "destructive" });
        return false;
      }
    },
    [cpf, toast]
  );

  const deleteListing = useCallback(
    async (id: string) => {
      if (!cpf) return false;
      try {
        await marketplaceRequest(cpf, "delete-listing", "DELETE", undefined, { id });
        toast({ title: "Anúncio removido" });
        return true;
      } catch (err: any) {
        toast({ title: "Erro ao remover", description: err.message, variant: "destructive" });
        return false;
      }
    },
    [cpf, toast]
  );

  const toggleFavorite = useCallback(
    async (listingId: string) => {
      if (!cpf) return;
      try {
        const data = await marketplaceRequest(cpf, "toggle-favorite", "POST", {
          listing_id: listingId,
        });
        setListings((prev) =>
          prev.map((l) =>
            l.id === listingId ? { ...l, is_favorited: data.favorited } : l
          )
        );
        if (currentListing?.id === listingId) {
          setCurrentListing((prev) => prev ? { ...prev, is_favorited: data.favorited } : prev);
        }
      } catch (err: any) {
        console.error("Toggle fav error:", err);
      }
    },
    [cpf, currentListing]
  );

  // ===== ORDER FUNCTIONS =====

  const createOrder = useCallback(
    async (body: { listing_id: string; buyer_name: string; buyer_email?: string; buyer_phone?: string; buyer_address?: string; payment_method?: string }) => {
      if (!cpf) return null;
      try {
        const data = await marketplaceRequest(cpf, "create-order", "POST", body);
        toast({ title: "Pedido criado!", description: `Código: ${data.order?.order_code}` });
        return data.order;
      } catch (err: any) {
        toast({ title: "Erro ao comprar", description: err.message, variant: "destructive" });
        return null;
      }
    },
    [cpf, toast]
  );

  const confirmPayment = useCallback(
    async (orderId: string, paymentMethod: string, paymentId?: string) => {
      if (!cpf) return false;
      try {
        await marketplaceRequest(cpf, "confirm-payment", "PUT", {
          order_id: orderId,
          payment_method: paymentMethod,
          payment_id: paymentId,
        });
        toast({ title: "Pagamento confirmado!" });
        return true;
      } catch (err: any) {
        toast({ title: "Erro no pagamento", description: err.message, variant: "destructive" });
        return false;
      }
    },
    [cpf, toast]
  );

  const fetchMyOrders = useCallback(async () => {
    if (!cpf) return;
    try {
      const data = await marketplaceRequest(cpf, "my-orders");
      setMyOrders(data.orders || []);
    } catch (err: any) {
      console.error("Fetch my orders error:", err);
    }
  }, [cpf]);

  const fetchMySales = useCallback(async () => {
    if (!cpf) return;
    try {
      const data = await marketplaceRequest(cpf, "my-sales");
      setMySales(data.orders || []);
    } catch (err: any) {
      console.error("Fetch my sales error:", err);
    }
  }, [cpf]);

  const updateOrderStatus = useCallback(
    async (orderId: string, status: string, extra?: Record<string, any>) => {
      if (!cpf) return false;
      try {
        await marketplaceRequest(cpf, "update-order-status", "PUT", {
          order_id: orderId,
          status,
          ...extra,
        });
        toast({ title: "Status atualizado!" });
        return true;
      } catch (err: any) {
        toast({ title: "Erro ao atualizar", description: err.message, variant: "destructive" });
        return false;
      }
    },
    [cpf, toast]
  );

  const rateSeller = useCallback(
    async (orderId: string, rating: number, review?: string) => {
      if (!cpf) return false;
      try {
        await marketplaceRequest(cpf, "rate-seller", "POST", {
          order_id: orderId,
          rating,
          review,
        });
        toast({ title: "Avaliação enviada!" });
        return true;
      } catch (err: any) {
        toast({ title: "Erro ao avaliar", description: err.message, variant: "destructive" });
        return false;
      }
    },
    [cpf, toast]
  );

  // ===== OFFER FUNCTIONS =====

  const makeOffer = useCallback(
    async (body: { listing_id: string; offer_price: number; message?: string; buyer_name?: string }) => {
      if (!cpf) return false;
      try {
        await marketplaceRequest(cpf, "make-offer", "POST", body);
        toast({ title: "Oferta enviada!", description: "O vendedor tem 48h para responder." });
        return true;
      } catch (err: any) {
        toast({ title: "Erro ao enviar oferta", description: err.message, variant: "destructive" });
        return false;
      }
    },
    [cpf, toast]
  );

  const fetchListingOffers = useCallback(
    async (listingId: string) => {
      if (!cpf) return [];
      try {
        const data = await marketplaceRequest(cpf, "listing-offers", "GET", undefined, { listing_id: listingId });
        return data.offers || [];
      } catch (err: any) {
        console.error("Fetch offers error:", err);
        return [];
      }
    },
    [cpf]
  );

  const respondOffer = useCallback(
    async (offerId: string, response: string, extra?: any) => {
      if (!cpf) return false;
      try {
        await marketplaceRequest(cpf, "respond-offer", "PUT", {
          offer_id: offerId,
          response,
          ...extra,
        });
        toast({ title: response === "accept" ? "Oferta aceita!" : response === "reject" ? "Oferta recusada" : "Contra-proposta enviada!" });
        return true;
      } catch (err: any) {
        toast({ title: "Erro", description: err.message, variant: "destructive" });
        return false;
      }
    },
    [cpf, toast]
  );

  // ===== SELLER ONBOARDING =====

  const checkOnboardingStatus = useCallback(async () => {
    if (!cpf) return { onboarded: false, seller: null };
    try {
      return await marketplaceRequest(cpf, "seller-onboarding-status");
    } catch {
      return { onboarded: false, seller: null };
    }
  }, [cpf]);

  const completeOnboarding = useCallback(
    async (data: any, documents?: { front: File | null; back: File | null; selfie: File | null }) => {
      if (!cpf) return false;
      try {
        // First, upload documents if provided
        let docUrls: { id_front_url?: string; id_back_url?: string; id_selfie_url?: string } = {};
        if (documents?.front && documents?.back && documents?.selfie) {
          const { supabase } = await import("@/integrations/supabase/client");
          const timestamp = Date.now();
          const sanitizedCpf = cpf.replace(/\D/g, "");

          const uploadDoc = async (file: File, type: string) => {
            const ext = file.name.split(".").pop() || "jpg";
            const path = `${sanitizedCpf}/${type}_${timestamp}.${ext}`;
            const { error } = await supabase.storage.from("seller-kyc-docs").upload(path, file, { upsert: true });
            if (error) throw new Error(`Erro ao enviar ${type}: ${error.message}`);
            return path;
          };

          const [frontPath, backPath, selfiePath] = await Promise.all([
            uploadDoc(documents.front, "front"),
            uploadDoc(documents.back, "back"),
            uploadDoc(documents.selfie, "selfie"),
          ]);

          docUrls = {
            id_front_url: frontPath,
            id_back_url: backPath,
            id_selfie_url: selfiePath,
          };
        }

        await marketplaceRequest(cpf, "seller-onboarding", "POST", { ...data, ...docUrls });
        toast({ 
          title: "Cadastro enviado!", 
          description: "Seus documentos serão analisados pela equipe Bravenza. Você será notificado quando for aprovado." 
        });
        return true;
      } catch (err: any) {
        toast({ title: "Erro no cadastro", description: err.message, variant: "destructive" });
        return false;
      }
    },
    [cpf, toast]
  );

  const fetchPriceDropSuggestions = useCallback(async () => {
    if (!cpf) return [];
    try {
      const data = await marketplaceRequest(cpf, "price-drop-suggestions");
      return data.suggestions || [];
    } catch (err: any) {
      console.error("Fetch price drop suggestions error:", err);
      return [];
    }
  }, [cpf]);

  return {
    listings,
    myListings,
    seller,
    total,
    isLoading,
    currentListing,
    myOrders,
    mySales,
    fetchListings,
    fetchMyListings,
    fetchListingDetail,
    createListing,
    updateListing,
    deleteListing,
    toggleFavorite,
    createOrder,
    confirmPayment,
    fetchMyOrders,
    fetchMySales,
    updateOrderStatus,
    rateSeller,
    makeOffer,
    fetchListingOffers,
    respondOffer,
    checkOnboardingStatus,
    completeOnboarding,
    fetchPriceDropSuggestions,
  };
}
