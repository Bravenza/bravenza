import { useInfiniteQuery } from "@tanstack/react-query";
import { getMarketplaceHeaders } from "@/hooks/marketplace/api";
import { STALE } from "@/lib/query-config";
import type { CatalogProduct } from "@/hooks/useMarketplaceCatalog";

const BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mkv2-catalog`;

interface CatalogFilters {
  search?: string;
  brand?: string;
  category?: string;
  limit?: number;
}

interface CatalogPage {
  products: CatalogProduct[];
  total: number;
  next_cursor: string | null;
  has_more: boolean;
}

/**
 * Cursor-based infinite query for the marketplace catalog.
 *
 * Usage:
 * ```tsx
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteCatalog({ brand: "Nike" });
 * const allProducts = data?.pages.flatMap(p => p.products) ?? [];
 * ```
 */
export function useInfiniteCatalog(filters: CatalogFilters = {}) {
  return useInfiniteQuery<CatalogPage>({
    queryKey: ["catalog-infinite", filters.search, filters.brand, filters.category],
    queryFn: async ({ pageParam }) => {
      const h = await getMarketplaceHeaders();
      const params = new URLSearchParams({ action: "catalog-products" });
      if (filters.search) params.set("search", filters.search);
      if (filters.brand) params.set("brand", filters.brand);
      if (filters.category) params.set("category", filters.category);
      if (filters.limit) params.set("limit", String(filters.limit));
      if (pageParam) params.set("cursor", pageParam as string);

      const res = await fetch(`${BASE}?${params}`, { headers: h });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data as CatalogPage;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor,
    staleTime: STALE.SEMI_STATIC,
  });
}
