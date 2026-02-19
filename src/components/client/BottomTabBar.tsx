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
      {/* Vault sub-navigation — slides up when vault section is active */}
      <AnimatePresence>
        {isVaultActive && hasVaultAccess && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="border-t border-border/20 bg-background/95 backdrop-blur-xl"
          >
            <div className="flex items-center overflow-x-auto scrollbar-hide gap-1 px-3 py-1.5">
              {vaultSubTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onSectionChange(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 shrink-0",
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

      {/* Primary tab bar */}
      <nav className="border-t border-border/30 bg-background/95 backdrop-blur-xl safe-area-bottom">
        <div className="flex items-stretch justify-around max-w-lg mx-auto">
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
                // Already in vault — cycle isn't needed, stay
              } else {
                onSectionChange(tab.id);
              }
            };

            return (
              <button
                key={tab.id}
                onClick={handleClick}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-h-[52px] flex-1 transition-colors duration-200",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground active:text-foreground"
                )}
              >
                <tab.icon
                  className={cn(
                    "h-5 w-5 transition-all duration-200",
                    isActive && "scale-110"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={cn(
                    "text-[10px] leading-tight",
                    isActive ? "font-semibold" : "font-medium"
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
