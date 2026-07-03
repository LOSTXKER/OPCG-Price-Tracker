"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowDown, ArrowUp, Star } from "lucide-react"

import { GroupedSection, GroupedRow } from "../../_components/grouped-list"
import { CARD_DETAIL, fmt, fmtPct } from "../../_data"

/**
 * Card Detail — the most information-dense screen in the iOS showcase.
 * Always renders CARD_DETAIL (Roronoa Zoro OP01-001) regardless of [code] param;
 * this is a one-card-deep demo of the iOS grammar × Meecard warm-premium skin.
 */

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

export default function CardDetailPage() {
  // Read but intentionally unused — this demo always renders CARD_DETAIL
  // regardless of which card code was navigated to (see file doc comment).
  const _params = useParams<{ code: string }>()

  // Always render the fully-detailed demo card
  const card = CARD_DETAIL

  const [selectedGradeKey, setSelectedGradeKey] = useState("raw")

  const selectedGrade = useMemo(
    () => card.grades.find((g) => g.key === selectedGradeKey) ?? card.grades[0],
    [card.grades, selectedGradeKey],
  )

  const displayPrice = selectedGrade.priceThb

  // Range bar — where does the current price sit between rangeLow and rangeHigh?
  const rangePos = Math.min(
    100,
    Math.max(0, ((displayPrice - card.rangeLow) / (card.rangeHigh - card.rangeLow)) * 100),
  )

  // SVG price history chart (30-point polyline + gradient area fill)
  const history = card.history
  const chartMin = Math.min(...history)
  const chartMax = Math.max(...history)
  const chartRange = chartMax - chartMin || 1

  const toX = (i: number) => (i / (history.length - 1)) * 300
  const toY = (v: number) => 92 - ((v - chartMin) / chartRange) * 82

  const polylinePoints = history.map((v, i) => `${toX(i).toFixed(2)},${toY(v).toFixed(2)}`).join(" ")

  const areaPath = [
    `M${toX(0).toFixed(2)},${toY(history[0]).toFixed(2)}`,
    ...history.map((v, i) => `L${toX(i).toFixed(2)},${toY(v).toFixed(2)}`),
    `L${toX(history.length - 1).toFixed(2)},100`,
    `L0,100`,
    `Z`,
  ].join(" ")

  return (
    <>
      {/*
       * Page scroll container — extra bottom padding so the sticky buy bar
       * never covers the last piece of content (related cards + 80px clearance).
       */}
      <div className="pb-36 md:pb-10 md:mx-auto md:max-w-6xl">
        {/*
         * Desktop two-column grid: sticky card identity rail (left) + content (right).
         * On mobile everything stacks in a single column.
         */}
        <div className="lg:grid lg:grid-cols-[300px_1fr] lg:gap-8 lg:px-6">
          {/* ── LEFT RAIL: Card art + identity ─────────────────────────────── */}
          <div className="lg:sticky lg:top-14 lg:self-start lg:py-6">
            {/* Card art */}
            <div className="mt-4 flex justify-center px-4 sm:px-6 lg:justify-start lg:px-0">
              <div className="hairline relative aspect-[63/88] w-[200px] overflow-hidden rounded-2xl bg-muted sm:w-[220px] lg:w-full lg:max-w-[260px]">
                <Image
                  src={card.img}
                  alt={card.name}
                  fill
                  sizes="(min-width: 1024px) 260px, 220px"
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* Identity: name, badges, code */}
            <div className="mt-4 px-4 text-center sm:px-6 lg:px-0 lg:text-left">
              <h1 className="text-h2">{card.name}</h1>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 lg:justify-start">
                <span className="rounded-full bg-muted px-2 py-0.5 text-meta">{card.rarity}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-meta">{card.setName}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-meta">{card.setCode}</span>
              </div>
              <p className="mt-1.5 font-mono text-meta">{card.code}</p>
            </div>
          </div>

          {/* ── RIGHT COLUMN: all detail content ──────────────────────────── */}
          <div className="min-w-0">
            {/* ─── 1. Hero price ──────────────────────────────────────────── */}
            <div className="mt-6 px-4 sm:px-6 lg:mt-6 lg:px-0">
              <div className="flex items-baseline gap-3">
                <span className="text-display">{fmt(displayPrice)}</span>
                <Delta value={card.d24} />
              </div>
              <p className="mt-1 text-meta">
                ราคากลาง · {selectedGrade.label} · อัปเดตวันนี้
              </p>
            </div>

            {/* ─── 2. Grade chips ─────────────────────────────────────────── */}
            <div className="mt-5 px-4 sm:px-6 lg:px-0">
              <p className="mb-2.5 text-eyebrow">เกรด</p>
              <div className="no-sb flex gap-2 overflow-x-auto pb-1">
                {card.grades.map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => setSelectedGradeKey(g.key)}
                    className={`ease-chrome flex shrink-0 flex-col items-center rounded-2xl px-4 py-2.5 transition-colors ${
                      selectedGradeKey === g.key
                        ? "bg-primary/12 text-primary"
                        : "bg-muted text-foreground hover:bg-muted/70"
                    }`}
                  >
                    <span className="text-body-sm font-semibold">{g.label}</span>
                    <span className="mt-0.5 text-meta tabular-nums">{fmt(g.priceThb)}</span>
                    <span className="mt-0.5 text-micro text-muted-foreground">{g.source}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ─── 3. 30-day range bar ────────────────────────────────────── */}
            <div className="mt-5 px-4 sm:px-6 lg:px-0">
              <p className="mb-2.5 text-eyebrow">ช่วงราคา 30 วัน</p>
              <div className="relative h-5 flex items-center">
                <div className="absolute inset-x-0 h-1.5 rounded-full bg-muted" />
                {/* price-up tint for the portion below current price */}
                <div
                  className="absolute h-1.5 rounded-full"
                  style={{
                    width: `${rangePos}%`,
                    background: "var(--price-up)",
                    opacity: 0.3,
                  }}
                />
                {/* marker dot */}
                <div
                  className="absolute size-3.5 rounded-full bg-foreground ring-2 ring-card shadow"
                  style={{ left: `calc(${rangePos}% - 7px)` }}
                />
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-meta tabular-nums">ต่ำสุด {fmt(card.rangeLow)}</span>
                <span className="text-meta tabular-nums">สูงสุด {fmt(card.rangeHigh)}</span>
              </div>
            </div>

            {/* ─── 4. Price history chart ──────────────────────────────────── */}
            <div className="mt-5 px-4 sm:px-6 lg:px-0">
              <div className="hairline rounded-2xl bg-card p-4">
                <p className="mb-3 text-eyebrow">แนวโน้มราคา 30 วัน</p>
                <svg
                  viewBox="0 0 300 100"
                  preserveAspectRatio="none"
                  className="h-[88px] w-full"
                  aria-hidden
                >
                  <defs>
                    <linearGradient id="card-chart-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--price-up)" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="var(--price-up)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Area fill */}
                  <path d={areaPath} fill="url(#card-chart-fill)" />
                  {/* Price line */}
                  <polyline
                    points={polylinePoints}
                    fill="none"
                    stroke="var(--price-up)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                  {/* End dot */}
                  <circle
                    cx={toX(history.length - 1).toFixed(2)}
                    cy={toY(history[history.length - 1]).toFixed(2)}
                    r="3"
                    fill="var(--price-up)"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
                {/* Min / max axis labels */}
                <div className="mt-1 flex justify-between">
                  <span className="text-meta tabular-nums">{fmt(chartMin)}</span>
                  <span className="text-meta tabular-nums">{fmt(chartMax)}</span>
                </div>
              </div>
            </div>

            {/* ─── 5. Sources / recent activity ───────────────────────────── */}
            <div className="mt-5 lg:px-0">
              <GroupedSection label="แหล่งอ้างอิง">
                {card.sales.map((sale, i) => (
                  <GroupedRow
                    key={i}
                    title={sale.source}
                    subtitle={`${sale.grade} · ${sale.when}`}
                    chevron={false}
                    trailing={
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <span className="text-price tabular-nums">{fmt(sale.priceThb)}</span>
                        <span
                          className={`text-micro ${
                            sale.type === "sold"
                              ? "text-muted-foreground"
                              : "text-primary"
                          }`}
                        >
                          {sale.type === "sold" ? "ขายแล้ว" : "ตั้งขาย"}
                        </span>
                      </div>
                    }
                  />
                ))}
              </GroupedSection>
            </div>

            {/* ─── 6. Card specs ──────────────────────────────────────────── */}
            <div className="mt-5 lg:px-0">
              <GroupedSection label="ข้อมูลการ์ด">
                <GroupedRow
                  title="Cost"
                  chevron={false}
                  trailing={
                    <span className="text-body-sm text-muted-foreground tabular-nums">
                      {card.cost}
                    </span>
                  }
                />
                <GroupedRow
                  title="Power"
                  chevron={false}
                  trailing={
                    <span className="text-body-sm text-muted-foreground tabular-nums">
                      {card.power.toLocaleString("th-TH")}
                    </span>
                  }
                />
                <GroupedRow
                  title="Counter"
                  chevron={false}
                  trailing={
                    <span className="text-body-sm text-muted-foreground tabular-nums">
                      {card.counter.toLocaleString("th-TH")}
                    </span>
                  }
                />
                <GroupedRow
                  title="Color"
                  chevron={false}
                  trailing={
                    <span className="text-body-sm text-muted-foreground">{card.color}</span>
                  }
                />
                <GroupedRow
                  title="Type"
                  chevron={false}
                  trailing={
                    <span className="text-body-sm text-muted-foreground">{card.type}</span>
                  }
                />
                <GroupedRow
                  title="Attribute"
                  chevron={false}
                  trailing={
                    <span className="text-body-sm text-muted-foreground">{card.attribute}</span>
                  }
                />
              </GroupedSection>
            </div>

            {/* Effect text — full-width below specs */}
            <div className="mt-2 px-4 sm:px-6 lg:px-0">
              <div className="hairline rounded-2xl bg-card px-4 py-3.5">
                <p className="mb-2 text-eyebrow">Effect</p>
                <p className="text-body-sm leading-relaxed">{card.effect}</p>
              </div>
            </div>

            {/* ─── 7. Related cards ────────────────────────────────────────── */}
            <div className="mt-6">
              <p className="mb-2.5 px-4 text-eyebrow sm:px-6 lg:px-0">การ์ดที่เกี่ยวข้อง</p>
              <div className="no-sb flex gap-3 overflow-x-auto px-4 pb-1 sm:px-6 lg:px-0">
                {card.related.map((c) => (
                  <Link
                    key={c.code}
                    href={`/proto/ios/cards/${c.code}`}
                    className="ease-chrome w-24 shrink-0 transition-transform active:scale-[0.97]"
                  >
                    <div className="hairline relative aspect-[63/88] w-24 overflow-hidden rounded-xl bg-muted">
                      <Image
                        src={c.img}
                        alt={c.name}
                        fill
                        sizes="96px"
                        className="object-contain"
                      />
                    </div>
                    <p className="mt-1.5 truncate text-body-sm font-medium">{c.name}</p>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-meta tabular-nums truncate">{fmt(c.priceThb)}</span>
                      <Delta value={c.d24} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky mobile buy bar (THE one gold moment on this screen) ─────── */}
      <div className="frost hairline-t fixed inset-x-0 bottom-16 z-30 flex items-center justify-between px-4 py-3 pb-safe md:hidden">
        <div>
          <p className="text-meta">{selectedGrade.label}</p>
          <p className="text-price tabular-nums">{fmt(displayPrice)}</p>
        </div>
        <button
          type="button"
          className="ease-chrome flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity active:opacity-80"
        >
          <Star className="size-3.5 fill-current" />
          ซื้อบน Meecard
        </button>
      </div>
    </>
  )
}
