import { Skeleton } from "@/components/ui/skeleton";

export default function SetsLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-4 w-56" />
        <Skeleton className="mt-2 h-3 w-64" />
      </div>

      {/* Type filter — scrollable tab bar */}
      <div className="flex gap-1 border-b border-hair pb-2.5">
        {[12, 20, 22, 18, 12].map((w, i) => (
          <Skeleton key={i} className="h-4" style={{ width: `${w * 4}px` }} />
        ))}
      </div>

      <div>
        <Skeleton className="mb-4 h-6 w-32" />
        <div className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="aspect-[3/4] w-full rounded-lg" />
              <div>
                <Skeleton className="h-4 w-32 max-w-[80%]" />
                <Skeleton className="mt-1.5 h-3 w-24 max-w-[60%]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
