"use client"

import {
  Toolbar,
  ToolbarSearch,
  ToolbarSortDropdown,
  type ToolbarSortOption,
} from "@/components/ui/toolbar"
import { LimitCounter } from "@/components/shared/limit-counter"
import { getLocale, t, type Language } from "@/lib/i18n"

import type { PurchaseSortKey, SortDir } from "./utils"

export function AssetsToolbar({
  lang,
  purchaseCount,
  copyCount,
  searchQuery,
  onSearchChange,
  searchOpen,
  onSearchOpenChange,
  sortKey,
  sortDir,
  onSortSelect,
  leading,
  quotaCurrent,
  quotaMax,
}: {
  lang: Language
  purchaseCount: number
  copyCount: number
  searchQuery: string
  onSearchChange: (v: string) => void
  searchOpen: boolean
  onSearchOpenChange: (v: boolean) => void
  sortKey: PurchaseSortKey
  sortDir: SortDir
  onSortSelect: (key: PurchaseSortKey) => void
  /** Replaces the default purchase/copy summary — e.g. the game tabs. */
  leading?: React.ReactNode
  /** Account-wide card-entry quota. This stays beside the holdings list so it
   * is never confused with the visible rows after search/game filtering. */
  quotaCurrent?: number
  quotaMax?: number
}) {
  const sortOptions: ToolbarSortOption<PurchaseSortKey>[] = [
    { key: "date", label: t(lang, "acquiredDate") },
    { key: "price", label: t(lang, "marketPricePerCard") },
    { key: "cost", label: t(lang, "unitCost") },
    { key: "pnl", label: t(lang, "pnl") },
    { key: "qty", label: t(lang, "quantity") },
  ]
  const countSummary = t(lang, "portfolioPurchaseCountSummary")
    .replace("{purchases}", purchaseCount.toLocaleString(getLocale(lang)))
    .replace("{copies}", copyCount.toLocaleString(getLocale(lang)))
  const compactCountSummary =
    purchaseCount === copyCount
      ? t(lang, "purchaseLotCount").replace(
          "{count}",
          purchaseCount.toLocaleString(getLocale(lang)),
        )
      : countSummary

  return (
    <Toolbar
      variant="bare"
      className="pb-3 [&>div:last-child]:min-w-0 [&>div:last-child]:flex-1 [&>div:last-child]:justify-end"
      right={
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:flex-nowrap">
          <ToolbarSearch
            value={searchQuery}
            onValueChange={onSearchChange}
            collapsible
            open={searchOpen}
            onOpenChange={onSearchOpenChange}
            placeholder={t(lang, "searchByNameOrCode")}
            size="sm"
          />
          {/* Mobile only — the desktop table sorts at its column headers. */}
          <div className="sm:hidden">
            <ToolbarSortDropdown
              options={sortOptions}
              activeKey={sortKey}
              activeDir={sortDir}
              onChange={onSortSelect}
              fallbackLabel={t(lang, "toolbarSort")}
            />
          </div>
        </div>
      }
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
        {leading ?? (
          <p
            className="text-h5 tabular-nums"
            data-slot="portfolio-assets-summary"
          >
            <span data-slot="portfolio-assets-count-summary">
              {compactCountSummary}
            </span>
          </p>
        )}
        {quotaCurrent != null && quotaMax != null ? (
          <span
            className="inline-flex items-center gap-1.5 whitespace-nowrap text-meta"
            data-slot="portfolio-assets-quota"
          >
            <span>{t(lang, "portfolioQuotaUsageCompact")}</span>
            <LimitCounter
              label={t(lang, "portfolioHoldingsQuota")}
              current={quotaCurrent}
              max={quotaMax}
            />
          </span>
        ) : null}
      </div>
    </Toolbar>
  )
}
