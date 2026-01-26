import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ClientAuthProvider } from "@/hooks/useClientAuth";

import Index from "./pages/Index";
import TrackingPage from "./pages/TrackingPage";
import BudgetApprovalPage from "./pages/BudgetApprovalPage";
import PaymentPage from "./pages/PaymentPage";
import NotFound from "./pages/NotFound";

// Client pages
import ClientLogin from "./pages/client/ClientLogin";
import ClientDashboard from "./pages/client/ClientDashboard";

// Admin pages
import Login from "./pages/admin/Login";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import OrdersList from "./pages/admin/OrdersList";
import NewOrder from "./pages/admin/NewOrder";
import OrderDetail from "./pages/admin/OrderDetail";
import UsersPage from "./pages/admin/UsersPage";
import SettingsPage from "./pages/admin/SettingsPage";
import EmailFlowPage from "./pages/admin/EmailFlowPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ClientAuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/rastreio/:orderId" element={<TrackingPage />} />
              <Route path="/orcamento/:token" element={<BudgetApprovalPage />} />
              <Route path="/pagamento/:token" element={<PaymentPage />} />

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
                <Route path="emails" element={<EmailFlowPage />} />
                <Route path="usuarios" element={<UsersPage />} />
                <Route path="configuracoes" element={<SettingsPage />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ClientAuthProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
