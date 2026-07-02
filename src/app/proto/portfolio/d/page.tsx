"use client"

import { useMemo, useState } from "react"
import { ArrowDown, ArrowUp } from "lucide-react"

import { HOLDINGS, TOTALS, GAMES, HISTORY, fmt, fmtPct } from "../proto-data"

/**
 * Proto D — the owner's pick: A's top (Robinhood hero + full-bleed chart,
 * boxless) over C's bottom (StockX terminal table with per-row sparklines).
 * Duplicates removed: the stat strip drops "มูลค่าพอร์ต" (the hero owns it)
 * and the footer drops the 30-day sparkline (the big chart owns history).
 */

const RANGES = ["1D", "1W", "1M", "3M", "1Y", "ALL"] as const
type GameFilter = "all" | "opcg" | "pokemon"

const GAME_TABS: { key: GameFilter; label: string }[] = [
  { key: "all", label: "ทุกเกม" },
  { key: "opcg", label: "OPCG" },
  { key: "pokemon", label: "Pokémon" },
]

const tintFor = (game: "opcg" | "pokemon") =>
  GAMES.find((g) => g.slug === game)?.tint ?? "var(--primary)"
const shortFor = (game: "opcg" | "pokemon") =>
  GAMES.find((g) => g.slug === game)?.short ?? game

/** Deterministic 6-point mini series interpolated from -d7..d7 (no randomness). */
function sparkPoints(d7: number, width: number, height: number): string {
  const steps = 6
  const pts: string[] = []
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1)
    const wobble = Math.sin(t * Math.PI) * Math.abs(d7) * 0.18
    const v = -d7 + t * (2 * d7) + (i % 2 === 0 ? wobble : -wobble)
    const x = (i / (steps - 1)) * width
    const range = Math.max(Math.abs(d7), 1)
    const y = height / 2 - (v / range) * (height / 2 - 2)
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return pts.join(" ")
}

function DeltaCell({ value }: { value: number }) {
  const up = value >= 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 font-price tabular-nums ${
        up ? "text-price-up" : "text-price-down"
      }`}
    >
      {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {fmtPct(value)}
    </span>
  )
}

export default function PortfolioProtoD() {
  const [range, setRange] = useState<(typeof RANGES)[number]>("ALL")
  const [filter, setFilter] = useState<GameFilter>("all")

  const rows = useMemo(() => {
    const filtered = filter === "all" ? HOLDINGS : HOLDINGS.filter((h) => h.game === filter)
    return [...filtered].sort((a, b) => b.priceThb * b.qty - a.priceThb * a.qty)
  }, [filter])

  const chart = useMemo(() => {
    const w = 900
    const h = 220
    const min = Math.min(...HISTORY)
    const max = Math.max(...HISTORY)
    const span = max - min || 1
    const points = HISTORY.map((v, i) => {
      const x = (i / (HISTORY.length - 1)) * w
      const y = h - ((v - min) / span) * (h - 6) - 3
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    const line = points.join(" ")
    const area = `0,${h} ${line} ${w},${h}`
    return { w, h, line, area }
  }, [])

  const isUp = TOTALS.pnl >= 0

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* ── A: hero — one huge number, plain-text delta ─────────────── */}
        <div>
          <p className="text-eyebrow">มูลค่าพอร์ต</p>
          <p className="font-price text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl">
            {fmt(TOTALS.value)}
          </p>
          <p
            className={`mt-2 flex items-center gap-1 text-sm font-medium ${
              isUp ? "text-price-up" : "text-price-down"
            }`}
          >
            {isUp ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            <span className="font-price tabular-nums">{fmt(Math.abs(TOTALS.pnl))}</span>
            <span className="font-price tabular-nums">({fmtPct(TOTALS.pnlPct)})</span>
          </p>
        </div>

        {/* ── A: full-bleed chart + range pills ───────────────────────── */}
        <div className="mt-6">
          <svg
            viewBox={`0 0 ${chart.w} ${chart.h}`}
            preserveAspectRatio="none"
            className="h-44 w-full sm:h-52"
          >
            <defs>
              <linearGradient id="proto-d-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--price-up)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="var(--price-up)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon points={chart.area} fill="url(#proto-d-fill)" />
            <polyline
              points={chart.line}
              fill="none"
              stroke="var(--price-up)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="mt-3 flex justify-end gap-1">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  range === r
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* ── C: quiet stat strip (no value repeat — hero owns it) ────── */}
        <div className="mt-6 grid grid-cols-2 divide-x divide-[var(--p-hair)] border-y border-[var(--p-hair)] sm:grid-cols-4">
          <div className="px-4 py-3">
            <div className="text-eyebrow">ต้นทุน</div>
            <div className="mt-1 font-price text-body tabular-nums">{fmt(TOTALS.cost)}</div>
          </div>
          <div className="px-4 py-3">
            <div className="text-eyebrow">กำไร/ขาดทุน</div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span
                className={`font-price text-body tabular-nums ${
                  isUp ? "text-price-up" : "text-price-down"
                }`}
              >
                {isUp ? "+" : ""}
                {fmt(TOTALS.pnl)}
              </span>
            </div>
          </div>
          <div className="border-t border-[var(--p-hair)] px-4 py-3 sm:border-t-0">
            <div className="text-eyebrow">ROI</div>
            <div className="mt-1">
              <DeltaCell value={TOTALS.pnlPct} />
            </div>
          </div>
          <div className="border-t border-[var(--p-hair)] px-4 py-3 sm:border-t-0">
            <div className="text-eyebrow">จำนวนการ์ด</div>
            <div className="mt-1 font-price text-body tabular-nums">
              {HOLDINGS.reduce((s, h) => s + h.qty, 0)}
            </div>
          </div>
        </div>

        {/* ── C: toolbar — game tabs · search · sort ──────────────────── */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {GAME_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`relative pb-1 text-body-sm transition-colors ${
                  filter === tab.key
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                {filter === tab.key && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[var(--p-honey)]" />
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="hairline flex h-9 w-full items-center rounded-md px-3 sm:w-56">
              <span className="text-meta">ค้นหาชื่อหรือรหัส...</span>
            </div>
            <button
              type="button"
              className="hairline flex h-9 items-center gap-1 rounded-md px-3 text-body-sm text-muted-foreground"
            >
              มูลค่า
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* ── C: the table (sm+) ──────────────────────────────────────── */}
        <div className="mt-4 hidden sm:block">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-background">
              <tr className="border-b border-[var(--p-hair)]">
                <th className="py-2.5 pr-3 text-left text-eyebrow">การ์ด</th>
                <th className="py-2.5 pr-3 text-left text-eyebrow">เกม</th>
                <th className="py-2.5 pr-3 text-right text-eyebrow">จำนวน</th>
                <th className="py-2.5 pr-3 text-right text-eyebrow">ต้นทุน</th>
                <th className="py-2.5 pr-3 text-right text-eyebrow">ราคา</th>
                <th className="py-2.5 pr-3 text-right text-eyebrow">24ชม.</th>
                <th className="py-2.5 pr-3 text-right text-eyebrow">7วัน</th>
                <th className="hidden py-2.5 pr-3 text-right text-eyebrow lg:table-cell">
                  แนวโน้ม 7วัน
                </th>
                <th className="py-2.5 pr-3 text-right text-eyebrow">กำไร/ขาดทุน</th>
                <th className="py-2.5 pl-3 text-right text-eyebrow">มูลค่า</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((h) => {
                const value = h.priceThb * h.qty
                const cost = h.costThb * h.qty
                const pnlPct = ((value - cost) / cost) * 100
                return (
                  <tr key={h.code} className="border-b border-[var(--p-hair)] hover:bg-muted/40">
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={h.img}
                          alt={h.name}
                          className="hairline aspect-[63/88] w-8 rounded object-cover"
                        />
                        <div className="min-w-0">
                          <div className="truncate text-body-sm">{h.name}</div>
                          <div className="text-code text-meta">{h.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: tintFor(h.game) }}
                        />
                        <span className="text-body-sm text-muted-foreground">
                          {shortFor(h.game)}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-right font-price text-body-sm tabular-nums">
                      {h.qty}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-price text-body-sm tabular-nums">
                      {fmt(cost)}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-price text-body-sm tabular-nums">
                      {fmt(h.priceThb)}
                    </td>
                    <td className="py-2.5 pr-3 text-right text-body-sm">
                      <DeltaCell value={h.d24} />
                    </td>
                    <td className="py-2.5 pr-3 text-right text-body-sm">
                      <DeltaCell value={h.d7} />
                    </td>
                    <td className="hidden py-2.5 pr-3 text-right lg:table-cell">
                      <svg
                        width={60}
                        height={20}
                        viewBox="0 0 60 20"
                        className={`ml-auto ${h.d7 >= 0 ? "text-price-up" : "text-price-down"}`}
                      >
                        <polyline
                          points={sparkPoints(h.d7, 60, 20)}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </td>
                    <td className="py-2.5 pr-3 text-right text-body-sm">
                      <DeltaCell value={pnlPct} />
                    </td>
                    <td className="py-2.5 pl-3 text-right font-price text-body-sm tabular-nums">
                      {fmt(value)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* ── mobile list (<sm) ───────────────────────────────────────── */}
        <div className="mt-4 divide-y divide-[var(--p-hair)] border-t border-[var(--p-hair)] sm:hidden">
          {rows.map((h) => {
            const value = h.priceThb * h.qty
            return (
              <div key={h.code} className="flex items-center gap-3 py-3">
                <img
                  src={h.img}
                  alt={h.name}
                  className="hairline aspect-[63/88] w-9 shrink-0 rounded object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-body-sm">{h.name}</div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: tintFor(h.game) }}
                    />
                    <span className="text-code text-meta">
                      {h.code} ×{h.qty}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-price text-body-sm tabular-nums">{fmt(value)}</div>
                  <DeltaCell value={h.d24} />
                </div>
              </div>
            )
          })}
        </div>

        {/* ── footer: by-game share only (chart owns history) ─────────── */}
        <div className="mt-6 flex items-center gap-4 border-t border-[var(--p-hair)] pt-4">
          <span className="text-eyebrow">แยกตามเกม</span>
          <div className="flex items-center gap-3">
            {GAMES.map((g) => (
              <div key={g.slug} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-1 rounded-full"
                  style={{ backgroundColor: g.tint }}
                />
                <span className="text-body-sm text-muted-foreground">
                  {g.short} {(g.share * 100).toFixed(0)}%
                  <span className="ml-1.5 font-price tabular-nums">{fmt(g.value)}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
