import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* breadcrumb back button */}
      <Skeleton className="h-8 w-20" />

      {/* page header: title + description + save action */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 max-w-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>

      {/* card info panel (image + meta) */}
      <div className="panel flex items-center gap-4 p-4">
        <Skeleton className="h-[84px] w-[60px] rounded-sm" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>

      {/* form panels: pricing / description / photos / shipping */}
      <Skeleton className="panel h-40" />
      <Skeleton className="panel h-36" />
      <Skeleton className="panel h-32" />
    </div>
  );
}
