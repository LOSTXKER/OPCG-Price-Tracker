import { CardGrid } from "@/components/cards/card-grid"
import { CardItemSkeleton } from "@/components/cards/card-item"
import { MobileCardSkeleton } from "@/components/home/mobile-card-item"
import {
  MarketTableLayout,
  marketTableHeaderClass,
} from "@/components/market/market-table-layout"
import { MarketTableRowSkeleton } from "@/components/market/market-table-row"
import { Skeleton } from "@/components/ui/skeleton"
import { Surface } from "@/components/ui/surface"

import { SEARCH_COLUMNS } from "./search-market-config"

export type SearchResultsSkeletonView = "table" | "grid"

function SearchBarSkeleton() {
  return (
    <div
      aria-hidden
      data-slot="search-bar-skeleton"
      className="flex items-center gap-2"
    >
      <Skeleton className="h-12 min-w-0 flex-1 rounded-l-xl rounded-r-none" />
      <Skeleton className="-ml-2 h-12 w-24 shrink-0 rounded-l-none rounded-r-xl" />
      <Skeleton className="size-12 shrink-0 rounded-lg" />
    </div>
  )
}

/** Mirrors the query summary and the runtime's wrapping set/grade/action rail. */
export function SearchControlsSkeleton() {
  return (
    <Surface
      variant="panel"
      padding="none"
      data-slot="search-controls-skeleton"
      className="overflow-hidden"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <Skeleton className="h-4 w-48 max-w-full" />
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-b-lg border-t border-hair bg-popover px-4 py-2.5">
        <Skeleton className="h-10 min-w-0 basis-full rounded-lg sm:h-9 sm:basis-auto sm:w-[220px]" />

        {/* GradeControl is a full row on phones, 224px at sm, and remains a
            44px touch rail through tablet before compacting at lg. */}
        <div className="min-w-0 basis-full sm:basis-auto sm:w-56 lg:w-72">
          <Skeleton className="h-11 w-full rounded-full lg:h-9" />
        </div>

        <Skeleton className="h-11 w-28 shrink-0 rounded-md md:h-9" />
        <Skeleton className="hidden h-11 w-32 shrink-0 rounded-md sm:block md:h-9" />
        <Skeleton className="ml-auto h-11 w-40 shrink-0 rounded-lg md:h-9" />
      </div>
    </Surface>
  )
}

/** One result placeholder for route loading and in-place query transitions. */
export function SearchResultsSkeleton({
  view = "table",
  rows = 8,
}: {
  view?: SearchResultsSkeletonView
  rows?: number
}) {
  if (view === "grid") {
    return (
      <div
        role="status"
        aria-label="กำลังโหลดผลการค้นหา"
        data-slot="search-results-skeleton"
        data-view="grid"
      >
        <CardGrid>
          {Array.from({ length: 10 }).map((_, index) => (
            <CardItemSkeleton key={index} />
          ))}
        </CardGrid>
      </div>
    )
  }

  return (
    <div
      role="status"
      aria-label="กำลังโหลดผลการค้นหา"
      data-slot="search-results-skeleton"
      data-view="table"
    >
      <div
        aria-hidden
        data-slot="search-mobile-list-skeleton"
        className="divide-y divide-hair sm:hidden"
      >
        {Array.from({ length: rows }).map((_, index) => (
          <MobileCardSkeleton key={index} />
        ))}
      </div>

      <div aria-hidden data-slot="search-desktop-table-skeleton">
        <MarketTableLayout
          columns={SEARCH_COLUMNS}
          surface="canvas"
          header={SEARCH_COLUMNS.map((column) => (
            <th key={column.key} className={marketTableHeaderClass(column)}>
              <Skeleton
                className={
                  column.align === "right"
                    ? "ml-auto h-3 w-10"
                    : "h-3 w-10"
                }
              />
            </th>
          ))}
        >
          {Array.from({ length: rows }).map((_, index) => (
            <MarketTableRowSkeleton key={index} columns={SEARCH_COLUMNS} />
          ))}
        </MarketTableLayout>
      </div>
    </div>
  )
}

export function SearchPageSkeleton() {
  return (
    <div data-slot="search-page-skeleton" className="space-y-4">
      <SearchBarSkeleton />
      <SearchControlsSkeleton />
      <SearchResultsSkeleton />
    </div>
  )
}
