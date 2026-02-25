import { useCallback, useRef } from "react";
import { Link, LinkProps } from "react-router-dom";
import { ROUTE_PRELOADS } from "@/routes/paths";

/**
 * PrefetchLink — Prefetches route chunks on hover or focus.
 * 
 * Uses the ROUTE_PRELOADS registry to dynamically import the target
 * page component before the user clicks, resulting in instant navigation.
 * 
 * Pattern used by: Next.js, Remix, Shopify Hydrogen
 */
export function PrefetchLink({ to, children, onMouseEnter, onFocus, ...props }: LinkProps) {
  const prefetched = useRef(false);

  const prefetch = useCallback(() => {
    if (prefetched.current) return;
    const path = typeof to === "string" ? to : to.pathname ?? "";
    
    // Try exact match first, then check base paths
    const loader = ROUTE_PRELOADS[path] ?? findClosestPreload(path);
    if (loader) {
      loader();
      prefetched.current = true;
    }
  }, [to]);

  return (
    <Link
      to={to}
      onMouseEnter={(e) => {
        prefetch();
        onMouseEnter?.(e);
      }}
      onFocus={(e) => {
        prefetch();
        onFocus?.(e);
      }}
      {...props}
    >
      {children}
    </Link>
  );
}

/**
 * Find the closest matching preload for parameterized routes.
 * E.g., "/app/vault" matches for "/app/vault/something"
 */
function findClosestPreload(path: string): (() => Promise<unknown>) | undefined {
  const segments = path.split("/").filter(Boolean);
  while (segments.length > 0) {
    const candidate = "/" + segments.join("/");
    if (ROUTE_PRELOADS[candidate]) return ROUTE_PRELOADS[candidate];
    segments.pop();
  }
  return undefined;
}
