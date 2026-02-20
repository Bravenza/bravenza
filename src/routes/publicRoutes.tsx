import { lazy } from "react";
import { Route, Navigate } from "react-router-dom";
import { ProtectedProviders } from "@/components/providers/ProtectedProviders";
import Index from "@/pages/Index";

const TrackingPortalPage = lazy(() => import("@/pages/TrackingPortalPage"));
const TrackingPage = lazy(() => import("@/pages/TrackingPage"));
const BudgetApprovalPage = lazy(() => import("@/pages/BudgetApprovalPage"));
const PaymentPage = lazy(() => import("@/pages/PaymentPage"));
const OrderRequestPage = lazy(() => import("@/pages/OrderRequestPage"));
const TermsPage = lazy(() => import("@/pages/TermsPage"));
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage"));
const ReturnsPage = lazy(() => import("@/pages/ReturnsPage"));
const InstallPage = lazy(() => import("@/pages/InstallPage"));
const AuthenticityPage = lazy(() => import("@/pages/AuthenticityPage"));
const AuthenticityInfoPage = lazy(() => import("@/pages/AuthenticityInfoPage"));
const AdGuidelinesPage = lazy(() => import("@/pages/AdGuidelinesPage"));
const MarketplaceRulesPage = lazy(() => import("@/pages/MarketplaceRulesPage"));
const VerificationPolicyPage = lazy(() => import("@/pages/VerificationPolicyPage"));

const ClientLogin = lazy(() => import("@/pages/client/ClientLogin"));
const ClientAuthPage = lazy(() => import("@/pages/client/ClientAuthPage"));
const UnifiedDashboard = lazy(() => import("@/pages/client/UnifiedDashboard"));

export const publicRoutes = (
  <>
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
    <Route path="/diretrizes-anuncio" element={<AdGuidelinesPage />} />
    <Route path="/regras-marketplace" element={<MarketplaceRulesPage />} />
    <Route path="/verificacao-autenticidade" element={<VerificationPolicyPage />} />

    {/* Client portal routes */}
    <Route path="/entrar" element={
      <ProtectedProviders><ClientAuthPage /></ProtectedProviders>
    } />
    <Route path="/minha-conta" element={
      <ProtectedProviders><UnifiedDashboard /></ProtectedProviders>
    } />
    {/* Legacy redirects */}
    <Route path="/cliente/login" element={<Navigate to="/entrar" replace />} />
    <Route path="/cliente" element={<Navigate to="/minha-conta" replace />} />
  </>
);
