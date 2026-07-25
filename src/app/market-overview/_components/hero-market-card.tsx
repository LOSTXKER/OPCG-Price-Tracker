"use client"

import { ArrowDown, ArrowRight, ArrowUp, Layers, Package, TrendingUp } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { HeroNumber } from "@/components/ui/hero-number"
import { PriceTag } from "@/components/ui/price-tag"
import { Surface } from "@/components/ui/surface"
import { cn } from "@/lib/utils"
import { t, type Language } from "@/lib/i18n"
import {
  formatCount,
  formatDisplayValue,
  jpyToDisplayValue,
} from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"

type Movers = { up: number; down: number; flat: number }

export function MarketSnapshot({
  totalValue,
  weightedDelta7d,
  movers,
  avgPrice,
  totalCards,
  setCount,
  lang,
}: {
  totalValue: number
  weightedDelta7d: number | null
  movers: Movers
  avgPrice: number
  totalCards: number
  setCount: number
  lang: Language
}) {
  const currency = useUIStore((s) => s.currency)
  const total = movers.up + movers.down + movers.flat
  const upPct = total > 0 ? (movers.up / total) * 100 : 0
  const downPct = total > 0 ? (movers.down / total) * 100 : 0
  const flatPct = Math.max(0, 100 - upPct - downPct)

  return (
    <Surface
      variant="hero"
      className="overflow-hidden"
      data-slot="market-snapshot"
    >
      {/* Top: hero metric + sentiment gauge */}
      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
        {/* Headline value */}
        <div className="min-w-0">
          <p className="text-eyebrow">{t(lang, "totalValue")}</p>
          <div className="mt-2 min-w-0 overflow-hidden">
            <HeroNumber
              value={jpyToDisplayValue(totalValue, currency)}
              format={(value) => formatDisplayValue(value, currency)}
              className="block truncate font-price text-foreground"
            />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <PriceTag
              change={weightedDelta7d}
              changeOnly
              decimals={2}
              size="sm"
            />
            <span className="text-meta">{t(lang, "marketHeroDeltaLabel")}</span>
          </div>
        </div>

        {/* Movers gauge: stacked bar with inline % + 3-column legend below */}
        <div className="min-w-0 lg:border-l lg:border-hair lg:pl-10">
          <p className="text-eyebrow">{t(lang, "marketMoversTitle")}</p>

          {/* Stacked proportional bar with inline % labels — segment widths
              represent share of cards in each direction, not price change. */}
          <div className="mt-2.5 flex h-6 w-full overflow-hidden rounded-md bg-muted">
            {upPct > 0 && (
              <div
                className="flex h-full items-center justify-center"
                style={{
                  width: `${upPct}%`,
                  background: "color-mix(in srgb, var(--price-up) 22%, transparent)",
                  color: "var(--price-up-text-on-soft)",
                }}
                aria-label={`${t(lang, "moversUp")} ${upPct.toFixed(1)}%`}
                title={`${t(lang, "moversUp")} · ${upPct.toFixed(1)}% (${formatCount(movers.up)} ${t(lang, "cardUnit")})`}
              >
                {upPct >= 8 && (
                  <span className="px-1 font-price text-micro tabular-nums">
                    {upPct.toFixed(0)}%
                  </span>
                )}
              </div>
            )}
            {flatPct > 0 && (
              <div
                className="flex h-full items-center justify-center bg-muted-foreground/20 text-foreground"
                style={{ width: `${flatPct}%` }}
                aria-label={`${t(lang, "moversFlat")} ${flatPct.toFixed(1)}%`}
                title={`${t(lang, "moversFlat")} · ${flatPct.toFixed(1)}% (${formatCount(movers.flat)} ${t(lang, "cardUnit")})`}
              >
                {flatPct >= 8 && (
                  <span className="px-1 font-price text-micro tabular-nums">
                    {flatPct.toFixed(0)}%
                  </span>
                )}
              </div>
            )}
            {downPct > 0 && (
              <div
                className="flex h-full items-center justify-center"
                style={{
                  width: `${downPct}%`,
                  background: "color-mix(in srgb, var(--price-down) 22%, transparent)",
                  color: "var(--price-down-text-on-soft)",
                }}
                aria-label={`${t(lang, "moversDown")} ${downPct.toFixed(1)}%`}
                title={`${t(lang, "moversDown")} · ${downPct.toFixed(1)}% (${formatCount(movers.down)} ${t(lang, "cardUnit")})`}
              >
                {downPct >= 8 && (
                  <span className="px-1 font-price text-micro tabular-nums">
                    {downPct.toFixed(0)}%
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Legend: matches bar segments (left→right) */}
          <div className="mt-3 grid grid-cols-3 gap-2 text-meta">
            <MoverLegend
              icon={ArrowUp}
              color="var(--price-up-text)"
              count={movers.up}
              label={t(lang, "moversUp")}
              unit={t(lang, "cardUnit")}
            />
            <MoverLegend
              icon={ArrowRight}
              color="var(--muted-foreground)"
              count={movers.flat}
              label={t(lang, "moversFlat")}
              unit={t(lang, "cardUnit")}
              muted
            />
            <MoverLegend
              icon={ArrowDown}
              color="var(--price-down-text)"
              count={movers.down}
              label={t(lang, "moversDown")}
              unit={t(lang, "cardUnit")}
            />
          </div>
        </div>
      </div>

      {/* Divider + secondary stats row */}
      <div className="grid grid-cols-3 divide-x divide-hair border-t border-hair">
        <SecondaryStat
          icon={TrendingUp}
          label={t(lang, "avgPrice")}
          value={formatDisplayValue(jpyToDisplayValue(avgPrice, currency), currency)}
        />
        <SecondaryStat
          icon={Layers}
          label={t(lang, "totalCards")}
          value={formatCount(totalCards)}
        />
        <SecondaryStat
          icon={Package}
          label={t(lang, "totalSets")}
          value={formatCount(setCount)}
        />
      </div>
    </Surface>
  )
}

function MoverLegend({
  icon: Icon,
  color,
  count,
  label,
  unit,
  muted,
}: {
  icon: LucideIcon
  color: string
  count: number
  label: string
  unit: string
  muted?: boolean
}) {
  return (
    <div className="min-w-0 text-center sm:text-left">
      <div className="flex items-center justify-center gap-1.5 sm:justify-start">
        <Icon
          className={cn("size-3.5 shrink-0", muted && "text-muted-foreground")}
          style={muted ? undefined : { color }}
          aria-hidden="true"
        />
        <span className="font-price font-semibold tabular-nums text-foreground">
          {formatCount(count)}
        </span>
        <span className="hidden truncate text-muted-foreground sm:inline">
          {unit} <span className="text-foreground">{label}</span>
        </span>
      </div>
      <p className="mt-0.5 text-micro text-muted-foreground sm:hidden">{label}</p>
    </div>
  )
}

function SecondaryStat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="min-w-0 px-3 py-3 text-center sm:px-5 sm:py-4 sm:text-left">
      <div className="flex items-center justify-center gap-1.5 sm:justify-start">
        <Icon className="hidden size-3.5 text-muted-foreground sm:block" aria-hidden="true" />
        <p className="whitespace-nowrap text-meta sm:text-eyebrow">{label}</p>
      </div>
      <p className="mt-1 truncate font-price text-h4 text-foreground sm:text-h3">
        {value}
      </p>
    </div>
  )
}
