import { ReactNode } from "react";
import { useLazySection } from "@/hooks/useLazySection";

interface LazySectionProps {
  children: ReactNode;
  /** Minimum height placeholder to prevent layout shift */
  minHeight?: string;
  /** Root margin for earlier trigger */
  rootMargin?: string;
}

/**
 * Renders children only when the section enters the viewport.
 * Adds a smooth fade-in animation when content appears.
 */
export function LazySection({ children, minHeight = "200px", rootMargin = "200px" }: LazySectionProps) {
  const { ref, hasTriggered } = useLazySection({ rootMargin });

  return (
    <div ref={ref} style={hasTriggered ? undefined : { minHeight }}>
      {hasTriggered ? (
        <div className="animate-fade-in" style={{ animationDuration: "0.5s", animationFillMode: "both" }}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
