import { Skeleton } from "@/components/ui/skeleton"
import { Surface } from "@/components/ui/surface"

export default function Loading() {
  return (
    <div
      className="space-y-10"
      data-slot="market-overview-loading"
      aria-hidden="true"
    >
      <div className="mb-6" data-slot="market-header-loading">
        <div className="mb-3 flex flex-wrap gap-2">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-2" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-52" />
          <Skeleton className="h-7 w-36 rounded-full" />
        </div>
        <Skeleton className="mt-2 h-4 w-full max-w-sm" />
        <div className="mt-3 flex items-center gap-2">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="size-4 rounded-full" />
          <Skeleton className="h-5 w-10 rounded-full" />
        </div>
      </div>

      <Surface
        variant="hero"
        className="overflow-hidden"
        data-slot="market-snapshot-loading"
      >
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2 lg:gap-10">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-52 max-w-full" />
            <Skeleton className="h-5 w-32 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-full rounded-md" />
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-hair border-t border-hair">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2 px-3 py-3 sm:px-5 sm:py-4">
              <Skeleton className="h-3 w-full max-w-16" />
              <Skeleton className="h-6 w-full max-w-20" />
            </div>
          ))}
        </div>
      </Surface>

      <section data-slot="market-top-cards-loading">
        <LoadingSectionHead titleWidth="w-44" captionWidth="w-64" withAction />
        <div className="-mx-5 md:-mx-6 lg:mx-0">
          <div
            className="flex gap-2 overflow-hidden px-5 pb-1 md:px-6 lg:hidden"
            data-slot="market-top-cards-loading-rail"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-[42vw] max-w-[170px] shrink-0 sm:w-[28vw] sm:max-w-[190px]"
              >
                <TopCardSkeleton />
              </div>
            ))}
          </div>
          <div
            className="hidden grid-cols-6 gap-2 lg:grid"
            data-slot="market-top-cards-loading-grid"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <TopCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>

      <div className="grid items-start gap-8 lg:grid-cols-2">
        <section data-slot="market-rarity-loading">
          <LoadingSectionHead titleWidth="w-36" captionWidth="w-52" />
          <DataPanelSkeleton />
        </section>
        <section data-slot="market-top-sets-loading">
          <LoadingSectionHead titleWidth="w-40" captionWidth="w-64" withAction />
          <DataPanelSkeleton />
        </section>
      </div>
    </div>
  )
}

function LoadingSectionHead({
  titleWidth,
  captionWidth,
  withAction = false,
}: {
  titleWidth: string
  captionWidth: string
  withAction?: boolean
}) {
  return (
    <div className="mb-3">
      <div className="mb-4 flex min-h-11 items-center justify-between gap-3">
        <Skeleton className={`h-6 ${titleWidth}`} />
        {withAction && <Skeleton className="h-5 w-16" />}
      </div>
      <Skeleton className={`-mt-3 h-4 max-w-full ${captionWidth}`} />
    </div>
  )
}

function TopCardSkeleton() {
  return (
    <Surface
      variant="panel"
      className="overflow-hidden"
      data-slot="market-top-card-loading"
    >
      <Skeleton className="aspect-[63/88] w-full rounded-none" />
      <div className="space-y-2 p-2">
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
        <div className="flex items-center justify-between gap-1">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </Surface>
  )
}

function DataPanelSkeleton() {
  return (
    <Surface variant="panel" padding="none" className="overflow-hidden">
      <div className="divide-y divide-hair">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex min-h-16 items-center gap-3 px-4 py-3 sm:px-5">
            <Skeleton className="size-10 shrink-0 rounded-sm" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-full" />
            </div>
            <div className="w-20 shrink-0 space-y-2">
              <Skeleton className="ml-auto h-4 w-full" />
              <Skeleton className="ml-auto h-3 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </Surface>
  )
}
