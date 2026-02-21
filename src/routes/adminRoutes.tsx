import { lazy } from "react";
import { Route } from "react-router-dom";
import { ProtectedProviders } from "@/components/providers/ProtectedProviders";

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


export const adminRoutes = (
  <>
    <Route path="/admin/login" element={
      <ProtectedProviders><Login /></ProtectedProviders>
    } />
    <Route path="/admin" element={
      <ProtectedProviders><AdminLayout /></ProtectedProviders>
    }>
      <Route index element={<AdminDashboard />} />
      <Route path="pedidos" element={<OrdersList />} />
      <Route path="pedidos/novo" element={<NewOrder />} />
      <Route path="pedidos/:orderId" element={<OrderDetail />} />
      <Route path="solicitacoes" element={<OrderRequestsPage />} />
      <Route path="financeiro" element={<FinancePage />} />
      <Route path="calculadora" element={<InstallmentCalculatorPage />} />
      <Route path="modelos" element={<FeaturedModelsPage />} />
      <Route path="fornecedores" element={<SuppliersPage />} />
      <Route path="fornecedores/novo" element={<SupplierFormPage />} />
      <Route path="fornecedores/:id/editar" element={<SupplierFormPage />} />
      <Route path="avaliacoes" element={<ReviewsPage />} />
      <Route path="indicacoes" element={<ReferralsPage />} />
      <Route path="usuarios" element={<UsersPage />} />
      <Route path="configuracoes" element={<SettingsPage />} />
      
      <Route path="logs" element={<ActivityLogsPage />} />
      <Route path="faq" element={<FAQManagerPage />} />
      <Route path="emails" element={<EmailFlowPage />} />
      <Route path="whatsapp" element={<WhatsAppFlowPage />} />
      {/* Vault Club Admin */}
      <Route path="vault/membros" element={<VaultMembersPage />} />
      <Route path="vault/buscas" element={<VaultSearchesPage />} />
      
      <Route path="vault/items" element={<VaultItemsPage />} />
      <Route path="vault/items/novo" element={<VaultItemFormPage />} />
      <Route path="vault/items/:id" element={<VaultItemDetailPage />} />
      <Route path="vault/convites" element={<VaultInvitesPage />} />
      <Route path="vault/drops" element={<VaultIntelAdminPage />} />
      <Route path="vault/comunidade" element={<VaultCommunityAdminPage />} />
      <Route path="vault/marketplace" element={<MarketplaceOrdersPage />} />
      <Route path="vault/marketplace/inspecao" element={<MarketplaceInspectionPage />} />
      <Route path="vault/marketplace/planos" element={<MarketplacePlansAdminPage />} />
      <Route path="vault/marketplace/analytics" element={<MarketplaceAnalyticsPage />} />
      <Route path="vault/marketplace/moderacao" element={<MarketplaceModerationPage />} />
      <Route path="vault/marketplace/disputas" element={<MarketplaceDisputesPage />} />
      <Route path="vault/marketplace/campanhas" element={<MarketplaceCampaignsPage />} />
      <Route path="vault/matchrooms" element={<VaultMatchRoomsPage />} />
      <Route path="vault/matchrooms/:id" element={<VaultMatchRoomDetailPage />} />
    </Route>
  </>
);
