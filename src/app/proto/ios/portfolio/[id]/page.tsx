"use client"

import { useState } from "react"
import Image from "next/image"
import { useParams } from "next/navigation"
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Share2 } from "lucide-react"

import { SegmentedControl } from "@/components/ui/segmented-control"
import { GroupedSection } from "@/components/ui/grouped-list"

import { LargeTitle } from "../../_components/large-title"
import { fmt, fmtPct, HISTORY, portfolioById, PORTFOLIO_STATS } from "../../_data"

type Tab = "overview" | "insights"

function Delta({ value }: { value: number }) {
  const up = value >= 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-price tabular-nums ${
        up ? "text-price-up" : "text-price-down"
      }`}
    >
      {up ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
      {fmtPct(value)}
    </span>
  )
}

function SparkLine({ data }: { data: number[] }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const W = 100
  const H = 40

  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / range) * H}`)
    .join(" ")

  const trending = data[data.length - 1] >= data[0]

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden
      className="h-24 w-full"
    >
      <polyline
        points={points}
        fill="none"
        stroke={trending ? "var(--price-up)" : "var(--price-down)"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const TAB_OPTIONS = [
  { value: "overview" as const, label: "ภาพรวม" },
  { value: "insights" as const, label: "เชิงลึก" },
]

export default function PortfolioDetailPage() {
  const params = useParams<{ id: string }>()
  const id = Number(params.id)

  const portfolio = portfolioById(id)
  const stats = PORTFOLIO_STATS.get(portfolio.id) ?? PORTFOLIO_STATS.get(1)!

  const [tab, setTab] = useState<Tab>("overview")
  const [balanceHidden, setBalanceHidden] = useState(false)

  // Per-unit gain% for best/worst — ranked by (priceThb - costThb) in _data.ts
  const bestPct =
    stats.best.costThb > 0
      ? ((stats.best.card.priceThb - stats.best.costThb) / stats.best.costThb) * 100
      : 0
  const worstPct =
    stats.worst.costThb > 0
      ? ((stats.worst.card.priceThb - stats.worst.costThb) / stats.worst.costThb) * 100
      : 0

  return (
    <div className="pb-8 md:mx-auto md:max-w-5xl">
      {/* ── Page identity ───────────────────────────── */}
      <LargeTitle
        title={portfolio.name}
        subtitle={`${stats.count} การ์ด · ${portfolio.isPublic ? "สาธารณะ" : "ส่วนตัว"}`}
        trailing={
          <>
            <button
              type="button"
              aria-label={balanceHidden ? "แสดงยอด" : "ซ่อนยอด"}
              onClick={() => setBalanceHidden((v) => !v)}
              className="ease-chrome flex size-9 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-muted/70"
            >
              {balanceHidden ? (
                <EyeOff className="size-4.5" />
              ) : (
                <Eye className="size-4.5" />
              )}
            </button>
            <button
              type="button"
              aria-label="แชร์"
              className="ease-chrome flex size-9 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-muted/70"
            >
              <Share2 className="size-4.5" />
            </button>
            {/* Desktop inline add-card — no bottom sticky bar on desktop */}
            <button
              type="button"
              className="ease-chrome hidden items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 md:inline-flex"
            >
              <Plus className="size-4" />
              เพิ่มการ์ด
            </button>
          </>
        }
      />

      {/* ── Hero KPI ─────────────────────────────────── */}
      <div className="px-4 pb-4 pt-1 sm:px-6">
        <div className="hairline rounded-2xl bg-card p-5">
          <p className="text-eyebrow mb-1">มูลค่าพอร์ต</p>
          <p className="text-display tabular-nums">
            {balanceHidden ? "••••••" : fmt(stats.value)}
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <Delta value={stats.pnlPct} />
            <span className="text-meta">
              {balanceHidden
                ? "•••"
                : `${stats.pnl >= 0 ? "+" : ""}${fmt(stats.pnl)}`}
            </span>
          </div>
        </div>
      </div>

      {/* ── Segment switcher ─────────────────────────── */}
      <div className="px-4 pb-5 sm:px-6">
        <SegmentedControl
          options={TAB_OPTIONS}
          value={tab}
          onChange={setTab}
          ariaLabel="มุมมองพอร์ต"
          fullWidth
        />
      </div>

      {/* ── Overview tab ─────────────────────────────── */}
      {tab === "overview" && (
        <GroupedSection label="สินทรัพย์">
          {portfolio.holdings.map((h) => (
            <div
              key={h.card.code}
              className="flex min-h-[60px] items-center gap-3 px-4 py-2.5"
            >
              {/* Card thumbnail */}
              <div className="hairline relative aspect-[63/88] w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                <Image
                  src={h.card.img}
                  alt={h.card.name}
                  fill
                  sizes="40px"
                  className="object-contain"
                />
              </div>

              {/* Name + code */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-sm font-medium">{h.card.name}</p>
                <p className="truncate text-meta font-mono">
                  {h.qty > 1 ? `×${h.qty} · ` : ""}
                  {h.card.code}
                </p>
              </div>

              {/* Price + delta */}
              <div className="shrink-0 text-right">
                <p className="text-price tabular-nums">
                  {balanceHidden ? "•••" : fmt(h.card.priceThb * h.qty)}
                </p>
                <Delta value={h.card.d24} />
              </div>
            </div>
          ))}
        </GroupedSection>
      )}

      {/* ── Insights tab — stacked mobile, side-by-side desktop ── */}
      {tab === "insights" && (
        <div className="grid gap-4 px-4 sm:px-6 lg:grid-cols-2 lg:items-start">
          {/* 30-day sparkline */}
          <div className="hairline rounded-2xl bg-card p-4">
            <p className="text-eyebrow mb-3">มูลค่าย้อนหลัง 30 วัน</p>
            <SparkLine data={HISTORY} />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-meta">{fmt(HISTORY[0])}</span>
              <span className="text-meta">{fmt(HISTORY[HISTORY.length - 1])}</span>
            </div>
          </div>

          {/* Stat strip — 5 cells in a responsive grid.
              gap-px + bg-[var(--p-hair)] on the grid creates 1px hairline
              separators between cells; overflow-hidden clips outer edges. */}
          <div className="hairline overflow-hidden rounded-2xl bg-card">
            <div className="grid grid-cols-2 gap-px bg-[var(--p-hair)] sm:grid-cols-3 lg:grid-cols-5">
              {/* 1 — ต้นทุน */}
              <div className="bg-card px-4 py-3">
                <p className="text-eyebrow mb-1">ต้นทุน</p>
                <p className="text-price tabular-nums">
                  {balanceHidden ? "•••" : fmt(stats.cost)}
                </p>
              </div>

              {/* 2 — กำไร / ขาดทุน */}
              <div className="bg-card px-4 py-3">
                <p className="text-eyebrow mb-1">กำไร / ขาดทุน</p>
                <p
                  className={`text-price tabular-nums ${
                    stats.pnl >= 0 ? "text-price-up" : "text-price-down"
                  }`}
                >
                  {balanceHidden
                    ? "•••"
                    : `${stats.pnl >= 0 ? "+" : ""}${fmt(stats.pnl)}`}
                </p>
              </div>

              {/* 3 — ROI */}
              <div className="bg-card px-4 py-3">
                <p className="text-eyebrow mb-1">ROI</p>
                <p
                  className={`text-price tabular-nums ${
                    stats.pnlPct >= 0 ? "text-price-up" : "text-price-down"
                  }`}
                >
                  {fmtPct(stats.pnlPct)}
                </p>
              </div>

              {/* 4 — ผลงานดีที่สุด */}
              <div className="bg-card px-4 py-3">
                <p className="text-eyebrow mb-1">ดีที่สุด</p>
                <p className="truncate text-micro text-muted-foreground">
                  {stats.best.card.name}
                </p>
                <p
                  className={`text-price tabular-nums ${
                    bestPct >= 0 ? "text-price-up" : "text-price-down"
                  }`}
                >
                  {fmtPct(bestPct)}
                </p>
              </div>

              {/* 5 — ผลงานแย่ที่สุด — spans 2 cols when alone on mobile row */}
              <div className="col-span-2 bg-card px-4 py-3 sm:col-span-1">
                <p className="text-eyebrow mb-1">แย่ที่สุด</p>
                <p className="truncate text-micro text-muted-foreground">
                  {stats.worst.card.name}
                </p>
                <p
                  className={`text-price tabular-nums ${
                    worstPct >= 0 ? "text-price-up" : "text-price-down"
                  }`}
                >
                  {fmtPct(worstPct)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile CTA bar ───────────────────────────── */}
      <div
        className="frost hairline-t fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 p-3 md:hidden"
        role="none"
      >
        <button
          type="button"
          className="ease-chrome w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity active:opacity-80"
        >
          + เพิ่มการ์ด
        </button>
      </div>
    </div>
  )
}
