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
  ChevronDown,
  ShoppingBag,
  Gift,
  Award,
  Clock,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Super admin email - full Vault Club access
const SUPER_ADMIN_EMAIL = "jefferson@mindsc.com.br";

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

const vaultMenuItems = [
  { id: "vault", label: "Minha Coleção", icon: Box, description: "Itens verificados" },
  { id: "wishlist", label: "Wishlist", icon: Search, description: "Buscas ativas" },
  { id: "intel", label: "Intel", icon: Newspaper, description: "Novidades exclusivas" },
  { id: "clube", label: "Meu Status", icon: Award, description: "Tier e benefícios" },
  { id: "comunidade", label: "Comunidade", icon: Users, description: "Social" },
];

const sectionTitles: Record<string, { title: string; subtitle: string; icon: any }> = {
  pedidos: { title: "Meus Pedidos", subtitle: "Acompanhe suas importações em tempo real", icon: Package },
  vault: { title: "Minha Coleção", subtitle: "Seus itens verificados com certificado de autenticidade", icon: Box },
  wishlist: { title: "Wishlist", subtitle: "Itens que estamos buscando para você", icon: Search },
  intel: { title: "Vault Intel", subtitle: "Novidades e conteúdos exclusivos para membros", icon: Newspaper },
  clube: { title: "Meu Status", subtitle: "Seu tier, benefícios e evolução no Vault Club", icon: Award },
  comunidade: { title: "Comunidade", subtitle: "Conecte-se com outros membros", icon: Users },
};

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { session, isLoading: authLoading, logout } = useClientAuth();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);
  const [vaultMember, setVaultMember] = useState<VaultMemberData | null>(null);
  const [activeSection, setActiveSection] = useState("pedidos");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [clientEmail, setClientEmail] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Check if current user is super admin
  const isSuperAdmin = clientEmail?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
  
  // Vault Club access: super admin, vault member, or has purchases
  const hasVaultAccess = isSuperAdmin || !!vaultMember || orders.length > 0;

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
          // Get client email from response or first order
          if (ordersRes.data.client_email) {
            setClientEmail(ordersRes.data.client_email);
          }
        }

        if (memberRes.data && memberRes.data.length > 0) {
          const member = memberRes.data[0] as unknown as VaultMemberData & { client_email?: string };
          setVaultMember(member);
          // Get email from vault member if available
          if ((memberRes.data[0] as any).client_email) {
            setClientEmail((memberRes.data[0] as any).client_email);
          }
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
  const currentSection = sectionTitles[activeSection];
  const isVaultSection = activeSection !== "pedidos";
  
  // For super admin without vault member record, create virtual tier info
  const effectiveTierInfo = tierInfo || (isSuperAdmin ? {
    name: "Super Admin",
    icon: Sparkles,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
    gradient: "from-primary/10 to-transparent",
  } : null);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Premium Header */}
      <header className="border-b border-border/30 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <Logo size="sm" />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-2">
              {/* Orders Button */}
              <button
                onClick={() => setActiveSection("pedidos")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
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

              {/* Vault Club Dropdown - show if has vault access */}
              {hasVaultAccess && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
                        isVaultSection
                          ? "bg-foreground text-background shadow-lg"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <Crown className="h-4 w-4" />
                      Vault Club
                      {isSuperAdmin && <Sparkles className="h-3 w-3 ml-1 text-primary" />}
                      <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-64 p-2 bg-card border-border/50">
                    {vaultMenuItems.map((item) => (
                      <DropdownMenuItem
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
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

              {/* Non-member Vault CTA - only show if no vault access */}
              {!hasVaultAccess && (
                <Link
                  to="/vault"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
                >
                  <Gift className="h-4 w-4" />
                  Conhecer Vault Club
                </Link>
              )}
            </nav>

            <div className="flex items-center gap-1">
              {session && <ClientNotificationBell clientCpf={session.cpf} />}
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
              {/* Mobile menu toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl md:hidden"
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
            className="md:hidden border-b border-border/30 bg-card/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="p-4 space-y-1">
              {/* Orders */}
              <button
                onClick={() => {
                  setActiveSection("pedidos");
                  setMobileMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200",
                  activeSection === "pedidos"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
              >
                <ShoppingBag className="h-5 w-5" />
                <div className="flex-1">
                  <span className="font-medium">Meus Pedidos</span>
                  {orders.length > 0 && (
                    <span className="ml-2 text-xs opacity-70">({orders.length})</span>
                  )}
                </div>
              </button>

              {/* Vault Club Items - show if has vault access */}
              {hasVaultAccess && (
                <>
                  <div className="pt-3 pb-2 px-4 flex items-center gap-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Vault Club
                    </p>
                    {isSuperAdmin && <Sparkles className="h-3 w-3 text-primary" />}
                  </div>
                  {vaultMenuItems.map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveSection(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200",
                          isActive
                            ? "bg-foreground text-background"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </>
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
        <div className="max-w-5xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
          {/* Section Header */}
          <motion.div
            key={`header-${activeSection}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                "p-3 rounded-2xl",
                isVaultSection && effectiveTierInfo ? effectiveTierInfo.bgColor : "bg-muted/50"
              )}>
                <currentSection.icon className={cn(
                  "h-6 w-6",
                  isVaultSection && effectiveTierInfo ? effectiveTierInfo.color : "text-foreground"
                )} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight">{currentSection.title}</h1>
                  {isVaultSection && effectiveTierInfo && (
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-semibold",
                      effectiveTierInfo.bgColor, effectiveTierInfo.color
                    )}>
                      {effectiveTierInfo.name}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground mt-1">{currentSection.subtitle}</p>
              </div>

              {/* Quick Stats for Vault sections */}
              {isVaultSection && (vaultMember || isSuperAdmin) && (
                <div className="hidden lg:flex items-center gap-6 pr-2">
                  <div className="text-right">
                    <p className="text-2xl font-bold tabular-nums">{vaultMember?.total_purchases ?? "∞"}</p>
                    <p className="text-xs text-muted-foreground">Itens</p>
                  </div>
                  <div className="h-8 w-px bg-border/50" />
                  <div className="text-right">
                    <p className="text-2xl font-bold tabular-nums">
                      {vaultMember ? `${vaultMember.active_hunts}/${vaultMember.max_active_hunts}` : "∞"}
                    </p>
                    <p className="text-xs text-muted-foreground">Buscas</p>
                  </div>
                  <div className="h-8 w-px bg-border/50" />
                  <div className="text-right">
                    <p className="text-2xl font-bold tabular-nums">{vaultMember?.invites_remaining ?? "∞"}</p>
                    <p className="text-xs text-muted-foreground">Convites</p>
                  </div>
                </div>
              )}

              {/* Orders count for orders section */}
              {activeSection === "pedidos" && orders.length > 0 && (
                <div className="hidden lg:flex items-center gap-4 pr-2">
                  <div className="text-right">
                    <p className="text-2xl font-bold tabular-nums">{orders.length}</p>
                    <p className="text-xs text-muted-foreground">Total de pedidos</p>
                  </div>
                </div>
              )}
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

              {/* Vault sections - show if has vault access */}
              {hasVaultAccess && session && (
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

                  {activeSection === "clube" && (vaultMember || isSuperAdmin) && (
                    <VaultClubTab
                      clientCpf={session.cpf}
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

                  {activeSection === "clube" && !vaultMember && !isSuperAdmin && (
                    <div className="text-center py-12">
                      <Crown className="h-12 w-12 mx-auto text-primary/50 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Bem-vindo ao Vault Club!</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Seu acesso está sendo processado. Em breve você terá acesso a todos os benefícios exclusivos do clube.
                      </p>
                    </div>
                  )}

                  {activeSection === "comunidade" && (vaultMember || isSuperAdmin) && (
                    <VaultCommunityTab
                      clientCpf={session.cpf}
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

                  {activeSection === "comunidade" && !vaultMember && !isSuperAdmin && (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto text-primary/50 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Comunidade Vault</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Seu acesso à comunidade está sendo ativado. Em breve você poderá interagir com outros membros.
                      </p>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Preferences - Sheet on mobile, Dialog on desktop */}
      {isMobile ? (
        <Sheet open={showPreferences} onOpenChange={setShowPreferences}>
          <SheetContent 
            side="bottom" 
            className="h-[90vh] rounded-t-[20px] border-t border-border/50 p-0 flex flex-col"
          >
            {/* Drag indicator */}
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
              <p className="text-sm text-muted-foreground mt-1">
                Personalize sua experiência
              </p>
            </SheetHeader>
            
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
              {session && (
                <ClientPreferences
                  clientCpf={session.cpf}
                  clientName={session.client_name}
                  embedded
                />
              )}
            </div>
            
            {/* Safe area padding for iOS */}
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
              <p className="text-sm text-muted-foreground mt-1">
                Personalize sua experiência
              </p>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {session && (
                <ClientPreferences
                  clientCpf={session.cpf}
                  clientName={session.client_name}
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
