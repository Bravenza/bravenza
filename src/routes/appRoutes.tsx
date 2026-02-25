import { lazy } from "react";
import { Route, Navigate } from "react-router-dom";
import { ProtectedProviders } from "@/components/providers/ProtectedProviders";

const AppLayout = lazy(() => import("@/pages/app/AppLayout"));

// Reuse existing marketplace pages
const MarketplaceHomePage = lazy(() => import("@/pages/marketplace/MarketplaceHomePage"));
const MarketplaceOrdersPage2 = lazy(() => import("@/pages/marketplace/MarketplaceOrdersPage2"));
const MarketplaceProfilePage = lazy(() => import("@/pages/marketplace/MarketplaceProfilePage"));
const MarketplaceFavoritesPage = lazy(() => import("@/pages/marketplace/MarketplaceFavoritesPage"));
const MarketplaceFeedPage = lazy(() => import("@/pages/marketplace/MarketplaceFeedPage"));
const MarketplaceMyStorePage = lazy(() => import("@/pages/marketplace/MarketplaceMyStorePage"));
const MarketplaceDropsPage = lazy(() => import("@/pages/marketplace/MarketplaceDropsPage"));

// Wrapper pages for vault sections (reuse existing tabs as standalone)
const AppVaultPage = lazy(() => import("@/pages/app/AppVaultPage"));
const AppWishlistPage = lazy(() => import("@/pages/app/AppWishlistPage"));
const AppDropsPage = lazy(() => import("@/pages/app/AppDropsPage"));
const AppCommunityPage = lazy(() => import("@/pages/app/AppCommunityPage"));
const AppMorePage = lazy(() => import("@/pages/app/AppMorePage"));

export const appRoutes = (
  <>
    <Route path="/app" element={
      <ProtectedProviders><AppLayout /></ProtectedProviders>
    }>
      <Route index element={<MarketplaceHomePage />} />
      <Route path="pedidos" element={<MarketplaceOrdersPage2 />} />
      <Route path="closet" element={<MarketplaceProfilePage />} />
      <Route path="loja" element={<MarketplaceMyStorePage />} />
      <Route path="favoritos" element={<MarketplaceFavoritesPage />} />
      <Route path="feed" element={<MarketplaceFeedPage />} />
      <Route path="perfil" element={<MarketplaceProfilePage />} />
      <Route path="wishlist" element={<AppWishlistPage />} />
      <Route path="vault" element={<AppVaultPage />} />
      <Route path="drops" element={<AppDropsPage />} />
      <Route path="comunidade" element={<AppCommunityPage />} />
      <Route path="mais" element={<AppMorePage />} />
    </Route>
  </>
);
