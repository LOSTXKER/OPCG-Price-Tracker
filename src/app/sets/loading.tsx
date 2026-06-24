import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";

export default function SetsLoading() {
  return (
    <div className="space-y-10">
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>

      {/* Filter pills skeleton */}
      <div className="flex gap-2">
        {[16, 24, 28, 22, 14, 16].map((w, i) => (
          <Skeleton key={i} className="h-8 rounded-full" style={{ width: `${w * 4}px` }} />
        ))}
      </div>

      {/* Top valuable skeleton */}
      <Surface variant="panel" className="overflow-hidden">
        <div className="border-b border-[var(--p-hair)] px-5 py-3.5">
          <Skeleton className="h-4 w-40" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-[var(--p-hair)] px-5 py-3 last:border-0"
          >
            <Skeleton className="size-6 rounded-full" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 flex-1 max-w-48" />
            <Skeleton className="ml-auto h-4 w-20" />
          </div>
        ))}
      </Surface>

      {/* Section skeleton */}
      <div className="space-y-5">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Surface key={i} variant="panel" className="overflow-hidden">
              <Skeleton className="h-28 w-full" />
              <div className="space-y-2 p-3">
                <Skeleton className="h-4 w-3/4" />
                <div className="flex items-center justify-between pt-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </Surface>
          ))}
        </div>
      </div>
    </div>
  );
}
