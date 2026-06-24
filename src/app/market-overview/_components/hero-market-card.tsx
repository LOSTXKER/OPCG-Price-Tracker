"use client"

import { ArrowDown, ArrowRight, ArrowUp, Layers, Package, TrendingUp } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { Price } from "@/components/shared/price-inline"
import { Surface } from "@/components/ui/surface"
import { cn } from "@/lib/utils"
import { t, type Language } from "@/lib/i18n"
import { formatCount } from "@/lib/utils/currency"

import { PeriodChip } from "./period-chip"
import { RawValueHint } from "./raw-value-hint"

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
  const total = movers.up + movers.down + movers.flat
  const upPct = total > 0 ? (movers.up / total) * 100 : 0
  const downPct = total > 0 ? (movers.down / total) * 100 : 0
  const flatPct = Math.max(0, 100 - upPct - downPct)

  return (
    <Surface variant="panel" className="overflow-hidden">
      {/* Top: hero metric + sentiment gauge */}
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
        {/* Headline value */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-eyebrow">{t(lang, "totalValue")}</p>
            <RawValueHint lang={lang} />
          </div>
          <p className="mt-2 truncate font-price text-display text-foreground">
            <Price jpy={totalValue} />
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <DeltaPill delta={weightedDelta7d} period="7d" />
            <span className="text-meta">{t(lang, "marketHeroDeltaLabel")}</span>
          </div>
        </div>

        {/* Movers gauge: stacked bar with inline % + 3-column legend below */}
        <div className="min-w-0 lg:border-l lg:border-[var(--p-hair)] lg:pl-10">
          <div className="flex items-center gap-1.5">
            <p className="text-eyebrow">{t(lang, "marketMoversTitle")}</p>
            <PeriodChip lang={lang} />
          </div>

          {/* Stacked proportional bar with inline % labels — segment widths
              represent share of cards in each direction, not price change. */}
          <div className="mt-2.5 flex h-6 w-full overflow-hidden rounded-md bg-muted">
            {upPct > 0 && (
              <div
                className="flex h-full items-center justify-center"
                style={{
                  width: `${upPct}%`,
                  background: "color-mix(in srgb, var(--price-up) 22%, transparent)",
                  color: "var(--price-up)",
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
                  color: "var(--price-down)",
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
              color="var(--price-up)"
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
              color="var(--price-down)"
              count={movers.down}
              label={t(lang, "moversDown")}
              unit={t(lang, "cardUnit")}
            />
          </div>
        </div>
      </div>

      {/* Divider + secondary stats row */}
      <div className="grid grid-cols-3 divide-x divide-[var(--p-hair)] border-t border-[var(--p-hair)]">
        <SecondaryStat
          icon={TrendingUp}
          label={t(lang, "avgPrice")}
          value={<Price jpy={avgPrice} />}
          hint={<RawValueHint lang={lang} />}
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
    <div className="flex min-w-0 items-center gap-1.5">
      <Icon
        className={cn("size-3.5 shrink-0", muted && "text-muted-foreground")}
        style={muted ? undefined : { color }}
        aria-hidden="true"
      />
      <span className="truncate">
        <span className="font-price font-semibold tabular-nums text-foreground">
          {formatCount(count)}
        </span>{" "}
        <span className="text-muted-foreground">{unit}</span>{" "}
        <span className="text-foreground">{label}</span>
      </span>
    </div>
  )
}

function SecondaryStat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
}) {
  return (
    <div className="min-w-0 px-4 py-3 sm:px-5 sm:py-4">
      <div className="flex items-center gap-1.5">
        <Icon className="size-3.5 text-muted-foreground" aria-hidden="true" />
        <p className="text-eyebrow">{label}</p>
        {hint}
      </div>
      <p className="mt-1 truncate font-price text-h3 text-foreground">{value}</p>
    </div>
  )
}

export function DeltaPill({
  delta,
  size = "md",
  period,
}: {
  delta: number | null
  size?: "sm" | "md"
  /**
   * Optional time-window label (e.g. "24h"). When provided, sets a native
   * tooltip and—on `md` size—renders the label inline so the % value
   * never appears without its time context.
   */
  period?: string
}) {
  if (delta == null) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground",
          size === "sm" ? "px-1.5 py-0.5 text-micro" : "px-2 py-0.5 text-xs font-semibold",
        )}
        title={period ? `${period}: —` : undefined}
      >
        {period && size === "md" && (
          <span className="text-micro font-mono uppercase tracking-wider opacity-70">
            {period}
          </span>
        )}
        —
      </span>
    )
  }

  const isUp = delta > 0.0001
  const isDown = delta < -0.0001
  const Icon = isUp ? ArrowUp : isDown ? ArrowDown : ArrowRight
  const color = isUp
    ? "var(--price-up)"
    : isDown
      ? "var(--price-down)"
      : "var(--muted-foreground)"
  const bg = isUp
    ? "color-mix(in srgb, var(--price-up) 14%, transparent)"
    : isDown
      ? "color-mix(in srgb, var(--price-down) 14%, transparent)"
      : "var(--muted)"
  const display = `${isUp ? "+" : ""}${delta.toFixed(2)}%`

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-price tabular-nums",
        size === "sm" ? "px-1.5 py-0.5 text-micro" : "px-2 py-0.5 text-xs font-semibold",
      )}
      style={{ color, background: bg }}
      title={period ? `${period}: ${display}` : undefined}
    >
      {period && size === "md" && (
        <span className="text-micro font-mono uppercase tracking-wider opacity-70">
          {period}
        </span>
      )}
      <Icon className={size === "sm" ? "size-3" : "size-3.5"} aria-hidden="true" />
      {display}
    </span>
  )
}
