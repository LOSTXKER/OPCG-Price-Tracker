import { Skeleton } from "@/components/ui/skeleton";

export default function CardDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl">
      {/* breadcrumb */}
      <Skeleton className="h-4 w-48" />

      {/* 3-col hero: image · identity+price+grade rail · buy box (flat, no panels) */}
      {/* Column widths must track card-detail.tsx or the layout jumps when the
          skeleton is replaced. */}
      <div className="mt-6 flex flex-col gap-y-6 lg:grid lg:grid-cols-[220px_minmax(0,1fr)_320px] lg:items-start lg:gap-x-8 lg:gap-y-0 xl:grid-cols-[280px_minmax(0,1fr)_360px] xl:gap-x-10">
        {/* COL 1 — image */}
        <Skeleton className="mx-auto aspect-[63/88] w-44 rounded-xl sm:w-52 lg:mx-0 lg:w-full" />

        {/* COL 2 — identity + grade rail + hero price */}
        <div className="min-w-0 space-y-4">
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <Skeleton className="h-8 min-w-0 flex-1" />
              <div className="flex shrink-0 items-center gap-1">
                <Skeleton className="size-9 rounded-md" />
                <Skeleton className="size-9 rounded-md" />
                <Skeleton className="size-9 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-4 w-40" />
          </div>

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

          {/* the two-line intro that closes the price block */}
          <div className="space-y-2 pt-1">
            <Skeleton className="h-4 w-full max-w-prose" />
            <Skeleton className="h-4 w-2/3 max-w-prose" />
          </div>
        </div>

        {/* COL 3 — buy box */}
        <div className="space-y-2 pt-4 lg:pl-8 lg:pt-0">
          <Skeleton className="h-11 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-11 rounded-xl" />
            <Skeleton className="h-11 rounded-xl" />
          </div>
          <div className="flex gap-1 pt-0.5">
            <Skeleton className="size-9 rounded-lg" />
            <Skeleton className="size-9 rounded-lg" />
          </div>
          <div className="mt-5 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
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
