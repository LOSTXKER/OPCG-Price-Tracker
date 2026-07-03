import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";

export default function PortfolioLoading() {
  return (
    <div className="lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:gap-6">
      {/* Sidebar */}
      <aside className="hidden lg:block lg:space-y-4">
        <Surface variant="panel" className="space-y-1.5 p-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-32" />
        </Surface>
        <Surface variant="panel" className="space-y-2 p-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-lg" />
          ))}
        </Surface>
      </aside>

      <div className="mt-5 space-y-5 sm:space-y-6 lg:mt-0">
        {/* Top bar: pill (mobile) / tabs (desktop) + actions */}
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-9 w-48 rounded-xl lg:hidden" />
          <Skeleton className="hidden h-8 w-40 rounded-lg lg:block" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="size-9 rounded-lg" />
            <Skeleton className="size-9 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>

        {/* Hero panel — value + delta + 4-stat row */}
        <Surface variant="panel" className="space-y-4 p-4 sm:p-5">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-56" />
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-[var(--p-hair)] pt-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </Surface>

        {/* Holdings toolbar */}
        <div className="flex items-center gap-3 border-b border-[var(--p-hair)] pb-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="ml-auto h-7 w-32 rounded-lg" />
        </div>

        {/* Holdings rows */}
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
    </div>
  );
}
