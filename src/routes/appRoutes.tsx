import { lazy } from "react";
import { Route, Navigate } from "react-router-dom";
import { ProtectedProviders } from "@/components/providers/ProtectedProviders";
import { RouteWrapper } from "@/components/routing/RouteWrapper";

const AppLayout = lazy(() => import("@/pages/app/AppLayout"));

// Reuse existing marketplace pages
const MarketplaceHomePage = lazy(() => import("@/pages/marketplace/MarketplaceHomePage"));
const MarketplaceOrdersPage2 = lazy(() => import("@/pages/marketplace/MarketplaceOrdersPage2"));
const MarketplaceOrderDetailPage = lazy(() => import("@/pages/marketplace/MarketplaceOrderDetailPage"));
const MarketplaceProfilePage = lazy(() => import("@/pages/marketplace/MarketplaceProfilePage"));
const MarketplaceFavoritesPage = lazy(() => import("@/pages/marketplace/MarketplaceFavoritesPage"));
const MarketplaceFeedPage = lazy(() => import("@/pages/marketplace/MarketplaceFeedPage"));
const MarketplaceMyStorePage = lazy(() => import("@/pages/marketplace/MarketplaceMyStorePage"));
const MarketplaceDropsPage = lazy(() => import("@/pages/marketplace/MarketplaceDropsPage"));

// Wrapper pages for vault sections
const AppVaultPage = lazy(() => import("@/pages/app/AppVaultPage"));
const AppWishlistPage = lazy(() => import("@/pages/app/AppWishlistPage"));
const AppDropsPage = lazy(() => import("@/pages/app/AppDropsPage"));
const AppCommunityPage = lazy(() => import("@/pages/app/AppCommunityPage"));
const AppMorePage = lazy(() => import("@/pages/app/AppMorePage"));
const AppNotificationsPage = lazy(() => import("@/pages/app/AppNotificationsPage"));
const AppDocumentsPage = lazy(() => import("@/pages/app/AppDocumentsPage"));
const AppMessagesPage = lazy(() => import("@/pages/app/AppMessagesPage"));
const AppAddressesPage = lazy(() => import("@/pages/app/AppAddressesPage"));
const AppSecurityPage = lazy(() => import("@/pages/app/AppSecurityPage"));

export const appRoutes = (
  <>
    <Route path="/app" element={
      <ProtectedProviders><AppLayout /></ProtectedProviders>
    }>
      <Route index element={<RouteWrapper section="Início" skeleton="dashboard"><MarketplaceHomePage /></RouteWrapper>} />
      <Route path="pedidos" element={<RouteWrapper section="Pedidos" skeleton="list"><MarketplaceOrdersPage2 /></RouteWrapper>} />
      <Route path="pedidos/:orderId" element={<RouteWrapper section="Detalhe do Pedido" skeleton="detail"><MarketplaceOrderDetailPage /></RouteWrapper>} />
      <Route path="closet" element={<RouteWrapper section="Closet" skeleton="list"><MarketplaceProfilePage /></RouteWrapper>} />
      <Route path="loja" element={<RouteWrapper section="Loja" skeleton="list"><MarketplaceMyStorePage /></RouteWrapper>} />
      <Route path="favoritos" element={<RouteWrapper section="Favoritos" skeleton="list"><MarketplaceFavoritesPage /></RouteWrapper>} />
      <Route path="feed" element={<RouteWrapper section="Feed" skeleton="feed"><MarketplaceFeedPage /></RouteWrapper>} />
      <Route path="perfil" element={<RouteWrapper section="Perfil" skeleton="detail"><MarketplaceProfilePage /></RouteWrapper>} />
      <Route path="wishlist" element={<RouteWrapper section="Wishlist" skeleton="list"><AppWishlistPage /></RouteWrapper>} />
      <Route path="vault" element={<RouteWrapper section="Vault" skeleton="dashboard"><AppVaultPage /></RouteWrapper>} />
      <Route path="drops" element={<RouteWrapper section="Drops" skeleton="feed"><AppDropsPage /></RouteWrapper>} />
      <Route path="comunidade" element={<RouteWrapper section="Comunidade" skeleton="feed"><AppCommunityPage /></RouteWrapper>} />
      <Route path="mais" element={<RouteWrapper section="Mais"><AppMorePage /></RouteWrapper>} />
      <Route path="notificacoes" element={<RouteWrapper section="Notificações" skeleton="list"><AppNotificationsPage /></RouteWrapper>} />
      <Route path="documentos" element={<RouteWrapper section="Documentos" skeleton="list"><AppDocumentsPage /></RouteWrapper>} />
      <Route path="mensagens" element={<RouteWrapper section="Mensagens" skeleton="list"><AppMessagesPage /></RouteWrapper>} />
      <Route path="enderecos" element={<RouteWrapper section="Endereços" skeleton="list"><AppAddressesPage /></RouteWrapper>} />
      <Route path="seguranca" element={<RouteWrapper section="Segurança" skeleton="detail"><AppSecurityPage /></RouteWrapper>} />
    </Route>
  </>
);
