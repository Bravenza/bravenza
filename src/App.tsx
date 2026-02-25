import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { usePWAOptimizations } from "@/hooks/usePWAOptimizations";
import { SkipToContent } from "@/components/a11y/SkipToContent";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PullToRefresh } from "@/components/PullToRefresh";
import { PageTransition } from "@/components/PageTransition";

// Route modules
import { publicRoutes } from "@/routes/publicRoutes";
import { marketplaceRoutes } from "@/routes/marketplaceRoutes";
import { vaultRoutes } from "@/routes/vaultRoutes";
import { adminRoutes } from "@/routes/adminRoutes";
import { appRoutes } from "@/routes/appRoutes";

const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center" role="status" aria-label="Carregando página">
    <div className="space-y-4 w-full max-w-md px-4">
      <Skeleton className="h-8 w-32 mx-auto" />
      <Skeleton className="h-4 w-48 mx-auto" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  </div>
);

// Optimized QueryClient with caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// PWA App Shell component
function AppShell({ children }: { children: React.ReactNode }) {
  usePWAOptimizations();
  return <>{children}</>;
}

const App = () => (
  <ErrorBoundary>
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <OfflineIndicator />
          <BrowserRouter>
            <SkipToContent />
            <ScrollToTop />
            <AppShell>
            <PullToRefresh>
            <Suspense fallback={<PageLoader />}>
              <PageTransition>
                <Routes>
                  {publicRoutes}
                  {appRoutes}
                  {marketplaceRoutes}
                  {vaultRoutes}
                  {adminRoutes}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </PageTransition>
            </Suspense>
            </PullToRefresh>
            </AppShell>
            <PWAInstallBanner />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
  </ErrorBoundary>
);

export default App;
