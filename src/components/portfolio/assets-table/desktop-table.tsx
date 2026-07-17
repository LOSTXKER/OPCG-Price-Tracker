"use client"

import { SortableHeader } from "@/components/shared/sortable-header"
import { t, type Language } from "@/lib/i18n"
import type { AssetRow } from "@/lib/types/portfolio"

import { AssetRowComponent } from "./desktop-row"
import type { SortDir, SortKey } from "./utils"

/**
 * Quiet columns (owner: "ตารางรก ซ้ำซ้อน"): card · price · 24h · 7d trend
 * (lg+, CMC-style) · P/L · value. Cost basis lives in the edit dialog and
 * Insights; the game reads as a tint dot on the card's code line.
 */
export function DesktopAssetsTable({
  rows,
  lang,
  onEdit,
  hideBalance = false,
  showGameBadge = false,
  sparklines,
  sortKey,
  sortDir,
  onSortSelect,
}: {
  rows: AssetRow[]
  lang: Language
  onEdit: (row: AssetRow) => void
  hideBalance?: boolean
  /** ≥2 games → tint dot + short name on each row's code line. */
  showGameBadge?: boolean
  /** 7-day price series keyed by cardId (optional trend column). */
  sparklines?: Record<number, number[]>
  sortKey: SortKey
  sortDir: SortDir
  /** Column headers sort in place (canonical SortableHeader, all tables). */
  onSortSelect: (key: SortKey) => void
}) {
  return (
    <div className="hidden sm:block">
      <table className="w-full border-collapse text-left text-sm">
        {/* Not sticky: the global header is sticky z-50, so a top-0 thead
            would pin underneath it. Revisit when --chrome-h (TOKENS-04) lands. */}
        <thead className="bg-background">
          <tr className="border-b border-hair text-eyebrow text-muted-foreground/60">
            <th className="py-3 pr-3 font-medium">{t(lang, "card")}</th>
            <SortableHeader<SortKey>
              label={t(lang, "price")}
              column="price"
              activeCol={sortKey}
              dir={sortDir}
              onClick={onSortSelect}
              align="right"
            />
            <SortableHeader<SortKey>
              label="24h"
              column="change24h"
              activeCol={sortKey}
              dir={sortDir}
              onClick={onSortSelect}
              align="right"
            />
            <th className="hidden py-3 pr-3 text-right font-medium lg:table-cell">7d</th>
            <SortableHeader<SortKey>
              label={t(lang, "pnl")}
              column="pnl"
              activeCol={sortKey}
              dir={sortDir}
              onClick={onSortSelect}
              align="right"
            />
            <SortableHeader<SortKey>
              label={t(lang, "value")}
              column="value"
              activeCol={sortKey}
              dir={sortDir}
              onClick={onSortSelect}
              align="right"
            />
            <th className="w-10 py-3 pl-1" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <AssetRowComponent
              key={row.itemId}
              row={row}
              lang={lang}
              onEdit={() => onEdit(row)}
              hideBalance={hideBalance}
              showGameBadge={showGameBadge}
              sparkline={sparklines?.[row.cardId]}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
