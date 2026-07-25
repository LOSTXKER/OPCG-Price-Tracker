"use client"

import { useMemo, useRef, useState } from "react"
import { CalendarRange } from "lucide-react"
import {
  Area,
  AreaChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts"

import { SegmentedControl, type SegmentedOption } from "@/components/ui/segmented-control"
import { useUIStore } from "@/stores/ui-store"
import { getLocale, t } from "@/lib/i18n"
import { jpyToDisplayValue, formatDisplayValue } from "@/lib/utils/currency"
import { MASKED } from "@/lib/constants/ui"
import { cn } from "@/lib/utils"
import {
  filterPortfolioHistoryByDays,
  mergePortfolioHistoryWithLive,
  type PortfolioInsightHistoryPoint,
} from "@/lib/portfolio/insights"
import type { HistoryPoint, PortfolioStats } from "@/lib/types/portfolio"

// ─── Range config ───────────────────────────────────────────────────────────

type RangeId = "7D" | "30D" | "90D"

const RANGES: { id: RangeId; label: string; days: number }[] = [
  { id: "7D", label: "7D", days: 7 },
  { id: "30D", label: "30D", days: 30 },
  { id: "90D", label: "90D", days: 90 },
]

// ─── Color constants — semantic CSS variables only ───────────────────────────

const HONEY = "var(--primary)"
const MUTED_FG = "var(--muted-foreground)"
const BG = "var(--background)"

// ─── Types ───────────────────────────────────────────────────────────────────

/** Shape of each data entry passed to Recharts — HistoryPoint + converted value. */
type ChartEntry = PortfolioInsightHistoryPoint & {
  displayValue: number
  trendValue: number | null
}

export interface PortfolioScrubChartProps {
  data: HistoryPoint[]
  stats: PortfolioStats
  /** Called with the active HistoryPoint while scrubbing, null on leave. */
  onScrub?: (point: HistoryPoint | null) => void
  /** When true, mask monetary values and hide axis labels. */
  hideBalance?: boolean
  /** Scoped game values are current-only; persisted history remains all-games. */
  historyUnavailable?: boolean
}

function SparseChartState({
  point,
  pointLabel,
  pointValue,
  message,
}: {
  point: ChartEntry | null
  pointLabel: string | null
  pointValue: string | null
  message: string
}) {
  return (
    <div
      className="flex w-full flex-col gap-3 rounded-lg bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      data-slot="portfolio-chart-sparse"
    >
      {point ? (
        <div
          className="flex min-w-0 items-center gap-3"
          data-slot="portfolio-chart-live-point"
          data-partial={point.valuationStatus === "partial" || undefined}
        >
          <span
            aria-hidden
            className={cn(
              "size-3 shrink-0 rounded-full ring-4 ring-primary/10",
              point.valuationStatus === "partial"
                ? "bg-background outline outline-2 outline-primary"
                : "bg-primary",
            )}
          />
          <div className="min-w-0">
            {pointValue ? (
              <p className="truncate text-body-sm font-price font-semibold tabular-nums">
                {point.valuationStatus === "partial" ? "≈ " : ""}
                {pointValue}
              </p>
            ) : null}
            {pointLabel ? (
              <p className="mt-0.5 truncate text-micro text-muted-foreground">
                {pointLabel}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <p
        className={cn(
          "text-meta",
          point ? "sm:max-w-sm sm:text-right" : "text-center",
        )}
      >
        {message}
      </p>
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PortfolioScrubChart({
  data,
  stats,
  onScrub,
  hideBalance = false,
  historyUnavailable = false,
}: PortfolioScrubChartProps) {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)
  const [now] = useState(() => new Date())
  const [range, setRange] = useState<RangeId>("30D")
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  // ── Data slicing ──────────────────────────────────────────────────────────

  const merged = useMemo(
    () =>
      mergePortfolioHistoryWithLive(historyUnavailable ? [] : data, stats, {
        now,
        liveLabel: `${t(lang, "dayToday")} · ${t(lang, "portfolioLatestValue")}`,
      }),
    [data, historyUnavailable, lang, now, stats],
  )

  const rangeOptions = useMemo<SegmentedOption<RangeId>[]>(
    () =>
      RANGES.map((rangeOption) => {
        const points = filterPortfolioHistoryByDays(
          merged,
          rangeOption.days,
          now,
        )
        const trendPointCount = points.filter(
          (point) => point.valuationStatus !== "partial",
        ).length
        return {
          value: rangeOption.id,
          label: rangeOption.label,
          disabled: trendPointCount < 2,
        }
      }),
    [merged, now],
  )

  const fallbackRange =
    (["30D", "90D", "7D"] as const).find(
      (candidate) =>
        !rangeOptions.find((option) => option.value === candidate)?.disabled,
    ) ?? range
  const activeRange =
    rangeOptions.find((option) => option.value === range)?.disabled
      ? fallbackRange
      : range
  const activeDays =
    RANGES.find((rangeOption) => rangeOption.id === activeRange)?.days ?? 30
  const rangeFiltered = useMemo(
    () => filterPortfolioHistoryByDays(merged, activeDays, now),
    [activeDays, merged, now],
  )
  const filtered = rangeOptions.every((option) => option.disabled)
    ? merged.slice(-1)
    : rangeFiltered

  /** Same slice, but with each point's JPY value converted to display currency. */
  const chartData = useMemo<ChartEntry[]>(
    () =>
      filtered.map((p) => ({
        ...p,
        displayValue: jpyToDisplayValue(p.value, currency),
        trendValue:
          p.valuationStatus === "partial"
            ? null
            : jpyToDisplayValue(p.value, currency),
      })),
    [filtered, currency],
  )

  const trendEntries = chartData.filter((entry) => entry.trendValue != null)
  const hasTrend = trendEntries.length >= 2
  const baseDisplayValue = trendEntries[0]?.trendValue ?? 0
  const liveEntry = chartData.find((entry) => entry.source === "live") ?? null

  // Tighten the Y domain to the data (Robinhood-style zoom) so the line uses the
  // full height instead of being flattened against a 0 baseline. A small pad keeps
  // the baseline + peaks off the edges.
  const yDomain = useMemo<[number, number]>(() => {
    if (chartData.length === 0) return [0, 1]
    const vals = chartData.map((d) => d.displayValue)
    const lo = Math.min(...vals)
    const hi = Math.max(...vals)
    const pad = (hi - lo) * 0.08 || Math.abs(hi) * 0.05 || 1
    return [lo - pad, hi + pad]
  }, [chartData])

  // ── Pointer scrub ─────────────────────────────────────────────────────────

  const clearScrub = () => {
    setActiveIndex(null)
    onScrub?.(null)
  }

  const handlePointer = (clientX: number) => {
    const el = wrapRef.current
    if (!el || chartData.length < 2) return
    const rect = el.getBoundingClientRect()
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
    const idx = Math.round(ratio * (chartData.length - 1))
    const point = chartData[idx]
    if (!point) return
    setActiveIndex(idx)
    onScrub?.(point)
  }

  // ── Derived scrub state ───────────────────────────────────────────────────

  const activeEntry = activeIndex != null ? chartData[activeIndex] : null
  const activeLabel = activeEntry?.label
  const activeDisplayValue = activeEntry?.displayValue

  /** Locale-formatted date shown while scrubbing. */
  const scrubDate =
    activeEntry?.date
      ? new Date(activeEntry.date).toLocaleDateString(getLocale(lang), {
          month: "short",
          day: "numeric",
        })
      : null

  const scrubValue =
    activeDisplayValue != null
      ? hideBalance
        ? MASKED
        : `${activeEntry?.valuationStatus === "partial" ? "≈ " : ""}${formatDisplayValue(
            activeDisplayValue,
            currency,
          )}`
      : null

  const sparsePoint = chartData.at(-1) ?? null
  const sparsePointLabel = sparsePoint
    ? sparsePoint.source === "live"
      ? sparsePoint.label
      : new Date(sparsePoint.date).toLocaleDateString(getLocale(lang), {
          month: "short",
          day: "numeric",
        })
    : null
  const sparsePointValue = sparsePoint
    ? hideBalance
      ? MASKED
      : formatDisplayValue(sparsePoint.displayValue, currency)
    : null

  // A single observed point is useful current context, but not a trend.
  if (!hasTrend) {
    return (
      <SparseChartState
        point={sparsePoint}
        pointLabel={sparsePointLabel}
        pointValue={sparsePointValue}
        message={t(
          lang,
          historyUnavailable ? "chartAllGamesOnly" : "noPortfolioDataDesc",
        )}
      />
    )
  }

  // ── Chart ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* Range selector */}
      <div
        className="no-sb flex max-w-full overflow-x-auto pb-px"
        data-slot="portfolio-chart-range"
      >
        <SegmentedControl<RangeId>
          options={rangeOptions}
          value={activeRange}
          onChange={(r) => {
            setRange(r)
            clearScrub()
          }}
          size="sm"
          variant="pill"
          leadingIcon={CalendarRange}
          ariaLabel={t(lang, "filter")}
          className="ml-auto shrink-0"
        />
      </div>

      {/*
        Date pill — always reserves a fixed height so the layout does not
        shift when scrubbing starts. Shows date + masked/unmasked value.
      */}
      <div
        className="flex h-6 items-center justify-center"
        aria-live="polite"
        aria-atomic
      >
        {scrubDate && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-muted/70 px-2.5 py-0.5">
            <span className="text-meta tabular-nums">{scrubDate}</span>
            {scrubValue && (
              <span className="text-meta font-price font-semibold tabular-nums text-foreground">
                {scrubValue}
              </span>
            )}
          </div>
        )}
      </div>

      {trendEntries.length < 7 ? (
        <p className="text-meta text-center" data-slot="portfolio-chart-collecting">
          {t(lang, "collectingPortfolioData")}
        </p>
      ) : null}

      {/* Full-bleed chart */}
      <div
        ref={wrapRef}
        className="h-44 w-full select-none sm:h-56"
        style={{ touchAction: "pan-y" }}
        onPointerMove={(e) => handlePointer(e.clientX)}
        onPointerDown={(e) => handlePointer(e.clientX)}
        onPointerLeave={clearScrub}
        onPointerUp={clearScrub}
        onPointerCancel={clearScrub}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
            {/* Hidden axes — present so ReferenceLine/ReferenceDot resolve their
                x (by label) + y positions, and the line zooms to the data range. */}
            <XAxis dataKey="label" hide />
            <YAxis hide domain={yDomain} />

            {/* Dashed baseline at the range-open value */}
            <ReferenceLine
              y={baseDisplayValue}
              stroke={MUTED_FG}
              strokeDasharray="3 4"
              strokeOpacity={0.22}
            />

            {/* Honey-gold line with a quiet solid area fill */}
            <Area
              type="monotone"
              dataKey="trendValue"
              stroke={HONEY}
              strokeWidth={2.25}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={HONEY}
              fillOpacity={0.08}
              isAnimationActive={false}
              activeDot={false}
              dot={false}
            />

            {/*
              Inflow notches — honey dots drawn on the line wherever cards were
              added. These are the "honesty signal": an inflow lifts netInvested
              but must NEVER read as a gain on the value line (VISION §5.3).
              aria-label via the parent; individual dots are decorative.
            */}
            {chartData
              .filter((p) => p.isInflow && p.trendValue != null)
              .map((p) => (
                <ReferenceDot
                  key={`inflow-${p.label}`}
                  x={p.label}
                  y={p.displayValue}
                  r={4}
                  fill={HONEY}
                  stroke={BG}
                  strokeWidth={2}
                  aria-label={t(lang, "cardsAdded")}
                />
              ))}

            {liveEntry ? (
              <ReferenceDot
                x={liveEntry.label}
                y={liveEntry.displayValue}
                r={4.5}
                fill={
                  liveEntry.valuationStatus === "partial" ? BG : HONEY
                }
                stroke={HONEY}
                strokeWidth={2.5}
                aria-label={liveEntry.label}
              />
            ) : null}

            {/* Scrub cursor — vertical hairline + active dot on the hovered point */}
            {activeLabel != null && activeDisplayValue != null && (
              <>
                <ReferenceLine
                  x={activeLabel}
                  stroke={MUTED_FG}
                  strokeOpacity={0.38}
                  strokeWidth={1}
                />
                <ReferenceDot
                  x={activeLabel}
                  y={activeDisplayValue}
                  r={4.5}
                  fill={HONEY}
                  stroke={BG}
                  strokeWidth={2.5}
                />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
