import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";

/** One stable shape for route, auth and client-data loading on /watchlist. */
export function WatchlistSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading watchlist">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Surface key={i} variant="panel" padding="sm" className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-3 w-12" />
          </Surface>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-11 w-56 sm:h-9" />
        <Skeleton className="h-11 w-32 sm:h-9" />
        <Skeleton className="h-11 w-28 sm:h-9" />
        <Skeleton className="ml-auto h-11 w-20 sm:h-9" />
      </div>

      <Surface variant="panel" className="overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-hair px-4 py-3 last:border-0"
          >
            <Skeleton className="size-5 shrink-0 rounded-sm sm:size-3.5" />
            <Skeleton className="size-10 shrink-0 rounded-sm" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="hidden h-4 w-16 sm:block" />
            <Skeleton className="hidden h-4 w-12 sm:block" />
            <Skeleton className="hidden h-7 w-24 lg:block" />
            <Skeleton className="size-11 shrink-0 rounded-md sm:size-8" />
          </div>
        ))}
      </Surface>
    </div>
  );
}
