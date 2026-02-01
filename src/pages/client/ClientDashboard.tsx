import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  LogOut, 
  Settings,
  Box,
  Search,
  Newspaper,
  Crown,
  Users,
  Shield,
  Sparkles,
  ChevronRight
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
import { OrdersTab } from "@/components/client/dashboard";
import { 
  VaultMyItemsTab, 
  VaultWishlistTab, 
  VaultIntelTab, 
  VaultClubTab, 
  VaultCommunityTab 
} from "@/components/client/vault";

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

const tierConfig = {
  member: { 
    label: "Vault Access", 
    icon: Shield, 
    color: "text-muted-foreground",
    bgColor: "bg-muted/50"
  },
  collector: { 
    label: "Vault Privilege", 
    icon: Crown, 
    color: "text-amber-500",
    bgColor: "bg-amber-500/10"
  },
  elite: { 
    label: "Vault Black", 
    icon: Sparkles, 
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
};

const tabItems = [
  { value: "pedidos", label: "Pedidos", icon: Package, vaultOnly: false },
  { value: "vault", label: "Meu Vault", icon: Box, vaultOnly: true },
  { value: "wishlist", label: "Wishlist", icon: Search, vaultOnly: true },
  { value: "intel", label: "Intel", icon: Newspaper, vaultOnly: true },
  { value: "clube", label: "Clube", icon: Crown, vaultOnly: true },
  { value: "comunidade", label: "Comunidade", icon: Users, vaultOnly: true },
];

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { session, isLoading: authLoading, logout } = useClientAuth();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);
  const [vaultMember, setVaultMember] = useState<VaultMemberData | null>(null);
  const [activeTab, setActiveTab] = useState("pedidos");

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
          supabase.rpc("get_vault_member", { p_cpf: session.cpf })
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
    
    const { data } = await supabase.rpc("get_vault_member", { p_cpf: session.cpf });
    
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

  const tierInfo = vaultMember ? tierConfig[vaultMember.tier] : null;
  const visibleTabs = tabItems.filter(tab => !tab.vaultOnly || vaultMember);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/">
                <Logo size="sm" />
              </Link>
              <div className="hidden sm:flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{session?.client_name}</span>
                {tierInfo && (
                  <Badge variant="outline" className={`${tierInfo.color} ${tierInfo.bgColor} border-0`}>
                    <tierInfo.icon className="h-3 w-3 mr-1" />
                    {tierInfo.label}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {session && <ClientNotificationBell clientCpf={session.cpf} />}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowPreferences(!showPreferences)}
                className="relative"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-4 md:py-6">
          {/* Mobile User Info */}
          <div className="sm:hidden mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Olá,</p>
                <p className="font-semibold">{session?.client_name}</p>
              </div>
              {tierInfo && (
                <Badge variant="outline" className={`${tierInfo.color} ${tierInfo.bgColor} border-0`}>
                  <tierInfo.icon className="h-3 w-3 mr-1" />
                  {tierInfo.label}
                </Badge>
              )}
            </div>
          </div>

          {/* Cashback Banner */}
          {session && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <CashbackBanner 
                clientCpf={session.cpf}
                onNavigateToReferrals={() => setActiveTab("pedidos")}
              />
            </motion.div>
          )}

          {/* Main Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <div className="sticky top-[57px] z-10 -mx-4 px-4 py-2 bg-background/95 backdrop-blur-sm border-b border-border/30">
              <TabsList className="w-full h-auto p-1 bg-card/50 border border-border/50 rounded-xl flex gap-1 overflow-x-auto">
                {visibleTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex-1 min-w-[70px] gap-1.5 py-2.5 px-3 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
                  >
                    <tab.icon className="h-4 w-4" />
                    <span className="hidden sm:inline text-sm">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Tab Contents */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                {/* Pedidos Tab */}
                <TabsContent value="pedidos" className="mt-0">
                  <div className="grid gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                      <div className="mb-4">
                        <h2 className="text-lg font-semibold">Meus Pedidos</h2>
                        <p className="text-sm text-muted-foreground">
                          Acompanhe o status de todos os seus pedidos
                        </p>
                      </div>
                      <OrdersTab 
                        orders={orders} 
                        isLoading={isLoading} 
                        sessionToken={session?.session_token || ""} 
                      />
                    </div>
                    <div className="space-y-4">
                      {!vaultMember && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-4 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold">Bravenza Vault Club</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Acesso exclusivo a curadoria global de tênis raros.
                          </p>
                          <Button asChild size="sm" variant="outline" className="w-full border-primary/50 hover:bg-primary/10">
                            <Link to="/vault">Saiba mais</Link>
                          </Button>
                        </motion.div>
                      )}
                      {session && (
                        <ReferralCard 
                          clientCpf={session.cpf}
                          clientName={session.client_name}
                        />
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Vault Tabs */}
                {vaultMember && session && (
                  <>
                    <TabsContent value="vault" className="mt-0">
                      <div className="mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                          <Box className="h-5 w-5 text-primary" />
                          Meu Vault
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Sua coleção certificada pelo Vault Club
                        </p>
                      </div>
                      <VaultMyItemsTab clientCpf={session.cpf} />
                    </TabsContent>

                    <TabsContent value="wishlist" className="mt-0">
                      <div className="mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                          <Search className="h-5 w-5 text-primary" />
                          Wishlist & Buscas
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Gerencie seus itens desejados e acompanhe buscas ativas
                        </p>
                      </div>
                      <VaultWishlistTab clientCpf={session.cpf} />
                    </TabsContent>

                    <TabsContent value="intel" className="mt-0">
                      <div className="mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                          <Newspaper className="h-5 w-5 text-primary" />
                          Intel
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Conteúdo exclusivo, alertas de mercado e guias
                        </p>
                      </div>
                      <VaultIntelTab clientCpf={session.cpf} />
                    </TabsContent>

                    <TabsContent value="clube" className="mt-0">
                      <div className="mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                          <Crown className="h-5 w-5 text-primary" />
                          Vault Club
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Seu status, benefícios, convites e progresso
                        </p>
                      </div>
                      <VaultClubTab 
                        clientCpf={session.cpf} 
                        member={vaultMember}
                        onMemberUpdate={refreshVaultMember}
                      />
                    </TabsContent>

                    <TabsContent value="comunidade" className="mt-0">
                      <div className="mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                          <Users className="h-5 w-5 text-primary" />
                          Comunidade
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Conecte-se com outros membros do Vault
                        </p>
                      </div>
                      <VaultCommunityTab 
                        clientCpf={session.cpf}
                        member={vaultMember}
                      />
                    </TabsContent>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </Tabs>

          {/* Preferences Panel */}
          <AnimatePresence>
            {showPreferences && session && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="fixed inset-x-0 bottom-0 z-30 bg-card border-t border-border shadow-lg"
              >
                <div className="container mx-auto px-4 py-4 max-h-[50vh] overflow-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Configurações</h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowPreferences(false)}>
                      ✕
                    </Button>
                  </div>
                  <ClientPreferences 
                    clientCpf={session.cpf}
                    clientName={session.client_name}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
