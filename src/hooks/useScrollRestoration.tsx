import { useRef, useCallback } from "react";

/**
 * Hook to save and restore scroll positions when switching between tabs.
 * Stores scroll positions keyed by tab ID.
 */
export function useScrollRestoration() {
  const scrollPositions = useRef<Record<string, number>>({});

  const saveScrollPosition = useCallback((tabId: string) => {
    scrollPositions.current[tabId] = window.scrollY;
  }, []);

  const restoreScrollPosition = useCallback((tabId: string) => {
    const saved = scrollPositions.current[tabId];
    if (saved !== undefined) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: saved, behavior: "instant" });
      });
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, []);

  return { saveScrollPosition, restoreScrollPosition };
}
