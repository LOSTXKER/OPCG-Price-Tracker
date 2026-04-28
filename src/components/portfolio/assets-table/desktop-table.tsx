"use client"

import { t, type Language } from "@/lib/i18n"
import type { AssetRow } from "@/lib/types/portfolio"

import { AssetRowComponent } from "./desktop-row"

export function DesktopAssetsTable({
  rows,
  lang,
  onEdit,
  onRemove,
}: {
  rows: AssetRow[]
  lang: Language
  onEdit: (row: AssetRow) => void
  onRemove: (row: AssetRow) => void
}) {
  return (
    <div className="hidden overflow-x-auto sm:block">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur">
          <tr className="border-b border-border/20 text-eyebrow text-muted-foreground/60">
            <th className="py-3 pl-5 pr-3">{t(lang, "card")}</th>
            <th className="py-3 pr-3 text-right">{t(lang, "value")}</th>
            <th className="py-3 pr-3 text-right">{t(lang, "price")}</th>
            <th className="py-3 pr-3 text-right">24h</th>
            <th className="hidden py-3 pr-3 text-right md:table-cell">7d</th>
            <th className="py-3 pr-3 text-right">{t(lang, "costBasis")}</th>
            <th className="py-3 pr-3 text-right">{t(lang, "pnl")}</th>
            <th className="w-12 py-3 pr-5 text-right" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <AssetRowComponent
              key={row.itemId}
              row={row}
              lang={lang}
              onEdit={() => onEdit(row)}
              onRemove={() => onRemove(row)}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
