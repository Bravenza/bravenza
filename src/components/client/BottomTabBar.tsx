import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Crown, Store, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomTabBarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onSettingsOpen: () => void;
  hasVaultAccess: boolean;
}

const tabs = [
  { id: "pedidos", label: "Pedidos", icon: Package },
  { id: "vault", label: "Vault", icon: Crown, requiresVault: true },
  { id: "marketplace", label: "Market", icon: Store, href: "/marketplace" },
  { id: "settings", label: "Perfil", icon: Settings },
];

function BottomTabBarComponent({
  activeSection,
  onSectionChange,
  onSettingsOpen,
  hasVaultAccess,
}: BottomTabBarProps) {
  const navigate = useNavigate();

  const vaultSections = ["vault", "wishlist", "drops", "clube", "comunidade"];
  const isVaultActive = vaultSections.includes(activeSection);

  const visibleTabs = tabs.filter(
    (tab) => !tab.requiresVault || hasVaultAccess
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border/30 bg-background/95 backdrop-blur-xl safe-area-bottom">
      <div className="flex items-stretch justify-around max-w-lg mx-auto">
        {visibleTabs.map((tab) => {
          const isActive =
            tab.id === "vault"
              ? isVaultActive
              : tab.id === "settings"
                ? false
                : activeSection === tab.id;

          const handleClick = () => {
            if (tab.href) {
              navigate(tab.href);
            } else if (tab.id === "settings") {
              onSettingsOpen();
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
  );
}

export const BottomTabBar = memo(BottomTabBarComponent);
