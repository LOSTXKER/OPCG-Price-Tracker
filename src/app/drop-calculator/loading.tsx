import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-4 w-2" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-8 w-44" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel space-y-3 p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="panel h-[200px]" />
      </div>
    </div>
  );
}
