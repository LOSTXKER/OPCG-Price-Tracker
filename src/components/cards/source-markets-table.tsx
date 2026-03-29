"use client"

import { cn } from "@/lib/utils"
import { formatByCurrency, formatUsdByCurrency } from "@/lib/utils/currency"
import { relativeTime } from "@/lib/utils/time"
import { t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"

const SOURCE_META: Record<string, { label: string; color: string }> = {
  YUYUTEI: { label: "Yuyu-tei", color: "bg-blue-500" },
  SNKRDUNK: { label: "SNKRDUNK", color: "bg-emerald-500" },
  TCGPLAYER: { label: "TCGPlayer", color: "bg-orange-500" },
  CARDMARKET: { label: "Cardmarket", color: "bg-violet-500" },
  EBAY_JP: { label: "eBay JP", color: "bg-yellow-500" },
  MERCARI_JP: { label: "Mercari JP", color: "bg-rose-500" },
  MARKETPLACE: { label: "Marketplace", color: "bg-cyan-500" },
}

export interface SourcePriceRow {
  source: string
  askPriceJpy: number | null
  askPriceThb: number | null
  askPriceUsd: number | null
  soldPriceJpy: number | null
  soldPriceThb: number | null
  soldPriceUsd: number | null
  updatedAt: string | null
}

function formatPrice(
  jpy: number | null,
  thb: number | null,
  usd: number | null,
  currency: string,
): string {
  if (usd != null) return formatUsdByCurrency(usd, currency as "JPY" | "THB" | "USD").primary
  if (jpy != null) return formatByCurrency(jpy, currency as "JPY" | "THB" | "USD", thb).primary
  return "—"
}


export function SourceMarketsTable({ rows }: { rows: SourcePriceRow[] }) {
  const currency = useUIStore((s) => s.currency)
  const lang = useUIStore((s) => s.language)

  if (rows.length === 0) return null

  return (
    <div>
      <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
        {t(lang, "sourceMarkets")}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/30 text-[10px] uppercase tracking-wider text-muted-foreground/60">
              <th className="pb-2 pr-3 font-medium">#</th>
              <th className="pb-2 pr-3 font-medium">{t(lang, "sourceRef")}</th>
              <th className="pb-2 pr-3 text-right font-medium">{t(lang, "listing")}</th>
              <th className="pb-2 pr-3 text-right font-medium">{t(lang, "lastSold")}</th>
              <th className="pb-2 text-right font-medium">{t(lang, "updated")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const meta = SOURCE_META[row.source] ?? {
                label: row.source,
                color: "bg-muted-foreground",
              }
              const askStr = formatPrice(row.askPriceJpy, row.askPriceThb, row.askPriceUsd, currency)
              const soldStr = formatPrice(row.soldPriceJpy, row.soldPriceThb, row.soldPriceUsd, currency)
              const isBestAsk = i === 0 && (row.askPriceJpy != null || row.askPriceUsd != null)

              return (
                <tr
                  key={row.source}
                  className="border-b border-border/10 last:border-0"
                >
                  <td className="py-2.5 pr-3 font-price text-xs text-muted-foreground/50">
                    {i + 1}
                  </td>
                  <td className="py-2.5 pr-3">
                    <span className="flex items-center gap-2">
                      <span
                        className={cn("size-2 shrink-0 rounded-full", meta.color)}
                      />
                      <span className="text-xs font-medium">{meta.label}</span>
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-right">
                    <span
                      className={cn(
                        "font-price text-xs font-semibold tabular-nums",
                        isBestAsk ? "text-price-up" : "text-foreground",
                        askStr === "—" && "text-muted-foreground/30",
                      )}
                    >
                      {askStr}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-right">
                    <span
                      className={cn(
                        "font-price text-xs tabular-nums",
                        soldStr === "—"
                          ? "text-muted-foreground/30"
                          : "text-foreground/80",
                      )}
                    >
                      {soldStr}
                    </span>
                  </td>
                  <td className="py-2.5 text-right text-[10px] text-muted-foreground/50">
                    {relativeTime(row.updatedAt, lang)}
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
