"use client"

import { useMemo, useState } from "react"
import { ArrowUp, ArrowDown } from "lucide-react"
import { HOLDINGS, TOTALS, GAMES, HISTORY, fmt, fmtPct } from "../proto-data"

const RANGES = ["1D", "1W", "1M", "3M", "1Y", "ALL"] as const

const GAME_FILTERS = [
  { slug: "all" as const, label: "ทุกเกม" },
  { slug: "opcg" as const, label: "OPCG" },
  { slug: "pokemon" as const, label: "Pokémon" },
]

function tintFor(game: "opcg" | "pokemon") {
  return game === "opcg" ? "var(--primary)" : "#F2C744"
}

export default function PortfolioProtoA() {
  const [range, setRange] = useState<(typeof RANGES)[number]>("ALL")
  const [gameFilter, setGameFilter] = useState<"all" | "opcg" | "pokemon">("all")

  const holdings = useMemo(
    () => (gameFilter === "all" ? HOLDINGS : HOLDINGS.filter((h) => h.game === gameFilter)),
    [gameFilter]
  )

  const chart = useMemo(() => {
    const w = 600
    const h = 200
    const min = Math.min(...HISTORY)
    const max = Math.max(...HISTORY)
    const span = max - min || 1
    const points = HISTORY.map((v, i) => {
      const x = (i / (HISTORY.length - 1)) * w
      const y = h - ((v - min) / span) * h
      return [x, y] as const
    })
    const line = points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ")
    const area = `0,${h} ${line} ${w},${h}`
    return { w, h, line, area }
  }, [])

  const isUp = TOTALS.pnl >= 0

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="space-y-8">
          {/* Hero */}
          <div>
            <p className="text-eyebrow">มูลค่าพอร์ต</p>
            <p className="font-price tabular-nums text-5xl font-semibold tracking-tight sm:text-6xl">
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

          {/* Chart */}
          <div>
            <svg
              viewBox={`0 0 ${chart.w} ${chart.h}`}
              preserveAspectRatio="none"
              className="h-40 w-full sm:h-48"
            >
              <polygon points={chart.area} fill="var(--price-up)" fillOpacity="0.1" />
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

          {/* Game filter */}
          <div className="flex items-center gap-5 text-sm">
            {GAME_FILTERS.map((g) => {
              const active = gameFilter === g.slug
              return (
                <button
                  key={g.slug}
                  type="button"
                  onClick={() => setGameFilter(g.slug)}
                  className="relative pb-1.5"
                >
                  <span className={active ? "font-medium text-primary" : "text-muted-foreground"}>
                    {g.label}
                  </span>
                  {active && (
                    <span className="absolute inset-x-0 -bottom-px h-[1.5px] bg-primary" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Holdings */}
          <div className="divide-y divide-hair">
            {holdings.map((h) => {
              const up = h.d24 >= 0
              return (
                <div key={h.code} className="flex items-center gap-3 py-3">
                  <img
                    src={h.img}
                    alt={h.name}
                    className="aspect-[63/88] w-9 shrink-0 rounded-sm ring-1 ring-hair object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{h.name}</p>
                    <p className="flex items-center gap-1 font-price tabular-nums text-xs text-muted-foreground">
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: tintFor(h.game) }}
                      />
                      {h.code} ×{h.qty}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-price tabular-nums text-sm">{fmt(h.priceThb)}</p>
                    <p
                      className={`flex items-center justify-end gap-0.5 font-price tabular-nums text-xs ${
                        up ? "text-price-up" : "text-price-down"
                      }`}
                    >
                      {up ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )}
                      {fmtPct(h.d24)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Quiet stats */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">ต้นทุน</span>
              <span className="font-price tabular-nums">{fmt(TOTALS.cost)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">กำไร/ขาดทุน</span>
              <span
                className={`font-price tabular-nums ${
                  isUp ? "text-price-up" : "text-price-down"
                }`}
              >
                {isUp ? "+" : ""}
                {fmt(TOTALS.pnl)}
              </span>
            </div>
          </div>

          {/* Split by game */}
          <div>
            <p className="text-eyebrow mb-2">แยกตามเกม</p>
            <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-hair">
              {GAMES.map((g) => (
                <div
                  key={g.slug}
                  style={{
                    width: `${g.share * 100}%`,
                    backgroundColor: g.tint,
                    opacity: 0.55,
                  }}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              {GAMES.map((g) => (
                <span key={g.slug} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: g.tint }}
                  />
                  {g.short}
                  <span className="font-price tabular-nums">{fmt(g.value)}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
