import { Skeleton } from "@/components/ui/skeleton";

export default function PortfolioLoading() {
  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-12 w-56 rounded-xl" />
        <div className="flex items-center gap-1.5">
          <Skeleton className="size-9 rounded-lg" />
          <Skeleton className="size-9 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* Holdings toolbar */}
      <div className="flex items-center gap-3 border-b border-[var(--p-hair)] pb-3">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="ml-auto h-7 w-32 rounded-lg" />
      </div>

      {/* Collection grid */}
      <div className="grid grid-cols-2 gap-3 pt-1 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="aspect-[63/88] w-full rounded-xl" />
            <Skeleton className="mt-2 h-3.5 w-3/4" />
            <Skeleton className="mt-1.5 h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
