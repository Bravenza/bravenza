import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ClientAuthProvider } from "@/hooks/useClientAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";

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
const InstallPage = lazy(() => import("./pages/InstallPage"));

// Lazy loaded pages - Client portal
const ClientLogin = lazy(() => import("./pages/client/ClientLogin"));
const ClientDashboard = lazy(() => import("./pages/client/ClientDashboard"));

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ClientAuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
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
                <Route path="/instalar" element={<InstallPage />} />

                {/* Client portal routes */}
                <Route path="/cliente/login" element={<ClientLogin />} />
                <Route path="/minha-conta" element={<ClientDashboard />} />

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
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <PWAInstallBanner />
          </BrowserRouter>
        </ClientAuthProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
