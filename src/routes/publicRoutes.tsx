import { lazy } from "react";
import { Route, Navigate } from "react-router-dom";
import { ProtectedProviders } from "@/components/providers/ProtectedProviders";
import { RouteWrapper } from "@/components/routing/RouteWrapper";
import Index from "@/pages/Index";

const TrackingPortalPage = lazy(() => import("@/pages/TrackingPortalPage"));
const TrackingPage = lazy(() => import("@/pages/TrackingPage"));
const BudgetApprovalPage = lazy(() => import("@/pages/BudgetApprovalPage"));
const PaymentPage = lazy(() => import("@/pages/PaymentPage"));
const OrderConfirmationPage = lazy(() => import("@/pages/OrderConfirmationPage"));
const CheckoutPreviewPage = lazy(() => import("@/pages/CheckoutPreviewPage"));
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
const DeliveryFlowPreview = lazy(() => import("@/pages/DeliveryFlowPreview"));
const FAQPage = lazy(() => import("@/pages/FAQPage"));
const ClientAuthPage = lazy(() => import("@/pages/client/ClientAuthPage"));

export const publicRoutes = (
  <>
    <Route path="/" element={<Index />} />
    <Route path="/solicitar" element={<RouteWrapper section="Solicitar"><OrderRequestPage /></RouteWrapper>} />
    <Route path="/rastreio" element={<RouteWrapper section="Rastreio"><TrackingPortalPage /></RouteWrapper>} />
    <Route path="/rastreio/:orderId" element={<RouteWrapper section="Rastreio" skeleton="detail"><TrackingPage /></RouteWrapper>} />
    <Route path="/orcamento/:token" element={<RouteWrapper section="Orçamento" skeleton="detail"><BudgetApprovalPage /></RouteWrapper>} />
    <Route path="/pagamento/:token" element={<RouteWrapper section="Pagamento" skeleton="detail"><PaymentPage /></RouteWrapper>} />
    <Route path="/confirmacao/:token" element={<RouteWrapper section="Confirmação" skeleton="detail"><OrderConfirmationPage /></RouteWrapper>} />
    <Route path="/checkout-preview" element={<RouteWrapper section="Preview"><CheckoutPreviewPage /></RouteWrapper>} />
    <Route path="/termos" element={<RouteWrapper section="Termos"><TermsPage /></RouteWrapper>} />
    <Route path="/politicas" element={<RouteWrapper section="Políticas"><PrivacyPage /></RouteWrapper>} />
    <Route path="/trocas-devolucoes" element={<RouteWrapper section="Trocas"><ReturnsPage /></RouteWrapper>} />
    <Route path="/instalar" element={<RouteWrapper section="Instalar"><InstallPage /></RouteWrapper>} />
    <Route path="/autenticidade" element={<RouteWrapper section="Autenticidade"><AuthenticityPage /></RouteWrapper>} />
    <Route path="/autenticidade/:code" element={<RouteWrapper section="Autenticidade" skeleton="detail"><AuthenticityPage /></RouteWrapper>} />
    <Route path="/sobre-autenticidade" element={<RouteWrapper section="Autenticidade"><AuthenticityInfoPage /></RouteWrapper>} />
    <Route path="/diretrizes-anuncio" element={<RouteWrapper section="Diretrizes"><AdGuidelinesPage /></RouteWrapper>} />
    <Route path="/regras-marketplace" element={<RouteWrapper section="Regras"><MarketplaceRulesPage /></RouteWrapper>} />
    <Route path="/verificacao-autenticidade" element={<RouteWrapper section="Verificação"><VerificationPolicyPage /></RouteWrapper>} />
    <Route path="/preview-delivery-flow" element={<RouteWrapper section="Entrega"><DeliveryFlowPreview /></RouteWrapper>} />
    <Route path="/faq" element={<RouteWrapper section="FAQ"><FAQPage /></RouteWrapper>} />

    {/* Client portal routes */}
    <Route path="/entrar" element={
      <ProtectedProviders>
        <RouteWrapper section="Login"><ClientAuthPage /></RouteWrapper>
      </ProtectedProviders>
    } />
    {/* Redirect legacy routes */}
    <Route path="/minha-conta" element={<Navigate to="/app" replace />} />
    <Route path="/cliente/login" element={<Navigate to="/entrar" replace />} />
    <Route path="/cliente" element={<Navigate to="/app" replace />} />
  </>
);
