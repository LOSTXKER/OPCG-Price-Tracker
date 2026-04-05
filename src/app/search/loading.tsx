import { Skeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <div className="space-y-4">
      {/* Search bar */}
      <Skeleton className="h-12 w-full rounded-xl" />

      {/* Controls panel */}
      <div className="panel overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center gap-2 border-t border-border/40 bg-muted/20 px-4 py-2.5">
          <Skeleton className="h-8 w-40 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="ml-auto h-8 w-16 rounded-lg" />
        </div>
      </div>

      {/* Results table */}
      <div className="panel divide-y divide-border/30 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="size-10 shrink-0 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="hidden h-4 w-20 sm:block" />
            <Skeleton className="hidden h-3.5 w-12 sm:block" />
            <Skeleton className="hidden h-3.5 w-12 md:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
