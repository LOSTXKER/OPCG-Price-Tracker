import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";

/** One stable shape for route, auth and client-data loading on /watchlist. */
export function WatchlistSkeleton({ withHeader = true }: { withHeader?: boolean }) {
  return (
    <div className="space-y-4 md:space-y-5" role="status" aria-label="Loading watchlist">
      {withHeader && (
        <>
          <Skeleton className="h-10 w-44" />
          <div className="flex h-11 items-center gap-3 border-b border-hair md:h-9">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-28" />
          </div>
        </>
      )}

      <div className="grid grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-2 md:flex">
        <Skeleton className="h-11 min-w-0 md:h-9 md:min-w-40 md:flex-1 lg:max-w-72" />
        <Skeleton className="h-11 min-w-0 md:h-9 md:min-w-40 md:flex-1 lg:max-w-64" />
        <Skeleton className="h-11 md:w-40 md:h-9" />
        <Skeleton className="h-11 md:w-24 md:h-9" />
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:min-h-11 md:min-h-9">
        <Skeleton className="hidden h-4 w-24 sm:block" />
        <div className="ml-auto flex max-w-full items-center gap-2 overflow-hidden">
          <div className="flex h-11 w-42 items-center md:h-8">
            <Skeleton className="h-9 w-full rounded-full md:h-8" />
          </div>
          <Skeleton className="h-11 w-20 md:h-7" />
          <Skeleton className="size-11 md:size-7" />
        </div>
      </div>

      <Surface variant="panel" className="overflow-hidden sm:hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-hair p-3 last:border-0">
            <Skeleton className="h-16 w-11 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="size-11 shrink-0 rounded-md" />
          </div>
        ))}
      </Surface>

      <div className="hidden sm:block">
        <div className="grid grid-cols-[minmax(0,1fr)_7rem_6rem_6rem] gap-3 border-b border-hair px-3 py-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-14" />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2">
            <Skeleton className="h-12 w-9 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="size-9 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
