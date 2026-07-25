"use client"

import { SortableHeader } from "@/components/shared/sortable-header"
import { t, type Language } from "@/lib/i18n"
import type { PortfolioPurchaseRow } from "@/lib/types/portfolio"

import { AssetRowComponent } from "./desktop-row"
import type { PurchaseSortKey, SortDir } from "./utils"

/**
 * Decision-first purchase columns: purchase identity · quantity · market price ·
 * unit cost · P/L.
 * The game reads as a tint dot on the card's code line; details stays a quiet
 * trailing chevron. Fixed widths keep privacy masking from shifting columns.
 */
export function DesktopAssetsTable({
  rows,
  lang,
  onEdit,
  hideBalance = false,
  showGameBadge = false,
  sortKey,
  sortDir,
  onSortSelect,
}: {
  rows: PortfolioPurchaseRow[]
  lang: Language
  onEdit: (row: PortfolioPurchaseRow) => void
  hideBalance?: boolean
  /** ≥2 games → tint dot + short name on each row's code line. */
  showGameBadge?: boolean
  sortKey: PurchaseSortKey
  sortDir: SortDir
  /** Column headers sort in place (canonical SortableHeader, all tables). */
  onSortSelect: (key: PurchaseSortKey) => void
}) {
  return (
    <div className="hidden sm:block">
      <table
        className="w-full table-fixed border-collapse text-left text-sm"
        data-slot="portfolio-assets-table"
      >
        <colgroup data-slot="portfolio-assets-colgroup">
          <col className="w-[28%]" />
          <col className="w-[10%]" />
          <col className="w-[17%]" />
          <col className="w-[17%]" />
          <col className="w-[20%]" />
          <col className="w-[8%]" />
        </colgroup>
        {/* Not sticky: the global header is sticky z-50, so a top-0 thead
            would pin underneath it. Revisit when --chrome-h (TOKENS-04) lands. */}
        <thead className="bg-transparent" data-slot="portfolio-assets-head">
          <tr className="border-b border-hair text-eyebrow">
            <SortableHeader<PurchaseSortKey>
              label={`${t(lang, "card")} / ${t(lang, "acquiredDate")}`}
              column="date"
              activeCol={sortKey}
              dir={sortDir}
              onClick={onSortSelect}
              wrapLabel
            />
            <SortableHeader<PurchaseSortKey>
              label={t(lang, "quantity")}
              column="qty"
              activeCol={sortKey}
              dir={sortDir}
              onClick={onSortSelect}
              align="right"
              wrapLabel
            />
            <SortableHeader<PurchaseSortKey>
              label={t(lang, "marketPricePerCard")}
              column="price"
              activeCol={sortKey}
              dir={sortDir}
              onClick={onSortSelect}
              align="right"
              wrapLabel
            />
            <SortableHeader<PurchaseSortKey>
              label={t(lang, "unitCost")}
              column="cost"
              activeCol={sortKey}
              dir={sortDir}
              onClick={onSortSelect}
              align="right"
              wrapLabel
            />
            <SortableHeader<PurchaseSortKey>
              label={t(lang, "pnl")}
              column="pnl"
              activeCol={sortKey}
              dir={sortDir}
              onClick={onSortSelect}
              align="right"
              wrapLabel
            />
            <th className="py-3 pl-1 text-right font-medium">
              <span className="sr-only">{t(lang, "details")}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <AssetRowComponent
              key={row.rowKey}
              row={row}
              lang={lang}
              onEdit={() => onEdit(row)}
              hideBalance={hideBalance}
              showGameBadge={showGameBadge}
              eagerImage={index === 0}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
