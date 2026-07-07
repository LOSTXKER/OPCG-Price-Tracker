import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="pb-16">
      <div className="relative mx-auto w-full max-w-5xl px-5 pt-6 md:px-6 md:pt-8 lg:px-8">
        {/* cover banner */}
        <Skeleton className="h-32 w-full rounded-2xl sm:h-40" />

        {/* hero: avatar + name/meta + actions */}
        <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <Skeleton className="size-24 shrink-0 rounded-full border-4 border-background" />
            <div className="space-y-2 pb-1">
              <Skeleton className="h-7 w-48 max-w-full" />
              <Skeleton className="h-4 w-36 max-w-full" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>

        {/* seller credibility strip */}
        <Skeleton className="mt-6 panel h-20" />

        {/* tabs nav */}
        <div className="mt-6 flex gap-2 border-b border-border/60 pb-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>

        {/* tab content: card grid */}
        <div className="grid grid-cols-2 gap-4 py-6 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
