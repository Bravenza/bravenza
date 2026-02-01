import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Package,
  Box,
  Search,
  Newspaper,
  Crown,
  Users,
  ChevronRight,
  Shield,
  Sparkles,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  vaultOnly?: boolean;
  badge?: string | number;
}

export const navItems: NavItem[] = [
  { id: "pedidos", label: "Meus Pedidos", icon: Package },
  { id: "vault", label: "Meu Vault", icon: Box, vaultOnly: true },
  { id: "wishlist", label: "Wishlist & Buscas", icon: Search, vaultOnly: true },
  { id: "intel", label: "Intel", icon: Newspaper, vaultOnly: true },
  { id: "clube", label: "Meu Clube", icon: Crown, vaultOnly: true },
  { id: "comunidade", label: "Comunidade", icon: Users, vaultOnly: true },
];

export const tierConfig = {
  member: {
    label: "Vault Access",
    icon: Shield,
    color: "text-muted-foreground",
    bgColor: "bg-muted/50",
    borderColor: "border-muted-foreground/20",
  },
  collector: {
    label: "Vault Privilege",
    icon: Crown,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
  },
  elite: {
    label: "Vault Black",
    icon: Sparkles,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
  },
};

interface DashboardSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isVaultMember: boolean;
  tier?: "member" | "collector" | "elite";
  userName: string;
  className?: string;
}

export function DashboardSidebar({
  activeSection,
  onSectionChange,
  isVaultMember,
  tier,
  userName,
  className,
}: DashboardSidebarProps) {
  const visibleItems = navItems.filter(
    (item) => !item.vaultOnly || isVaultMember
  );
  const tierInfo = tier ? tierConfig[tier] : null;

  return (
    <aside
      className={cn(
        "w-64 flex-shrink-0 border-r border-border/50 bg-card/30",
        className
      )}
    >
      <div className="p-6 sticky top-[57px]">
        {/* User Info Card */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-1">Olá,</p>
          <p className="font-semibold text-lg truncate">{userName}</p>
          {tierInfo && (
            <div
              className={cn(
                "mt-3 px-3 py-2 rounded-lg border flex items-center gap-2",
                tierInfo.bgColor,
                tierInfo.borderColor
              )}
            >
              <tierInfo.icon className={cn("h-4 w-4", tierInfo.color)} />
              <span className={cn("text-sm font-medium", tierInfo.color)}>
                {tierInfo.label}
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {visibleItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-medium flex-1">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="h-1.5 w-1.5 rounded-full bg-primary-foreground"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Vault Club Promo (non-members) */}
        {!isVaultMember && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold">Vault Club</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Acesso exclusivo à curadoria global de tênis raros.
            </p>
            <a
              href="/vault"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              Saiba mais
              <ChevronRight className="h-3 w-3" />
            </a>
          </motion.div>
        )}
      </div>
    </aside>
  );
}
