"use client"

import { useMemo, useState } from "react"
import { ArrowUp, ArrowDown } from "lucide-react"
import { HOLDINGS, TOTALS, GAMES, HISTORY, fmt, fmtPct, type ProtoHolding } from "../proto-data"

type GameFilter = "all" | "opcg" | "pokemon"

const GAME_LABELS: Record<"opcg" | "pokemon", string> = {
  opcg: "One Piece",
  pokemon: "Pokémon",
}

function tintFor(game: "opcg" | "pokemon") {
  return game === "opcg" ? "var(--primary)" : "#F2C744"
}

/** Highest-value card per game — used as the round "coin" thumbnail in the filter row. */
const GAME_COIN: Record<"opcg" | "pokemon", ProtoHolding> = {
  opcg: [...HOLDINGS].filter((h) => h.game === "opcg").sort((a, b) => b.priceThb - a.priceThb)[0],
  pokemon: [...HOLDINGS]
    .filter((h) => h.game === "pokemon")
    .sort((a, b) => b.priceThb - a.priceThb)[0],
}

/** 120x28 sparkline points for the demoted "value history" row at the bottom. */
function sparklinePoints(values: number[], w: number, h: number) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w
      const y = h - ((v - min) / span) * h
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(" ")
}

export default function PortfolioProtoB() {
  const [gameFilter, setGameFilter] = useState<GameFilter>("all")

  const holdings = useMemo(
    () => (gameFilter === "all" ? HOLDINGS : HOLDINGS.filter((h) => h.game === gameFilter)),
    [gameFilter]
  )

  const showcase = useMemo(
    () => [...holdings].sort((a, b) => b.priceThb * b.qty - a.priceThb * a.qty).slice(0, 3),
    [holdings]
  )

  const rest = useMemo(() => {
    const shown = new Set(showcase.map((h) => h.code))
    return holdings.filter((h) => !shown.has(h.code))
  }, [holdings, showcase])

  const games = useMemo(
    () => (gameFilter === "all" ? GAMES : GAMES.filter((g) => g.slug === gameFilter)),
    [gameFilter]
  )

  const isUp = TOTALS.pnl >= 0
  const spark = useMemo(() => sparklinePoints(HISTORY, 120, 28), [])

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="space-y-8">
          {/* Header: one hero number + quiet game filter */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-eyebrow">พอร์ตของฉัน</p>
              <p className="font-price tabular-nums text-4xl font-semibold tracking-tight">
                {fmt(TOTALS.value)}
              </p>
              <p
                className={`mt-1 flex items-center gap-1 text-sm ${
                  isUp ? "text-price-up" : "text-price-down"
                }`}
              >
                {isUp ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
                <span className="font-price tabular-nums">{fmt(Math.abs(TOTALS.pnl))}</span>
                <span className="font-price tabular-nums">({fmtPct(TOTALS.pnlPct)})</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              {(["opcg", "pokemon"] as const).map((g) => {
                const coin = GAME_COIN[g]
                const tint = tintFor(g)
                const dimmed = gameFilter !== "all" && gameFilter !== g
                return (
                  <button
                    key={g}
                    type="button"
                    title={GAME_LABELS[g]}
                    aria-pressed={gameFilter === g}
                    onClick={() => setGameFilter((prev) => (prev === g ? "all" : g))}
                    className={`h-9 w-9 shrink-0 overflow-hidden rounded-full transition-opacity ${
                      dimmed ? "opacity-40" : "opacity-100"
                    }`}
                    style={{ boxShadow: `0 0 0 2px ${tint}` }}
                  >
                    <img src={coin.img} alt={GAME_LABELS[g]} className="h-full w-full object-cover" />
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() => setGameFilter("all")}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  gameFilter === "all"
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                ทุกเกม
              </button>
            </div>
          </div>

          {/* Showcase shelf — the most valuable cards, as a gallery */}
          {showcase.length > 0 && (
            <div>
              <p className="text-eyebrow mb-3">การ์ดมูลค่าสูงสุด</p>
              <div className="flex gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0">
                {showcase.map((h, i) => {
                  const up = h.d7 >= 0
                  return (
                    <div key={h.code} className="w-40 shrink-0 lg:w-auto">
                      <div className="relative">
                        <img
                          src={h.img}
                          alt={h.name}
                          className="aspect-[63/88] w-full rounded-xl object-cover ring-1 ring-hair"
                        />
                        <span className="text-overlay font-price absolute left-1.5 top-1.5 rounded-sm bg-background px-1.5 py-0.5 ring-1 ring-hair">
                          {i + 1}/{showcase.length}
                        </span>
                      </div>
                      <div className="mt-2 space-y-0.5">
                        <p className="truncate text-sm font-semibold">{h.name}</p>
                        <p className="text-code text-xs text-muted-foreground">{h.code}</p>
                        <p className="flex items-center gap-1.5">
                          <span className="font-price tabular-nums text-sm">{fmt(h.priceThb)}</span>
                          <span
                            className={`flex items-center gap-0.5 font-price tabular-nums text-xs ${
                              up ? "text-price-up" : "text-price-down"
                            }`}
                          >
                            {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                            {fmtPct(h.d7)}
                          </span>
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Split by game */}
          {games.length > 0 && (
            <div>
              <p className="text-eyebrow mb-3">แยกตามเกม</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {games.map((g) => {
                  const preview = [...HOLDINGS]
                    .filter((h) => h.game === g.slug)
                    .sort((a, b) => b.priceThb - a.priceThb)
                    .slice(0, 2)
                  const up = g.pnlPct >= 0
                  return (
                    <div
                      key={g.slug}
                      className="rounded-xl border border-hair bg-card p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-3">
                          {preview.map((h) => (
                            <img
                              key={h.code}
                              src={h.img}
                              alt=""
                              className="aspect-[63/88] w-8 rounded-sm ring-2 ring-background object-cover"
                            />
                          ))}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{g.name}</p>
                          <p className="text-meta">{g.count} ใบ</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-end justify-between">
                        <span className="font-price tabular-nums text-lg font-semibold">
                          {fmt(g.value)}
                        </span>
                        <span
                          className={`flex items-center gap-0.5 font-price tabular-nums text-xs ${
                            up ? "text-price-up" : "text-price-down"
                          }`}
                        >
                          {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                          {fmtPct(g.pnlPct)}
                        </span>
                      </div>
                      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-hair">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${g.share * 100}%`, backgroundColor: g.tint, opacity: 0.6 }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* The rest of the collection — a tight, quiet list */}
          <div>
            <p className="text-eyebrow mb-2">การ์ดที่เหลือ</p>
            <div className="divide-y divide-hair">
              {rest.map((h) => {
                const up = h.d24 >= 0
                return (
                  <div key={h.code} className="flex items-center gap-3 py-2.5">
                    <img
                      src={h.img}
                      alt={h.name}
                      className="aspect-[63/88] w-10 shrink-0 rounded-sm ring-1 ring-hair object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{h.name}</p>
                      <p className="text-code text-xs text-muted-foreground">{h.code}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-price tabular-nums text-sm">{fmt(h.priceThb)}</p>
                      <p
                        className={`flex items-center justify-end gap-0.5 font-price tabular-nums text-xs ${
                          up ? "text-price-up" : "text-price-down"
                        }`}
                      >
                        {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                        {fmtPct(h.d24)}
                      </p>
                    </div>
                  </div>
                )
              })}
              {rest.length === 0 && (
                <p className="py-4 text-center text-meta">ไม่มีการ์ดเพิ่มเติมในหมวดนี้</p>
              )}
            </div>

            {/* Value history — intentionally demoted to a single quiet row */}
            <div className="mt-1 flex items-center justify-between gap-4 border-t border-hair pt-3">
              <span className="text-meta">ดูประวัติมูลค่า</span>
              <svg
                width="120"
                height="28"
                viewBox="0 0 120 28"
                preserveAspectRatio="none"
                className="opacity-70"
                aria-hidden
              >
                <polyline
                  points={spark}
                  fill="none"
                  stroke="var(--price-up)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
