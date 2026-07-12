"use client"

import { t, type Language } from "@/lib/i18n"
import type { AssetRow } from "@/lib/types/portfolio"

import { AssetRowComponent } from "./desktop-row"

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
}: {
  rows: AssetRow[]
  lang: Language
  onEdit: (row: AssetRow) => void
  hideBalance?: boolean
  /** ≥2 games → tint dot + short name on each row's code line. */
  showGameBadge?: boolean
  /** 7-day price series keyed by cardId (optional trend column). */
  sparklines?: Record<number, number[]>
}) {
  return (
    <div className="hidden sm:block">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="sticky top-0 z-10 bg-background">
          <tr className="border-b border-hair text-eyebrow text-muted-foreground/60">
            <th className="py-3 pr-3 font-medium">{t(lang, "card")}</th>
            <th className="py-3 pr-3 text-right font-medium">{t(lang, "price")}</th>
            <th className="py-3 pr-3 text-right font-medium">24h</th>
            <th className="hidden py-3 pr-3 text-right font-medium lg:table-cell">7d</th>
            <th className="py-3 pr-3 text-right font-medium">{t(lang, "pnl")}</th>
            <th className="py-3 pr-3 text-right font-medium">{t(lang, "value")}</th>
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
