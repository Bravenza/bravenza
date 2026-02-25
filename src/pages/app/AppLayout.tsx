import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Search, Package, Box, Heart, Star, Store, Crown, 
  Users, Sparkles, Award, Settings, LogOut, Menu,
  ShoppingBag, MoreHorizontal, X, Activity, ChevronLeft, HelpCircle, DollarSign
} from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Logo } from "@/components/Logo";
import { useClientSession } from "@/hooks/useClientSession";
import { CartProvider } from "@/hooks/useMarketplaceCart";
import { CartDrawer } from "@/components/client/vault/marketplace/CartDrawer";
import { ClientNotificationBell } from "@/components/client/ClientNotificationBell";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut, isVaultMember } = useClientSession();
  const isMobile = useIsMobile();
  const cpf = profile?.cpf || null;
  const [moreOpen, setMoreOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
        <header className="sticky top-0 z-50 theme-dark" style={{ top: "var(--safe-area-top, 0px)" }}>
          <div className="h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          <div className="bg-background/95 backdrop-blur-xl border-b border-border/20">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center h-14 gap-3">
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
                  {!isMobile && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive" onClick={handleLogout} title="Sair">
                      <LogOut className="h-4 w-4" />
                    </Button>
                  )}
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
                "sticky top-[57px] h-[calc(100vh-57px)] shrink-0 transition-all duration-300 overflow-y-auto overflow-x-hidden",
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
          <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-card/98 backdrop-blur-xl safe-area-bottom">
            <div className="flex items-stretch justify-around">
              {bottomTabs.map(tab => {
                const active = tab.isMore
                  ? moreOpen
                  : tab.exact
                    ? location.pathname === tab.path
                    : location.pathname.startsWith(tab.path);

                return (
                  <button
                    key={tab.path}
                    onClick={() => {
                      if (tab.isMore) {
                        setMoreOpen(true);
                      } else {
                        navigate(tab.path);
                        setMoreOpen(false);
                      }
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center gap-0.5 py-2 px-2 min-h-[52px] flex-1 transition-colors relative",
                      active ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {active && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <tab.icon className="h-5 w-5" strokeWidth={active ? 2.5 : 1.8} />
                    <span className={cn("text-[10px]", active ? "font-semibold" : "font-medium")}>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        {/* ===== MOBILE "MAIS" SHEET ===== */}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetContent side="bottom" className="rounded-t-[20px] border-t border-border/50 p-0 max-h-[70vh]">
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>
            <SheetHeader className="px-5 pb-3">
              <SheetTitle className="text-base">Mais opções</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-6 space-y-1">
              {moreItems.map(item => (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setMoreOpen(false); }}
                  className={cn(
                    "flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                    isActive(item.path) ? "bg-primary/10 text-primary" : "text-foreground hover:bg-secondary"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </button>
              ))}

              {isVaultMember && (
                <>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    Vault Club
                  </p>
                  {vaultItems.map(item => (
                    <button
                      key={item.path}
                      onClick={() => { navigate(item.path); setMoreOpen(false); }}
                      className={cn(
                        "flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                        isActive(item.path) ? "bg-primary/10 text-primary" : "text-foreground hover:bg-secondary"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </button>
                  ))}
                </>
              )}

              <div className="pt-3 border-t border-border/30 mt-3">
                <button
                  onClick={() => { setMoreOpen(false); handleLogout(); }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  Sair da conta
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
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
