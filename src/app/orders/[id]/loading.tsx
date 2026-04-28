import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-2" />
        <Skeleton className="h-4 w-36" />
      </div>
      <Skeleton className="h-9 w-64 max-w-full" />
      <Skeleton className="panel min-h-[200px]" />
    </div>
  );
}
