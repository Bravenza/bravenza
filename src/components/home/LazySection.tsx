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
 * Prevents below-fold sections from mounting, fetching data, or running animations
 * until the user scrolls near them.
 */
export function LazySection({ children, minHeight = "200px", rootMargin = "200px" }: LazySectionProps) {
  const { ref, hasTriggered } = useLazySection({ rootMargin });

  return (
    <div ref={ref} style={hasTriggered ? undefined : { minHeight }}>
      {hasTriggered ? children : null}
    </div>
  );
}
