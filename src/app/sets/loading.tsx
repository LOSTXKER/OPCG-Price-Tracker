import { Skeleton } from "@/components/ui/skeleton";

export default function SetsLoading() {
  return (
    <div className="space-y-10">
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>

      {/* Top valuable skeleton */}
      <div className="panel overflow-hidden">
        <div className="border-b border-border/60 px-5 py-3.5">
          <Skeleton className="h-4 w-40" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border/40 px-5 py-3 last:border-0">
            <Skeleton className="size-6 rounded-full" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 flex-1 max-w-48" />
            <Skeleton className="ml-auto h-4 w-20" />
          </div>
        ))}
      </div>

      {/* Section skeleton */}
      <div className="space-y-5">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="panel overflow-hidden">
              <Skeleton className="h-36 w-full" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-4 w-3/4" />
                <div className="flex items-center justify-between pt-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
