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

      {/* Row 3 — control row: period pill + 3 icons (mobile) / pulse text +
          2 controls (desktop). */}
      <div className="flex items-center gap-2 sm:hidden">
        <Skeleton className="h-9 w-24 rounded-full" />
        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="size-9 rounded-md" />
          <Skeleton className="size-9 rounded-md" />
          <Skeleton className="size-9 rounded-md" />
        </div>
      </div>
      <div className="hidden items-center gap-2 sm:flex">
        <Skeleton className="h-4 w-40" />
        <div className="ml-auto flex items-center gap-1.5">
          <Skeleton className="size-7 rounded-md" />
          <Skeleton className="h-7 w-20 rounded-md" />
          <Skeleton className="h-7 w-20 rounded-md" />
        </div>
      </div>

      {/* List header + row shadows (mobile Apple-Stocks anatomy). */}
      <div className="sm:hidden">
        <div className="flex h-9 items-center justify-between border-b border-hair px-1">
          <Skeleton className="h-3 w-14" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-3 w-14" />
          </div>
        </div>
        <Surface variant="panel" className="mt-2 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-hair p-3 last:border-0">
              <Skeleton className="h-[72px] w-[52px] shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-14 rounded-md" />
              </div>
            </div>
          ))}
        </Surface>
      </div>

      {/* Desktop table shadows. */}
      <div className="hidden sm:block">
        <div className="flex items-center gap-3 border-b border-hair px-3 py-2.5">
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="hidden h-3 w-20 xl:block" />
          <Skeleton className="h-3 w-24" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5">
            <Skeleton className="h-12 w-9 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-28" />
            </div>
            <div className="w-28 space-y-1">
              <Skeleton className="ml-auto h-4 w-16" />
              <Skeleton className="ml-auto h-3 w-12" />
            </div>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="hidden h-4 w-20 xl:block" />
            <Skeleton className="size-9 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
