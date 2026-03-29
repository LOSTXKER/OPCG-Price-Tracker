import { Skeleton } from "@/components/ui/skeleton";

export default function WatchlistLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-32" />

      <div className="panel overflow-hidden p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border/40 py-3 last:border-0">
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
