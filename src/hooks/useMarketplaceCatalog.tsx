import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { getMarketplaceHeaders } from "@/hooks/marketplace/api";
import { getErrorMessage } from "@/lib/error-utils";

const BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mkv2-catalog`;
const BASE_ENGAGE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mkv2-engage`;

export interface CatalogProduct {
  id: string;
  slug: string;
  brand: string;
  model: string;
  colorway: string | null;
  sku: string | null;
  release_date: string | null;
  retail_price: number | null;
  description: string | null;
  category: string;
  images: string[];
  is_high_risk: boolean;
  total_offers: number;
  lowest_price: number | null;
  created_at: string;
}

export interface ProductOffer {
  id: string;
  product_id: string;
  seller_id: string;
  listing_id: string | null;
  size: string;
  size_system: string;
  condition: string;
  price: number;
  original_purchase_price: number | null;
  description: string | null;
  defects: string | null;
  photos: string[];
  proof_photos: string[];
  has_receipt: boolean;
  shipping_mode: string;
  pro_recommendation: string;
  status: string;
  views_count: number;
  created_at: string;
  seller?: {
    id: string;
    seller_cep: string | null;
    average_rating: number | null;
    total_sales_count: number;
    current_fee_percent: number;
    member: {
      client_name: string;
      tier: string;
    };
  };
}

export function useMarketplaceCatalog(clientCpf: string) {
  const { toast } = useToast();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [offers, setOffers] = useState<ProductOffer[]>([]);
  const [allOffers, setAllOffers] = useState<ProductOffer[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);

  const fetchProducts = useCallback(async (filters?: {
    search?: string;
    brand?: string;
    model?: string;
    category?: string;
    page?: number;
  }) => {
    setIsLoading(true);
    try {
      const h = await getMarketplaceHeaders();
      const params = new URLSearchParams({ action: "catalog-products" });
      if (filters?.search) params.set("search", filters.search);
      if (filters?.brand) params.set("brand", filters.brand);
      if (filters?.model) params.set("model", filters.model);
      if (filters?.category) params.set("category", filters.category);
      if (filters?.page) params.set("page", String(filters.page));
      const res = await fetch(`${BASE}?${params}`, { headers: h });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setProducts(data.products || []);
      setTotalProducts(data.total || 0);
    } catch (err) {
      toast({ title: "Erro", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchModels = useCallback(async (brand: string): Promise<string[]> => {
    try {
      const h = await getMarketplaceHeaders();
      const params = new URLSearchParams({ action: "catalog-models", brand });
      const res = await fetch(`${BASE}?${params}`, { headers: h });
      const data = await res.json();
      return data.models || [];
    } catch {
      return [];
    }
  }, []);

  const fetchProduct = useCallback(async (slug: string) => {
    setIsLoading(true);
    try {
      const h = await getMarketplaceHeaders();
      const params = new URLSearchParams({ action: "catalog-product", slug });
      const res = await fetch(`${BASE}?${params}`, { headers: h });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setProduct(data.product || null);
      setSizes(data.sizes || []);
      setOffers(data.offers || []);
      setAllOffers(data.offers || []);
      return data;
    } catch (err) {
      toast({ title: "Erro", description: getErrorMessage(err), variant: "destructive" });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchOffersBySize = useCallback(async (productId: string, size: string) => {
    try {
      const h = await getMarketplaceHeaders();
      const params = new URLSearchParams({ action: "catalog-offers", product_id: productId, size });
      const res = await fetch(`${BASE}?${params}`, { headers: h });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setOffers(data.offers || []);
      return data.offers || [];
    } catch (err) {
      toast({ title: "Erro", description: getErrorMessage(err), variant: "destructive" });
      return [];
    }
  }, [toast]);

  const createProduct = useCallback(async (productData: {
    brand: string;
    model: string;
    colorway?: string;
    sku?: string;
    category?: string;
    images?: string[];
    description?: string;
  }) => {
    try {
      const h = await getMarketplaceHeaders();
      const res = await fetch(`${BASE}?action=catalog-create-product`, {
        method: "POST",
        headers: h,
        body: JSON.stringify(productData),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data.product;
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
      return null;
    }
  }, [toast]);

  const createOffer = useCallback(async (offerData: {
    product_id: string;
    size: string;
    condition: string;
    price: number;
    original_purchase_price?: number;
    description?: string;
    defects?: string;
    photos: string[];
    proof_photos?: string[];
    has_receipt?: boolean;
    shipping_mode?: string;
    vault_item_id?: string;
  }) => {
    try {
      const h = await getMarketplaceHeaders();
      const res = await fetch(`${BASE}?action=catalog-create-offer`, {
        method: "POST",
        headers: h,
        body: JSON.stringify(offerData),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast({ title: "Oferta criada!", description: "Sua oferta foi publicada no marketplace." });
      return data.offer;
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
      return null;
    }
  }, [toast]);

  const searchProducts = useCallback(async (query: string) => {
    try {
      const h = await getMarketplaceHeaders();
      const params = new URLSearchParams({ action: "catalog-search", q: query });
      const res = await fetch(`${BASE}?${params}`, { headers: h });
      const data = await res.json();
      return data.products || [];
    } catch {
      return [];
    }
  }, []);

  // ===== WATCHLIST =====
  const [watchlistStatus, setWatchlistStatus] = useState<{ active: boolean; max_price: number | null }>({ active: false, max_price: null });

  const checkWatchlist = useCallback(async (productId: string, size: string) => {
    try {
      const h = await getMarketplaceHeaders();
      const params = new URLSearchParams({ action: "watchlist-check", product_id: productId, size });
      const res = await fetch(`${BASE}?${params}`, { headers: h });
      const data = await res.json();
      setWatchlistStatus({ active: !!data.active, max_price: data.max_price || null });
    } catch {
      setWatchlistStatus({ active: false, max_price: null });
    }
  }, []);

  const toggleWatchlist = useCallback(async (productId: string, size: string, maxPrice?: number | null) => {
    try {
      const h = await getMarketplaceHeaders();
      const res = await fetch(`${BASE}?action=watchlist-toggle`, {
        method: "POST",
        headers: h,
        body: JSON.stringify({ product_id: productId, size, max_price: maxPrice }),
      });
      const data = await res.json();
      setWatchlistStatus({ active: data.active, max_price: data.max_price || null });
      toast({ title: data.active ? "🔔 Alerta ativado!" : "Alerta removido" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  }, [toast]);

  // ===== COMMENTS =====
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const fetchComments = useCallback(async (productId: string) => {
    setCommentsLoading(true);
    try {
      const h = await getMarketplaceHeaders();
      const params = new URLSearchParams({ action: "product-comments", product_id: productId });
      const res = await fetch(`${BASE_ENGAGE}?${params}`, { headers: h });
      const data = await res.json();
      setComments(data.comments || []);
    } catch {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  const submitComment = useCallback(async (productId: string, content: string, parentId?: string) => {
    try {
      const h = await getMarketplaceHeaders();
      const res = await fetch(`${BASE_ENGAGE}?action=product-comment`, {
        method: "POST",
        headers: h,
        body: JSON.stringify({ product_id: productId, content, parent_id: parentId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return true;
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
      return false;
    }
  }, [toast]);

  // ===== REVIEWS =====
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsAverage, setReviewsAverage] = useState(0);
  const [reviewsTotal, setReviewsTotal] = useState(0);

  const fetchReviews = useCallback(async (productId: string) => {
    setReviewsLoading(true);
    try {
      const h = await getMarketplaceHeaders();
      const params = new URLSearchParams({ action: "product-reviews", product_id: productId });
      const res = await fetch(`${BASE_ENGAGE}?${params}`, { headers: h });
      const data = await res.json();
      setReviews(data.reviews || []);
      setReviewsAverage(data.average || 0);
      setReviewsTotal(data.total || 0);
    } catch {
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  const submitReview = useCallback(async (productId: string, rating: number, comment?: string, details?: { product_quality?: number; authenticity_score?: number; shipping_speed?: number }) => {
    try {
      const h = await getMarketplaceHeaders();
      const res = await fetch(`${BASE_ENGAGE}?action=product-review`, {
        method: "POST",
        headers: h,
        body: JSON.stringify({ product_id: productId, rating, comment, ...details }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return true;
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
      return false;
    }
  }, [toast]);

  // ===== ANALYTICS =====
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const fetchAnalytics = useCallback(async (productId: string) => {
    setAnalyticsLoading(true);
    try {
      const h = await getMarketplaceHeaders();
      const params = new URLSearchParams({ action: "product-analytics", product_id: productId });
      const res = await fetch(`${BASE_ENGAGE}?${params}`, { headers: h });
      const data = await res.json();
      setAnalytics(data.analytics || null);
    } catch {
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  return {
    products,
    product,
    offers,
    allOffers,
    sizes,
    totalProducts,
    isLoading,
    fetchProducts,
    fetchProduct,
    fetchOffersBySize,
    createProduct,
    createOffer,
    searchProducts,
    fetchModels,
    watchlistStatus,
    checkWatchlist,
    toggleWatchlist,
    comments,
    commentsLoading,
    fetchComments,
    submitComment,
    reviews,
    reviewsLoading,
    reviewsAverage,
    reviewsTotal,
    fetchReviews,
    submitReview,
    analytics,
    analyticsLoading,
    fetchAnalytics,
  };
}
