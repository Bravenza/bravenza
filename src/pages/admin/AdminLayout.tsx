import { useEffect, useState } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  Star,
  Gift,
  DollarSign,
  Calculator,
  Sparkles,
  Crown,
  Search,
  
  Shield,
  Ticket,
  FileText,
  MessageSquare,
  Store,
  Activity,
  Mail,
  BarChart3,
  Scale,
  Flag,
  Bell,
  ChevronDown,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { GlobalSearch } from "@/components/admin/GlobalSearch";
import { ReportPDFGenerator } from "@/components/admin/ReportPDFGenerator";

import { useRealtimeAdmin } from "@/hooks/useRealtimeAdmin";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  items: NavItem[];
}

const standaloneItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
];

const navGroups: NavGroup[] = [
  {
    label: "Operações",
    icon: Package,
    items: [
      { icon: ClipboardList, label: "Solicitações", path: "/admin/solicitacoes" },
      { icon: Package, label: "Pedidos", path: "/admin/pedidos" },
      { icon: DollarSign, label: "Financeiro", path: "/admin/financeiro" },
      { icon: Calculator, label: "Calculadora", path: "/admin/calculadora" },
      { icon: Building2, label: "Fornecedores", path: "/admin/fornecedores" },
    ],
  },
  {
    label: "Conteúdo & Clientes",
    icon: Users,
    items: [
      { icon: Sparkles, label: "Modelos Destaque", path: "/admin/modelos" },
      { icon: Star, label: "Avaliações", path: "/admin/avaliacoes" },
      { icon: Gift, label: "Indicações", path: "/admin/indicacoes" },
      { icon: Users, label: "Usuários", path: "/admin/usuarios" },
    ],
  },
  {
    label: "Comunicação",
    icon: Mail,
    items: [
      { icon: Mail, label: "Fluxo de Emails", path: "/admin/emails" },
      { icon: MessageSquare, label: "Fluxo WhatsApp", path: "/admin/whatsapp" },
      { icon: FileText, label: "FAQ", path: "/admin/faq" },
      { icon: Activity, label: "Logs", path: "/admin/logs" },
    ],
  },
  {
    label: "Vault Club",
    icon: Crown,
    items: [
      { icon: Crown, label: "Membros", path: "/admin/vault/membros" },
      { icon: Search, label: "Curadoria", path: "/admin/vault/buscas" },
      { icon: Shield, label: "Items", path: "/admin/vault/items" },
      { icon: Ticket, label: "Convites", path: "/admin/vault/convites" },
      { icon: FileText, label: "Drops", path: "/admin/vault/drops" },
      { icon: MessageSquare, label: "Comunidade", path: "/admin/vault/comunidade" },
    ],
  },
  {
    label: "Marketplace",
    icon: Store,
    items: [
      { icon: Store, label: "Pedidos MKT", path: "/admin/vault/marketplace" },
      { icon: Shield, label: "Hub PRO", path: "/admin/vault/marketplace/inspecao" },
      { icon: Crown, label: "Planos", path: "/admin/vault/marketplace/planos" },
      { icon: BarChart3, label: "Analytics", path: "/admin/vault/marketplace/analytics" },
      { icon: Flag, label: "Moderação", path: "/admin/vault/marketplace/moderacao" },
      { icon: Scale, label: "Disputas", path: "/admin/vault/marketplace/disputas" },
      { icon: Bell, label: "Campanhas", path: "/admin/vault/marketplace/campanhas" },
    ],
  },
];

const settingsItem: NavItem = { icon: Settings, label: "Configurações", path: "/admin/configuracoes" };

function NavGroupSection({
  group,
  currentPath,
  onNavigate,
  isOpen,
  onToggle,
}: {
  group: NavGroup;
  currentPath: string;
  onNavigate: () => void;
  isOpen: boolean;
  onToggle: () => void;
}) {

  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors rounded-lg"
      >
        <span className="flex items-center gap-2">
          <group.icon className="h-3.5 w-3.5" />
          {group.label}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"}`}
        />
      </button>
      {isOpen && (
        <div className="space-y-0.5 mt-0.5">
          {group.items.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group text-sm ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                <span className="font-medium truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mfaChecked, setMfaChecked] = useState(false);
  const activeGroup = navGroups.find((g) => g.items.some((i) => location.pathname === i.path));
  const [openGroup, setOpenGroup] = useState<string | null>(activeGroup?.label ?? null);
  useRealtimeAdmin();

  useEffect(() => {
    const active = navGroups.find((g) => g.items.some((i) => location.pathname === i.path));
    if (active) setOpenGroup(active.label);
  }, [location.pathname]);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate("/admin/login");
      return;
    }
    if (user && isAdmin && !isLoading) {
      (async () => {
        const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const hasVerifiedFactor = factors?.totp?.some((f) => f.status === "verified");

        if (!hasVerifiedFactor || data?.currentLevel !== "aal2") {
          navigate("/admin/login");
          return;
        }
        setMfaChecked(true);
      })();
    }
  }, [user, isAdmin, isLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  const closeSidebar = () => setSidebarOpen(false);

  if (isLoading || !mfaChecked) {
    return (
      <div className="min-h-screen bg-background flex theme-light">
        <div className="hidden lg:block w-64 border-r border-border/30 p-4 bg-card/50">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-4 md:p-8">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative theme-light">
      <div className="fixed inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none will-change-transform" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-primary/3 rounded-full blur-3xl pointer-events-none will-change-transform" />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
          onClick={closeSidebar}
        />
      )}

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card/80 backdrop-blur-xl border-r border-border/30 transform transition-transform duration-300 lg:translate-x-0 theme-dark ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-primary/20 via-primary/5 to-transparent" />

          <div className="flex flex-col h-full relative">
            {/* Logo */}
            <div className="p-4 border-b border-border/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Logo size="md" />
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Admin
                </span>
              </div>
              <button
                onClick={closeSidebar}
                className="lg:hidden p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors active:scale-95"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav
              className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin"
              aria-label="Menu principal admin"
            >
              {/* Dashboard (standalone) */}
              {standaloneItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeSidebar}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    <item.icon
                      className={`h-5 w-5 ${isActive ? "text-primary" : ""}`}
                    />
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                );
              })}

              {/* Grouped navigation */}
              <div className="space-y-2 pt-2">
                {navGroups.map((group) => (
                  <NavGroupSection
                    key={group.label}
                    group={group}
                    currentPath={location.pathname}
                    onNavigate={closeSidebar}
                    isOpen={openGroup === group.label}
                    onToggle={() => setOpenGroup(openGroup === group.label ? null : group.label)}
                  />
                ))}
              </div>

              {/* Settings (standalone, bottom) */}
              <div className="pt-2">
                {(() => {
                  const isActive = location.pathname === settingsItem.path;
                  return (
                    <Link
                      to={settingsItem.path}
                      onClick={closeSidebar}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      }`}
                    >
                      <settingsItem.icon
                        className={`h-5 w-5 ${isActive ? "text-primary" : ""}`}
                      />
                      <span className="font-medium text-sm">{settingsItem.label}</span>
                    </Link>
                  );
                })()}
              </div>
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-border/30 shrink-0">
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Sair</span>
              </Button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          <header className="sticky top-0 z-40 border-b border-border/30 bg-background/80 backdrop-blur-xl theme-dark">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors active:scale-95"
                  aria-label="Abrir menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <Logo size="sm" className="lg:hidden" />
              </div>
              <div className="flex items-center gap-3">
                <GlobalSearch />
                <ReportPDFGenerator />
                <NotificationBell />
              </div>
            </div>
          </header>

          <main
            id="main-content"
            className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto relative"
          >
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
