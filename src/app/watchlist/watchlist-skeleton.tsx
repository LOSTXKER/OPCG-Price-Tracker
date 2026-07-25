import { buildMarketColumns } from "@/components/market/market-columns";
import {
  MarketTableLayout,
  marketTableCellClass,
  marketTableHeaderClass,
  type MarketTableLayoutColumn,
} from "@/components/market/market-table-layout";
import { Skeleton } from "@/components/ui/skeleton";

const WATCHLIST_SKELETON_COLUMNS: MarketTableLayoutColumn[] = [
  ...buildMarketColumns({ showViews: false }).filter(
    (column) => column.key !== "star" && column.key !== "rank",
  ),
  { key: "actions", col: "w-[100px]", cell: "", align: "right" },
];

const GRADE_SKELETON_WIDTHS = ["w-11", "w-14", "w-12", "w-12", "w-14"];

/** One stable shape for route, auth and client-data loading on /watchlist. */
export function WatchlistSkeleton({ withHeader = true }: { withHeader?: boolean }) {
  return (
    <div className="space-y-4 md:space-y-5" role="status" aria-label="Loading watchlist">
      {withHeader && (
        <>
          <Skeleton className="h-10 w-44" />
          <div className="flex h-11 items-center gap-3 border-b border-hair md:h-10">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-28" />
          </div>
        </>
      )}

      <div
        className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-x-2 sm:gap-y-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-y-0"
        data-slot="watchlist-skeleton-toolbar"
      >
        <Skeleton
          className="h-11 w-32 rounded-lg sm:col-start-1 sm:row-start-1 sm:h-9"
          data-slot="watchlist-skeleton-game-filter"
        />

        <div
          className="contents"
          data-slot="watchlist-skeleton-toolbar-controls"
        >
          <div
            className="flex items-center gap-2 sm:hidden"
            data-slot="watchlist-skeleton-mobile-search"
          >
            <Skeleton className="h-11 min-w-0 flex-1 rounded-lg" />
            <Skeleton className="size-9 rounded-md" />
            <Skeleton className="size-9 rounded-md" />
          </div>
          <div className="sm:hidden" data-slot="watchlist-skeleton-mobile-grade">
            <GradeRailSkeleton />
          </div>
          <div
            className="hidden min-w-0 sm:col-start-2 sm:row-start-1 sm:block"
            data-slot="watchlist-skeleton-toolbar-search"
          >
            <Skeleton className="h-9 min-w-0 flex-1 rounded-lg md:w-72 md:flex-none" />
          </div>
          <div
            className="hidden min-w-0 shrink-0 items-center gap-1.5 sm:col-span-2 sm:row-start-2 sm:flex sm:justify-self-end lg:col-span-1 lg:col-start-3 lg:row-start-1"
            data-slot="watchlist-skeleton-toolbar-actions"
          >
            <GradeRailSkeleton />
            <Skeleton className="h-5 w-px shrink-0" />
            <Skeleton className="h-7 w-20 shrink-0 rounded-md" />
            <Skeleton className="h-7 w-20 shrink-0 rounded-md" />
          </div>
        </div>
      </div>

      <div className="sm:hidden">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2 border-b border-hair px-1 pb-2">
          <Skeleton className="h-9 w-44 rounded-full" />
          <div className="ml-auto flex items-center gap-3">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-3 w-14" />
          </div>
        </div>
        <div className="divide-y divide-hair">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex min-w-0 items-center gap-3 px-4 py-2.5">
              <Skeleton className="aspect-[63/88] w-11 shrink-0 rounded-md" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-4/5" />
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-8 rounded-full" />
                  <Skeleton className="ml-auto h-5 w-12" />
                </div>
              </div>
              <div className="shrink-0 space-y-1 text-right">
                <Skeleton className="ml-auto h-4 w-16" />
                <Skeleton className="ml-auto h-4 w-10" />
              </div>
              <span className="inline-flex size-11 shrink-0 items-center justify-center">
                <Skeleton className="size-8 rounded-lg" />
              </span>
            </div>
          ))}
        </div>
      </div>

      <MarketTableLayout
        columns={WATCHLIST_SKELETON_COLUMNS}
        surface="canvas"
        header={WATCHLIST_SKELETON_COLUMNS.map((column) => (
          <th key={column.key} className={marketTableHeaderClass(column)}>
            <Skeleton className={headerWidth(column.key)} />
          </th>
        ))}
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <DesktopRowSkeleton key={index} />
        ))}
      </MarketTableLayout>
    </div>
  );
}

function headerWidth(key: string) {
  if (key === "card") return "h-3 w-20";
  if (key === "sparkline") return "ml-auto h-3 w-20";
  if (key === "actions") return "ml-auto h-3 w-10";
  return "ml-auto h-3 w-12";
}

function DesktopRowSkeleton() {
  return (
    <tr>
      {WATCHLIST_SKELETON_COLUMNS.map((column) => (
        <td key={column.key} className={marketTableCellClass(column)}>
          {column.key === "card" ? (
            <div className="flex min-w-0 items-center gap-3">
              <Skeleton className="size-10 shrink-0 rounded-md" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-40 max-w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ) : column.key === "rarity" ? (
            <Skeleton className="h-5 w-10 rounded-full" />
          ) : column.key === "sparkline" ? (
            <Skeleton className="ml-auto h-7 w-[88px]" />
          ) : column.key === "actions" ? (
            <div className="flex items-center justify-end gap-2">
              <Skeleton className="size-9 rounded-lg" />
              <Skeleton className="size-9 rounded-lg" />
            </div>
          ) : (
            <Skeleton className="ml-auto h-4 w-14" />
          )}
        </td>
      ))}
    </tr>
  );
}

function GradeRailSkeleton() {
  return (
    <div className="no-sb w-full min-w-0 max-w-full overflow-hidden pb-px sm:w-56 lg:w-auto">
      <div className="inline-flex h-11 w-max shrink-0 items-center gap-0.5 rounded-lg bg-muted/50 p-1 lg:h-9">
        {GRADE_SKELETON_WIDTHS.map((width, index) => (
          <Skeleton key={index} className={`h-7 rounded-md ${width}`} />
        ))}
      </div>
    </div>
  );
}
