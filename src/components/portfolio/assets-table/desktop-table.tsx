"use client"

import { t, type Language } from "@/lib/i18n"
import type { AssetRow } from "@/lib/types/portfolio"

import { AssetRowComponent } from "./desktop-row"

export function DesktopAssetsTable({
  rows,
  lang,
  onEdit,
  hideBalance = false,
}: {
  rows: AssetRow[]
  lang: Language
  onEdit: (row: AssetRow) => void
  hideBalance?: boolean
}) {
  return (
    <div className="hidden overflow-x-auto sm:block">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur">
          <tr className="border-b border-[var(--p-hair)] text-eyebrow text-muted-foreground/60">
            <th className="py-3 pl-5 pr-3">{t(lang, "card")}</th>
            <th className="py-3 pr-3 text-right">{t(lang, "value")}</th>
            <th className="py-3 pr-3 text-right">{t(lang, "costBasis")}</th>
            <th className="py-3 pr-3 text-right">{t(lang, "pnl")}</th>
            <th className="w-20 py-3 pr-5 text-right" />
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
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
