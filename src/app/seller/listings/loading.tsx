import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";

export default function SellerListingsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <Surface variant="panel" className="overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border/40 px-4 py-3 last:border-0">
            <Skeleton className="size-12 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        ))}
      </Surface>
    </div>
  );
}
