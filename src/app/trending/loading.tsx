import { Skeleton } from "@/components/ui/skeleton";

export default function TrendingLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-32" />
        <Skeleton className="mt-1 h-4 w-56" />
      </div>

      {/* Period tabs */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-16 rounded-lg" />
        ))}
      </div>

      {/* Card list */}
      <div className="panel overflow-hidden p-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border/40 py-3 last:border-0">
            <Skeleton className="size-6 rounded-full" />
            <Skeleton className="size-10 rounded" />
            <div className="flex-1">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="mt-1 h-3 w-20" />
            </div>
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3.5 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
