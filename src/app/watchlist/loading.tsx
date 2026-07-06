import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";

export default function WatchlistLoading() {
  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Surface key={i} variant="panel" padding="sm" className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-3 w-12" />
          </Surface>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-28" />
        <Skeleton className="ml-auto h-9 w-20" />
      </div>

      {/* List skeleton */}
      <Surface variant="panel" className="overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-hair px-4 py-3 last:border-0"
          >
            <Skeleton className="size-3.5 shrink-0 rounded" />
            <Skeleton className="size-10 shrink-0 rounded" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="hidden h-4 w-16 sm:block" />
            <Skeleton className="hidden h-4 w-12 sm:block" />
            <Skeleton className="hidden h-7 w-24 lg:block" />
            <Skeleton className="size-8 shrink-0 rounded-md" />
          </div>
        ))}
      </Surface>
    </div>
  );
}
