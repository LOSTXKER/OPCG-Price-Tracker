import { Skeleton } from "@/components/ui/skeleton";

export default function PortfolioLoading() {
  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Action row */}
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-12 w-56 rounded-xl" />
        <div className="flex items-center gap-1.5">
          <Skeleton className="size-9 rounded-lg" />
          <Skeleton className="size-9 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      {/* Underline tabs */}
      <div className="border-b border-[var(--p-hair)] pb-2.5">
        <Skeleton className="h-4 w-44" />
      </div>

      {/* Hero line — eyebrow + display number */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-11 w-64" />
      </div>

      {/* Stat strip */}
      <div className="flex gap-10 border-t border-[var(--p-hair)] pt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>

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
  );
}
