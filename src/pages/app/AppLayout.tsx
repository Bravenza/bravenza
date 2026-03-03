import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Search, Package, Box, Heart, Star, Store, Crown, Bell, MessageSquare,
  Users, Sparkles, Award, Settings, LogOut, Menu, FileText as FileTextIcon,
  ShoppingBag, MoreHorizontal, X, Activity, ChevronLeft, HelpCircle, DollarSign,
  ArrowRight, FileText, Shield, RefreshCw, ChevronRight
} from "lucide-react";
import { lazy, Suspense, useState } from "react";
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
  { path: "/app", label: "Explorar", mobileLabel: "Explorar", icon: Search, group: "main" },
  { path: "/app/pedidos", label: "Pedidos", mobileLabel: "Pedidos", icon: Package, group: "main" },
  { path: "/app/closet", label: "Meu Closet", mobileLabel: "Closet", icon: Box, group: "main" },
  { path: "/app/loja", label: "Minha Loja", mobileLabel: "Loja", icon: Store, group: "main" },
  { path: "/app/favoritos", label: "Favoritos", mobileLabel: "Favoritos", icon: Heart, group: "more" },
  { path: "/app/feed", label: "Feed", mobileLabel: "Feed", icon: Activity, group: "more" },
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  const mainItems = navItems.filter(i => i.group === "main");
  const vaultItems = navItems.filter(i => i.group === "vault");
  const moreItems = navItems.filter(i => i.group === "more");
  

  return (
    <CartProvider cpf={cpf}>
      <div className="min-h-screen bg-background flex flex-col theme-light">
        {/* ===== TOP HEADER ===== */}
        <header className="sticky top-0 z-50 pointer-events-none" style={{ top: "var(--safe-area-top, 0px)" }}>
          <div className="px-3 pt-2 pb-2">
          <div className="pointer-events-auto theme-dark bg-background/80 backdrop-blur-2xl border border-border/40 rounded-2xl shadow-xl shadow-black/20 ring-1 ring-white/5">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center h-12 gap-3">
                <Link to="/app" className="shrink-0 hover:opacity-80 transition-opacity">
                  <Logo size="sm" />
                </Link>

                {/* Desktop: Toggle sidebar */}
                {!isMobile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  >
                    {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                  </Button>
                )}

                <div className="flex-1" />

                {/* Right actions */}
                <div className="flex items-center gap-1">
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
                      <DropdownMenuContent align="end" className="w-56 z-[100] bg-popover border border-border shadow-xl p-0">
                        {/* User info: CPF + Email */}
                        <div className="px-4 pt-3 pb-2 border-b border-border/40">
                          <p className="text-xs text-muted-foreground font-mono">
                            {cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
                          </p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {profile?.full_name || "Usuário"}
                          </p>
                        </div>

                        {/* Account links */}
                        <div className="py-1">
                          {avatarAccountLinks.map(link => (
                            <DropdownMenuItem key={link.path} onClick={() => navigate(link.path)} className="cursor-pointer px-4 py-2 text-sm">
                              {link.label}
                            </DropdownMenuItem>
                          ))}
                        </div>

                        <DropdownMenuSeparator className="my-0" />

                        {/* Seller links */}
                        <div className="py-1">
                          {avatarSellerLinks.map(link => (
                            <DropdownMenuItem key={link.path} onClick={() => navigate(link.path)} className="cursor-pointer px-4 py-2 text-sm">
                              <span className="flex-1">{link.label}</span>
                              {link.hasArrow && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />}
                            </DropdownMenuItem>
                          ))}
                        </div>

                        <DropdownMenuSeparator className="my-0" />

                        {/* Footer: More + Logout */}
                        <div className="py-1">
                          <DropdownMenuItem onClick={() => navigate("/app/mais")} className="cursor-pointer px-4 py-2 text-sm">
                            Mais opções...
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer px-4 py-2 text-sm text-destructive focus:text-destructive">
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

        <div className="flex flex-1">
          {/* ===== DESKTOP SIDEBAR ===== */}
          {!isMobile && (
            <aside
              className={cn(
                "sticky top-[60px] h-[calc(100vh-60px)] shrink-0 transition-all duration-300 overflow-y-auto overflow-x-hidden",
                "bg-sidebar border-r border-sidebar-border",
                sidebarCollapsed ? "w-[60px]" : "w-[220px]"
              )}
            >
              <nav className="py-4 px-2 space-y-1">
                {/* User card */}
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="px-2 pb-3 mb-3 border-b border-sidebar-border"
                    >
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-9 w-9 border border-sidebar-primary/30">
                          <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "Avatar"} />
                          <AvatarFallback className="bg-sidebar-primary/15 text-sidebar-primary text-xs font-bold">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate text-sidebar-foreground">{profile?.full_name || "Usuário"}</p>
                          <p className="text-[10px] text-sidebar-foreground/50">
                            {cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.***.$3-**")}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Collapsed: show avatar only */}
                {sidebarCollapsed && (
                  <div className="flex justify-center pb-2 mb-2 border-b border-sidebar-border">
                    <Avatar className="h-8 w-8 border border-sidebar-primary/30">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "Avatar"} />
                      <AvatarFallback className="bg-sidebar-primary/15 text-sidebar-primary text-[10px] font-bold">{initials}</AvatarFallback>
                    </Avatar>
                  </div>
                )}

                {/* Main nav */}
                {mainItems.map(item => (
                  <SidebarLink key={item.path} item={item} collapsed={sidebarCollapsed} active={isActive(item.path, item.path === "/app")} />
                ))}

                {/* Vault section */}
                {isVaultMember && (
                  <>
                    {!sidebarCollapsed && (
                      <p className="px-3 pt-5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-primary/60">
                        Vault Club
                      </p>
                    )}
                    {sidebarCollapsed && <div className="my-3 mx-2 h-px bg-sidebar-border" />}
                    {vaultItems.map(item => (
                      <SidebarLink key={item.path} item={item} collapsed={sidebarCollapsed} active={isActive(item.path)} />
                    ))}
                  </>
                )}

                {/* More section */}
                {!sidebarCollapsed && (
                  <p className="px-3 pt-5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                    Mais
                  </p>
                )}
                {sidebarCollapsed && <div className="my-3 mx-2 h-px bg-sidebar-border" />}
                {moreItems.map(item => (
                  <SidebarLink key={item.path} item={item} collapsed={sidebarCollapsed} active={isActive(item.path)} />
                ))}
              </nav>
            </aside>
          )}

          {/* ===== MAIN CONTENT ===== */}
          <main className="flex-1 min-w-0">
            <Outlet context={{ cpf: profile?.cpf, profile }} />
          </main>
        </div>

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

function SidebarLink({ item, collapsed, active }: { item: NavItem; collapsed: boolean; active: boolean }) {
  return (
    <Link
      to={item.path}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-lg transition-all duration-200 group relative",
        collapsed ? "justify-center px-0 py-2.5 mx-1" : "px-3 py-2",
        active
          ? "bg-sidebar-primary/15 text-sidebar-primary font-medium"
          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
      )}
    >
      {active && !collapsed && (
        <motion.div
          layoutId="sidebarActive"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-sidebar-primary"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-sidebar-primary" : "group-hover:text-sidebar-foreground")} />
      {!collapsed && <span className="text-sm truncate">{item.label}</span>}
    </Link>
  );
}