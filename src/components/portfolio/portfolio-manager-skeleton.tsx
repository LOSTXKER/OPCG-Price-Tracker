import { Skeleton } from "@/components/ui/skeleton"
import { Surface } from "@/components/ui/surface"

export function PortfolioManagerSkeleton({
  rows = 1,
  showCreateAction = true,
}: {
  rows?: number
  showCreateAction?: boolean
}) {
  return (
    <div
      className="space-y-3"
      data-slot="portfolio-manager-skeleton"
      aria-hidden
    >
      <div className="flex min-h-11 items-center justify-between gap-2">
        {rows > 1 ? (
          <Skeleton className="h-4 w-56 max-w-[55%]" />
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <Skeleton className="size-11 rounded-lg" />
          {showCreateAction && <Skeleton className="h-11 w-28 rounded-lg" />}
        </div>
      </div>

      <Surface variant="panel" className="overflow-hidden">
        <div className="divide-y divide-hair">
          {Array.from({ length: rows }).map((_, index) => (
            <article
              key={index}
              className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-3 sm:px-4"
            >
              <div className="flex min-h-14 min-w-0 items-center gap-3 p-1 -m-1">
                <div className="flex shrink-0 -space-x-2">
                  {Array.from({ length: 2 }).map((__, previewIndex) => (
                    <Skeleton
                      key={previewIndex}
                      data-slot="portfolio-skeleton-preview"
                      className="aspect-[63/88] w-9 rounded-md ring-2 ring-card"
                    />
                  ))}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-28 max-w-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-36 max-w-full" />
                </div>
                <Skeleton className="size-4 shrink-0" />
              </div>

              <div className="flex shrink-0 gap-1">
                <Skeleton className="size-11 rounded-lg" />
                <Skeleton className="size-11 rounded-lg" />
              </div>
            </article>
          ))}
        </div>
      </Surface>
    </div>
  )
}
