import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
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

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vault-marketplace`;

async function marketplaceRequest(
  cpf: string,
  action: string,
  method: string = "GET",
  body?: any,
  extraParams?: Record<string, string>
) {
  const params = new URLSearchParams({ action, ...extraParams });
  const url = `${FUNCTION_URL}?${params}`;

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

  const fetchListings = useCallback(
    async (filters?: { brand?: string; size?: string; sort?: string; page?: number }) => {
      if (!cpf) return;
      setIsLoading(true);
      try {
        const params: Record<string, string> = {};
        if (filters?.brand) params.brand = filters.brand;
        if (filters?.size) params.size = filters.size;
        if (filters?.sort) params.sort = filters.sort;
        if (filters?.page) params.page = String(filters.page);

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
        // Update local state
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

  return {
    listings,
    myListings,
    seller,
    total,
    isLoading,
    currentListing,
    fetchListings,
    fetchMyListings,
    fetchListingDetail,
    createListing,
    updateListing,
    deleteListing,
    toggleFavorite,
  };
}
