"use client"

import { useMemo, useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Edit3,
  Eye,
  EyeOff,
  Globe,
  Pencil,
  Plus,
  Receipt,
  Search,
  Share2,
  Wallet,
} from "lucide-react"

import { HOLDINGS, TOTALS, GAMES, HISTORY, fmt, fmtPct } from "../proto-data"

/**
 * Proto D v2 — one coherent instrument, full feature set. Top = a single
 * "money band": number+stats on the left paired with the chart on the right
 * (Robinhood desktop), not stacked slabs. Middle = a thin context band
 * (today's movers + by-game filters). Bottom = the terminal table (C) with
 * per-row sparklines, working search/sort/game-filter, per-row edit, and the
 * full action row (portfolio switcher · hide-balance · share · history ·
 * visibility · add card).
 */

const RANGES = ["1D", "1W", "1M", "3M", "1Y", "ALL"] as const
type GameFilter = "all" | "opcg" | "pokemon"
type SortKey = "value" | "pnl" | "d24"

const tintFor = (game: "opcg" | "pokemon") =>
  GAMES.find((g) => g.slug === game)?.tint ?? "var(--primary)"
const shortFor = (game: "opcg" | "pokemon") =>
  GAMES.find((g) => g.slug === game)?.short ?? game

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

function Delta({ value, className = "" }: { value: number; className?: string }) {
  const up = value >= 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 font-price tabular-nums ${
        up ? "text-price-up" : "text-price-down"
      } ${className}`}
    >
      {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {fmtPct(value)}
    </span>
  )
}

function IconBtn({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  )
}

export default function PortfolioProtoD() {
  const [range, setRange] = useState<(typeof RANGES)[number]>("ALL")
  const [filter, setFilter] = useState<GameFilter>("all")
  const [query, setQuery] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("value")
  const [hide, setHide] = useState(false)

  const money = (n: number) => (hide ? "••••" : fmt(n))

  const rows = useMemo(() => {
    let out = filter === "all" ? HOLDINGS : HOLDINGS.filter((h) => h.game === filter)
    const q = query.trim().toLowerCase()
    if (q) {
      out = out.filter(
        (h) => h.name.toLowerCase().includes(q) || h.code.toLowerCase().includes(q),
      )
    }
    return [...out].sort((a, b) => {
      if (sortKey === "pnl") {
        const pa = (a.priceThb - a.costThb) / a.costThb
        const pb = (b.priceThb - b.costThb) / b.costThb
        return pb - pa
      }
      if (sortKey === "d24") return b.d24 - a.d24
      return b.priceThb * b.qty - a.priceThb * a.qty
    })
  }, [filter, query, sortKey])

  // Today's movers — top 3 by absolute THB swing (like the real page).
  const movers = useMemo(
    () =>
      [...HOLDINGS]
        .map((h) => ({ h, swing: (h.priceThb * h.qty * h.d24) / 100 }))
        .sort((a, b) => Math.abs(b.swing) - Math.abs(a.swing))
        .slice(0, 3),
    [],
  )

  const chart = useMemo(() => {
    const w = 760
    const h = 190
    const min = Math.min(...HISTORY)
    const max = Math.max(...HISTORY)
    const span = max - min || 1
    const pts = HISTORY.map((v, i) => {
      const x = (i / (HISTORY.length - 1)) * w
      const y = h - ((v - min) / span) * (h - 8) - 4
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    return { w, h, line: pts.join(" "), area: `0,${h} ${pts.join(" ")} ${w},${h}` }
  }, [])

  const isUp = TOTALS.pnl >= 0
  const sortLabels: Record<SortKey, string> = { value: "มูลค่า", pnl: "กำไร", d24: "24ชม." }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ═ Action row — switcher · view actions · add card ═══════════ */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex min-w-0 items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-muted/60"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Wallet className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold leading-tight">Default</span>
              <span className="block text-meta leading-tight">2 พอร์ต · แตะเพื่อสลับ</span>
            </span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </button>

          <div className="ml-auto flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setHide((v) => !v)}
              aria-label="ซ่อนยอด"
              title="ซ่อนยอด"
              className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {hide ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
            <IconBtn label="ประวัติธุรกรรม">
              <Receipt className="size-4" />
            </IconBtn>
            <IconBtn label="แชร์พอร์ต">
              <Share2 className="size-4" />
            </IconBtn>
            <IconBtn label="สาธารณะ">
              <Globe className="size-4" />
            </IconBtn>
            <button
              type="button"
              className="ml-1 inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">เพิ่มการ์ด</span>
            </button>
          </div>
        </div>

        {/* ═ Money band — number+stats LEFT, chart RIGHT (one instrument) ═ */}
        <div className="mt-6 gap-10 lg:grid lg:grid-cols-[minmax(300px,5fr)_7fr] lg:items-end">
          <div>
            <p className="text-eyebrow">มูลค่าพอร์ต</p>
            <p className="font-price text-5xl font-semibold tracking-tight tabular-nums">
              {money(TOTALS.value)}
            </p>
            <p
              className={`mt-2 flex items-center gap-1 text-sm font-medium ${
                isUp ? "text-price-up" : "text-price-down"
              }`}
            >
              {isUp ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              <span className="font-price tabular-nums">{money(Math.abs(TOTALS.pnl))}</span>
              <span className="font-price tabular-nums">({fmtPct(TOTALS.pnlPct)})</span>
            </p>

            {/* stats live WITH the number — not a separate slab */}
            <dl className="mt-6 space-y-2 border-t border-hair pt-4 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">ต้นทุน</dt>
                <dd className="font-price tabular-nums">{money(TOTALS.cost)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">ROI</dt>
                <dd>
                  <Delta value={TOTALS.pnlPct} />
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">จำนวนการ์ด</dt>
                <dd className="font-price tabular-nums">
                  {HOLDINGS.reduce((s, h) => s + h.qty, 0)} ใบ
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-6 lg:mt-0">
            <svg
              viewBox={`0 0 ${chart.w} ${chart.h}`}
              preserveAspectRatio="none"
              className="h-40 w-full sm:h-48"
            >
              <polygon points={chart.area} fill="var(--price-up)" fillOpacity="0.08" />
              <polyline
                points={chart.line}
                fill="none"
                stroke="var(--price-up)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="mt-2 flex justify-end gap-1">
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
        </div>

        {/* ═ Context band — movers + by-game (thin, one line) ══════════ */}
        <div className="mt-8 flex flex-col gap-4 border-y border-hair py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="text-eyebrow shrink-0">มูฟเวอร์วันนี้</span>
            <div className="no-sb flex min-w-0 items-center gap-2 overflow-x-auto">
              {movers.map(({ h }) => (
                <span
                  key={h.code}
                  className="flex shrink-0 items-center gap-2 rounded-full py-1 pl-1 pr-3 ring-1 ring-hair"
                >
                  <img
                    src={h.img}
                    alt={h.name}
                    className="aspect-[63/88] w-5 rounded-sm object-cover"
                  />
                  <span className="max-w-28 truncate text-xs">{h.name}</span>
                  <Delta value={h.d24} className="text-xs" />
                </span>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="text-eyebrow">แยกตามเกม</span>
            {GAMES.map((g) => {
              const active = filter === g.slug
              return (
                <button
                  key={g.slug}
                  type="button"
                  onClick={() => setFilter(active ? "all" : g.slug)}
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition-colors ${
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground ring-1 ring-hair hover:text-foreground"
                  }`}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: g.tint }}
                  />
                  {g.short}
                  <span className="font-price tabular-nums">{money(g.value)}</span>
                  <Delta value={g.pnlPct} className="text-[11px]" />
                </button>
              )
            })}
          </div>
        </div>

        {/* ═ Collection — toolbar + terminal table ═════════════════════ */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            <span className="text-meta">{rows.length} รายการ</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="hairline flex h-9 w-full items-center gap-2 rounded-md px-3 sm:w-52">
              <Search className="size-3.5 shrink-0 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหาชื่อหรือรหัส..."
                className="w-full bg-transparent text-body-sm outline-none placeholder:text-muted-foreground"
              />
            </label>
            <button
              type="button"
              onClick={() =>
                setSortKey((k) => (k === "value" ? "pnl" : k === "pnl" ? "d24" : "value"))
              }
              className="hairline flex h-9 shrink-0 items-center gap-1 rounded-md px-3 text-body-sm text-muted-foreground transition-colors hover:text-foreground"
              title="สลับการเรียง"
            >
              {sortLabels[sortKey]}
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="hairline flex h-9 shrink-0 items-center gap-1.5 rounded-md px-3 text-body-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Edit3 className="size-3.5" />
              <span className="hidden sm:inline">แก้ไขหลายรายการ</span>
            </button>
          </div>
        </div>

        {/* table (sm+) */}
        <div className="mt-3 hidden sm:block">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-background">
              <tr className="border-b border-hair">
                <th className="py-2.5 pr-3 text-left text-eyebrow">การ์ด</th>
                <th className="py-2.5 pr-3 text-left text-eyebrow">เกม</th>
                <th className="py-2.5 pr-3 text-right text-eyebrow">ต้นทุน</th>
                <th className="py-2.5 pr-3 text-right text-eyebrow">ราคา</th>
                <th className="py-2.5 pr-3 text-right text-eyebrow">24ชม.</th>
                <th className="hidden py-2.5 pr-3 text-right text-eyebrow lg:table-cell">
                  แนวโน้ม 7วัน
                </th>
                <th className="py-2.5 pr-3 text-right text-eyebrow">กำไร/ขาดทุน</th>
                <th className="py-2.5 pr-3 text-right text-eyebrow">มูลค่า</th>
                <th className="w-10 py-2.5 pl-1" />
              </tr>
            </thead>
            <tbody>
              {rows.map((h) => {
                const value = h.priceThb * h.qty
                const cost = h.costThb * h.qty
                const pnlPct = ((value - cost) / cost) * 100
                return (
                  <tr
                    key={h.code}
                    className="group border-b border-hair hover:bg-muted/40"
                  >
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={h.img}
                          alt={h.name}
                          className="hairline aspect-[63/88] w-8 rounded-sm object-cover"
                        />
                        <div className="min-w-0">
                          <div className="truncate text-body-sm font-medium">{h.name}</div>
                          <div className="text-code text-meta">
                            {h.code} <span className="text-foreground/50">×{h.qty}</span>
                          </div>
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
                    <td className="py-2.5 pr-3 text-right font-price text-body-sm tabular-nums text-muted-foreground">
                      {money(cost)}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-price text-body-sm tabular-nums">
                      {fmt(h.priceThb)}
                    </td>
                    <td className="py-2.5 pr-3 text-right text-body-sm">
                      <Delta value={h.d24} />
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
                      {hide ? (
                        <span className="text-muted-foreground">••••</span>
                      ) : (
                        <Delta value={pnlPct} />
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-price text-body-sm font-semibold tabular-nums">
                      {money(value)}
                    </td>
                    <td className="py-2.5 pl-1 text-right">
                      <button
                        type="button"
                        aria-label="แก้ไข"
                        title="แก้ไข"
                        className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground/40 transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* mobile list (<sm) */}
        <div className="mt-3 divide-y divide-hair border-t border-hair sm:hidden">
          {rows.map((h) => {
            const value = h.priceThb * h.qty
            return (
              <div key={h.code} className="flex items-center gap-3 py-3">
                <img
                  src={h.img}
                  alt={h.name}
                  className="hairline aspect-[63/88] w-10 shrink-0 rounded-sm object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-body-sm font-medium">{h.name}</div>
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
                  <div className="font-price text-body-sm font-semibold tabular-nums">
                    {money(value)}
                  </div>
                  <Delta value={h.d24} className="text-xs" />
                </div>
                <button
                  type="button"
                  aria-label="แก้ไข"
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground/40"
                >
                  <Pencil className="size-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
