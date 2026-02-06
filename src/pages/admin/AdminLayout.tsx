import { useEffect } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
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
  Layers,
  Shield,
  Ticket,
  FileText,
  MessageSquare,
  Store,
} from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: ClipboardList, label: "Solicitações", path: "/admin/solicitacoes" },
  { icon: Package, label: "Pedidos", path: "/admin/pedidos" },
  { icon: DollarSign, label: "Financeiro", path: "/admin/financeiro" },
  { icon: Calculator, label: "Calculadora", path: "/admin/calculadora" },
  { icon: Building2, label: "Fornecedores", path: "/admin/fornecedores" },
  { icon: Sparkles, label: "Modelos Destaque", path: "/admin/modelos" },
  { icon: Star, label: "Avaliações", path: "/admin/avaliacoes" },
  { icon: Gift, label: "Indicações", path: "/admin/indicacoes" },
  { icon: Users, label: "Usuários", path: "/admin/usuarios" },
  { icon: Settings, label: "Configurações", path: "/admin/configuracoes" },
];

const vaultNavItems = [
  { icon: Crown, label: "Membros Vault", path: "/admin/vault/membros" },
  { icon: Search, label: "Buscas", path: "/admin/vault/buscas" },
  { icon: Layers, label: "Match Rooms", path: "/admin/vault/match-rooms" },
  { icon: Shield, label: "Vault Items", path: "/admin/vault/items" },
  { icon: Ticket, label: "Convites", path: "/admin/vault/convites" },
  { icon: FileText, label: "Intel", path: "/admin/vault/intel" },
  { icon: MessageSquare, label: "Comunidade", path: "/admin/vault/comunidade" },
  { icon: Store, label: "Marketplace", path: "/admin/vault/marketplace" },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate("/admin/login");
    }
  }, [user, isAdmin, isLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <div className="w-64 border-r border-border/30 p-4 bg-card/50">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex relative">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-primary/3 rounded-full blur-3xl pointer-events-none" />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card/80 backdrop-blur-xl border-r border-border/30 transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-primary/20 via-primary/5 to-transparent" />
        
        <div className="flex flex-col h-full relative">
          {/* Logo */}
          <div className="p-4 border-b border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Logo size="md" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Admin</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Link
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                      isActive
                        ? "bg-primary/10 text-primary shadow-[0_0_20px_rgba(212,175,55,0.1)]"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    <item.icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${isActive ? "text-primary" : ""}`} />
                    <span className="font-medium text-sm">{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}

            <Separator className="my-4 bg-border/30" />
            <p className="px-3 py-2 text-xs font-semibold text-primary/80 uppercase tracking-wider flex items-center gap-2">
              <Crown className="h-3 w-3" />
              Vault Club
            </p>

            {vaultNavItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (navItems.length + index) * 0.03 }}
                >
                  <Link
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                      isActive
                        ? "bg-primary/10 text-primary shadow-[0_0_20px_rgba(212,175,55,0.1)]"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    <item.icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${isActive ? "text-primary" : ""}`} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-border/30">
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
        {/* Header with notifications */}
        <header className="sticky top-0 z-40 border-b border-border/30 bg-background/80 backdrop-blur-xl">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
              <Logo size="sm" className="lg:hidden" />
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
