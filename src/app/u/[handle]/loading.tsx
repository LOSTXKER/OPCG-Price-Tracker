import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="pb-16">
      <div className="mx-auto w-full max-w-5xl px-5 pt-6 md:px-6 md:pt-8 lg:px-8">
        {/* cover banner */}
        <Skeleton className="h-24 w-full rounded-2xl sm:h-32 sm:rounded-3xl md:h-40" />

        {/* hero: avatar overlapping cover + name/meta + actions */}
        <div className="relative -mt-8 flex flex-col gap-4 px-1 sm:-mt-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <Skeleton className="size-20 rounded-full border-4 border-background sm:size-24" />
            <div className="space-y-2 pb-1">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56 max-w-full" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>

        {/* seller / trust strip */}
        <Skeleton className="mt-6 h-20 w-full rounded-2xl" />

        {/* tabs */}
        <div className="mt-6 flex gap-2 border-b pb-3">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>

        {/* tab content grid */}
        <div className="grid grid-cols-2 gap-4 py-6 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[63/88] w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
