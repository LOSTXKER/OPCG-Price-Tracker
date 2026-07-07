import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-10">
      {/* breadcrumb */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-2" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-2" />
          <Skeleton className="h-4 w-16" />
        </div>

        {/* hero — poster + identity */}
        <header className="mt-4 flex flex-row items-center gap-4 sm:gap-7 lg:gap-10">
          <Skeleton className="aspect-[3/4] w-40 shrink-0 rounded-xl sm:w-52 lg:w-60" />
          <div className="min-w-0 flex-1 space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-40 max-w-full" />
            <Skeleton className="h-6 w-56 max-w-full" />
            <div className="flex flex-wrap gap-4 pt-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
        </header>
      </div>

      {/* filter row + card grid */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>

        {/* section heading (name + count, flanked by hairlines) */}
        <div className="flex items-center gap-4">
          <span aria-hidden className="h-px flex-1 bg-hair" />
          <Skeleton className="h-5 w-40" />
          <span aria-hidden className="h-px flex-1 bg-hair" />
        </div>

        <div className="grid grid-cols-3 gap-x-2.5 gap-y-4 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[63/88] w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
