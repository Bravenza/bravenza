import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Settings,
  Package,
  Box,
  Search,
  Newspaper,
  Crown,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClientAuth } from "@/hooks/useClientAuth";
import { Footer } from "@/components/home/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Logo } from "@/components/Logo";
import { ReferralCard } from "@/components/client/ReferralCard";
import { CashbackBanner } from "@/components/client/CashbackBanner";
import { ClientNotificationBell } from "@/components/client/ClientNotificationBell";
import { ClientPreferences } from "@/components/client/ClientPreferences";
import {
  OrdersTab,
  DashboardSidebar,
  MobileNav,
  SectionHeader,
} from "@/components/client/dashboard";
import {
  VaultMyItemsTab,
  VaultWishlistTab,
  VaultIntelTab,
  VaultClubTab,
  VaultCommunityTab,
} from "@/components/client/vault";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface OrderData {
  order_id: string;
  order_type: string;
  current_status: string;
  product_name: string;
  product_brand: string | null;
  product_model: string | null;
  product_size: string | null;
  product_color: string | null;
  product_price: number | null;
  product_currency: string | null;
  payment_mode: string | null;
  sinal_value: number | null;
  sinal_paid: boolean | null;
  sinal_paid_at: string | null;
  balance_value: number | null;
  balance_paid: boolean | null;
  balance_paid_at: string | null;
  budget_status: string | null;
  budget_approval_token: string | null;
  international_tracking: string | null;
  national_tracking: string | null;
  national_carrier: string | null;
  created_at: string;
  updated_at: string;
  history: { status: string; notes: string | null; created_at: string }[];
  inspection_photos: string[] | null;
}

interface VaultMemberData {
  id: string;
  tier: "member" | "collector" | "elite";
  total_purchases: number;
  active_hunts: number;
  max_active_hunts: number;
  max_wishlist_items: number;
  invites_remaining: number;
  community_opt_in: boolean;
  stats_purchases_count_12m: number;
  stats_spend_total_12m: number;
  stats_decision_rate: number;
  stats_converted_invites: number;
}

const sectionConfig = {
  pedidos: {
    icon: Package,
    title: "Meus Pedidos",
    description: "Acompanhe o status de todos os seus pedidos",
  },
  vault: {
    icon: Box,
    title: "Meu Vault",
    description: "Sua coleção certificada pelo Vault Club",
  },
  wishlist: {
    icon: Search,
    title: "Wishlist & Buscas",
    description: "Gerencie seus itens desejados e acompanhe buscas ativas",
  },
  intel: {
    icon: Newspaper,
    title: "Intel",
    description: "Conteúdo exclusivo, alertas de mercado e guias",
  },
  clube: {
    icon: Crown,
    title: "Meu Clube",
    description: "Seu status, benefícios, convites e progresso",
  },
  comunidade: {
    icon: Users,
    title: "Comunidade",
    description: "Conecte-se com outros membros do Vault",
  },
};

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { session, isLoading: authLoading, logout } = useClientAuth();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);
  const [vaultMember, setVaultMember] = useState<VaultMemberData | null>(null);
  const [activeSection, setActiveSection] = useState("pedidos");

  useEffect(() => {
    if (!authLoading && !session) {
      navigate("/cliente/login");
    }
  }, [authLoading, session, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.session_token) return;

      try {
        const [ordersRes, memberRes] = await Promise.all([
          supabase.functions.invoke("client-orders", {
            body: { session_token: session.session_token },
          }),
          supabase.rpc("get_vault_member", { p_cpf: session.cpf }),
        ]);

        if (!ordersRes.error && ordersRes.data?.orders) {
          setOrders(ordersRes.data.orders);
        }

        if (memberRes.data && memberRes.data.length > 0) {
          setVaultMember(memberRes.data[0] as unknown as VaultMemberData);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchData();
    }
  }, [session]);

  const refreshVaultMember = async () => {
    if (!session?.cpf) return;

    const { data } = await supabase.rpc("get_vault_member", {
      p_cpf: session.cpf,
    });

    if (data && data.length > 0) {
      setVaultMember(data[0] as unknown as VaultMemberData);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/cliente/login");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const currentSection =
    sectionConfig[activeSection as keyof typeof sectionConfig];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Logo size="sm" />
            </Link>
            <div className="flex items-center gap-1">
              {session && <ClientNotificationBell clientCpf={session.cpf} />}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPreferences(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <DashboardSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          isVaultMember={!!vaultMember}
          tier={vaultMember?.tier}
          userName={session?.client_name || ""}
          className="hidden lg:block"
        />

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="p-4 lg:p-8 max-w-5xl mx-auto">
            {/* Mobile Navigation */}
            <div className="lg:hidden mb-6">
              <MobileNav
                activeSection={activeSection}
                onSectionChange={setActiveSection}
                isVaultMember={!!vaultMember}
                tier={vaultMember?.tier}
                userName={session?.client_name || ""}
              />
            </div>

            {/* Cashback Banner */}
            {session && activeSection === "pedidos" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <CashbackBanner
                  clientCpf={session.cpf}
                  onNavigateToReferrals={() => {}}
                />
              </motion.div>
            )}

            {/* Section Header */}
            {currentSection && (
              <SectionHeader
                icon={currentSection.icon}
                title={currentSection.title}
                description={currentSection.description}
              />
            )}

            {/* Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                {/* Pedidos */}
                {activeSection === "pedidos" && (
                  <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                      <OrdersTab
                        orders={orders}
                        isLoading={isLoading}
                        sessionToken={session?.session_token || ""}
                      />
                    </div>
                    <div className="space-y-4">
                      {session && (
                        <ReferralCard
                          clientCpf={session.cpf}
                          clientName={session.client_name}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Vault Tabs */}
                {vaultMember && session && (
                  <>
                    {activeSection === "vault" && (
                      <VaultMyItemsTab clientCpf={session.cpf} />
                    )}

                    {activeSection === "wishlist" && (
                      <VaultWishlistTab clientCpf={session.cpf} />
                    )}

                    {activeSection === "intel" && (
                      <VaultIntelTab clientCpf={session.cpf} />
                    )}

                    {activeSection === "clube" && (
                      <VaultClubTab
                        clientCpf={session.cpf}
                        member={vaultMember}
                        onMemberUpdate={refreshVaultMember}
                      />
                    )}

                    {activeSection === "comunidade" && (
                      <VaultCommunityTab
                        clientCpf={session.cpf}
                        member={vaultMember}
                      />
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Preferences Dialog */}
      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurações</DialogTitle>
          </DialogHeader>
          {session && (
            <ClientPreferences
              clientCpf={session.cpf}
              clientName={session.client_name}
            />
          )}
        </DialogContent>
      </Dialog>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
