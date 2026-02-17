import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  Settings,
  Package,
  Box,
  Search,
  Crown,
  Users,
  Sparkles,
  Menu,
  X,
  ChevronDown,
  ShoppingBag,
  Award,
  Store,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useClientSession } from "@/hooks/useClientSession";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
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
import { MarketplaceTab } from "@/components/client/vault/marketplace";
import { Loader2 } from "lucide-react";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import { OrdersTabSkeleton, SectionHeaderSkeleton } from "@/components/skeletons/DashboardSkeleton";

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
  client_email?: string;
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

const SUPER_ADMIN_EMAIL = "jefferson@mindsc.com.br";

const tierConfig = {
  member: {
    name: "Vault Access",
    color: "text-muted-foreground",
    bgColor: "bg-muted/30",
  },
  collector: {
    name: "Vault Privilege",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  elite: {
    name: "Vault Black",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
};

const vaultMenuItems = [
  { id: "vault", label: "Minha Coleção", icon: Box, description: "Itens verificados" },
  { id: "wishlist", label: "Wishlist", icon: Search, description: "Buscas ativas" },
  { id: "drops", label: "Drops", icon: Sparkles, description: "Conteúdos exclusivos" },
  { id: "clube", label: "Meu Status", icon: Award, description: "Tier e benefícios" },
  { id: "comunidade", label: "Comunidade", icon: Users, description: "Social" },
  { id: "marketplace", label: "Marketplace", icon: Store, description: "Comprar e vender" },
];

const sectionTitles: Record<string, { title: string; subtitle: string; icon: React.ElementType }> = {
  pedidos: { title: "Meus Pedidos", subtitle: "Acompanhe suas importações em tempo real", icon: Package },
  vault: { title: "Minha Coleção", subtitle: "Seus itens verificados com certificado de autenticidade", icon: Box },
  wishlist: { title: "Wishlist", subtitle: "Itens que estamos buscando para você", icon: Search },
  drops: { title: "Drops", subtitle: "Novidades, guias e conteúdos exclusivos para membros", icon: Sparkles },
  clube: { title: "Meu Status", subtitle: "Seu tier, benefícios e evolução no Vault Club", icon: Award },
  comunidade: { title: "Comunidade", subtitle: "Conecte-se com outros membros", icon: Users },
  marketplace: { title: "Marketplace", subtitle: "Compre e venda sneakers autenticados", icon: Store },
};

export default function UnifiedDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile, isLoading: sessionLoading, isVaultMember, signOut } = useClientSession();

  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vaultMember, setVaultMember] = useState<VaultMemberData | null>(null);
  const [activeSection, setActiveSection] = useState(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) return tabParam;
    // Fallback to last visited tab stored in localStorage
    const saved = localStorage.getItem("bvz_dashboard_tab");
    return saved || "pedidos";
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const isMobile = useIsMobile();
  const { saveScrollPosition, restoreScrollPosition } = useScrollRestoration();

  const handleSectionChange = useCallback((newSection: string) => {
    saveScrollPosition(activeSection);
    setActiveSection(newSection);
    setSearchParams({ tab: newSection }, { replace: true });
    localStorage.setItem("bvz_dashboard_tab", newSection);
    restoreScrollPosition(newSection);
  }, [activeSection, saveScrollPosition, restoreScrollPosition, setSearchParams]);

  // Sync tab param on change
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && tabParam !== activeSection) {
      setActiveSection(tabParam);
    }
  }, [searchParams]);

  const isSuperAdmin = user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
  const hasVaultAccess = isSuperAdmin || !!vaultMember || isVaultMember;

  useEffect(() => {
    if (!sessionLoading && !user) {
      navigate("/entrar");
    }
  }, [user, sessionLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.cpf) return;

      try {
        const { data: ordersData } = await supabase.rpc("get_client_orders");
        if (ordersData) setOrders(ordersData as unknown as OrderData[]);

        if (profile.vault_member_id || profile.cpf) {
          const { data: memberData } = await supabase
            .rpc("ensure_vault_membership", { p_cpf: profile.cpf });
          if (memberData && memberData.length > 0) {
            setVaultMember(memberData[0] as unknown as VaultMemberData);
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (profile) fetchData();
  }, [profile]);

  const refreshVaultMember = async () => {
    if (!profile?.cpf) return;
    const { data } = await supabase.rpc("ensure_vault_membership", { p_cpf: profile.cpf });
    if (data && data.length > 0) setVaultMember(data[0] as unknown as VaultMemberData);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/entrar");
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center theme-light">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const tierInfo = vaultMember ? tierConfig[vaultMember.tier] : null;
  const effectiveTierInfo = tierInfo || (isSuperAdmin ? tierConfig.elite : null);
  const currentSection = sectionTitles[activeSection] || sectionTitles.pedidos;
  const isVaultSection = activeSection !== "pedidos";

  return (
    <div className="min-h-screen bg-background flex flex-col theme-light">
      {/* Navigation Bar */}
      <div className="sticky top-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-xl theme-dark">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="transition-all duration-300 hover:opacity-80">
              <Logo size="md" />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-2">
              <button
                onClick={() => handleSectionChange("pedidos")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                  activeSection === "pedidos"
                    ? "bg-foreground text-background shadow-lg"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <ShoppingBag className="h-4 w-4" />
                Meus Pedidos
                {orders.length > 0 && (
                  <span className={cn(
                    "ml-1 px-2 py-0.5 rounded-full text-xs font-bold",
                    activeSection === "pedidos"
                      ? "bg-background/20 text-background"
                      : "bg-primary/10 text-primary"
                  )}>
                    {orders.length}
                  </span>
                )}
              </button>

              {hasVaultAccess && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                        isVaultSection
                          ? "bg-foreground text-background shadow-lg"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <Crown className="h-4 w-4" />
                      Vault Club
                      <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-64 p-2 bg-card border-border/50">
                    {vaultMenuItems.map((item) => (
                      <DropdownMenuItem
                        key={item.id}
                        onClick={() => handleSectionChange(item.id)}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                          activeSection === item.id && "bg-primary/10"
                        )}
                      >
                        <div className={cn(
                          "p-2 rounded-lg",
                          activeSection === item.id ? "bg-primary/20 text-primary" : "bg-muted/50"
                        )}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {!hasVaultAccess && (
                <Link
                  to="/vault"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
                >
                  <Crown className="h-4 w-4" />
                  Conhecer Vault Club
                </Link>
              )}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-1 ml-auto">
              {profile?.cpf && <ClientNotificationBell clientCpf={profile.cpf} />}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl"
                onClick={() => setShowPreferences(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl hidden sm:flex"
                onClick={handleLogout}
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-border/30 bg-card/95 backdrop-blur-xl overflow-hidden z-40"
          >
            <div className="p-4 space-y-1">
              <button
                onClick={() => { handleSectionChange("pedidos"); setMobileMenuOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200",
                  activeSection === "pedidos"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
              >
                <ShoppingBag className="h-5 w-5" />
                <span className="font-medium flex-1">Meus Pedidos</span>
                {orders.length > 0 && (
                  <span className="text-xs opacity-70">({orders.length})</span>
                )}
              </button>

              {hasVaultAccess && (
                <>
                  <div className="pt-3 pb-2 px-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Vault Club
                    </p>
                  </div>
                  {vaultMenuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { handleSectionChange(item.id); setMobileMenuOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200",
                        activeSection === item.id
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <div className="flex-1">
                        <span className="font-medium">{item.label}</span>
                        <p className="text-xs opacity-70 mt-0.5">{item.description}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {!hasVaultAccess && (
                <Link
                  to="/vault"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-primary bg-primary/10"
                >
                  <Crown className="h-5 w-5" />
                  <span className="font-medium">Conhecer Vault Club</span>
                </Link>
              )}

              <div className="pt-3 border-t border-border/30 mt-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left text-muted-foreground hover:text-foreground hover:bg-muted/30"
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
        <div className="max-w-5xl mx-auto px-4 lg:px-6 pt-12 pb-28 lg:pt-14 lg:pb-12">
          {/* Section Header */}
          <motion.div
            key={`header-${activeSection}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                "p-3 rounded-2xl shrink-0",
                isVaultSection && effectiveTierInfo ? effectiveTierInfo.bgColor : "bg-muted/50"
              )}>
                <currentSection.icon className={cn(
                  "h-6 w-6",
                  isVaultSection && effectiveTierInfo ? effectiveTierInfo.color : "text-foreground"
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <h1 className="text-lg sm:text-2xl font-bold tracking-tight truncate">{currentSection.title}</h1>
                  {isVaultSection && effectiveTierInfo && (
                    <Badge variant="outline" className={cn("text-xs shrink-0", effectiveTierInfo.color, effectiveTierInfo.bgColor)}>
                      {effectiveTierInfo.name}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{currentSection.subtitle}</p>
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
                  orders={orders as any}
                  isLoading={isLoading}
                  sessionToken=""
                />
              )}

              {hasVaultAccess && profile?.cpf && (
                <>
                  {activeSection === "vault" && (
                    <VaultMyItemsTab clientCpf={profile.cpf} />
                  )}
                  {activeSection === "wishlist" && (
                    <VaultWishlistTab clientCpf={profile.cpf} />
                  )}
                  {activeSection === "drops" && (
                    <VaultIntelTab clientCpf={profile.cpf} />
                  )}
                  {activeSection === "clube" && (vaultMember || isSuperAdmin) && (
                    <VaultClubTab
                      clientCpf={profile.cpf}
                      member={vaultMember || {
                        id: "super-admin",
                        tier: "elite" as const,
                        total_purchases: 0,
                        active_hunts: 0,
                        max_active_hunts: 999,
                        max_wishlist_items: 999,
                        invites_remaining: 999,
                        community_opt_in: true,
                        stats_purchases_count_12m: 0,
                        stats_spend_total_12m: 0,
                        stats_decision_rate: 100,
                        stats_converted_invites: 0,
                      }}
                      onMemberUpdate={refreshVaultMember}
                    />
                  )}
                  {activeSection === "comunidade" && (vaultMember || isSuperAdmin) && (
                    <VaultCommunityTab
                      clientCpf={profile.cpf}
                      member={vaultMember || {
                        id: "super-admin",
                        tier: "elite" as const,
                        total_purchases: 0,
                        active_hunts: 0,
                        max_active_hunts: 999,
                        max_wishlist_items: 999,
                        invites_remaining: 999,
                        community_opt_in: true,
                        stats_purchases_count_12m: 0,
                        stats_spend_total_12m: 0,
                        stats_decision_rate: 100,
                        stats_converted_invites: 0,
                      }}
                    />
                  )}
                  {activeSection === "marketplace" && (
                    <MarketplaceTab
                      clientCpf={profile.cpf}
                      isVaultMember={!!vaultMember || isSuperAdmin}
                      buyerName={profile.full_name || undefined}
                      buyerEmail={user?.email || undefined}
                      initialSearch={searchParams.get("search") || undefined}
                    />
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Preferences Modal */}
      {isMobile ? (
        <Sheet open={showPreferences} onOpenChange={setShowPreferences}>
          <SheetContent
            side="bottom"
            className="h-[90vh] rounded-t-[20px] border-t border-border/50 p-0 flex flex-col"
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>
            <SheetHeader className="px-5 pb-4 border-b border-border/30 shrink-0">
              <SheetTitle className="flex items-center gap-2.5 text-lg">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Settings className="h-5 w-5 text-primary" />
                </div>
                Configurações
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
              {profile?.cpf && (
                <ClientPreferences
                  clientCpf={profile.cpf}
                  clientName={profile.full_name || ""}
                  embedded
                />
              )}
            </div>
            <div className="h-[env(safe-area-inset-bottom,0px)]" />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
          <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/30 shrink-0">
              <DialogTitle className="flex items-center gap-2.5 text-lg">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Settings className="h-5 w-5 text-primary" />
                </div>
                Configurações
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {profile?.cpf && (
                <ClientPreferences
                  clientCpf={profile.cpf}
                  clientName={profile.full_name || ""}
                  embedded
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
