import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Smart scroll restoration:
 * - PUSH navigation: scroll to top (new page)
 * - POP navigation (back/forward): restore saved position
 * - List pages (/app, /marketplace): position is saved so returning preserves scroll
 */
const LIST_ROUTES = ["/app", "/marketplace"];

export function ScrollToTop() {
  const { pathname } = useLocation();
  const navType = useNavigationType();
  const positions = useRef<Record<string, number>>({});

  // Save scroll position before leaving
  useEffect(() => {
    const save = () => {
      positions.current[pathname] = window.scrollY;
    };

    window.addEventListener("beforeunload", save);
    return () => {
      save();
      window.removeEventListener("beforeunload", save);
    };
  }, [pathname]);

  useEffect(() => {
    if (navType === "POP") {
      // Restore saved position on back/forward
      const saved = positions.current[pathname];
      if (saved != null) {
        requestAnimationFrame(() => window.scrollTo({ top: saved, left: 0, behavior: "instant" }));
      }
    } else {
      // On PUSH, only scroll to top for non-list routes OR if navigating to a new list root
      const isListRoute = LIST_ROUTES.some(r => pathname === r);
      if (!isListRoute) {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
    }
  }, [pathname, navType]);

  return null;
}
