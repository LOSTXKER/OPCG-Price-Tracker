"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowDown, ArrowUp, Search, SlidersHorizontal } from "lucide-react"

import { LargeTitle } from "./_components/large-title"
import { GroupedSection } from "@/components/ui/grouped-list"
import { CATALOG, MARKET_STATS, MOST_VALUABLE, TOP_GAINERS, TOP_LOSERS, JPY_THB_RATE, fmt, fmtPct } from "./_data"

/**
 * Home / Market — the showcase's tab-1 screen, and the one screen the owner
 * has directly compared against a real screenshot. Ticker stats → hero search
 * → the "มูลค่าสูงสุด / ขึ้นมากสุด / ลงมากสุด" three-up (mirrors the real
 * home page's top-cards rail) → set + grade filter → the full catalog as a
 * grouped-inset list with 24h/7d/30d columns. Same grammar on every
 * breakpoint (v3): desktop just gets more columns, not a different layout.
 */

type PriceMode = "raw" | "psa10"

function Delta({ value, className = "" }: { value: number; className?: string }) {
  const up = value >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-price tabular-nums ${up ? "text-price-up" : "text-price-down"} ${className}`}>
      {up ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
      {fmtPct(value)}
    </span>
  )
}

function MoverColumn({
  title,
  cards,
}: {
  title: string
  cards: typeof CATALOG
}) {
  return (
    <div className="hairline min-w-0 flex-1 overflow-hidden rounded-2xl bg-card">
      <p className="px-4 pt-3.5 text-eyebrow">{title}</p>
      <div className="divide-y divide-hair">
        {cards.map((c, i) => (
          <Link
            key={c.code}
            href={`/proto/ios/cards/${c.code}`}
            className="ease-chrome flex items-center gap-2.5 px-4 py-2.5 transition-colors active:bg-muted/60"
          >
            <span className="w-3.5 shrink-0 text-center text-meta tabular-nums">{i + 1}</span>
            <div className="hairline relative aspect-[63/88] w-7 shrink-0 overflow-hidden rounded-sm bg-muted">
              <Image src={c.img} alt={c.name} fill sizes="28px" className="object-contain" />
            </div>
            <span className="min-w-0 flex-1 truncate text-body-sm font-medium">{c.name}</span>
            <Delta value={c.d24} />
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function IosHomeScreen() {
  const [priceMode, setPriceMode] = useState<PriceMode>("raw")
  const [setFilter, setSetFilter] = useState<string | null>(null)

  const sets = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of CATALOG) if (c.setCode) map.set(c.setCode, c.setName)
    return [...map.entries()].map(([code, name]) => ({ code, name }))
  }, [])

  const rows = useMemo(() => {
    let list = setFilter ? CATALOG.filter((c) => c.setCode === setFilter) : CATALOG
    if (priceMode === "psa10") list = list.filter((c) => c.psa10Usd != null)
    return list
  }, [setFilter, priceMode])

  return (
    <div className="pb-6">
      {/* Stats ticker — real aggregate, matches the owner's own screenshot
          exactly (3,838 cards / 2,688,706 THB). Same content on every
          breakpoint; only the row wraps differently. */}
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 px-4 pt-3 text-meta sm:px-6 md:mx-auto md:max-w-6xl">
        <span>
          การ์ดทั้งหมด <b className="font-semibold text-foreground tabular-nums">{MARKET_STATS.totalCards.toLocaleString("th-TH")}</b>
        </span>
        <span>
          มูลค่ารวม <b className="font-semibold text-foreground tabular-nums">{fmt(MARKET_STATS.totalValueThb)}</b>
        </span>
        <span className="tabular-nums">JPY/THB {JPY_THB_RATE.toFixed(3)}</span>
      </div>

      <LargeTitle
        title="ตลาด"
        subtitle="ราคาการ์ด One Piece Card Game อัปเดตวันนี้"
        trailing={
          <button
            type="button"
            aria-label="ค้นหา"
            className="ease-chrome flex size-9 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-muted/70"
          >
            <Search className="size-4.5" />
          </button>
        }
      />

      <div className="md:mx-auto md:max-w-6xl">
        {/* iOS-style search field */}
        <div className="px-4 sm:px-6">
          <div className="flex h-10 items-center gap-2 rounded-xl bg-muted px-3 text-muted-foreground">
            <Search className="size-4 shrink-0" />
            <span className="text-body-sm">ค้นหาการ์ด, เซ็ต...</span>
          </div>
        </div>

        {/* Top cards — มูลค่าสูงสุด / ขึ้นมากสุด / ลงมากสุด. One column on
            mobile (stacked), three side-by-side from md: up — mirrors the
            real home page's "top cards" rail exactly. */}
        <div className="mt-5 flex flex-col gap-3 px-4 sm:px-6 md:flex-row">
          <MoverColumn title="มูลค่าสูงสุด" cards={MOST_VALUABLE} />
          <MoverColumn title="ขึ้นมากสุด" cards={TOP_GAINERS} />
          <MoverColumn title="ลงมากสุด" cards={TOP_LOSERS} />
        </div>

        {/* Set + grade filter row */}
        <div className="mt-5 flex items-center gap-2 px-4 sm:px-6">
          <div className="no-sb flex flex-1 items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setSetFilter(null)}
              className={`ease-chrome shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                setFilter === null ? "bg-primary/12 text-primary" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              ทุกเซ็ต
            </button>
            {sets.map((s) => (
              <button
                key={s.code}
                type="button"
                onClick={() => setSetFilter(s.code)}
                className={`ease-chrome shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold uppercase transition-colors ${
                  setFilter === s.code ? "bg-primary/12 text-primary" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.code}
              </button>
            ))}
          </div>
          <div role="radiogroup" className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-muted p-0.5">
            {(
              [
                { key: "raw" as const, label: "Raw" },
                { key: "psa10" as const, label: "PSA 10" },
              ]
            ).map((f) => (
              <button
                key={f.key}
                type="button"
                role="radio"
                aria-checked={priceMode === f.key}
                onClick={() => setPriceMode(f.key)}
                className={`ease-chrome rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  priceMode === f.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label="ตัวกรอง"
            className="ease-chrome flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:text-foreground"
          >
            <SlidersHorizontal className="size-4" />
          </button>
        </div>

        {/* Full catalog — grouped inset list. 24h always shown; 7d/30d join in
            from sm:/lg: up (CMC-style progressive density, same row markup
            everywhere — just more columns visible). */}
        <div className="mt-5">
          <GroupedSection label={`การ์ดทั้งหมด · ${rows.length.toLocaleString("th-TH")}`}>
            {rows.map((c, i) => {
              const price = priceMode === "psa10" ? Math.round((c.psa10Usd ?? 0) * 31.34) : c.priceThb
              return (
                <Link
                  key={c.code}
                  href={`/proto/ios/cards/${c.code}`}
                  className="ease-chrome block transition-colors active:bg-muted/60"
                >
                  <div className="flex min-h-[60px] items-center gap-3 px-4 py-2.5">
                    <span className="hidden w-5 shrink-0 text-center text-meta tabular-nums sm:block">{i + 1}</span>
                    <div className="hairline relative aspect-[63/88] w-9 shrink-0 overflow-hidden rounded-md bg-muted">
                      <Image src={c.img} alt={c.name} fill sizes="36px" className="object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body-sm font-medium">{c.name}</p>
                      <p className="truncate text-meta">
                        <span className="font-mono">{c.code}</span>
                        <span className="ml-1.5 uppercase">{c.rarity}</span>
                      </p>
                    </div>
                    <div className="hidden w-16 shrink-0 text-right sm:block">
                      <p className="text-eyebrow">7d</p>
                      <Delta value={c.d7} />
                    </div>
                    <div className="hidden w-16 shrink-0 text-right lg:block">
                      <p className="text-eyebrow">30d</p>
                      <Delta value={c.d30} />
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-price tabular-nums">{fmt(price)}</p>
                      <Delta value={c.d24} />
                    </div>
                  </div>
                </Link>
              )
            })}
          </GroupedSection>
        </div>
      </div>
    </div>
  )
}
