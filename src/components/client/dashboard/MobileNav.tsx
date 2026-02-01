import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { NavItem, navItems, tierConfig } from "./DashboardSidebar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Crown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface MobileNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isVaultMember: boolean;
  tier?: "member" | "collector" | "elite";
  userName: string;
}

export function MobileNav({
  activeSection,
  onSectionChange,
  isVaultMember,
  tier,
  userName,
}: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const visibleItems = navItems.filter(
    (item) => !item.vaultOnly || isVaultMember
  );
  const tierInfo = tier ? tierConfig[tier] : null;
  const activeItem = visibleItems.find((item) => item.id === activeSection);

  const handleNavigation = (id: string) => {
    onSectionChange(id);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between h-12 px-4"
        >
          <div className="flex items-center gap-3">
            <Menu className="h-4 w-4" />
            {activeItem && (
              <>
                <activeItem.icon className="h-4 w-4 text-primary" />
                <span className="font-medium">{activeItem.label}</span>
              </>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="p-6 border-b border-border/50">
          <SheetTitle className="text-left">
            <p className="text-sm text-muted-foreground font-normal mb-1">
              Olá,
            </p>
            <p className="text-lg">{userName}</p>
            {tierInfo && (
              <div
                className={cn(
                  "mt-3 px-3 py-2 rounded-lg border flex items-center gap-2 w-fit",
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
          </SheetTitle>
        </SheetHeader>

        <nav className="p-4 space-y-1">
          {visibleItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium flex-1">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveIndicator"
                    className="h-2 w-2 rounded-full bg-primary-foreground"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Vault Club Promo (non-members) */}
        {!isVaultMember && (
          <div className="p-4 mt-4 mx-4 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
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
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
