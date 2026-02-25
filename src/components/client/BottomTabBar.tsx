import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Crown, Store, User, Search, Sparkles, Award, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

interface BottomTabBarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onSettingsOpen: () => void;
  hasVaultAccess: boolean;
}

const primaryTabs = [
  { id: "pedidos", label: "Pedidos", icon: Package },
  { id: "vault", label: "Vault", icon: Crown, requiresVault: true },
  { id: "marketplace", label: "Market", icon: Store, href: "/marketplace" },
  { id: "profile", label: "Perfil", icon: User },
];

const vaultSubTabs = [
  { id: "vault", label: "Coleção", icon: Package },
  { id: "wishlist", label: "Wishlist", icon: Search },
  { id: "drops", label: "Drops", icon: Sparkles },
  { id: "clube", label: "Status", icon: Award },
  { id: "comunidade", label: "Social", icon: Users },
];

const vaultSections = ["vault", "wishlist", "drops", "clube", "comunidade"];

/**
 * iOS-style Tab Bar following Apple Human Interface Guidelines:
 * - 49pt tab bar height (content area) + safe area inset bottom
 * - Background extends into safe area (home indicator region)
 * - Filled icons (strokeWidth 2.5) when active, outline (strokeWidth 1.5) when inactive
 * - 10pt labels, semibold active / regular inactive
 * - Tint color for active state, no scale animations
 * - 1px hairline separator at top
 */
function BottomTabBarComponent({
  activeSection,
  onSectionChange,
  onSettingsOpen,
  hasVaultAccess,
}: BottomTabBarProps) {
  const navigate = useNavigate();
  const isVaultActive = vaultSections.includes(activeSection);

  const visibleTabs = primaryTabs.filter(
    (tab) => !tab.requiresVault || hasVaultAccess
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Vault sub-navigation — slides up above tab bar */}
      <AnimatePresence>
        {isVaultActive && hasVaultAccess && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="border-t border-border/10 bg-background"
          >
            <div className="flex items-center overflow-x-auto scrollbar-hide gap-1 px-3 py-1.5">
              {vaultSubTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onSectionChange(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors duration-150 shrink-0",
                    activeSection === tab.id
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground active:text-foreground"
                  )}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary tab bar — Apple HIG: 49pt content + safe area extension */}
      <nav
        className="bg-background"
        aria-label="Navegação principal"
        style={{
          /* Hairline separator — Apple uses 0.33pt, we use 0.5px for retina */
          borderTop: '0.5px solid hsl(var(--border) / 0.4)',
          /* Safe area: extend background into home indicator region */
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div
          className="flex items-stretch justify-around max-w-lg mx-auto"
          style={{ height: '49px' }} /* Apple's standard 49pt tab bar height */
        >
          {visibleTabs.map((tab) => {
            const isActive =
              tab.id === "vault"
                ? isVaultActive
                : tab.id === "profile"
                  ? false
                  : activeSection === tab.id;

            const handleClick = () => {
              if (tab.href) {
                navigate(tab.href);
              } else if (tab.id === "profile") {
                onSettingsOpen();
              } else if (tab.id === "vault" && isVaultActive) {
                // Already in vault — stay
              } else {
                onSectionChange(tab.id);
              }
            };

            return (
              <button
                key={tab.id}
                onClick={handleClick}
                className={cn(
                  "flex flex-col items-center justify-center gap-[2px] flex-1 transition-colors duration-150",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground active:text-foreground"
                )}
              >
                {/* Apple HIG: 25×25pt icons, filled active / outline inactive */}
                <tab.icon
                  className="h-[22px] w-[22px]"
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
                {/* Apple HIG: 10pt label */}
                <span
                  className={cn(
                    "text-[10px] leading-none tracking-tight",
                    isActive ? "font-semibold" : "font-normal"
                  )}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export const BottomTabBar = memo(BottomTabBarComponent);
