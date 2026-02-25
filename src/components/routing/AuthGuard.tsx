import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { PATHS } from "@/routes/paths";
import { RouteSkeleton } from "./RouteSkeleton";

interface AuthGuardProps {
  children: ReactNode;
  /** If true, requires admin role */
  requireAdmin?: boolean;
  /** Custom redirect path (defaults to /entrar) */
  redirectTo?: string;
}

/**
 * AuthGuard — Unified authentication guard for protected routes.
 *
 * Features:
 * - Redirects unauthenticated users to login with return URL
 * - Optional admin role enforcement
 * - Shows contextual skeleton during auth check
 * - Preserves intended destination in location state
 *
 * Pattern used by: Remix (loader), Next.js (middleware), Vercel Dashboard
 */
export function AuthGuard({ 
  children, 
  requireAdmin = false, 
  redirectTo = PATHS.entrar 
}: AuthGuardProps) {
  const { user, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  // Show skeleton while auth state is being determined
  if (isLoading) {
    return <RouteSkeleton variant="default" />;
  }

  // Not authenticated → redirect to login with return path
  if (!user) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location.pathname + location.search }} 
        replace 
      />
    );
  }

  // Requires admin but user is not admin
  if (requireAdmin && !isAdmin) {
    return <Navigate to={PATHS.app.root} replace />;
  }

  return <>{children}</>;
}
