import { Link, useLocation } from "react-router-dom";
import { Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems } from "./marketplace-nav";
import { usePrefetch } from "@/hooks/useLazySection";

const prefetchMap: Record<string, string> = {
  "/app": "/app",
  "/app/pedidos": "/app/pedidos",
  "/app/loja": "/app/loja",
};

export function MarketplaceBottomNav() {
  const location = useLocation();
  const { prefetch } = usePrefetch();

  const handlePrefetch = (path: string) => {
    const route = prefetchMap[path];
    if (route) prefetch(route);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border/30 safe-bottom z-50" aria-label="Navegação inferior">
      <div className="flex justify-around items-center py-1">
        {navItems.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);
          const Icon = item.icon || Compass;
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
              onMouseEnter={() => handlePrefetch(item.path)}
              onTouchStart={() => handlePrefetch(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 h-12 w-12 rounded-full text-[10px] font-medium transition-all duration-200 active:scale-95",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60 active:bg-secondary/80"
              )}
            >
              <Icon className={cn("h-5 w-5 transition-all duration-200", isActive && "drop-shadow-[0_0_6px_hsl(var(--primary)/0.4)]")} />
              <span className="leading-none">{item.mobileLabel}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
