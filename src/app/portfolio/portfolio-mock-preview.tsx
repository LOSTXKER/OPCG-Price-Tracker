"use client"

import type { ReactNode } from "react"
import {
  Calculator,
  ChevronRight,
  Eye,
  Gauge,
  Layers3,
  Lock,
  Plus,
  Share2,
  StickyNote,
  type LucideIcon,
} from "lucide-react"

import { PurchaseNotePreview } from "@/components/portfolio/assets-table/purchase-note-preview"
import { formatPurchaseRowQuantity } from "@/components/portfolio/assets-table/utils"
import { GameFilterChips } from "@/components/shared/game-filter-chips"
import { Skeleton } from "@/components/ui/skeleton"
import { Surface } from "@/components/ui/surface"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ALL_GAMES } from "@/lib/game/constants"
import { getLocale, t, type Language } from "@/lib/i18n"
import { formatJpyAmount } from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"

const MOCK_PURCHASE_ROWS = [
  {
    id: "luffy-latest",
    code: "OP01-016",
    quantity: 1,
    acquiredAt: "2026-07-18T00:00:00.000Z",
    hasNote: true,
    unitCostJpy: 3_350,
  },
  {
    id: "luffy-first",
    code: "OP01-016",
    quantity: 2,
    acquiredAt: "2026-06-02T00:00:00.000Z",
    hasNote: false,
    unitCostJpy: 2_900,
  },
  {
    id: "zoro",
    code: "OP05-119",
    quantity: 1,
    acquiredAt: null,
    hasNote: true,
    unitCostJpy: 4_150,
  },
  {
    id: "nami",
    code: "OP09-093",
    quantity: 1,
    acquiredAt: "2026-05-11T00:00:00.000Z",
    hasNote: false,
    unitCostJpy: 1_100,
  },
] as const
const MOCK_ALLOCATION = [
  { label: "Monkey.D.Luffy", share: 54, valueJpy: 8_413 },
  { label: "Roronoa Zoro", share: 28, valueJpy: 4_362 },
  { label: "Nami", share: 18, valueJpy: 2_805 },
] as const

function PreviewAmount({
  jpy,
  signed = false,
}: {
  jpy: number
  signed?: boolean
}) {
  const currency = useUIStore((state) => state.currency)
  return (
    <>
      {signed && jpy > 0 ? "+" : ""}
      {formatJpyAmount(jpy, currency)}
    </>
  )
}

function portfolioCountSummary(
  lang: Language,
  holdingCount: number,
  copyCount: number,
) {
  return t(lang, "portfolioCardCountSummary")
    .replace("{holdings}", holdingCount.toLocaleString(getLocale(lang)))
    .replace("{copies}", copyCount.toLocaleString(getLocale(lang)))
}

function purchaseCountSummary(
  lang: Language,
  purchaseCount: number,
  copyCount: number,
) {
  return t(lang, "portfolioPurchaseCountSummary")
    .replace("{purchases}", purchaseCount.toLocaleString(getLocale(lang)))
    .replace("{copies}", copyCount.toLocaleString(getLocale(lang)))
}

function previewPurchaseDate(
  lang: Language,
  row: (typeof MOCK_PURCHASE_ROWS)[number],
  style: "full" | "compact" = "full",
) {
  if (!row.acquiredAt) return t(lang, "dateNotSpecified")

  const parsed = new Date(row.acquiredAt)
  const thisYear = parsed.getUTCFullYear() === new Date().getUTCFullYear()
  return new Intl.DateTimeFormat(getLocale(lang), {
    day: "numeric",
    month: "short",
    // Mirrors formatPurchaseRowDate: the mobile row drops a same-year year.
    year: style === "full" ? "numeric" : thisYear ? undefined : "2-digit",
    timeZone: "UTC",
  }).format(parsed)
}

/** Static, data-free detail preview shared by every logged-out portfolio URL. */
export function PortfolioMockPreview({ lang }: { lang: Language }) {
  return (
    <div data-slot="portfolio-detail-preview">
      <div className="lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:gap-6">
        <PortfolioPreviewSidebar lang={lang} />

        <Tabs
          defaultValue="overview"
          className="min-w-0 gap-0"
          data-slot="portfolio-detail-preview-main"
        >
          <PortfolioPreviewToolbar lang={lang} />

          {/* Scope filter below the rail — same grammar as the live page: the
              tab rail carries navigation + actions, the data control sits with
              the data. */}
          <div
            className="pt-3 sm:pt-4"
            data-slot="portfolio-detail-preview-game-filter"
          >
            <GameFilterChips
              games={[{ slug: "opcg", label: "One Piece" }]}
              activeGame={ALL_GAMES}
              onSelect={() => undefined}
              variant="select"
            />
          </div>

          <TabsContent
            value="overview"
            keepMounted
            className="pt-3"
            data-slot="portfolio-overview"
          >
            <PortfolioPreviewOverview lang={lang} />
          </TabsContent>

          <TabsContent
            value="insights"
            keepMounted
            className="pt-3"
          >
            <PortfolioPreviewInsights lang={lang} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
function PortfolioPreviewSidebar({ lang }: { lang: Language }) {
  return (
    <aside
      className="hidden lg:sticky lg:top-24 lg:block"
      data-slot="portfolio-detail-preview-sidebar"
    >
      <Surface
        variant="panel"
        padding="none"
        className="overflow-hidden"
        data-slot="portfolio-detail-preview-sidebar-list"
      >
        <div className="px-4 pb-2 pt-4">
          <p className="text-eyebrow">
            {t(lang, "portfolio")} (1)
          </p>
        </div>
        <div className="space-y-2 p-2">
          <div className="rounded-lg bg-muted/50 px-3 py-3 ring-1 ring-hair">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Lock className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-label text-foreground">
                  {t(lang, "myPortfolio")}
                </p>
                <p className="mt-1 truncate text-meta font-price tabular-nums">
                  <PreviewAmount jpy={15_580} />{" "}
                  <span className="text-price-up">+16.3%</span>
                </p>
              </div>
            </div>
          </div>
          <div className="flex min-h-12 items-center gap-3 rounded-lg px-3 text-muted-foreground ring-1 ring-dashed ring-hair">
            <span className="flex size-8 items-center justify-center rounded-full bg-muted">
              <Plus className="size-4" aria-hidden />
            </span>
            <span className="text-body-sm">{t(lang, "createPortfolio")}</span>
          </div>
        </div>
      </Surface>
    </aside>
  )
}

function PortfolioPreviewToolbar({ lang }: { lang: Language }) {
  return (
    <div
      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0 md:border-b md:border-hair lg:grid-cols-[auto_minmax(0,1fr)]"
      data-slot="portfolio-detail-preview-toolbar"
    >
      <Surface
        variant="subtle"
        padding="none"
        className="col-start-1 row-start-1 flex h-14 min-w-0 items-center gap-2 px-3 lg:hidden"
        data-slot="portfolio-detail-preview-switcher"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-label text-foreground">
            {t(lang, "myPortfolio")}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-meta">
            <Lock className="size-3" aria-hidden />
            {t(lang, "portfolioPrivate")}
          </p>
        </div>
      </Surface>

      <TabsList
        variant="line"
        aria-label={t(lang, "portfolio")}
        className="col-span-2 row-start-2 w-full justify-start gap-1 border-b border-hair p-0 group-data-horizontal/tabs:h-11 md:col-span-1 md:col-start-1 md:border-b-0 lg:row-start-1 lg:w-auto"
        data-slot="portfolio-detail-preview-tabs"
      >
        <TabsTrigger
          value="overview"
          className="min-h-11 flex-none px-3.5 group-data-horizontal/tabs:after:-bottom-px"
        >
          {t(lang, "overviewTab")}
        </TabsTrigger>
        <TabsTrigger
          value="insights"
          className="min-h-11 flex-none px-3.5 group-data-horizontal/tabs:after:-bottom-px"
        >
          {t(lang, "insightsTab")}
        </TabsTrigger>
      </TabsList>

      <div
        className="col-start-2 row-start-1 flex items-center justify-end gap-2 lg:col-start-2"
        data-slot="portfolio-detail-preview-actions"
      >
        <span className="flex size-10 items-center justify-center rounded-lg bg-muted/50">
          <Eye className="size-4" aria-hidden />
        </span>
        <span className="flex size-10 items-center justify-center rounded-lg bg-muted/50">
          <Share2 className="size-4" aria-hidden />
        </span>
        {/* Mirrors the live button: label visible at every width. */}
        <span className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 text-label text-primary-foreground sm:min-h-9">
          <Plus className="size-4" aria-hidden />
          {t(lang, "addCard")}
        </span>
      </div>
    </div>
  )
}

function PortfolioPreviewOverview({ lang }: { lang: Language }) {
  return (
    <div className="space-y-4 sm:space-y-5">
      <Surface
        as="section"
        variant="hero"
        padding="none"
        className="portfolio-financial-gradient overflow-hidden p-4 sm:p-6"
        data-slot="portfolio-detail-preview-summary"
        data-trend="up"
      >
        <div
          className="flex flex-wrap items-end gap-x-3 gap-y-2"
          data-slot="portfolio-detail-preview-summary-value"
        >
          <div>
            <p className="text-eyebrow">{t(lang, "portfolioValue")}</p>
            <p className="mt-2 text-display font-price tabular-nums">
              <PreviewAmount jpy={15_580} />
            </p>
          </div>
          <span
            className="mb-1 inline-flex shrink-0 rounded-full bg-price-up/10 px-2.5 py-1 text-label font-price tabular-nums text-price-up-on-soft"
            data-slot="portfolio-detail-preview-summary-roi"
          >
            <span className="sr-only">{t(lang, "roi")} </span>
            +16.3%
          </span>
        </div>

        <dl
          className="mt-4 grid max-w-2xl grid-cols-2 gap-0 sm:mt-6"
          data-slot="portfolio-detail-preview-summary-metrics"
        >
          <div className="min-w-0 pr-3 sm:pr-6" data-slot="portfolio-detail-preview-summary-pnl">
            <dt className="text-label text-foreground">
              {t(lang, "unrealizedPnl")}
            </dt>
            <dd className="mt-1.5 text-h4 font-price tabular-nums text-price-up">
              <PreviewAmount jpy={2_180} signed />
            </dd>
          </div>
          <div
            className="min-w-0 border-l border-hair pl-3 sm:pl-6"
            data-slot="portfolio-detail-preview-summary-cost"
          >
            <dt className="text-label text-foreground">{t(lang, "costBasis")}</dt>
            <dd className="mt-1.5 text-h4 font-price tabular-nums text-foreground">
              <PreviewAmount jpy={13_400} />
            </dd>
          </div>
        </dl>
      </Surface>

      <Surface
        as="section"
        variant="panel"
        padding="none"
        className="overflow-hidden p-4 sm:p-5"
        data-slot="portfolio-detail-preview-assets"
      >
        <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 pb-3">
          <p className="text-eyebrow">
            {t(lang, "purchaseLots")}
            <span
              className="ml-2 tabular-nums text-muted-foreground/70"
              data-slot="portfolio-assets-count-summary"
            >
              {purchaseCountSummary(lang, 4, 5)}
            </span>
          </p>
          <div className="flex items-center gap-2" aria-hidden>
            <span className="size-10 rounded-full bg-muted/50" />
            <span className="h-10 w-20 rounded-lg bg-muted/50" />
          </div>
        </div>

        <div
          className="divide-y divide-hair sm:hidden"
          data-slot="portfolio-detail-preview-mobile-list"
        >
          {MOCK_PURCHASE_ROWS.map((row) => (
            /* Same one-line row as the live list: identity + money stack,
               labels for AT only, no inner metric table. */
            <div
              key={row.id}
              className="flex min-h-[56px] items-center gap-2.5 py-2.5"
              data-slot="portfolio-detail-preview-mobile-row"
            >
              <Skeleton className="aspect-[63/88] w-10 shrink-0 rounded-md" />
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-baseline gap-2">
                  <Skeleton className="h-3.5 w-28 min-w-0 max-w-full flex-1" />
                  {row.quantity > 1 && (
                    <span
                      className="shrink-0 whitespace-nowrap text-meta tabular-nums"
                      data-slot="portfolio-detail-preview-mobile-quantity"
                    >
                      {formatPurchaseRowQuantity(row.quantity, lang)}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-meta">
                  <span className="shrink-0 font-mono">{row.code}</span>
                  <span aria-hidden>·</span>
                  <span
                    className={
                      row.acquiredAt
                        ? "truncate whitespace-nowrap"
                        : "truncate whitespace-nowrap text-primary"
                    }
                    data-slot="portfolio-detail-preview-mobile-date"
                    data-state={row.acquiredAt ? "recorded" : "missing"}
                  >
                    {previewPurchaseDate(lang, row, "compact")}
                  </span>
                  {row.hasNote && (
                    <span
                      className="shrink-0 text-muted-foreground/70"
                      data-slot="portfolio-detail-preview-note"
                      title={t(lang, "portfolioPreviewNote")}
                    >
                      <StickyNote className="size-3" aria-hidden />
                    </span>
                  )}
                </p>
              </div>

              <dl
                className="shrink-0 text-right"
                data-slot="portfolio-detail-preview-mobile-metrics"
              >
                <dt className="sr-only">{t(lang, "marketPricePerCard")}</dt>
                <dd
                  className="whitespace-nowrap text-body-sm font-price font-semibold tabular-nums"
                  data-slot="portfolio-detail-preview-mobile-price"
                >
                  <PreviewAmount jpy={3_895} />
                </dd>
                <dt className="sr-only">{t(lang, "pnl")}</dt>
                <dd
                  className="mt-0.5 whitespace-nowrap text-meta font-price tabular-nums text-price-up"
                  data-slot="portfolio-detail-preview-mobile-pnl"
                >
                  +16.3%
                </dd>
              </dl>

              <span
                className="flex size-5 shrink-0 items-center justify-center text-muted-foreground/50"
                data-slot="portfolio-detail-preview-details"
                title={t(lang, "details")}
              >
                <ChevronRight className="size-4" aria-hidden />
              </span>
            </div>
          ))}
        </div>

        <div
          className="hidden sm:block"
          data-slot="portfolio-detail-preview-desktop-table"
        >
          <table className="w-full table-fixed border-collapse text-left text-sm">
            <colgroup data-slot="portfolio-detail-preview-colgroup">
              <col className="w-[28%]" />
              <col className="w-[10%]" />
              <col className="w-[17%]" />
              <col className="w-[17%]" />
              <col className="w-[20%]" />
              <col className="w-[8%]" />
            </colgroup>
            <thead className="bg-transparent" data-slot="portfolio-detail-preview-head">
              <tr className="border-b border-hair text-eyebrow">
                <th className="whitespace-normal py-3 pr-3 font-medium leading-tight">
                  {t(lang, "card")} / {t(lang, "acquiredDate")}
                </th>
                <th className="whitespace-normal py-3 pr-3 text-right font-medium leading-tight">
                  {t(lang, "quantity")}
                </th>
                <th className="whitespace-normal py-3 pr-3 text-right font-medium leading-tight">
                  {t(lang, "marketPricePerCard")}
                </th>
                <th className="whitespace-normal py-3 pr-3 text-right font-medium leading-tight">
                  {t(lang, "unitCost")}
                </th>
                <th className="whitespace-normal py-3 pr-3 text-right font-medium leading-tight">
                  {t(lang, "pnl")}
                </th>
                <th className="py-3" />
              </tr>
            </thead>
            <tbody>
              {MOCK_PURCHASE_ROWS.map((row) => (
                <tr
                  key={row.id}
                  data-slot="portfolio-detail-preview-desktop-row"
                >
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="aspect-[63/88] w-10 shrink-0 rounded-md" />
                      <div className="min-w-0 space-y-1">
                        <Skeleton className="h-3.5 w-36 max-w-full" />
                        <p className="flex min-w-0 flex-wrap items-center gap-1.5 text-meta">
                          <span className="shrink-0 font-mono">{row.code}</span>
                          <span aria-hidden>·</span>
                          <span
                            className={
                              row.acquiredAt
                                ? "shrink-0 whitespace-nowrap"
                                : "shrink-0 whitespace-nowrap text-primary"
                            }
                            data-slot="portfolio-detail-preview-desktop-date"
                            data-state={row.acquiredAt ? "recorded" : "missing"}
                          >
                            {previewPurchaseDate(lang, row)}
                          </span>
                        </p>
                        <span data-slot="portfolio-detail-preview-note">
                          <PurchaseNotePreview
                            note={
                              row.hasNote
                                ? t(lang, "portfolioPreviewNote")
                                : null
                            }
                            lang={lang}
                          />
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-3 text-right text-body-sm font-medium tabular-nums">
                    {formatPurchaseRowQuantity(row.quantity, lang)}
                  </td>
                  <td className="py-3 pr-3 text-right text-body-sm font-price tabular-nums">
                    <PreviewAmount jpy={3_895} />
                  </td>
                  <td className="py-3 pr-3 text-right text-body-sm font-price tabular-nums">
                    <PreviewAmount jpy={row.unitCostJpy} />
                  </td>
                  <td className="py-3 pr-3 text-right font-price tabular-nums text-price-up">
                    <span className="block text-body-sm font-medium">
                      <PreviewAmount jpy={545} signed />
                    </span>
                    <span className="block text-micro opacity-80">+16.3%</span>
                  </td>
                  <td className="py-3">
                    <span
                      className="mx-auto flex size-10 items-center justify-center rounded-full border border-hair bg-muted/40 text-muted-foreground"
                      data-slot="portfolio-detail-preview-details"
                      title={t(lang, "details")}
                    >
                      <ChevronRight className="size-4" aria-hidden />
                    </span>
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

function PreviewKpi({
  icon: Icon,
  label,
  value,
  meta,
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  meta?: string
}) {
  return (
    <Surface
      as="article"
      variant="outline"
      padding="none"
      className="min-w-0 p-3.5 sm:p-4"
      data-slot="portfolio-insights-kpi"
    >
      <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
        <Icon className="size-4 shrink-0" aria-hidden />
        <p className="truncate text-label">{label}</p>
      </div>
      <p className="mt-2 truncate text-h4 font-price tabular-nums">{value}</p>
      {meta ? <p className="mt-1 truncate text-meta">{meta}</p> : null}
    </Surface>
  )
}

function PortfolioPreviewInsights({ lang }: { lang: Language }) {
  return (
    <div className="space-y-4 sm:space-y-5" data-slot="portfolio-insights">
      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 [&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1"
        data-slot="portfolio-insights-kpis"
      >
        <PreviewKpi
          icon={Layers3}
          label={t(lang, "assets")}
          value={portfolioCountSummary(lang, 4, 9)}
        />
        <PreviewKpi
          icon={Calculator}
          label={t(lang, "averageCostPerCard")}
          value={<PreviewAmount jpy={1_489} />}
          meta={t(lang, "costCoverage")
            .replace("{known}", "9")
            .replace("{total}", "9")}
        />
        <PreviewKpi
          icon={Gauge}
          label={t(lang, "largestPortfolioShare")}
          value="54.0%"
          meta="Monkey.D.Luffy"
        />
      </div>

      <Surface
        as="section"
        variant="panel"
        padding="none"
        className="min-w-0 p-4 sm:p-5"
        data-slot="portfolio-insights-allocation"
      >
        <h2 className="text-h4">{t(lang, "holdingsBreakdown")}</h2>
        <p className="mt-0.5 text-meta">{t(lang, "portfolioStructure")}</p>

        <div className="mt-4 space-y-1">
          {MOCK_ALLOCATION.map((item, index) => (
            <div key={item.label} className="flex items-center gap-3 px-1 py-2.5">
              <Skeleton
                className="aspect-[63/88] w-9 shrink-0 rounded-md"
                data-slot="portfolio-allocation-card-image"
              />
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex items-baseline gap-2">
                  <span className="min-w-0 flex-1 truncate text-body-sm font-medium">
                    {item.label}
                  </span>
                  <span className="shrink-0 text-meta font-price tabular-nums">
                    {item.share}%
                  </span>
                  <span className="shrink-0 text-price tabular-nums">
                    <PreviewAmount jpy={item.valueJpy} />
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className={
                      index === 0
                        ? "block h-full rounded-full bg-foreground/40"
                        : "block h-full rounded-full bg-foreground/20"
                    }
                    style={{ width: `${item.share}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Surface>
    </div>
  )
}
