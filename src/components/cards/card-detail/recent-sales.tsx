"use client"

import { formatByCurrency, formatUsdByCurrency } from "@/lib/utils/currency"
import { relativeTime } from "@/lib/utils/time"
import { useUIStore } from "@/stores/ui-store"
import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import type { GradeFamily } from "./grades"

export type SaleRow = {
  scrapedAt: string
  priceJpy: number | null
  priceThb?: number | null
  priceUsd?: number | null
  source?: string
  gradeCondition?: string | null
  /** SELL = listing/ask, SOLD = settled sale. */
  type?: string | null
}

const SRC_META: Record<string, { label: string; dot: string }> = {
  YUYUTEI: { label: "Yuyu-tei", dot: "bg-blue-500" },
  SNKRDUNK: { label: "SNKRDUNK", dot: "bg-emerald-500" },
  EBAY_JP: { label: "eBay JP", dot: "bg-yellow-500" },
  TCGPLAYER: { label: "TCGPlayer", dot: "bg-orange-500" },
  MERCARI_JP: { label: "Mercari JP", dot: "bg-rose-500" },
}

function familyMatches(family: GradeFamily, row: SaleRow): boolean {
  const graded = !!row.gradeCondition
  return family === "raw" ? !graded : graded
}

/** Sold vs Listed pill — never lets an asking price read as a settled sale. */
function TypeTag({ type, lang }: { type?: string | null; lang: Language }) {
  const sold = type === "SOLD"
  return (
    <span
      className={cn(
        "text-overlay shrink-0 rounded px-1 py-0.5 uppercase",
        sold ? "status-success" : "bg-muted text-muted-foreground",
      )}
    >
      {sold ? t(lang, "priceTypeSold") : t(lang, "priceTypeListed")}
    </span>
  )
}

/**
 * Time-ordered recent price observations bound to the selected grade family
 * (VISION §5.1, zone 6). Newest-first; every row is badged Sold/Listed and shows
 * its real grade + source, so an ask is never presented as a settled sale, and a
 * PSA-10 row is never mislabelled as another grade. List on phones, table on sm+.
 */
export function RecentSales({
  rows,
  family,
  lang,
}: {
  rows: SaleRow[]
  family: GradeFamily
  lang: Language
}) {
  const currency = useUIStore((s) => s.currency)

  const fmt = (r: SaleRow): string => {
    if (r.priceUsd != null) return formatUsdByCurrency(r.priceUsd, currency).primary
    if (r.priceJpy != null) return formatByCurrency(r.priceJpy, currency, r.priceThb ?? null).primary
    return "—"
  }

  const sorted = rows
    .filter((r) => familyMatches(family, r) && (r.priceJpy != null || r.priceUsd != null))
    .sort((a, b) => new Date(b.scrapedAt).getTime() - new Date(a.scrapedAt).getTime())
    .slice(0, 8)

  if (sorted.length === 0) {
    return <p className="text-meta px-5 py-6 text-center">{t(lang, "noPriceHistory")}</p>
  }

  return (
    <div className="px-5 pb-4 pt-3">
      {/* Mobile list */}
      <div className="divide-y divide-border/10 sm:hidden">
        {sorted.map((r, i) => {
          const meta = SRC_META[r.source ?? ""] ?? { label: r.source ?? "—", dot: "bg-muted-foreground" }
          return (
            <div key={`${r.scrapedAt}-${i}`} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-price text-sm font-semibold tabular-nums text-foreground">
                  {fmt(r)}
                  <TypeTag type={r.type} lang={lang} />
                </p>
                <p className="text-meta text-muted-foreground/60">{relativeTime(r.scrapedAt, lang)}</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5">
                {r.gradeCondition && (
                  <span className="text-overlay text-muted-foreground/70">{r.gradeCondition}</span>
                )}
                <span className={cn("size-2 rounded-full", meta.dot)} />
                <span className="text-xs text-muted-foreground">{meta.label}</span>
              </span>
            </div>
          )
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/30 text-eyebrow text-muted-foreground/60">
              <th className="pb-2 pr-3 font-medium">{t(lang, "updated")}</th>
              <th className="pb-2 pr-3 text-right font-medium">{t(lang, "marketPrice")}</th>
              <th className="pb-2 text-right font-medium">{t(lang, "sourceRef")}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => {
              const meta = SRC_META[r.source ?? ""] ?? { label: r.source ?? "—", dot: "bg-muted-foreground" }
              return (
                <tr key={`${r.scrapedAt}-${i}`} className="border-b border-border/10 last:border-0">
                  <td className="py-2.5 pr-3 text-meta text-muted-foreground/70">{relativeTime(r.scrapedAt, lang)}</td>
                  <td className="py-2.5 pr-3 text-right">
                    <span className="inline-flex items-center justify-end gap-1.5">
                      <TypeTag type={r.type} lang={lang} />
                      <span className="font-price text-sm font-semibold tabular-nums text-foreground">{fmt(r)}</span>
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <span className="inline-flex items-center justify-end gap-1.5">
                      {r.gradeCondition && (
                        <span className="text-overlay text-muted-foreground/70">{r.gradeCondition}</span>
                      )}
                      <span className={cn("size-2 rounded-full", meta.dot)} />
                      <span className="text-xs text-muted-foreground">{meta.label}</span>
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
