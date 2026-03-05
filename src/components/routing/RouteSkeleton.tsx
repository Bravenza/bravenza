import { Skeleton } from "@/components/ui/skeleton";

export type SkeletonVariant = "default" | "dashboard" | "list" | "detail" | "feed" | "admin";

interface RouteSkeletonProps {
  variant?: SkeletonVariant;
}

/**
 * RouteSkeleton — Contextual loading skeletons per route type.
 *
 * Instead of a single generic loader, each route section gets a
 * skeleton that matches its layout, reducing perceived load time.
 *
 * Pattern used by: Facebook, Instagram, Airbnb
 */
export function RouteSkeleton({ variant = "default" }: RouteSkeletonProps) {
  switch (variant) {
    case "dashboard":
      return (
        <div className="p-4 space-y-4" aria-label="Carregando dashboard" role="status">
          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          {/* Chart area */}
          <Skeleton className="h-48 rounded-xl" />
          {/* Recent items */}
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        </div>
      );

    case "list":
      return (
        <div className="p-4 space-y-3" aria-label="Carregando lista" role="status">
          {/* Search bar */}
          <Skeleton className="h-10 rounded-lg" />
          {/* Filter chips */}
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-full" />
            ))}
          </div>
          {/* List items */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 items-center">
              <Skeleton className="h-16 w-16 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      );

    case "detail":
      return (
        <div className="p-4 space-y-4" aria-label="Carregando detalhes" role="status">
          {/* Hero image */}
          <Skeleton className="h-64 rounded-xl" />
          {/* Title + price */}
          <div className="space-y-2">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-8 w-1/3" />
          </div>
          {/* Description */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
          {/* Action button */}
          <Skeleton className="h-12 rounded-lg" />
        </div>
      );

    case "feed":
      return (
        <div className="p-4 space-y-4" aria-label="Carregando feed" role="status">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              {/* Author */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              {/* Content */}
              <Skeleton className="h-48 rounded-xl" />
              {/* Actions */}
              <div className="flex gap-4">
                <Skeleton className="h-8 w-16 rounded-full" />
                <Skeleton className="h-8 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      );

    case "admin":
      return (
        <div className="p-6 space-y-4" aria-label="Carregando painel" role="status">
          {/* Breadcrumb */}
          <Skeleton className="h-5 w-48" />
          {/* Title */}
          <Skeleton className="h-8 w-64" />
          {/* Table header */}
          <div className="flex gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 flex-1 rounded-lg" />
            ))}
          </div>
          {/* Table rows */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-12 flex-1 rounded-lg" />
              ))}
            </div>
          ))}
        </div>
      );

    default:
      return (
        <div className="min-h-[60vh] flex items-center justify-center" aria-label="Carregando" role="status">
          <div className="space-y-4 w-full max-w-md px-4">
            <Skeleton className="h-8 w-32 mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      );
  }
}
