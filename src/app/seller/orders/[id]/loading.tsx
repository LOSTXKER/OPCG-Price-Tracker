import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* breadcrumb back button */}
      <Skeleton className="h-8 w-20" />

      {/* header: title + status badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-48 max-w-full" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      {/* product info: card image + details */}
      <Surface variant="panel" padding="md" className="flex items-center gap-4">
        <Skeleton className="h-[90px] w-[64px] shrink-0 rounded-sm" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-48 max-w-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-28" />
        </div>
      </Surface>

      {/* buyer info */}
      <Surface variant="panel" padding="md" className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-8 w-24" />
      </Surface>

      {/* status timeline */}
      <Surface variant="panel" padding="md" className="space-y-4">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1.5 pt-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
        ))}
      </Surface>
    </div>
  );
}
