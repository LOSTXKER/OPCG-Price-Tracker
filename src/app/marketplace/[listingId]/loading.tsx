import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-10">
      {/* breadcrumb */}
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-2" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-2" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Top: Image LEFT + Info RIGHT */}
      <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
        {/* LEFT: image gallery */}
        <div className="space-y-3">
          <Skeleton className="aspect-[63/88] w-full rounded-xl" />
          <Skeleton className="h-9 w-full" />
        </div>

        {/* RIGHT: identity + price panel + seller panel */}
        <div className="min-w-0 space-y-6">
          {/* Block A: identity */}
          <div className="space-y-4">
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-4 w-32" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-12" />
            </div>
            <Skeleton className="h-4 w-48" />
          </div>

          {/* Block B: price + actions */}
          <Skeleton className="panel h-48" />

          {/* Block C: seller + shipping */}
          <Skeleton className="panel h-40" />
        </div>
      </div>

      {/* Similar listings grid below */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
