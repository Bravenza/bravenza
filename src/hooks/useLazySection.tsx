import { useState, useEffect, useRef, RefObject } from "react";

interface UseLazySectionOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

interface UseLazySectionReturn {
  ref: RefObject<HTMLDivElement>;
  isVisible: boolean;
  hasTriggered: boolean;
}

/**
 * Hook for lazy loading sections using Intersection Observer
 * Optimized for performance with configurable trigger behavior
 */
export function useLazySection({
  threshold = 0.1,
  rootMargin = "100px",
  triggerOnce = true
}: UseLazySectionOptions = {}): UseLazySectionReturn {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Skip if already triggered and triggerOnce is true
    if (triggerOnce && hasTriggered) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsVisible(visible);
        
        if (visible && triggerOnce) {
          setHasTriggered(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce, hasTriggered]);

  return { ref, isVisible, hasTriggered };
}

/**
 * Hook for prefetching routes on hover/focus
 */
export function usePrefetch() {
  const prefetchedRoutes = useRef(new Set<string>());

  const prefetch = (route: string) => {
    if (prefetchedRoutes.current.has(route)) return;
    
    // Add to prefetched set
    prefetchedRoutes.current.add(route);
    
    // Create prefetch link
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = route;
    document.head.appendChild(link);
  };

  return { prefetch };
}
