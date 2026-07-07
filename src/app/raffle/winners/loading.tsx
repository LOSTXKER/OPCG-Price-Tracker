import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      {/* breadcrumb */}
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-4 w-2" />
        <Skeleton className="h-4 w-28" />
      </div>

      {/* page header (icon + title + description) */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      {/* month section: heading row + count */}
      <div className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-20" />
        </div>

        {/* winner card grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="panel h-72" />
          ))}
        </div>
      </div>
    </div>
  );
}
