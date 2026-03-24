import { Skeleton } from "@/components/ui/skeleton";

export default function CardDetailLoading() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-4 w-48" />
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Skeleton className="mx-auto aspect-[63/88] w-full max-w-[360px] rounded-xl lg:max-w-none" />
        </div>
        <div className="space-y-4 lg:col-span-7">
          <div>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-2 h-8 w-64" />
            <Skeleton className="mt-2 h-4 w-48" />
          </div>
          <div className="panel p-5">
            <Skeleton className="h-3 w-12 mb-3" />
            <Skeleton className="h-9 w-32" />
            <Skeleton className="mt-3 h-9 w-40 rounded-lg" />
          </div>
          <div className="panel p-5">
            <Skeleton className="h-3 w-12 mb-3" />
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-2.5 w-10" />
                  <Skeleton className="mt-1 h-5 w-12" />
                </div>
              ))}
            </div>
          </div>
          <div className="panel p-5">
            <Skeleton className="h-3 w-20 mb-3" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
