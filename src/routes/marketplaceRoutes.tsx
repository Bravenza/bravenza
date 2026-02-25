import { lazy } from "react";
import { Route, Navigate } from "react-router-dom";
import { ProtectedProviders } from "@/components/providers/ProtectedProviders";

const MarketplaceCheckoutPage = lazy(() => import("@/pages/marketplace/MarketplaceCheckoutPage"));
const ProductDetailPage = lazy(() => import("@/pages/marketplace/ProductDetailPage"));
const SellerStorefrontPage = lazy(() => import("@/pages/marketplace/SellerStorefrontPage"));
const DropsArticlePage = lazy(() => import("@/pages/drops/DropsArticlePage"));
const BravenzaFullPage = lazy(() => import("@/pages/marketplace/BravenzaFullPage"));

export const marketplaceRoutes = (
  <>
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
      <ProtectedProviders><MarketplaceCheckoutPage /></ProtectedProviders>
    } />
    <Route path="/marketplace/product/:slug" element={
      <ProtectedProviders><ProductDetailPage /></ProtectedProviders>
    } />
    <Route path="/marketplace/:slug" element={
      <ProtectedProviders><ProductDetailPage /></ProtectedProviders>
    } />
    <Route path="/marketplace/seller/:sellerId" element={
      <ProtectedProviders><SellerStorefrontPage /></ProtectedProviders>
    } />
    <Route path="/drops/:postId" element={
      <ProtectedProviders><DropsArticlePage /></ProtectedProviders>
    } />
    <Route path="/full" element={<BravenzaFullPage />} />
  </>
);
