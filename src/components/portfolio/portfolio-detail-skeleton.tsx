import { Skeleton } from "@/components/ui/skeleton"

export function PortfolioDetailSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div
      className="space-y-4 sm:space-y-5"
      data-slot="portfolio-detail-skeleton"
      aria-hidden
    >
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-11 w-48 rounded-xl" />
        <div className="flex items-center gap-1.5">
          <Skeleton className="size-11 rounded-lg" />
          <Skeleton className="size-11 rounded-lg" />
          <Skeleton className="h-11 w-24 rounded-lg" />
        </div>
      </div>

      {/* Mirrors the real page's lg two-zone grid: main column (hero, chart,
          holdings) + a 320px rail (KPI quartet, movers, by-game). */}
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-8">
        <div className="space-y-4 sm:space-y-5">
          {/* Hero — eyebrow bar + big value bar */}
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-56" />
          </div>

          {/* Chart */}
          <Skeleton className="h-44 rounded-xl sm:h-56" />

          {/* KPI 2×2 — lg-only fallback (the rail below carries it at lg:) */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-y border-hair py-4 sm:grid-cols-4 lg:hidden">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {Array.from({ length: rows }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-3"
                data-slot="portfolio-detail-skeleton-row"
              >
                <Skeleton className="aspect-[63/88] w-11 rounded-md" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-40 max-w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="space-y-1.5 text-right">
                  <Skeleton className="ml-auto h-4 w-20" />
                  <Skeleton className="ml-auto h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop rail — KPI quartet as a vertical stack + a movers block */}
        <div className="hidden lg:block lg:space-y-6">
          <div className="divide-y divide-hair">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2 py-3">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
