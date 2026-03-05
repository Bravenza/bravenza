import { lazy } from "react";
import { Route, Navigate } from "react-router-dom";
import { ProtectedProviders } from "@/components/providers/ProtectedProviders";
import { RouteWrapper } from "@/components/routing/RouteWrapper";

const AppLayout = lazy(() => import("@/pages/app/AppLayout"));
const MarketplaceCheckoutPage = lazy(() => import("@/pages/marketplace/MarketplaceCheckoutPage"));
const ProductDetailPage = lazy(() => import("@/pages/marketplace/ProductDetailPage"));
const SellerStorefrontPage = lazy(() => import("@/pages/marketplace/SellerStorefrontPage"));
const DropsArticlePage = lazy(() => import("@/pages/drops/DropsArticlePage"));
const BravenzaFullPage = lazy(() => import("@/pages/marketplace/BravenzaFullPage"));
const SellLandingPage = lazy(() => import("@/pages/marketplace/SellLandingPage"));

export const marketplaceRoutes = (
  <>
    {/* Sell landing page — public */}
    <Route path="/vender" element={
      <RouteWrapper section="Vender"><SellLandingPage /></RouteWrapper>
    } />
    {/* Redirect logged-in marketplace routes to unified /app */}
    <Route path="/marketplace" element={<Navigate to="/app" replace />} />
    <Route path="/marketplace/pedidos" element={<Navigate to="/app/pedidos" replace />} />
    <Route path="/marketplace/feed" element={<Navigate to="/app/feed" replace />} />
    <Route path="/marketplace/loja" element={<Navigate to="/app/loja" replace />} />
    <Route path="/marketplace/planos" element={<Navigate to="/app/loja" replace />} />
    <Route path="/marketplace/drops" element={<Navigate to="/app/drops" replace />} />
    <Route path="/marketplace/favoritos" element={<Navigate to="/app/favoritos" replace />} />
    <Route path="/marketplace/perfil" element={<Navigate to="/app/perfil" replace />} />
    <Route path="/marketplace/checkout" element={
      <ProtectedProviders>
        <RouteWrapper section="Checkout" skeleton="detail"><MarketplaceCheckoutPage /></RouteWrapper>
      </ProtectedProviders>
    } />

    {/* Product & Seller routes wrapped in AppLayout for consistent header/footer/bottom nav */}
    <Route element={
      <ProtectedProviders>
        <AppLayout />
      </ProtectedProviders>
    }>
      <Route path="/marketplace/product/:slug" element={
        <RouteWrapper section="Produto" skeleton="detail"><ProductDetailPage /></RouteWrapper>
      } />
      <Route path="/marketplace/:slug" element={
        <RouteWrapper section="Produto" skeleton="detail"><ProductDetailPage /></RouteWrapper>
      } />
      <Route path="/marketplace/seller/:sellerId" element={
        <RouteWrapper section="Loja do Vendedor" skeleton="list"><SellerStorefrontPage /></RouteWrapper>
      } />
    </Route>

    <Route path="/drops/:postId" element={
      <ProtectedProviders>
        <RouteWrapper section="Artigo" skeleton="detail"><DropsArticlePage /></RouteWrapper>
      </ProtectedProviders>
    } />
    <Route path="/full" element={
      <RouteWrapper section="Bravenza"><BravenzaFullPage /></RouteWrapper>
    } />
  </>
);
