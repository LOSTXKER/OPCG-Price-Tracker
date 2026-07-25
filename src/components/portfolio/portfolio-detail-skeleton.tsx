import { Skeleton } from "@/components/ui/skeleton"
import { Surface } from "@/components/ui/surface"

type PortfolioSkeletonTab = "overview" | "insights"

export function PortfolioDetailSkeleton({
  rows = 6,
  tab = "overview",
}: {
  rows?: number
  tab?: PortfolioSkeletonTab
}) {
  return (
    <div data-slot="portfolio-detail-skeleton" aria-hidden>
      <div className="lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:gap-6">
        <PortfolioSidebarSkeleton />

        <div
          className="min-w-0"
          data-slot="portfolio-detail-skeleton-main"
        >
          <PortfolioToolbarSkeleton tab={tab} />

          {/* Scope filter sits below the rail (mirrors the live layout — it is a
              data control, not a tab), so the panels take the smaller step. */}
          <div
            className="pt-3 sm:pt-4"
            data-slot="portfolio-detail-skeleton-game-filter"
          >
            <Skeleton className="h-11 w-32 rounded-lg sm:h-9" />
          </div>

          <div className="pt-3">
            {tab === "overview" ? (
              <PortfolioOverviewSkeleton rows={rows} />
            ) : (
              <PortfolioInsightsSkeleton />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
function PortfolioSidebarSkeleton() {
  return (
    <aside
      className="hidden lg:sticky lg:top-24 lg:block"
      data-slot="portfolio-detail-skeleton-sidebar"
    >
      <Surface
        variant="panel"
        padding="none"
        className="overflow-hidden"
        data-slot="portfolio-detail-skeleton-sidebar-list"
      >
        <div className="px-4 pb-2 pt-4">
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="space-y-2 p-2">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      </Surface>
    </aside>
  )
}

function PortfolioToolbarSkeleton({ tab }: { tab: PortfolioSkeletonTab }) {
  return (
    <div
      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0 md:border-b md:border-hair lg:grid-cols-[auto_minmax(0,1fr)]"
      data-slot="portfolio-detail-skeleton-toolbar"
    >
      <Skeleton
        className="col-start-1 row-start-1 h-14 min-w-0 rounded-lg lg:hidden"
        data-slot="portfolio-detail-skeleton-switcher"
      />

      <div
        className="col-span-2 row-start-2 flex h-11 w-full items-center gap-1 border-b border-hair md:col-span-1 md:col-start-1 md:border-b-0 lg:row-start-1 lg:w-auto"
        data-slot="portfolio-detail-skeleton-tabs"
      >
        {Array.from({ length: 2 }).map((_, index) => {
          const active = tab === (index === 0 ? "overview" : "insights")

          return (
            <div
              key={index}
              className="relative flex h-11 flex-none items-center justify-center px-3.5"
              data-slot="portfolio-detail-skeleton-tab"
            >
              <Skeleton
                className={
                  active
                    ? "h-4 w-16 max-w-full bg-foreground/15"
                    : "h-4 w-20 max-w-full"
                }
              />
              {active ? (
                <span
                  className="absolute inset-x-0 -bottom-px h-0.5 bg-primary/60"
                  data-slot="portfolio-detail-skeleton-tab-indicator"
                />
              ) : null}
            </div>
          )
        })}
      </div>

      <div
        className="col-start-2 row-start-1 flex items-center justify-end gap-2 lg:col-start-2"
        data-slot="portfolio-detail-skeleton-actions"
      >
        <Skeleton className="size-10 rounded-lg" />
        <Skeleton className="size-10 rounded-lg" />
        {/* "เพิ่มการ์ด" keeps its label at every width, so the placeholder is
            never a square. */}
        <Skeleton className="h-11 w-28 rounded-lg sm:h-9" />
      </div>
    </div>
  )
}

function PortfolioOverviewSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-4 sm:space-y-5" data-slot="portfolio-overview-skeleton">
      <Surface
        as="section"
        variant="hero"
        padding="none"
        className="portfolio-financial-gradient overflow-hidden p-4 sm:p-6"
        data-slot="portfolio-detail-skeleton-summary"
        data-trend="neutral"
      >
        <div
          className="flex flex-wrap items-end gap-x-3 gap-y-2"
          data-slot="portfolio-detail-skeleton-summary-value"
        >
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-56 max-w-full" />
          </div>
          <Skeleton
            className="mb-1 h-8 w-20 rounded-full"
            data-slot="portfolio-detail-skeleton-summary-roi"
          />
        </div>

        <dl
          className="mt-4 grid max-w-2xl grid-cols-2 gap-0 sm:mt-6"
          data-slot="portfolio-detail-skeleton-summary-metrics"
        >
          <div
            className="min-w-0 space-y-2 pr-3 sm:pr-6"
            data-slot="portfolio-detail-skeleton-summary-pnl"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-28" />
          </div>
          <div
            className="min-w-0 space-y-2 border-l border-hair pl-3 sm:pl-6"
            data-slot="portfolio-detail-skeleton-summary-cost"
          >
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-5 w-24" />
          </div>
        </dl>
      </Surface>

      <Surface
        as="section"
        variant="panel"
        padding="none"
        className="overflow-hidden p-4 sm:p-5"
        data-slot="portfolio-detail-skeleton-assets"
      >
        <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 pb-3">
          <Skeleton className="h-4 w-44 max-w-full" />
          <div className="flex items-center gap-2">
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="h-10 w-20 rounded-lg" />
          </div>
        </div>

        <div
          className="divide-y divide-hair sm:hidden"
          data-slot="portfolio-detail-skeleton-mobile-list"
        >
          {Array.from({ length: rows }).map((_, index) => (
            /* One-line row: identity + money stack (mirrors the live list —
               no inner metric table). */
            <div
              key={index}
              className="flex min-h-[56px] items-center gap-2.5 py-2.5"
              data-slot="portfolio-detail-skeleton-mobile-row"
            >
              <Skeleton className="aspect-[63/88] w-10 shrink-0 rounded-md" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex min-w-0 items-baseline gap-2">
                  <Skeleton className="h-3.5 w-28 min-w-0 max-w-full flex-1" />
                  <Skeleton
                    className="h-3 w-8 shrink-0"
                    data-slot="portfolio-detail-skeleton-mobile-quantity"
                  />
                </div>
                <div
                  className="flex min-w-0 items-center gap-1.5"
                  data-slot="portfolio-detail-skeleton-mobile-code-date"
                >
                  <Skeleton className="h-3 w-14 shrink-0" />
                  <Skeleton
                    className="h-3 w-16 max-w-full"
                    data-slot="portfolio-detail-skeleton-mobile-date"
                  />
                </div>
              </div>

              <div
                className="shrink-0 space-y-1 text-right"
                data-slot="portfolio-detail-skeleton-mobile-metrics"
              >
                <Skeleton
                  className="ml-auto h-4 w-16"
                  data-slot="portfolio-detail-skeleton-mobile-price"
                />
                <Skeleton
                  className="ml-auto h-3 w-10"
                  data-slot="portfolio-detail-skeleton-mobile-pnl"
                />
              </div>

              <Skeleton
                className="size-5 shrink-0 rounded-md"
                data-slot="portfolio-detail-skeleton-details"
              />
            </div>
          ))}
        </div>

        <div
          className="hidden sm:block"
          data-slot="portfolio-detail-skeleton-desktop-table"
        >
          <table className="w-full table-fixed border-collapse text-left">
            <colgroup data-slot="portfolio-detail-skeleton-colgroup">
              <col className="w-[28%]" />
              <col className="w-[10%]" />
              <col className="w-[17%]" />
              <col className="w-[17%]" />
              <col className="w-[20%]" />
              <col className="w-[8%]" />
            </colgroup>
            <thead
              className="bg-transparent"
              data-slot="portfolio-detail-skeleton-head"
            >
              <tr className="border-b border-hair">
                <th className="py-3 pr-3"><Skeleton className="h-3 w-16" /></th>
                <th className="py-3 pr-3"><Skeleton className="ml-auto h-3 w-10" /></th>
                <th className="py-3 pr-3"><Skeleton className="ml-auto h-3 w-12" /></th>
                <th className="py-3 pr-3"><Skeleton className="ml-auto h-3 w-14" /></th>
                <th className="py-3 pr-3"><Skeleton className="ml-auto h-3 w-12" /></th>
                <th className="py-3" />
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }).map((_, index) => (
                <tr key={index} data-slot="portfolio-detail-skeleton-desktop-row">
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="aspect-[63/88] w-10 shrink-0 rounded-md" />
                      <div className="min-w-0 space-y-1.5">
                        <Skeleton className="h-3.5 w-36 max-w-full" />
                        <div className="flex min-w-0 items-center gap-1.5">
                          <Skeleton className="h-3 w-16 shrink-0" />
                          <Skeleton
                            className="h-3 w-20 max-w-full"
                            data-slot="portfolio-detail-skeleton-desktop-date"
                          />
                        </div>
                        <div
                          className="flex items-center gap-1.5"
                          data-slot="portfolio-detail-skeleton-note"
                        >
                          <Skeleton className="size-3 shrink-0" />
                          <Skeleton className="h-3 w-24 max-w-full" />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-3"><Skeleton className="ml-auto h-4 w-12" /></td>
                  <td className="py-3 pr-3"><Skeleton className="ml-auto h-4 w-20" /></td>
                  <td className="py-3 pr-3"><Skeleton className="ml-auto h-4 w-20" /></td>
                  <td className="space-y-1.5 py-3 pr-3">
                    <Skeleton className="ml-auto h-4 w-20" />
                    <Skeleton className="ml-auto h-3 w-12" />
                  </td>
                  <td className="py-3">
                    <Skeleton
                      className="mx-auto size-10 rounded-full"
                      data-slot="portfolio-detail-skeleton-details"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  )
}
function PortfolioInsightsSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-5" data-slot="portfolio-insights">
      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 [&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1"
        data-slot="portfolio-insights-kpis"
      >
        {Array.from({ length: 3 }).map((_, index) => (
          <Surface
            key={index}
            as="article"
            variant="outline"
            padding="none"
            className="min-w-0 p-3.5 sm:p-4"
            data-slot="portfolio-insights-kpi"
          >
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 shrink-0" />
              <Skeleton className="h-3 w-20 max-w-full" />
            </div>
            <Skeleton className="mt-3 h-6 w-24 max-w-full" />
            {index > 0 ? <Skeleton className="mt-2 h-3 w-16 max-w-full" /> : null}
          </Surface>
        ))}
      </div>

      <Surface
        as="section"
        variant="panel"
        padding="none"
        className="min-w-0 p-4 sm:p-5"
        data-slot="portfolio-insights-history"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton
          className="mt-4 h-24 w-full rounded-lg sm:h-28"
          data-slot="portfolio-insights-skeleton-chart"
        />
      </Surface>

      <Surface
        as="section"
        variant="panel"
        padding="none"
        className="min-w-0 p-4 sm:p-5"
        data-slot="portfolio-insights-allocation"
      >
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
        <div className="mt-4 space-y-3">
          {[82, 58, 36].map((width) => (
            <div key={width} className="flex items-center gap-3 py-1">
              <Skeleton
                className="aspect-[63/88] w-9 shrink-0 rounded-md"
                data-slot="portfolio-allocation-card-image"
              />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Skeleton className="h-4 w-36 max-w-[55%]" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-1 rounded-full" style={{ width: `${width}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Surface>
    </div>
  )
}
