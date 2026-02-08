import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import { ClientAuthProvider } from "@/hooks/useClientAuth";
import { ClientSessionProvider } from "@/hooks/useClientSession";
import { Skeleton } from "@/components/ui/skeleton";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { usePWAOptimizations } from "@/hooks/usePWAOptimizations";
import { SkipToContent } from "@/components/a11y/SkipToContent";

// Eagerly loaded pages (critical path)
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy loaded pages - Public
const TrackingPortalPage = lazy(() => import("./pages/TrackingPortalPage"));
const TrackingPage = lazy(() => import("./pages/TrackingPage"));
const BudgetApprovalPage = lazy(() => import("./pages/BudgetApprovalPage"));
const PaymentPage = lazy(() => import("./pages/PaymentPage"));
const OrderRequestPage = lazy(() => import("./pages/OrderRequestPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const ReturnsPage = lazy(() => import("./pages/ReturnsPage"));
const InstallPage = lazy(() => import("./pages/InstallPage"));
const AuthenticityPage = lazy(() => import("./pages/AuthenticityPage"));
const AuthenticityInfoPage = lazy(() => import("./pages/AuthenticityInfoPage"));

// Lazy loaded pages - Vault Club
const VaultLandingPage = lazy(() => import("./pages/vault/VaultLandingPage"));
const VaultWaitlistPage = lazy(() => import("./pages/vault/VaultWaitlistPage"));
const VaultRedeemPage = lazy(() => import("./pages/vault/VaultRedeemPage"));
const VaultMatchRoom = lazy(() => import("./pages/vault/VaultMatchRoom"));
const VaultProfilePage = lazy(() => import("./pages/vault/VaultProfilePage"));
const ProductDetailPage = lazy(() => import("./pages/marketplace/ProductDetailPage"));

// Lazy loaded pages - Client portal
const ClientLogin = lazy(() => import("./pages/client/ClientLogin"));
const ClientDashboard = lazy(() => import("./pages/client/ClientDashboard"));
const ClientAuthPage = lazy(() => import("./pages/client/ClientAuthPage"));
const UnifiedDashboard = lazy(() => import("./pages/client/UnifiedDashboard"));

// Lazy loaded pages - Admin (largest bundle, load on demand)
const Login = lazy(() => import("./pages/admin/Login"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const OrdersList = lazy(() => import("./pages/admin/OrdersList"));
const NewOrder = lazy(() => import("./pages/admin/NewOrder"));
const OrderDetail = lazy(() => import("./pages/admin/OrderDetail"));
const OrderRequestsPage = lazy(() => import("./pages/admin/OrderRequestsPage"));
const UsersPage = lazy(() => import("./pages/admin/UsersPage"));
const SettingsPage = lazy(() => import("./pages/admin/SettingsPage"));
const SuppliersPage = lazy(() => import("./pages/admin/SuppliersPage"));
const ReviewsPage = lazy(() => import("./pages/admin/ReviewsPage"));
const ReferralsPage = lazy(() => import("./pages/admin/ReferralsPage"));
const FinancePage = lazy(() => import("./pages/admin/FinancePage"));
const InstallmentCalculatorPage = lazy(() => import("./pages/admin/InstallmentCalculatorPage"));
const FeaturedModelsPage = lazy(() => import("./pages/admin/FeaturedModelsPage"));
const VaultMembersPage = lazy(() => import("./pages/admin/VaultMembersPage"));
const VaultSearchesPage = lazy(() => import("./pages/admin/VaultSearchesPage"));
const VaultMatchRoomsPage = lazy(() => import("./pages/admin/VaultMatchRoomsPage"));
const VaultItemsPage = lazy(() => import("./pages/admin/VaultItemsPage"));
const VaultInvitesPage = lazy(() => import("./pages/admin/VaultInvitesPage"));
const VaultIntelAdminPage = lazy(() => import("./pages/admin/VaultIntelAdminPage"));
const VaultCommunityAdminPage = lazy(() => import("./pages/admin/VaultCommunityAdminPage"));
const MarketplaceOrdersPage = lazy(() => import("./pages/admin/MarketplaceOrdersPage"));
const MarketplaceInspectionPage = lazy(() => import("./pages/admin/MarketplaceInspectionPage"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="space-y-4 w-full max-w-md px-4">
      <Skeleton className="h-8 w-32 mx-auto" />
      <Skeleton className="h-4 w-48 mx-auto" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  </div>
);

// Optimized QueryClient with caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// PWA App Shell component
function AppShell({ children }: { children: React.ReactNode }) {
  usePWAOptimizations();
  return <>{children}</>;
}

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ClientAuthProvider>
            <ClientSessionProvider>
              <Toaster />
              <Sonner />
              <OfflineIndicator />
              <BrowserRouter>
                <SkipToContent />
                <AppShell>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Index />} />
                    <Route path="/solicitar" element={<OrderRequestPage />} />
                    <Route path="/rastreio" element={<TrackingPortalPage />} />
                    <Route path="/rastreio/:orderId" element={<TrackingPage />} />
                    <Route path="/orcamento/:token" element={<BudgetApprovalPage />} />
                    <Route path="/pagamento/:token" element={<PaymentPage />} />
                    <Route path="/termos" element={<TermsPage />} />
                    <Route path="/politicas" element={<PrivacyPage />} />
                    <Route path="/trocas-devolucoes" element={<ReturnsPage />} />
                    <Route path="/instalar" element={<InstallPage />} />
                    <Route path="/autenticidade" element={<AuthenticityPage />} />
                    <Route path="/autenticidade/:code" element={<AuthenticityPage />} />
                    <Route path="/sobre-autenticidade" element={<AuthenticityInfoPage />} />
                    <Route path="/marketplace/:slug" element={<ProductDetailPage />} />

                    {/* Vault Club public routes */}
                    <Route path="/vault" element={<VaultLandingPage />} />
                    <Route path="/vault/waitlist" element={<VaultWaitlistPage />} />
                    <Route path="/vault/redeem" element={<VaultRedeemPage />} />
                    <Route path="/vault/perfil" element={<VaultProfilePage />} />
                    <Route path="/vault/app/match/:matchRoomId" element={<VaultMatchRoom />} />
                    {/* Redirect old vault/app routes to unified dashboard */}
                    <Route path="/vault/app" element={<Navigate to="/minha-conta" replace />} />
                    <Route path="/vault/app/*" element={<Navigate to="/minha-conta" replace />} />

                    {/* Client portal routes - New unified system */}
                    <Route path="/entrar" element={<ClientAuthPage />} />
                    <Route path="/minha-conta" element={<UnifiedDashboard />} />
                    {/* Legacy routes - redirect to new system */}
                    <Route path="/cliente/login" element={<Navigate to="/entrar" replace />} />
                    <Route path="/cliente" element={<Navigate to="/minha-conta" replace />} />

                    {/* Admin routes */}
                    <Route path="/admin/login" element={<Login />} />
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<AdminDashboard />} />
                      <Route path="pedidos" element={<OrdersList />} />
                      <Route path="pedidos/novo" element={<NewOrder />} />
                      <Route path="pedidos/:orderId" element={<OrderDetail />} />
                      <Route path="solicitacoes" element={<OrderRequestsPage />} />
                      <Route path="financeiro" element={<FinancePage />} />
                      <Route path="calculadora" element={<InstallmentCalculatorPage />} />
                      <Route path="modelos" element={<FeaturedModelsPage />} />
                      <Route path="fornecedores" element={<SuppliersPage />} />
                      <Route path="avaliacoes" element={<ReviewsPage />} />
                      <Route path="indicacoes" element={<ReferralsPage />} />
                      <Route path="usuarios" element={<UsersPage />} />
                      <Route path="configuracoes" element={<SettingsPage />} />
                      {/* Vault Club Admin */}
                      <Route path="vault/membros" element={<VaultMembersPage />} />
                      <Route path="vault/buscas" element={<VaultSearchesPage />} />
                      <Route path="vault/match-rooms" element={<VaultMatchRoomsPage />} />
                      <Route path="vault/items" element={<VaultItemsPage />} />
                      <Route path="vault/convites" element={<VaultInvitesPage />} />
                      <Route path="vault/intel" element={<VaultIntelAdminPage />} />
                      <Route path="vault/comunidade" element={<VaultCommunityAdminPage />} />
                      <Route path="vault/marketplace" element={<MarketplaceOrdersPage />} />
                      <Route path="vault/marketplace/inspecao" element={<MarketplaceInspectionPage />} />
                    </Route>

                    {/* 404 */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
                </AppShell>
                <PWAInstallBanner />
              </BrowserRouter>
            </ClientSessionProvider>
          </ClientAuthProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
