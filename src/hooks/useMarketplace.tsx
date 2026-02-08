// Re-export types and hooks from the split marketplace modules
// This file acts as a backward-compatible facade

export type { MarketplaceListing, MarketplaceOrder, SellerProfile } from "./marketplace/types";
export { marketplaceRequest } from "./marketplace/api";

import { useMarketplaceListings } from "./marketplace/useMarketplaceListings";
import { useMarketplaceOrders } from "./marketplace/useMarketplaceOrders";
import { useMarketplaceSeller } from "./marketplace/useMarketplaceSeller";

/**
 * Combined marketplace hook — backward-compatible facade.
 * For new code, prefer importing individual hooks from @/hooks/marketplace.
 */
export function useMarketplace(cpf: string | null) {
  const listingsHook = useMarketplaceListings(cpf);
  const ordersHook = useMarketplaceOrders(cpf);
  const sellerHook = useMarketplaceSeller(cpf);

  return {
    ...listingsHook,
    ...ordersHook,
    ...sellerHook,
  };
}
