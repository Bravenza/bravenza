import { Skeleton } from "@/components/ui/skeleton";

/** Full-page skeleton for the ProductDetail page */
export function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-3 w-32" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Gallery */}
          <div className="lg:col-span-3">
            <Skeleton className="aspect-[4/3] rounded-2xl" />
            <div className="flex gap-2 mt-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="w-16 h-16 rounded-xl" />
              ))}
            </div>
          </div>

          {/* Info panel */}
          <div className="lg:col-span-2 space-y-5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-10 w-40" />
            <div className="pt-4 space-y-3">
              <Skeleton className="h-4 w-20" />
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-11 w-16 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Offers section */}
        <div className="mt-14 space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Skeleton for marketplace catalog grid */
export function CatalogGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden border border-border/30 bg-card">
          <Skeleton className="aspect-[4/3] w-full" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-2.5 w-12" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-20" />
            <div className="pt-2 border-t border-border/20">
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
