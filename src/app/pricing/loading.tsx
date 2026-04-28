import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-4 w-2" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-9 w-48" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="panel flex h-[200px] flex-col gap-3 p-5">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-10 w-32" />
            <div className="mt-auto space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
