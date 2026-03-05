import { Suspense, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { RouteErrorBoundary } from "./RouteErrorBoundary";
import { RouteSkeleton } from "./RouteSkeleton";

type SkeletonVariant = "default" | "form" | "dashboard" | "detail";

interface RouteWrapperProps {
  children: ReactNode;
  /** Section label for error UI */
  section?: string;
  /** Skeleton variant to show during lazy load */
  skeleton?: SkeletonVariant;
}

/**
 * RouteWrapper — Combines error boundary + suspense for a route.
 *
 * Usage:
 *   <RouteWrapper section="Dashboard" skeleton="dashboard">
 *     <LazyDashboard />
 *   </RouteWrapper>
 */
export function RouteWrapper({ children, section, skeleton = "default" }: RouteWrapperProps) {
  const location = useLocation();
  return (
    <RouteErrorBoundary section={section} resetKey={location.pathname}>
      <Suspense fallback={<RouteSkeleton variant={skeleton} />}>
        {children}
      </Suspense>
    </RouteErrorBoundary>
  );
}
