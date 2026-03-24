import { Skeleton } from "@/components/ui/skeleton";

export default function SetsLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-7 w-24" />
        <Skeleton className="mt-1 h-4 w-48" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="panel overflow-hidden">
            <Skeleton className="h-40 w-full" />
            <div className="p-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-2 h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
