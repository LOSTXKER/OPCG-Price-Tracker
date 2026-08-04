import { Skeleton } from "@/components/ui/skeleton";

export default function CardDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl">
      {/* breadcrumb */}
      <Skeleton className="h-4 w-48" />

      {/* Identity band above three columns — must track the grid, orders and
          column widths in card-detail.tsx or the layout jumps when the skeleton
          is replaced. */}
      <div className="mt-6 flex flex-col gap-y-6 lg:grid lg:grid-cols-[220px_minmax(0,1fr)_320px] lg:items-start lg:gap-x-8 lg:gap-y-5 xl:grid-cols-[280px_minmax(0,1fr)_360px] xl:gap-x-10">
        {/* BAND — name + meta + the two-line intro */}
        <div className="order-2 min-w-0 space-y-2 lg:order-none lg:col-span-2 lg:col-start-1 lg:row-start-1">
          <div className="flex items-start gap-3">
            <Skeleton className="h-8 min-w-0 flex-1 max-w-xs" />
            <div className="flex shrink-0 items-center gap-1">
              <Skeleton className="size-9 rounded-md" />
              <Skeleton className="size-9 rounded-md" />
              <Skeleton className="size-9 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-full max-w-prose" />
          <Skeleton className="h-4 w-2/3 max-w-prose" />
        </div>

        {/* BAND right — the three transact actions */}
        <div className="order-4 min-w-0 space-y-2 lg:order-none lg:col-start-3 lg:row-start-1">
          <Skeleton className="h-11 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-11 rounded-xl" />
            <Skeleton className="h-11 rounded-xl" />
          </div>
        </div>

        <div
          aria-hidden
          className="hidden border-t border-hair lg:block lg:col-span-3 lg:col-start-1 lg:row-start-2"
        />

        {/* COL 1 — image */}
        <Skeleton className="order-1 mx-auto aspect-[63/88] w-44 rounded-xl sm:w-52 lg:order-none lg:col-start-1 lg:row-start-3 lg:mx-0 lg:w-full" />

        {/* COL 2 — grade rail + hero price */}
        <div className="order-3 min-w-0 space-y-4 lg:order-none lg:col-start-2 lg:row-start-3">
          {/* edition toggle + grade rail chips */}
          <Skeleton className="h-11 w-28 rounded-full md:h-9" />
          <div className="no-sb -mx-1 max-w-full overflow-hidden px-1">
            <div className="flex w-max gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-20 shrink-0 rounded-lg" />
              ))}
            </div>
          </div>

          {/* hero price + delta */}
          <div className="space-y-2 pt-1">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-36" />
          </div>

          {/* low/high range bar */}
          <Skeleton className="h-1.5 w-full max-w-sm rounded-full" />
        </div>

        {/* COL 3 — sale reference rail */}
        <div className="order-5 min-w-0 space-y-2 lg:order-none lg:col-start-3 lg:row-start-3 lg:pl-8">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      </div>

      {/* tabs */}
      <div className="mt-6 flex gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-20" />
        ))}
      </div>

      {/* chart */}
      <Skeleton className="mt-6 h-[210px] w-full rounded-xl sm:h-[280px] lg:h-[320px]" />
    </div>
  );
}
