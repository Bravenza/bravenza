import { Skeleton } from "@/components/ui/skeleton";

/** Content-aware skeleton for the Home page hero + sections */
export function HomePageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="h-16 border-b border-border/20 flex items-center px-6">
        <Skeleton className="h-6 w-28" />
        <div className="flex-1" />
        <div className="flex gap-6">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md ml-6" />
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center justify-center py-24 px-4 space-y-6">
        <Skeleton className="h-8 w-64 rounded-full" />
        <Skeleton className="h-14 w-[500px] max-w-full" />
        <Skeleton className="h-14 w-[600px] max-w-full" />
        <Skeleton className="h-5 w-[450px] max-w-full" />
        <div className="flex gap-4 pt-4">
          <Skeleton className="h-12 w-48 rounded-md" />
          <Skeleton className="h-12 w-40 rounded-md" />
        </div>
        <div className="flex gap-6 pt-6">
          <Skeleton className="h-16 w-40 rounded-xl" />
          <Skeleton className="h-16 w-40 rounded-xl" />
          <Skeleton className="h-16 w-40 rounded-xl" />
        </div>
      </div>

      {/* Brands bar */}
      <div className="flex items-center justify-center gap-8 py-6 border-y border-border/20">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-20" />
        ))}
      </div>
    </div>
  );
}

/** Content-aware skeleton for orders list */
export function OrdersListSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border/30 bg-card">
          <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
          <div className="text-right space-y-1">
            <Skeleton className="h-5 w-20 ml-auto" />
            <Skeleton className="h-3 w-16 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Content-aware skeleton for favorites/wishlist grid */
export function FavoritesGridSkeleton() {
  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden border border-border/30 bg-card">
            <Skeleton className="aspect-[4/3] w-full" />
            <div className="p-3 space-y-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-16" />
              <div className="flex items-center justify-between pt-2 border-t border-border/20">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Content-aware skeleton for profile/closet page */
export function ProfileSkeleton() {
  return (
    <div className="p-4 space-y-6">
      {/* Profile header */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border/30 bg-card p-4 space-y-2">
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      {/* Content tabs */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-xl" />
        ))}
      </div>
    </div>
  );
}
