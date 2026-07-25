"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

import { RarityBadge } from "@/components/shared/rarity-badge"
import { PriceTag } from "@/components/ui/price-tag"
import { Surface } from "@/components/ui/surface"
import { cn } from "@/lib/utils"
import { RARITY_BAR_COLOR } from "@/lib/constants/rarities"
import { t, type Language } from "@/lib/i18n"
import { formatCount } from "@/lib/utils/currency"

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
    <Surface
      variant="panel"
      className="overflow-hidden"
      data-slot="market-rarity-panel"
    >
      {/* Column eyebrows */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-1 sm:gap-3 sm:px-5">
        <div className="w-14 shrink-0 sm:w-16">
          <span className="text-eyebrow">{t(lang, "rarity")}</span>
        </div>
        <div className="min-w-0 flex-1" />
        <span className="w-10 shrink-0 text-right text-eyebrow">
          {t(lang, "marketRarityShare")}
        </span>
        <div className="w-24 shrink-0 text-right sm:w-28">
          <span className="text-eyebrow">{t(lang, "marketRarityValue")}</span>
        </div>
      </div>

      <div id="market-rarity-rows" className="divide-y divide-hair">
        {visible.map((r) => {
          const isOthers = r.rarity === "OTHERS"
          const pct = (r.totalValue / denom) * 100
          const barWidth = (r.totalValue / maxValue) * 100
          const barColor = isOthers ? "bg-muted-foreground/30" : RARITY_BAR_COLOR[r.rarity] ?? "bg-muted-foreground/40"

          return (
            <div
              key={r.rarity}
              className="flex items-center gap-2 px-4 py-3 motion-base hover:bg-muted/70 sm:gap-3 sm:px-5"
            >
              <div className="w-14 shrink-0 sm:w-16">
                {isOthers ? (
                  <span className="inline-flex items-center whitespace-nowrap rounded-sm bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                    +{rest.length}
                  </span>
                ) : (
                  <RarityBadge rarity={r.rarity} size="sm" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="h-[3px] overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full opacity-80 motion-base", barColor)}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                {isOthers && (
                  <p className="mt-1 text-meta">{t(lang, "marketRarityOthers")}</p>
                )}
              </div>
              <span className="w-10 shrink-0 text-right text-meta tabular-nums">
                {pct.toFixed(1)}%
              </span>
              <div className="w-24 shrink-0 text-right sm:w-28">
                <PriceTag
                  jpy={r.totalValue}
                  showChange={false}
                  size="sm"
                  className="justify-end whitespace-nowrap"
                />
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
          aria-expanded={expanded}
          aria-controls="market-rarity-rows"
          className="flex min-h-11 w-full items-center justify-center gap-1 border-t border-hair px-5 py-2.5 text-meta motion-base hover:bg-muted/70 hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
