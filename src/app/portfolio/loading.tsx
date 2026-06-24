import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";

export default function PortfolioLoading() {
  return (
    <div className="flex flex-col gap-5 md:flex-row md:gap-6">
      {/* Sidebar skeleton */}
      <div className="hidden w-56 shrink-0 space-y-3 md:block">
        <Skeleton className="h-[72px] rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>

      {/* Mobile picker skeleton */}
      <Skeleton className="h-[46px] rounded-xl md:hidden" />

      {/* Main content */}
      <div className="min-w-0 flex-1 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="size-6 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-48 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>

        {/* Hero */}
        <Skeleton className="h-36 rounded-xl" />

        {/* Stats strip */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>

        {/* Chart */}
        <Skeleton className="h-52 rounded-xl" />

        {/* Table */}
        <Surface variant="panel" className="overflow-hidden">
          <div className="border-b border-[var(--p-hair)] px-4 py-3">
            <Skeleton className="h-4 w-20" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-[var(--p-hair)] px-4 py-3 last:border-0">
              <Skeleton className="size-10 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="mt-1.5 h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3.5 w-12" />
            </div>
          ))}
        </Surface>
      </div>
    </div>
  );
}
