import { Skeleton } from "@/components/ui/skeleton";

export default function DeckCalculatorLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-40" />
        <Skeleton className="mt-1 h-4 w-56" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Deck list */}
        <div className="panel p-5 space-y-3">
          <Skeleton className="h-5 w-28" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-8 rounded" />
              <Skeleton className="h-3.5 w-32 flex-1" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="panel p-5 space-y-3">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>
    </div>
  );
}
