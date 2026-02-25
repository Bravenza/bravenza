import { Suspense, type ReactNode } from "react";
import { RouteErrorBoundary } from "./RouteErrorBoundary";
import { RouteSkeleton } from "./RouteSkeleton";

type SkeletonVariant = "default" | "dashboard" | "list" | "detail" | "feed" | "admin";

interface RouteWrapperProps {
  children: ReactNode;
  section?: string;
  skeleton?: SkeletonVariant;
}

/**
 * RouteWrapper — Combines error boundary + suspense skeleton for each route.
 *
 * Provides:
 * - Per-route error isolation (errors don't crash the whole app)
 * - Contextual loading skeletons (not a generic spinner)
 * - Section labeling for error messages
 *
 * Usage:
 * <Route path="pedidos" element={
 *   <RouteWrapper section="Pedidos" skeleton="list">
 *     <OrdersPage />
 *   </RouteWrapper>
 * } />
 */
export function RouteWrapper({ children, section, skeleton = "default" }: RouteWrapperProps) {
  return (
    <RouteErrorBoundary section={section}>
      <Suspense fallback={<RouteSkeleton variant={skeleton} />}>
        {children}
      </Suspense>
    </RouteErrorBoundary>
  );
}
