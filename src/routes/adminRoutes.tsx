import { lazy } from "react";
import { Route } from "react-router-dom";
import { ProtectedProviders } from "@/components/providers/ProtectedProviders";
import { RouteWrapper } from "@/components/routing/RouteWrapper";

const Login = lazy(() => import("@/pages/admin/Login"));
const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const OrdersList = lazy(() => import("@/pages/admin/OrdersList"));
const NewOrder = lazy(() => import("@/pages/admin/NewOrder"));
const OrderDetail = lazy(() => import("@/pages/admin/OrderDetail"));
const OrderRequestsPage = lazy(() => import("@/pages/admin/OrderRequestsPage"));
const UsersPage = lazy(() => import("@/pages/admin/UsersPage"));
const SettingsPage = lazy(() => import("@/pages/admin/SettingsPage"));
const SuppliersPage = lazy(() => import("@/pages/admin/SuppliersPage"));
const SupplierFormPage = lazy(() => import("@/pages/admin/SupplierFormPage"));
const ReviewsPage = lazy(() => import("@/pages/admin/ReviewsPage"));
const ReferralsPage = lazy(() => import("@/pages/admin/ReferralsPage"));
const FinancePage = lazy(() => import("@/pages/admin/FinancePage"));
const InstallmentCalculatorPage = lazy(() => import("@/pages/admin/InstallmentCalculatorPage"));
const FeaturedModelsPage = lazy(() => import("@/pages/admin/FeaturedModelsPage"));
const VaultMembersPage = lazy(() => import("@/pages/admin/VaultMembersPage"));
const VaultSearchesPage = lazy(() => import("@/pages/admin/VaultSearchesPage"));
const VaultItemsPage = lazy(() => import("@/pages/admin/VaultItemsPage"));
const VaultItemFormPage = lazy(() => import("@/pages/admin/VaultItemFormPage"));
const VaultItemDetailPage = lazy(() => import("@/pages/admin/VaultItemDetailPage"));
const VaultInvitesPage = lazy(() => import("@/pages/admin/VaultInvitesPage"));
const VaultIntelAdminPage = lazy(() => import("@/pages/admin/VaultIntelAdminPage"));
const VaultCommunityAdminPage = lazy(() => import("@/pages/admin/VaultCommunityAdminPage"));
const VaultMatchRoomsPage = lazy(() => import("@/pages/admin/VaultMatchRoomsPage"));
const VaultMatchRoomDetailPage = lazy(() => import("@/pages/admin/VaultMatchRoomDetailPage"));
const MarketplaceOrdersPage = lazy(() => import("@/pages/admin/MarketplaceOrdersPage"));
const MarketplaceInspectionPage = lazy(() => import("@/pages/admin/MarketplaceInspectionPage"));
const MarketplacePlansAdminPage = lazy(() => import("@/pages/admin/MarketplacePlansAdminPage"));
const ActivityLogsPage = lazy(() => import("@/pages/admin/ActivityLogsPage"));
const EmailFlowPage = lazy(() => import("@/pages/admin/EmailFlowPage"));
const WhatsAppFlowPage = lazy(() => import("@/pages/admin/WhatsAppFlowPage"));
const FAQManagerPage = lazy(() => import("@/pages/admin/FAQManagerPage"));
const MarketplaceAnalyticsPage = lazy(() => import("@/pages/admin/MarketplaceAnalyticsPage"));
const MarketplaceModerationPage = lazy(() => import("@/pages/admin/MarketplaceModerationPage"));
const MarketplaceDisputesPage = lazy(() => import("@/pages/admin/MarketplaceDisputesPage"));
const MarketplaceCampaignsPage = lazy(() => import("@/pages/admin/MarketplaceCampaignsPage"));
const CatalogSeedPage = lazy(() => import("@/pages/admin/CatalogSeedPage"));
const CatalogListPage = lazy(() => import("@/pages/admin/CatalogListPage"));
const CatalogDetailPage = lazy(() => import("@/pages/admin/CatalogDetailPage"));

export const adminRoutes = (
  <>
    <Route path="/admin/login" element={
      <ProtectedProviders><Login /></ProtectedProviders>
    } />
    <Route path="/admin" element={
      <ProtectedProviders><AdminLayout /></ProtectedProviders>
    }>
      <Route index element={<RouteWrapper section="Dashboard" skeleton="admin"><AdminDashboard /></RouteWrapper>} />
      <Route path="pedidos" element={<RouteWrapper section="Pedidos" skeleton="admin"><OrdersList /></RouteWrapper>} />
      <Route path="pedidos/novo" element={<RouteWrapper section="Novo Pedido" skeleton="admin"><NewOrder /></RouteWrapper>} />
      <Route path="pedidos/:orderId" element={<RouteWrapper section="Detalhes do Pedido" skeleton="detail"><OrderDetail /></RouteWrapper>} />
      <Route path="solicitacoes" element={<RouteWrapper section="Solicitações" skeleton="admin"><OrderRequestsPage /></RouteWrapper>} />
      <Route path="financeiro" element={<RouteWrapper section="Financeiro" skeleton="admin"><FinancePage /></RouteWrapper>} />
      <Route path="calculadora" element={<RouteWrapper section="Calculadora" skeleton="admin"><InstallmentCalculatorPage /></RouteWrapper>} />
      <Route path="modelos" element={<RouteWrapper section="Modelos" skeleton="admin"><FeaturedModelsPage /></RouteWrapper>} />
      <Route path="fornecedores" element={<RouteWrapper section="Fornecedores" skeleton="admin"><SuppliersPage /></RouteWrapper>} />
      <Route path="fornecedores/novo" element={<RouteWrapper section="Novo Fornecedor" skeleton="admin"><SupplierFormPage /></RouteWrapper>} />
      <Route path="fornecedores/:id/editar" element={<RouteWrapper section="Editar Fornecedor" skeleton="admin"><SupplierFormPage /></RouteWrapper>} />
      <Route path="avaliacoes" element={<RouteWrapper section="Avaliações" skeleton="admin"><ReviewsPage /></RouteWrapper>} />
      <Route path="indicacoes" element={<RouteWrapper section="Indicações" skeleton="admin"><ReferralsPage /></RouteWrapper>} />
      <Route path="usuarios" element={<RouteWrapper section="Usuários" skeleton="admin"><UsersPage /></RouteWrapper>} />
      <Route path="configuracoes" element={<RouteWrapper section="Configurações" skeleton="admin"><SettingsPage /></RouteWrapper>} />
      <Route path="logs" element={<RouteWrapper section="Logs" skeleton="admin"><ActivityLogsPage /></RouteWrapper>} />
      <Route path="faq" element={<RouteWrapper section="FAQ" skeleton="admin"><FAQManagerPage /></RouteWrapper>} />
      <Route path="emails" element={<RouteWrapper section="E-mails" skeleton="admin"><EmailFlowPage /></RouteWrapper>} />
      <Route path="whatsapp" element={<RouteWrapper section="WhatsApp" skeleton="admin"><WhatsAppFlowPage /></RouteWrapper>} />
      {/* Vault Club Admin */}
      <Route path="vault/membros" element={<RouteWrapper section="Vault Membros" skeleton="admin"><VaultMembersPage /></RouteWrapper>} />
      <Route path="vault/buscas" element={<RouteWrapper section="Vault Buscas" skeleton="admin"><VaultSearchesPage /></RouteWrapper>} />
      <Route path="vault/items" element={<RouteWrapper section="Vault Items" skeleton="admin"><VaultItemsPage /></RouteWrapper>} />
      <Route path="vault/items/novo" element={<RouteWrapper section="Novo Item" skeleton="admin"><VaultItemFormPage /></RouteWrapper>} />
      <Route path="vault/items/:id" element={<RouteWrapper section="Detalhe Item" skeleton="detail"><VaultItemDetailPage /></RouteWrapper>} />
      <Route path="vault/convites" element={<RouteWrapper section="Convites" skeleton="admin"><VaultInvitesPage /></RouteWrapper>} />
      <Route path="vault/drops" element={<RouteWrapper section="Drops Intel" skeleton="admin"><VaultIntelAdminPage /></RouteWrapper>} />
      <Route path="vault/comunidade" element={<RouteWrapper section="Comunidade" skeleton="admin"><VaultCommunityAdminPage /></RouteWrapper>} />
      <Route path="vault/marketplace" element={<RouteWrapper section="MK Pedidos" skeleton="admin"><MarketplaceOrdersPage /></RouteWrapper>} />
      <Route path="vault/marketplace/inspecao" element={<RouteWrapper section="Inspeção" skeleton="admin"><MarketplaceInspectionPage /></RouteWrapper>} />
      <Route path="vault/marketplace/planos" element={<RouteWrapper section="Planos" skeleton="admin"><MarketplacePlansAdminPage /></RouteWrapper>} />
      <Route path="vault/marketplace/analytics" element={<RouteWrapper section="Analytics" skeleton="admin"><MarketplaceAnalyticsPage /></RouteWrapper>} />
      <Route path="vault/marketplace/moderacao" element={<RouteWrapper section="Moderação" skeleton="admin"><MarketplaceModerationPage /></RouteWrapper>} />
      <Route path="vault/marketplace/disputas" element={<RouteWrapper section="Disputas" skeleton="admin"><MarketplaceDisputesPage /></RouteWrapper>} />
      <Route path="vault/marketplace/campanhas" element={<RouteWrapper section="Campanhas" skeleton="admin"><MarketplaceCampaignsPage /></RouteWrapper>} />
      <Route path="vault/matchrooms" element={<RouteWrapper section="Match Rooms" skeleton="admin"><VaultMatchRoomsPage /></RouteWrapper>} />
      <Route path="vault/matchrooms/:id" element={<RouteWrapper section="Match Room" skeleton="detail"><VaultMatchRoomDetailPage /></RouteWrapper>} />
      {/* Catálogo Oficial */}
      <Route path="catalog/seed-500" element={<RouteWrapper section="Catalog Seed" skeleton="admin"><CatalogSeedPage /></RouteWrapper>} />
      <Route path="catalog" element={<RouteWrapper section="Catálogo" skeleton="admin"><CatalogListPage /></RouteWrapper>} />
      <Route path="catalog/:sku" element={<RouteWrapper section="Detalhe Sneaker" skeleton="detail"><CatalogDetailPage /></RouteWrapper>} />
    </Route>
  </>
);
