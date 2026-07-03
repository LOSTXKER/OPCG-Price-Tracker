import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";

export default function PortfolioLoading() {
  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Dashboard hero */}
      <Surface variant="panel" className="space-y-3 p-4 sm:p-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-3 w-32" />
      </Surface>

      {/* Portfolio picker grid */}
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Surface key={i} variant="panel" className="space-y-3 p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-32" />
              <div className="flex gap-1.5">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="aspect-[63/88] w-7 rounded" />
                ))}
              </div>
            </Surface>
          ))}
        </div>
      </div>
    </div>
  );
}
