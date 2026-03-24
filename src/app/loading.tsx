import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="space-y-8">
      {/* Stat widgets */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="panel p-4">
            <Skeleton className="mb-2 h-3 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>

      {/* Featured + Gainers */}
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="panel p-5 lg:col-span-5">
          <Skeleton className="mb-3 h-4 w-28" />
          <Skeleton className="mx-auto aspect-[63/88] w-full max-w-[200px] rounded-lg" />
          <Skeleton className="mx-auto mt-3 h-4 w-32" />
        </div>
        <div className="panel p-5 lg:col-span-7">
          <Skeleton className="mb-3 h-4 w-28" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5">
              <Skeleton className="size-6 rounded-full" />
              <Skeleton className="size-8 rounded" />
              <div className="flex-1">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="mt-1 h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* Losers + Viewed */}
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="panel p-5">
            <Skeleton className="mb-3 h-4 w-28" />
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3 py-2.5">
                <Skeleton className="size-6 rounded-full" />
                <Skeleton className="size-8 rounded" />
                <Skeleton className="h-3.5 w-28 flex-1" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
