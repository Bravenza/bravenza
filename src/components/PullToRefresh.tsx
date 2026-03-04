import { useState, useRef, useCallback, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";

const THRESHOLD = 80;
const MAX_PULL = 130;

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const isPulling = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const canPull = useCallback(() => {
    return window.scrollY <= 0 && !isRefreshing;
  }, [isRefreshing]);

  const isInsideScrollable = useCallback((target: EventTarget | null) => {
    if (!target || !(target instanceof HTMLElement)) return false;
    let el: HTMLElement | null = target;
    while (el && el !== document.body) {
      if (
        el.classList.contains("scroll-area") ||
        el.hasAttribute("data-radix-scroll-area-viewport") ||
        el.getAttribute("role") === "listbox" ||
        el.classList.contains("overflow-y-auto") ||
        el.classList.contains("overflow-auto")
      ) {
        if (el.scrollTop > 0) return true;
      }
      el = el.parentElement;
    }
    return false;
  }, []);

  useEffect(() => {
    // Only register touch listeners on mobile
    if (!isMobile) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (!canPull()) return;
      if (isInsideScrollable(e.target)) return;
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || !canPull()) return;
      if (isInsideScrollable(e.target)) {
        isPulling.current = false;
        setPullDistance(0);
        return;
      }

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      if (diff > 0 && window.scrollY <= 0) {
        const distance = Math.min(diff * 0.5, MAX_PULL);
        setPullDistance(distance);
        if (distance > 10 && e.cancelable) {
          e.preventDefault();
        }
      } else {
        isPulling.current = false;
        setPullDistance(0);
      }
    };

    const handleTouchEnd = () => {
      if (!isPulling.current) return;
      isPulling.current = false;

      if (pullDistance >= THRESHOLD) {
        setIsRefreshing(true);
        setPullDistance(THRESHOLD);

        // Invalidate all queries instead of full page reload
        queryClient.invalidateQueries().then(() => {
          setTimeout(() => {
            setIsRefreshing(false);
            setPullDistance(0);
          }, 300);
        });
      } else {
        setPullDistance(0);
      }
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [canPull, isInsideScrollable, pullDistance, isMobile, queryClient]);

  // On desktop, just render children without pull-to-refresh overhead
  if (!isMobile) {
    return <>{children}</>;
  }

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const rotation = progress * 360;
  const showIndicator = pullDistance > 10;

  return (
    <div ref={containerRef} className="relative">
      {/* Pull indicator */}
      <div
        className="fixed left-1/2 -translate-x-1/2 z-[999] pointer-events-none flex items-center justify-center transition-opacity duration-200"
        style={{
          top: `calc(var(--safe-area-top, 0px) + ${Math.min(pullDistance - 30, 40)}px)`,
          opacity: showIndicator ? progress : 0,
        }}
      >
        <div
          className={`w-10 h-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center ${
            isRefreshing ? "animate-spin" : ""
          }`}
        >
          <RefreshCw
            className={`w-5 h-5 transition-colors duration-200 ${
              progress >= 1 ? "text-primary" : "text-muted-foreground"
            }`}
            style={{
              transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
            }}
          />
        </div>
      </div>

      {/* Content with pull transform */}
      <div
        style={{
          transform: pullDistance > 10 ? `translateY(${pullDistance * 0.3}px)` : undefined,
          transition: isPulling.current ? "none" : "transform 0.3s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
