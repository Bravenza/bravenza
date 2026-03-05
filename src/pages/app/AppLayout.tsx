import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Compass, Package, Box, Heart, Star, Store, Bell, MessageSquare,
  Users, Sparkles, Award, Settings, LogOut, FileText as FileTextIcon,
  MoreHorizontal, Newspaper, HelpCircle, DollarSign,
  ArrowRight, FileText, RefreshCw, TrendingUp
} from "lucide-react";
import { lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/Logo";
import { useClientSession } from "@/hooks/useClientSession";
import { CartProvider } from "@/hooks/useMarketplaceCart";
import { CartDrawer } from "@/components/client/vault/marketplace/CartDrawer";
import { ClientNotificationBell } from "@/components/client/ClientNotificationBell";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useVaultPrefetch } from "@/hooks/useVaultPrefetch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const Footer = lazy(() => import("@/components/home/Footer").then(m => ({ default: m.Footer })));

interface NavItem {
  path: string;
  label: string;
  mobileLabel: string;
  icon: React.ElementType;
  group?: "main" | "vault" | "more";
}

const navItems: NavItem[] = [
  { path: "/app", label: "Explorar", mobileLabel: "Explorar", icon: Compass, group: "main" },
  { path: "/app/pedidos", label: "Pedidos", mobileLabel: "Pedidos", icon: Package, group: "main" },
  { path: "/app/closet", label: "Meu Closet", mobileLabel: "Closet", icon: Box, group: "main" },
  { path: "/app/loja", label: "Minha Loja", mobileLabel: "Loja", icon: Store, group: "main" },
  { path: "/app/favoritos", label: "Favoritos", mobileLabel: "Favoritos", icon: Heart, group: "more" },
  { path: "/app/feed", label: "Feed", mobileLabel: "Feed", icon: Newspaper, group: "more" },
  { path: "/app/wishlist", label: "Wishlist", mobileLabel: "Wishlist", icon: Star, group: "vault" },
  { path: "/app/vault", label: "Meu Status", mobileLabel: "Status", icon: Award, group: "vault" },
  { path: "/app/drops", label: "Drops & Intel", mobileLabel: "Drops", icon: Sparkles, group: "vault" },
  { path: "/app/comunidade", label: "Comunidade", mobileLabel: "Social", icon: Users, group: "vault" },
  { path: "/vender", label: "Quero Vender", mobileLabel: "Vender", icon: DollarSign, group: "more" },
  { path: "/app/perfil", label: "Meus Dados", mobileLabel: "Dados", icon: Settings, group: "more" },
  { path: "/faq", label: "Perguntas Frequentes", mobileLabel: "FAQ", icon: HelpCircle, group: "more" },
];

const bottomTabs = [
  { path: "/app", label: "Explorar", icon: Search, exact: true },
  { path: "/app/pedidos", label: "Pedidos", icon: Package },
  { path: "/app/closet", label: "Closet", icon: Box },
  { path: "/app/loja", label: "Loja", icon: Store },
  { path: "/app/mais", label: "Mais", icon: MoreHorizontal, isMore: true },
];

// ===== Grouped menu items for "Mais opções" page/sheet =====
interface MenuGroup {
  label?: string;
  items: { path: string; label: string; icon: React.ElementType; highlight?: boolean }[];
}

const getMenuGroups = (isVaultMember: boolean): MenuGroup[] => [
  {
    items: [
      { path: "/app/notificacoes", label: "Notificações", icon: Bell },
      { path: "/app/pedidos", label: "Compras", icon: Package },
      { path: "/app/favoritos", label: "Favoritos", icon: Heart },
    ],
  },
  {
    items: [
      { path: "/vender", label: "Quero vender meu sneaker", icon: DollarSign, highlight: true },
      { path: "/app", label: "Market", icon: Store },
      { path: "/app/loja", label: "Vendas", icon: Activity },
    ],
  },
  {
    items: [
      { path: "/app/mensagens", label: "Mensagens", icon: MessageSquare },
      { path: "/app/closet", label: "Closet", icon: Box },
      { path: "/app/documentos", label: "Documentos", icon: FileTextIcon },
      { path: "/app/feed", label: "Feed", icon: Activity },
    ],
  },
  ...(isVaultMember
    ? [{
        items: [
          { path: "/app/wishlist", label: "Wishlist", icon: Star },
          { path: "/app/vault", label: "Meu Status", icon: Award },
          { path: "/app/drops", label: "Drops & Intel", icon: Sparkles },
          { path: "/app/comunidade", label: "Comunidade", icon: Users },
        ],
      }]
    : []),
  {
    items: [
      { path: "/faq", label: "Como a Bravenza funciona?", icon: HelpCircle },
    ],
  },
  {
    items: [
      { path: "/termos", label: "Termos de Uso", icon: FileText },
      { path: "/trocas-devolucoes", label: "Trocas e Devoluções", icon: RefreshCw },
    ],
  },
  {
    items: [
      { path: "/app/perfil", label: "Configurações", icon: Settings },
    ],
  },
];

// ===== Avatar dropdown items (matching Droper layout) =====
const avatarAccountLinks = [
  { path: "/app/perfil", label: "Meus dados" },
  { path: "/app/pedidos", label: "Compras" },
  { path: "/app/favoritos", label: "Favoritos" },
  { path: "/app/closet", label: "Closet" },
];

const avatarSellerLinks = [
  { path: "/vender", label: "Quero vender", hasArrow: true },
  { path: "/app/loja", label: "Minha Loja" },
  { path: "/app", label: "Market" },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut, isVaultMember } = useClientSession();
  const isMobile = useIsMobile();
  const cpf = profile?.cpf || null;
  

  // Prefetch vault data for members so navigation feels instant
  useVaultPrefetch(cpf, isVaultMember);

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const handleLogout = async () => {
    await signOut();
    navigate("/entrar");
  };


  return (
    <CartProvider cpf={cpf}>
      <div className="min-h-screen bg-background flex flex-col theme-light">
        {/* ===== TOP HEADER ===== */}
        <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
          <div className="px-3 pt-2 pb-2">
          <div className="pointer-events-auto theme-dark bg-background/80 backdrop-blur-2xl border border-border/40 rounded-2xl shadow-xl shadow-black/20 ring-1 ring-white/5">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center h-12 gap-3">
                <Link to="/app" className="shrink-0 hover:opacity-80 transition-opacity">
                  <Logo size="sm" />
                </Link>

                {/* Desktop inline nav */}
                {!isMobile && (
                  <nav className="hidden md:flex items-center gap-1 ml-4">
                    {[
                      { path: "/app", label: "Explorar", icon: Search, exact: true },
                      { path: "/app/pedidos", label: "Pedidos", icon: Package },
                      { path: "/app/closet", label: "Closet", icon: Box },
                      { path: "/app/loja", label: "Loja", icon: Store },
                    ].map(item => {
                      const active = item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200",
                            active
                              ? "text-primary bg-primary/10"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          )}
                        >
                          <item.icon className="h-3.5 w-3.5" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </nav>
                )}

                <div className="flex-1" />

                {/* Right actions */}
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" asChild>
                    <Link to="/app/favoritos">
                      <Heart className="h-4 w-4" />
                    </Link>
                  </Button>
                  <CartDrawer />
                  {profile?.cpf && <ClientNotificationBell clientCpf={profile.cpf} />}

                  {/* ===== AVATAR DROPDOWN (desktop) ===== */}
                  {!isMobile && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                          <Avatar className="h-8 w-8 border border-primary/30 cursor-pointer hover:border-primary/60 transition-colors">
                            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "Avatar"} />
                            <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">{initials}</AvatarFallback>
                          </Avatar>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" sideOffset={8} className="w-64 z-[100] bg-popover/95 backdrop-blur-xl border border-border/50 shadow-2xl shadow-black/15 rounded-xl p-0">
                        {/* User identity header */}
                        <div className="px-4 pt-4 pb-3 flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-border/60 shrink-0">
                            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "Avatar"} />
                            <AvatarFallback className="bg-muted text-muted-foreground text-sm font-semibold">{initials}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">
                              {profile?.full_name || "Usuário"}
                            </p>
                            <p className="text-[11px] text-muted-foreground/70 font-mono">
                              {cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.•••.$3-••")}
                            </p>
                          </div>
                        </div>

                        <DropdownMenuSeparator className="my-0 bg-border/30" />

                        <div className="p-1">
                          <DropdownMenuItem onClick={() => navigate("/app/perfil")} className="cursor-pointer px-3 py-2 rounded-md text-[13px] gap-2.5">
                            <Settings className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                            Meus dados
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate("/app/pedidos")} className="cursor-pointer px-3 py-2 rounded-md text-[13px] gap-2.5">
                            <Package className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                            Compras
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate("/app/favoritos")} className="cursor-pointer px-3 py-2 rounded-md text-[13px] gap-2.5">
                            <Heart className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                            Favoritos
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate("/app/closet")} className="cursor-pointer px-3 py-2 rounded-md text-[13px] gap-2.5">
                            <Box className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                            Closet
                          </DropdownMenuItem>
                        </div>

                        <DropdownMenuSeparator className="my-0 bg-border/30" />

                        <div className="p-1">
                          <DropdownMenuItem onClick={() => navigate("/vender")} className="cursor-pointer px-3 py-2 rounded-md text-[13px] gap-2.5">
                            <DollarSign className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                            <span className="flex-1">Quero vender</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate("/app/loja")} className="cursor-pointer px-3 py-2 rounded-md text-[13px] gap-2.5">
                            <Store className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                            Minha Loja
                          </DropdownMenuItem>
                        </div>

                        <DropdownMenuSeparator className="my-0 bg-border/30" />

                        <div className="p-1">
                          <DropdownMenuItem onClick={() => navigate("/app/mais")} className="cursor-pointer px-3 py-2 rounded-md text-[13px] gap-2.5">
                            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                            Mais opções
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer px-3 py-2 rounded-md text-[13px] gap-2.5 text-destructive/80 focus:text-destructive">
                            <LogOut className="h-3.5 w-3.5 shrink-0" />
                            Sair
                          </DropdownMenuItem>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </div>
          </div>
          </div>
        </header>

        {/* ===== MAIN CONTENT ===== */}
        <main className="flex-1 min-w-0" style={{ paddingTop: "calc(64px + env(safe-area-inset-top, 0px))" }}>
          <Outlet context={{ cpf: profile?.cpf, profile }} />
        </main>

        {/* Footer - desktop only */}
        {!isMobile && (
          <Suspense fallback={null}>
            <Footer />
          </Suspense>
        )}

        {/* ===== MOBILE BOTTOM TAB BAR ===== */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-2 safe-area-bottom">
            <nav className="rounded-2xl bg-card/95 backdrop-blur-xl border border-border/30 shadow-lg shadow-black/15">
              <div className="flex items-stretch justify-around px-1">
                {bottomTabs.map(tab => {
                  const active = tab.isMore
                    ? location.pathname.startsWith("/app/mais")
                    : tab.exact
                      ? location.pathname === tab.path
                      : location.pathname.startsWith(tab.path);

                  return (
                    <button
                      key={tab.path}
                      onClick={() => {
                        if (tab.isMore) {
                          navigate("/app/mais");
                        } else {
                          navigate(tab.path);
                        }
                      }}
                      className={cn(
                        "flex items-center justify-center py-3 px-3 min-h-[44px] flex-1 rounded-xl transition-all duration-200 relative active:scale-90",
                        active
                          ? "text-primary"
                          : "text-muted-foreground active:text-foreground"
                      )}
                    >
                      {active && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-1 rounded-xl bg-primary/10"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <tab.icon className="h-5 w-5 relative z-10" strokeWidth={active ? 2.5 : 1.8} />
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>
        )}

      </div>
    </CartProvider>
  );
}
