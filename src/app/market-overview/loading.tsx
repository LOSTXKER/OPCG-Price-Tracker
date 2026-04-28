import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-4 w-2" />
        <Skeleton className="h-4 w-36" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-7 w-36 rounded-full" />
      </div>

      <div className="panel overflow-hidden">
        <div className="grid gap-6 p-6 lg:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-5 w-32 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-border/40 border-t border-border/40">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2 px-5 py-4">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="grid grid-cols-3 gap-2 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="panel overflow-hidden">
              <Skeleton className="aspect-[63/88] w-full rounded-none" />
              <div className="space-y-2 p-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-14" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="panel h-[420px]" />
        <Skeleton className="panel h-[420px]" />
      </div>
    </div>
  );
}
