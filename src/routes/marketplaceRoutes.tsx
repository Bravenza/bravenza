import { lazy } from "react";
import { Route } from "react-router-dom";
import { ProtectedProviders } from "@/components/providers/ProtectedProviders";

const MarketplaceLayout = lazy(() => import("@/pages/marketplace/MarketplaceLayout"));
const MarketplaceHomePage = lazy(() => import("@/pages/marketplace/MarketplaceHomePage"));
const MarketplaceOrdersPage2 = lazy(() => import("@/pages/marketplace/MarketplaceOrdersPage2"));
const MarketplaceFeedPage = lazy(() => import("@/pages/marketplace/MarketplaceFeedPage"));
const MarketplaceMyStorePage = lazy(() => import("@/pages/marketplace/MarketplaceMyStorePage"));
const MarketplacePlansPage = lazy(() => import("@/pages/marketplace/MarketplacePlansPage"));
const ProductDetailPage = lazy(() => import("@/pages/marketplace/ProductDetailPage"));
const DropsArticlePage = lazy(() => import("@/pages/drops/DropsArticlePage"));

export const marketplaceRoutes = (
  <>
    <Route path="/marketplace" element={
      <ProtectedProviders><MarketplaceLayout /></ProtectedProviders>
    }>
      <Route index element={<MarketplaceHomePage />} />
      <Route path="pedidos" element={<MarketplaceOrdersPage2 />} />
      <Route path="feed" element={<MarketplaceFeedPage />} />
      <Route path="loja" element={<MarketplaceMyStorePage />} />
      <Route path="planos" element={<MarketplacePlansPage />} />
    </Route>
    <Route path="/marketplace/:slug" element={
      <ProtectedProviders><ProductDetailPage /></ProtectedProviders>
    } />
    <Route path="/drops/:postId" element={
      <ProtectedProviders><DropsArticlePage /></ProtectedProviders>
    } />
  </>
);
