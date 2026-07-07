import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";

export default function PortfolioDetailLoading() {
  return (
    <div className="space-y-4 sm:space-y-5">
      <Skeleton className="h-4 w-40" />

      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-9 w-48 rounded-xl" />
        <div className="flex items-center gap-1.5">
          <Skeleton className="size-9 rounded-lg" />
          <Skeleton className="size-9 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      <Surface variant="panel" className="space-y-4 p-4 sm:p-5">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-56" />
        </div>
        <div className="grid grid-cols-2 gap-4 border-t border-hair pt-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </Surface>

      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="aspect-[63/88] w-11 rounded-md" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="space-y-1.5 text-right">
              <Skeleton className="ml-auto h-4 w-20" />
              <Skeleton className="ml-auto h-3 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
