"use client"

import { useId, useMemo, useRef, useState } from "react"
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
import { t } from "@/lib/i18n"
import { jpyToDisplayValue, formatDisplayValue } from "@/lib/utils/currency"
import { MASKED } from "@/lib/constants/ui"
import type { HistoryPoint } from "@/lib/types/portfolio"

// ─── Range config ───────────────────────────────────────────────────────────

type RangeId = "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL"

const RANGES: { id: RangeId; label: string; pts: number }[] = [
  { id: "1D", label: "1D", pts: 2 },
  { id: "1W", label: "1W", pts: 7 },
  { id: "1M", label: "1M", pts: 30 },
  { id: "3M", label: "3M", pts: 90 },
  { id: "1Y", label: "1Y", pts: 365 },
  { id: "ALL", label: "ALL", pts: Infinity },
]

// ─── Color constants — semantic CSS variables only ───────────────────────────

const HONEY = "var(--primary)"
const MUTED_FG = "var(--muted-foreground)"
const BG = "var(--background)"

// ─── Types ───────────────────────────────────────────────────────────────────

/** Shape of each data entry passed to Recharts — HistoryPoint + converted value. */
type ChartEntry = HistoryPoint & { displayValue: number }

export interface PortfolioScrubChartProps {
  data: HistoryPoint[]
  /** Called with the active HistoryPoint while scrubbing, null on leave. */
  onScrub?: (point: HistoryPoint | null) => void
  /** When true, mask monetary values and hide axis labels. */
  hideBalance?: boolean
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PortfolioScrubChart({
  data,
  onScrub,
  hideBalance = false,
}: PortfolioScrubChartProps) {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)
  // Unique gradient ID — prevents conflicts when multiple charts are on the same page.
  const fillId = `pf-scrub-${useId().replace(/:/g, "")}`

  // Default to 1M when there is enough data; fall back to ALL for sparse histories.
  const defaultRange: RangeId = data.length >= 30 ? "1M" : "ALL"
  const [range, setRange] = useState<RangeId>(defaultRange)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const rangeOptions: SegmentedOption<RangeId>[] = RANGES.map((r) => ({
    value: r.id,
    label: r.label,
  }))

  // ── Data slicing ──────────────────────────────────────────────────────────

  const filtered = useMemo<HistoryPoint[]>(() => {
    const pts = RANGES.find((r) => r.id === range)?.pts ?? Infinity
    if (pts === Infinity) return data
    return data.slice(-pts)
  }, [data, range])

  /** Same slice, but with each point's JPY value converted to display currency. */
  const chartData = useMemo<ChartEntry[]>(
    () =>
      filtered.map((p) => ({
        ...p,
        displayValue: jpyToDisplayValue(p.value, currency),
      })),
    [filtered, currency],
  )

  const baseDisplayValue = chartData[0]?.displayValue ?? 0

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
    if (!el || filtered.length < 2) return
    const rect = el.getBoundingClientRect()
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
    const idx = Math.round(ratio * (filtered.length - 1))
    const point = filtered[idx]
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
      ? new Date(activeEntry.date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })
      : null

  const scrubValue =
    activeDisplayValue != null
      ? hideBalance
        ? MASKED
        : formatDisplayValue(activeDisplayValue, currency)
      : null

  // ── Not enough data in full dataset ──────────────────────────────────────

  if (data.length < 2) {
    return (
      <div className="space-y-3">
        <div className="pointer-events-none flex justify-end opacity-40">
          <SegmentedControl<RangeId>
            options={rangeOptions}
            value={range}
            onChange={() => {}}
            size="sm"
            variant="pill"
            ariaLabel={t(lang, "filter")}
          />
        </div>
        <div className="flex h-24 w-full items-center justify-center rounded-xl border border-dashed border-hair sm:h-28">
          <p className="max-w-xs text-center text-meta">{t(lang, "noPortfolioDataDesc")}</p>
        </div>
      </div>
    )
  }

  // ── Not enough data for the current range ─────────────────────────────────

  if (filtered.length < 2) {
    return (
      <div className="space-y-3">
        <div className="flex justify-end">
          <SegmentedControl<RangeId>
            options={rangeOptions}
            value={range}
            onChange={(r) => {
              setRange(r)
              clearScrub()
            }}
            size="sm"
            variant="pill"
            ariaLabel={t(lang, "filter")}
          />
        </div>
        <div className="flex h-24 w-full items-center justify-center rounded-xl border border-dashed border-hair sm:h-28">
          <p className="max-w-xs text-center text-meta">{t(lang, "noPortfolioDataDesc")}</p>
        </div>
      </div>
    )
  }

  // ── Chart ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* Range selector */}
      <div className="flex justify-end">
        <SegmentedControl<RangeId>
          options={rangeOptions}
          value={range}
          onChange={(r) => {
            setRange(r)
            clearScrub()
          }}
          size="sm"
          variant="pill"
          ariaLabel={t(lang, "filter")}
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
              <span className="text-meta font-semibold tabular-nums text-foreground">
                {scrubValue}
              </span>
            )}
          </div>
        )}
      </div>

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
            <defs>
              {/* Soft honey-gold gradient fill under the line */}
              <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={HONEY} stopOpacity={0.22} />
                <stop offset="65%" stopColor={HONEY} stopOpacity={0.06} />
                <stop offset="100%" stopColor={HONEY} stopOpacity={0} />
              </linearGradient>
            </defs>

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

            {/* Honey-gold line with gradient area fill */}
            <Area
              type="monotone"
              dataKey="displayValue"
              stroke={HONEY}
              strokeWidth={2.25}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={`url(#${fillId})`}
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
              .filter((p) => p.isInflow)
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
