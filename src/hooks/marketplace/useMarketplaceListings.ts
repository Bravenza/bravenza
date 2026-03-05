import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { marketplaceRequest } from "./api";
import { getErrorMessage } from "@/lib/error-utils";
import type { MarketplaceListing, SellerProfile } from "./types";

export function useMarketplaceListings(cpf: string | null) {
  const { toast } = useToast();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [myListings, setMyListings] = useState<MarketplaceListing[]>([]);
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [currentListing, setCurrentListing] = useState<MarketplaceListing | null>(null);

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
      } catch (err) {
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
    } catch (err) {
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
      } catch (err) {
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
        const data = await marketplaceRequest(cpf, "toggle-favorite", "POST", { listing_id: listingId });
        setListings((prev) => prev.map((l) => l.id === listingId ? { ...l, is_favorited: data.favorited } : l));
        if (currentListing?.id === listingId) {
          setCurrentListing((prev) => prev ? { ...prev, is_favorited: data.favorited } : prev);
        }
      } catch (err: any) {
        console.error("Toggle fav error:", err);
      }
    },
    [cpf, currentListing]
  );

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
        await marketplaceRequest(cpf, "respond-offer", "PUT", { offer_id: offerId, response, ...extra });
        toast({ title: response === "accept" ? "Oferta aceita!" : response === "reject" ? "Oferta recusada" : "Contra-proposta enviada!" });
        return true;
      } catch (err: any) {
        toast({ title: "Erro", description: err.message, variant: "destructive" });
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

  const acceptCounter = useCallback(
    async (offerId: string) => {
      if (!cpf) return false;
      try {
        await marketplaceRequest(cpf, "accept-counter", "PUT", { offer_id: offerId });
        toast({ title: "Contra-proposta aceita!", description: "Agora você pode finalizar a compra." });
        return true;
      } catch (err: any) {
        toast({ title: "Erro", description: err.message, variant: "destructive" });
        return false;
      }
    },
    [cpf, toast]
  );

  const rejectCounter = useCallback(
    async (offerId: string) => {
      if (!cpf) return false;
      try {
        await marketplaceRequest(cpf, "reject-counter", "PUT", { offer_id: offerId });
        toast({ title: "Contra-proposta recusada" });
        return true;
      } catch (err: any) {
        toast({ title: "Erro", description: err.message, variant: "destructive" });
        return false;
      }
    },
    [cpf, toast]
  );

  const makeBundleOffer = useCallback(
    async (body: { listing_ids: string[]; prices: number[]; message?: string; buyer_name: string; discount_percent: number }) => {
      if (!cpf) return false;
      try {
        await marketplaceRequest(cpf, "bundle-offer", "POST", body);
        toast({ title: "Bundle enviado!", description: `Oferta para ${body.listing_ids.length} itens enviada.` });
        return true;
      } catch (err: any) {
        toast({ title: "Erro ao enviar bundle", description: err.message, variant: "destructive" });
        return false;
      }
    },
    [cpf, toast]
  );

  return {
    listings, myListings, seller, total, isLoading, currentListing,
    fetchListings, fetchMyListings, fetchListingDetail,
    createListing, updateListing, deleteListing, toggleFavorite,
    makeOffer, fetchListingOffers, respondOffer, fetchPriceDropSuggestions,
    acceptCounter, rejectCounter, makeBundleOffer,
  };
}
