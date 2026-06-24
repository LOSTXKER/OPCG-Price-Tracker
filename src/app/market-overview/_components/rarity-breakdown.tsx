"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

import { RarityBadge } from "@/components/shared/rarity-badge"
import { Price } from "@/components/shared/price-inline"
import { Surface } from "@/components/ui/surface"
import { cn } from "@/lib/utils"
import { RARITY_BAR_COLOR } from "@/lib/constants/rarities"
import { t, type Language } from "@/lib/i18n"
import { formatCount } from "@/lib/utils/currency"

import { RawValueHint } from "./raw-value-hint"

type RarityRow = { rarity: string; count: number; totalValue: number }

const TOP_N = 5

export function RarityBreakdown({
  rows,
  totalValue,
  lang,
}: {
  rows: RarityRow[]
  totalValue: number
  lang: Language
}) {
  const [expanded, setExpanded] = useState(false)

  const top = rows.slice(0, TOP_N)
  const rest = rows.slice(TOP_N)
  const restAgg = rest.reduce(
    (acc, r) => ({
      rarity: "OTHERS",
      count: acc.count + r.count,
      totalValue: acc.totalValue + r.totalValue,
    }),
    { rarity: "OTHERS", count: 0, totalValue: 0 } as RarityRow,
  )

  const visible = expanded ? rows : rest.length > 0 ? [...top, restAgg] : top
  const denom = totalValue > 0 ? totalValue : 1
  const maxValue = Math.max(...rows.map((r) => r.totalValue), 1)

  return (
    <Surface variant="panel" className="overflow-hidden">
      <div className="flex items-end justify-between gap-3 border-b border-[var(--p-hair)] px-5 py-3.5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="text-h4">{t(lang, "valueByRarity")}</h2>
            <RawValueHint lang={lang} />
          </div>
          <p className="text-meta">{t(lang, "valueByRarityCaption")}</p>
        </div>
        <span className="shrink-0 text-meta tabular-nums">{formatCount(rows.length)}</span>
      </div>

      {/* Column eyebrows */}
      <div className="flex items-center gap-3 px-5 pt-3 pb-1">
        <div className="w-16 shrink-0">
          <span className="text-eyebrow">Rarity</span>
        </div>
        <div className="min-w-0 flex-1" />
        <span className="w-9 shrink-0 text-right text-eyebrow">{t(lang, "marketRarityShare")}</span>
        <div className="w-28 shrink-0 text-right">
          <span className="text-eyebrow">{t(lang, "marketRarityValue")}</span>
        </div>
      </div>

      <div className="divide-y divide-[var(--p-hair)]">
        {visible.map((r) => {
          const isOthers = r.rarity === "OTHERS"
          const pct = (r.totalValue / denom) * 100
          const barWidth = (r.totalValue / maxValue) * 100
          const barColor = isOthers ? "bg-muted-foreground/30" : RARITY_BAR_COLOR[r.rarity] ?? "bg-neutral-400"

          return (
            <div
              key={r.rarity}
              className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/30"
            >
              <div className="w-16 shrink-0">
                {isOthers ? (
                  <span className="inline-flex items-center whitespace-nowrap rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                    +{rest.length}
                  </span>
                ) : (
                  <RarityBadge rarity={r.rarity} size="sm" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="h-[3px] overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full opacity-80 transition-all", barColor)}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                {isOthers && (
                  <p className="mt-1 text-meta">{t(lang, "marketRarityOthers")}</p>
                )}
              </div>
              <span className="w-9 shrink-0 text-right text-meta tabular-nums">
                {pct.toFixed(1)}%
              </span>
              <div className="w-28 shrink-0 text-right">
                <p className="whitespace-nowrap font-price text-sm font-semibold tabular-nums">
                  <Price jpy={r.totalValue} />
                </p>
                <p className="whitespace-nowrap text-meta tabular-nums">
                  {formatCount(r.count)} {t(lang, "cardUnit")}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {rest.length > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-center gap-1 border-t border-[var(--p-hair)] px-5 py-2.5 text-meta transition-colors hover:bg-muted/30 hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {expanded ? t(lang, "marketShowLess") : t(lang, "marketShowAll")}
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform",
              expanded && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>
      )}
    </Surface>
  )
}
