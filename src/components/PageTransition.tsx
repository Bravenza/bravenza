import { type ReactNode } from "react";

/**
 * Lightweight page wrapper — no longer re-mounts the entire tree on navigation.
 * Previously used framer-motion with key={pathname} which destroyed and recreated
 * the full component tree on every route change, causing unnecessary re-renders,
 * state loss, and redundant data fetches.
 *
 * CSS handles the subtle fade-in via the route skeleton → content transition.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
