"use client"

import { useMemo, useState } from "react"
import { ArrowDown, ArrowUp } from "lucide-react"

import { HOLDINGS, TOTALS, GAMES, HISTORY, fmt, fmtPct } from "../proto-data"

/** Deterministic 6-point mini series interpolated from -d7..d7 (no randomness). */
function sparkPoints(d7: number, width: number, height: number): string {
  const steps = 6
  const pts: string[] = []
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1)
    // ease the walk from -d7 toward +d7 with a gentle midpoint wobble
    const wobble = Math.sin(t * Math.PI) * Math.abs(d7) * 0.18
    const v = -d7 + t * (2 * d7) + (i % 2 === 0 ? wobble : -wobble)
    const x = (i / (steps - 1)) * width
    // normalize v against +-|d7| range (fallback to +-1 when d7 is 0)
    const range = Math.max(Math.abs(d7), 1)
    const y = height / 2 - (v / range) * (height / 2 - 2)
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return pts.join(" ")
}

function historyPoints(width: number, height: number): string {
  const min = Math.min(...HISTORY)
  const max = Math.max(...HISTORY)
  const range = max - min || 1
  return HISTORY.map((v, i) => {
    const x = (i / (HISTORY.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 2) - 1
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(" ")
}

type SortKey = "value"
type GameFilter = "all" | "opcg" | "pokemon"

function DeltaCell({ value }: { value: number }) {
  const up = value >= 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 font-price tabular-nums ${
        up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
      }`}
    >
      {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {fmtPct(value)}
    </span>
  )
}

export default function PortfolioProtoC() {
  const [filter, setFilter] = useState<GameFilter>("all")
  const sortKey: SortKey = "value"

  const rows = useMemo(() => {
    const filtered = filter === "all" ? HOLDINGS : HOLDINGS.filter((h) => h.game === filter)
    return [...filtered].sort((a, b) => {
      if (sortKey === "value") return b.priceThb * b.qty - a.priceThb * a.qty
      return 0
    })
  }, [filter])

  const gameTint = (game: "opcg" | "pokemon") => GAMES.find((g) => g.slug === game)?.tint ?? "var(--primary)"
  const gameShort = (game: "opcg" | "pokemon") => GAMES.find((g) => g.slug === game)?.short ?? game

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-baseline justify-between">
          <h1 className="text-h1">พอร์ตของฉัน</h1>
          <span className="text-meta">อัปเดตล่าสุด วันนี้</span>
        </div>

        {/* Stat strip — the one hero number */}
        <div className="grid grid-cols-2 divide-x divide-y divide-hair border-y border-hair sm:grid-cols-5 sm:divide-y-0">
          <div className="px-4 py-3 sm:col-span-1">
            <div className="text-eyebrow">มูลค่าพอร์ต</div>
            <div className="mt-1 font-price text-2xl tabular-nums">{fmt(TOTALS.value)}</div>
          </div>
          <div className="px-4 py-3">
            <div className="text-eyebrow">ต้นทุน</div>
            <div className="mt-1 font-price text-body tabular-nums">{fmt(TOTALS.cost)}</div>
          </div>
          <div className="px-4 py-3">
            <div className="text-eyebrow">กำไร/ขาดทุน</div>
            <div className="mt-1">
              <DeltaCell value={TOTALS.pnlPct} />
            </div>
          </div>
          <div className="px-4 py-3">
            <div className="text-eyebrow">ROI</div>
            <div className="mt-1 font-price text-body tabular-nums">{fmtPct(TOTALS.pnlPct)}</div>
          </div>
          <div className="px-4 py-3">
            <div className="text-eyebrow">จำนวนการ์ด</div>
            <div className="mt-1 font-price text-body tabular-nums">
              {HOLDINGS.reduce((s, h) => s + h.qty, 0)}
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {(
              [
                { key: "all" as const, label: "ทุกเกม" },
                { key: "opcg" as const, label: "OPCG" },
                { key: "pokemon" as const, label: "Pokémon" },
              ]
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`relative pb-1 text-body-sm transition-colors ${
                  filter === tab.key ? "text-foreground" : "text-muted-foreground hover:text-foreground"
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

        {/* Table (sm+) */}
        <div className="mt-4 hidden sm:block">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-background">
              <tr className="border-b border-hair">
                <th className="py-2.5 pr-3 text-left text-eyebrow">การ์ด</th>
                <th className="py-2.5 pr-3 text-left text-eyebrow">เกม</th>
                <th className="py-2.5 pr-3 text-right text-eyebrow">จำนวน</th>
                <th className="py-2.5 pr-3 text-right text-eyebrow">ต้นทุน</th>
                <th className="py-2.5 pr-3 text-right text-eyebrow">ราคา</th>
                <th className="py-2.5 pr-3 text-right text-eyebrow">24ชม.</th>
                <th className="py-2.5 pr-3 text-right text-eyebrow">7วัน</th>
                <th className="hidden py-2.5 pr-3 text-right text-eyebrow lg:table-cell">แนวโน้ม 7วัน</th>
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
                  <tr key={h.code} className="border-b border-hair hover:bg-muted/40">
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={h.img}
                          alt={h.name}
                          className="hairline aspect-[63/88] w-8 rounded-sm object-cover"
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
                          style={{ backgroundColor: gameTint(h.game) }}
                        />
                        <span className="text-body-sm text-muted-foreground">{gameShort(h.game)}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-right font-price tabular-nums text-body-sm">{h.qty}</td>
                    <td className="py-2.5 pr-3 text-right font-price tabular-nums text-body-sm">
                      {fmt(cost)}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-price tabular-nums text-body-sm">
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
                        className={`ml-auto ${
                          h.d7 >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        }`}
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
                    <td className="py-2.5 pl-3 text-right font-price tabular-nums text-body-sm">
                      {fmt(value)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Hairline list (<sm) */}
        <div className="mt-4 divide-y divide-hair border-t border-hair sm:hidden">
          {rows.map((h) => {
            const value = h.priceThb * h.qty
            return (
              <div key={h.code} className="flex items-center gap-3 py-3">
                <img
                  src={h.img}
                  alt={h.name}
                  className="hairline aspect-[63/88] w-9 shrink-0 rounded-sm object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-body-sm">{h.name}</div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: gameTint(h.game) }}
                    />
                    <span className="text-code text-meta">{h.code}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-price tabular-nums text-body-sm">{fmt(value)}</div>
                  <DeltaCell value={h.d24} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer strip */}
        <div className="mt-6 flex flex-col gap-4 border-t border-hair pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
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
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-eyebrow">30 วัน</span>
            <svg
              width={160}
              height={32}
              viewBox="0 0 160 32"
              className={TOTALS.pnl >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}
            >
              <polyline
                points={historyPoints(160, 32)}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
