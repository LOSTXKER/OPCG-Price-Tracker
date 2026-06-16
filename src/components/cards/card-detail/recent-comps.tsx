"use client"

import { ChevronRight } from "lucide-react"

import { t, type Language } from "@/lib/i18n"
import { relativeTime } from "@/lib/utils/time"
import { cn } from "@/lib/utils"

import { Amount } from "./grade-value"
import { SourceLogo } from "./source-logo"
import { mockComps, mockSales30d } from "./mock"
import type { Stat } from "./grades"

function SourceBadge({ s }: { s: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <SourceLogo source={s} size={18} />
      <span className="text-xs font-medium text-foreground">{s}</span>
    </span>
  )
}

/**
 * Recent settled sales (comps) — a full-width ledger module. Prototype mock,
 * seeded by the selected grade's value (consistent with the chart's mock), so
 * switching grade re-prices the comps. Swap for the real comps feed at launch.
 */
export function CardRecentComps({
  compBase,
  gradeLabel,
  currency,
  firstSale,
  latestUpdatedAt,
  lang,
}: {
  compBase: number | null
  gradeLabel: string
  currency: "JPY" | "USD"
  firstSale?: Stat | null
  latestUpdatedAt?: string | null
  lang: Language
}) {
  const comps = mockComps(compBase, gradeLabel, 7, { firstSale })
  const totalSales = mockSales30d(compBase)
  const baseTime = latestUpdatedAt ? new Date(latestUpdatedAt).getTime() : null
  const compDate = (days: number) => (baseTime ? new Date(baseTime - days * 86_400_000).toISOString() : null)

  return (
    <div className="surface-1 hairline overflow-hidden rounded-2xl">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-2 pt-4">
        <p className="text-eyebrow">{gradeLabel}</p>
        <p className="text-meta">{t(lang, "receiptMatchesLastSold")}</p>
      </div>
      {comps.map((c, i) => (
        <div key={i} className={cn("hairline-t flex items-center gap-3 px-4 py-3")}>
          <SourceBadge s={c.source} />
          <span className="text-xs text-muted-foreground">{c.grade}</span>
          <Amount
            jpy={c.priceJpy ?? (currency === "JPY" ? c.price : null)}
            usd={c.priceUsd ?? (currency === "USD" ? c.price : null)}
            size="stat"
            className="ml-auto text-foreground"
          />
          <span className="tnum w-14 shrink-0 text-right text-xs text-muted-foreground/60">
            {relativeTime(compDate(c.whenDays), lang)}
          </span>
        </div>
      ))}
      <button
        type="button"
        className="hairline-t ease-chrome flex w-full items-center justify-center gap-1 py-3 text-xs font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        {t(lang, "viewAll")} {totalSales.toLocaleString()} <ChevronRight className="size-3" aria-hidden />
      </button>
    </div>
  )
}
