"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { ArrowDown, ArrowUp, Bell, SlidersHorizontal, Star } from "lucide-react"

import { LargeTitle } from "../_components/large-title"
import { GroupedSection } from "../_components/grouped-list"
import { WATCHLIST, fmt, fmtPct } from "../_data"

type Filter = "all" | "pinned"

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

export default function WatchlistScreen() {
  const [filter, setFilter] = useState<Filter>("all")

  const rows = useMemo(
    () => (filter === "all" ? WATCHLIST : WATCHLIST.filter((w) => w.pinned)),
    [filter],
  )

  const pinnedCount = WATCHLIST.filter((w) => w.pinned).length

  return (
    <div className="pb-6 md:mx-auto md:max-w-5xl">
      <LargeTitle
        title="รายการโปรด"
        subtitle={`${WATCHLIST.length} การ์ดที่ติดตาม`}
        trailing={
          <button
            type="button"
            aria-label="ตัวกรองรายการโปรด"
            className="ease-chrome flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:text-foreground"
          >
            <SlidersHorizontal className="size-4" />
          </button>
        }
      />

      {/* Segmented filter — same pill-in-pill pattern as the market screen */}
      <div className="px-4 sm:px-6">
        <div role="radiogroup" className="inline-flex items-center gap-0.5 rounded-full bg-muted p-0.5">
          {(
            [
              { key: "all" as const, label: "ทั้งหมด" },
              { key: "pinned" as const, label: "ปักหมุด" },
            ] satisfies { key: Filter; label: string }[]
          ).map((f) => (
            <button
              key={f.key}
              type="button"
              role="radio"
              aria-checked={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={`ease-chrome rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === f.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              {f.label}
              {f.key === "pinned" && pinnedCount > 0 && (
                <span className="ml-1 tabular-nums opacity-60">{pinnedCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Card list */}
      <div className="mt-4">
        {rows.length === 0 ? (
          <p className="py-14 text-center text-meta">ยังไม่มีการ์ดที่ปักหมุด</p>
        ) : (
          <GroupedSection label={`${rows.length} รายการ`}>
            {/*
             * Real swipe-to-delete (UIKit / Reanimated gesture) would live on each row.
             * This prototype shows the resting-state only — no hover-fake needed.
             */}
            {rows.map(({ card, pinned, alert }) => (
              <div key={card.code} className="flex min-h-[60px] items-center gap-3 px-4 py-2.5">
                {/* Card art thumbnail — 63:88 aspect, same ratio as catalog rows */}
                <div className="hairline relative aspect-[63/88] w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                  <Image
                    src={card.img}
                    alt={card.name}
                    fill
                    sizes="40px"
                    className="object-contain"
                  />
                </div>

                {/* Name + code + quiet status icons */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="truncate text-body-sm font-medium">{card.name}</p>
                    {/* Pinned star — honey-gold, filled, micro-scale ≈ 12 px */}
                    {pinned && (
                      <Star
                        className="size-3 shrink-0 fill-primary text-primary"
                        aria-label="ปักหมุด"
                      />
                    )}
                    {/* Alert bell — honey-gold outline, same micro scale */}
                    {alert && (
                      <Bell
                        className="size-3 shrink-0 text-primary"
                        aria-label="แจ้งเตือนราคาเปิดอยู่"
                      />
                    )}
                  </div>
                  <p className="truncate font-mono text-meta">{card.code}</p>
                </div>

                {/* 7d column — desktop only, matches the market screen's density */}
                <div className="hidden w-16 shrink-0 text-right lg:block">
                  <p className="text-eyebrow">7d</p>
                  <Delta value={card.d7} />
                </div>

                {/* Price + 24 h delta — right-aligned, tabular mono */}
                <div className="shrink-0 text-right">
                  <p className="text-price tabular-nums">{fmt(card.priceThb)}</p>
                  <Delta value={card.d24} />
                </div>
              </div>
            ))}
          </GroupedSection>
        )}
      </div>
    </div>
  )
}
