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
  Shield,
  Sparkles,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClientAuth } from "@/hooks/useClientAuth";
import { Footer } from "@/components/home/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Logo } from "@/components/Logo";
import { ClientNotificationBell } from "@/components/client/ClientNotificationBell";
import { ClientPreferences } from "@/components/client/ClientPreferences";
import { OrdersTab } from "@/components/client/dashboard";
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
import { cn } from "@/lib/utils";

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
    name: "Vault Access",
    icon: Shield,
    color: "text-muted-foreground",
    bgColor: "bg-muted/30",
    borderColor: "border-muted-foreground/20",
    gradient: "from-muted/20 to-transparent",
  },
  collector: {
    name: "Vault Privilege",
    icon: Crown,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    gradient: "from-amber-500/10 to-transparent",
  },
  elite: {
    name: "Vault Black",
    icon: Sparkles,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
    gradient: "from-primary/10 to-transparent",
  },
};

const navItems = [
  { id: "pedidos", label: "Pedidos", icon: Package },
  { id: "vault", label: "Vault", icon: Box, vaultOnly: true },
  { id: "wishlist", label: "Wishlist", icon: Search, vaultOnly: true },
  { id: "intel", label: "Intel", icon: Newspaper, vaultOnly: true },
  { id: "clube", label: "Clube", icon: Crown, vaultOnly: true },
  { id: "comunidade", label: "Social", icon: Users, vaultOnly: true },
];

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { session, isLoading: authLoading, logout } = useClientAuth();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);
  const [vaultMember, setVaultMember] = useState<VaultMemberData | null>(null);
  const [activeSection, setActiveSection] = useState("pedidos");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const tierInfo = vaultMember ? tierConfig[vaultMember.tier] : null;
  const visibleNavItems = navItems.filter(
    (item) => !item.vaultOnly || vaultMember
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-14">
            <Link to="/" className="flex items-center gap-2">
              <Logo size="sm" />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {visibleNavItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              {session && <ClientNotificationBell clientCpf={session.cpf} />}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setShowPreferences(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 hidden sm:flex"
                onClick={handleLogout}
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
              {/* Mobile menu toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-border/50 bg-card/95 backdrop-blur-md overflow-hidden"
          >
            <div className="p-4 space-y-2">
              {visibleNavItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
              <div className="pt-2 border-t border-border/50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-muted-foreground hover:text-foreground hover:bg-muted/50"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Sair</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
          {/* User Hero Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div
              className={cn(
                "relative overflow-hidden rounded-2xl border p-6",
                tierInfo
                  ? `${tierInfo.borderColor} bg-gradient-to-br ${tierInfo.gradient}`
                  : "border-border/50 bg-card/50"
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {tierInfo && (
                    <div className={cn("p-3 rounded-xl", tierInfo.bgColor)}>
                      <tierInfo.icon className={cn("h-6 w-6", tierInfo.color)} />
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {tierInfo ? "Bem-vindo ao Vault Club" : "Olá"}
                    </p>
                    <h1 className="text-xl font-semibold">
                      {session?.client_name}
                    </h1>
                    {tierInfo && (
                      <p className={cn("text-sm font-medium mt-1", tierInfo.color)}>
                        {tierInfo.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                {vaultMember && (
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {vaultMember.total_purchases}
                      </p>
                      <p className="text-xs text-muted-foreground">Itens</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {vaultMember.active_hunts}/{vaultMember.max_active_hunts}
                      </p>
                      <p className="text-xs text-muted-foreground">Buscas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {vaultMember.invites_remaining}
                      </p>
                      <p className="text-xs text-muted-foreground">Convites</p>
                    </div>
                  </div>
                )}

                {/* Non-member CTA */}
                {!vaultMember && (
                  <Link
                    to="/vault"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <Crown className="h-4 w-4" />
                    <span className="text-sm font-medium">Conhecer Vault Club</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          </motion.div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {activeSection === "pedidos" && (
                <OrdersTab
                  orders={orders}
                  isLoading={isLoading}
                  sessionToken={session?.session_token || ""}
                />
              )}

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
