import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";

const ROWS = 8;

function TrendingControlsSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="no-sb -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
        <div className="inline-flex h-11 items-center gap-0.5 rounded-xl bg-muted/50 sm:h-10 sm:rounded-lg sm:p-1">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton
              key={index}
              data-testid="trending-scope-option"
              className="h-11 w-28 shrink-0 rounded-lg sm:h-8 sm:w-32 sm:rounded-md"
            />
          ))}
        </div>
      </div>

      <div className="ml-auto inline-flex h-11 items-center gap-0.5 rounded-full bg-muted/50 px-0.5 md:h-8 md:p-0.5">
        <Skeleton className="mx-1.5 size-3.5 shrink-0 rounded-full" />
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton
            key={index}
            data-testid="trending-period-option"
            className="h-11 w-12 shrink-0 rounded-full md:h-7"
          />
        ))}
      </div>
    </div>
  );
}

function MobileTrendingListSkeleton() {
  return (
    <Surface
      data-testid="trending-mobile-list"
      variant="panel"
      padding="none"
      className="overflow-hidden sm:hidden"
    >
      <div className="divide-y divide-hair">
        {Array.from({ length: ROWS }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="h-4 w-5 shrink-0" />
            <Skeleton className="size-11 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-32 max-w-full" />
              <Skeleton className="mt-1 h-3 w-20" />
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        ))}
      </div>
    </Surface>
  );
}

function DesktopTrendingTableSkeleton() {
  return (
    <Surface
      data-testid="trending-desktop-table"
      variant="panel"
      padding="none"
      className="hidden overflow-hidden sm:block"
    >
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col className="w-12" />
            <col />
            <col className="w-20" />
            <col className="w-28" />
            <col className="w-36" />
            <col className="hidden w-24 sm:table-column" />
          </colgroup>
          <thead>
            <tr className="border-b border-hair">
              {Array.from({ length: 6 }).map((_, index) => (
                <th key={index} className="px-4 py-3">
                  <Skeleton className={index === 1 ? "h-3 w-20" : "ml-auto h-3 w-10"} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROWS }).map((_, index) => (
              <tr key={index} className="border-b border-hair last:border-0">
                <td className="px-4 py-2.5"><Skeleton className="mx-auto h-3 w-4" /></td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-9 shrink-0 rounded-sm" />
                    <div className="min-w-0 flex-1">
                      <Skeleton className="h-4 w-32 max-w-full" />
                      <Skeleton className="mt-1 h-3 w-12" />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5"><Skeleton className="h-3 w-12" /></td>
                <td className="px-4 py-2.5"><Skeleton className="ml-auto h-4 w-16" /></td>
                <td className="px-4 py-2.5"><Skeleton className="ml-auto h-4 w-14" /></td>
                <td className="hidden px-4 py-2.5 sm:table-cell">
                  <Skeleton className="ml-auto h-7 w-20" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Surface>
  );
}

export default function TrendingLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-32" />
        <Skeleton className="mt-1 h-4 w-56" />
      </div>

      <div className="space-y-4">
        <TrendingControlsSkeleton />
        <MobileTrendingListSkeleton />
        <DesktopTrendingTableSkeleton />
      </div>
    </div>
  );
}
