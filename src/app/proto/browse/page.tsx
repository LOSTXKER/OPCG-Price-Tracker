"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Delta, Spark, baht } from "../_components/kit"
import { AdSlot } from "../_components/ads"
import { CARDS } from "../_components/mock"

const CHIPS = ["ทั้งหมด", "SEC", "SR", "OP01", "OP02", "PSA 10"] as const

export default function ProtoBrowse() {
  const [chip, setChip] = useState<(typeof CHIPS)[number]>("ทั้งหมด")

  return (
    <div className="mx-auto max-w-[460px] pb-12 lg:max-w-5xl">
      <div className="px-4 pt-5 lg:px-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">ราคาการ์ด</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">ราคากลางรายวัน · Yuyutei · SNKRDUNK</p>
      </div>

      {/* filter chip rail */}
      <section className="px-4 pt-4 lg:px-8">
        <div className="no-sb flex gap-2 overflow-x-auto pb-1">
          {CHIPS.map((c) => {
            const active = c === chip
            return (
              <button
                key={c}
                type="button"
                onClick={() => setChip(c)}
                className={cn(
                  "ease-chrome flex h-9 shrink-0 items-center rounded-full px-4 text-sm font-semibold",
                  active ? "text-[var(--primary-foreground)]" : "surface-1 hairline text-muted-foreground hover:text-foreground",
                )}
                style={active ? { background: "var(--primary)" } : undefined}
              >
                {c}
              </button>
            )
          })}
        </div>
      </section>

      {/* price list */}
      <section className="px-4 pt-3 lg:px-8">
        {/* mobile: single stacked list in one container · desktop: 2-col grid of row cards */}
        <div className="surface-1 hairline overflow-hidden rounded-2xl lg:grid lg:grid-cols-2 lg:gap-3 lg:overflow-visible lg:rounded-none lg:border-0 lg:bg-transparent lg:shadow-none">
          {CARDS.map((card, i) => (
            <PriceRow key={card.code} card={card} first={i === 0} />
          ))}
        </div>
      </section>

      {/* in-feed ad after ~4th row */}
      <section className="px-4 lg:px-8">
        <AdSlot format="feed" className="my-2" />
      </section>
    </div>
  )
}

function PriceRow({ card, first }: { card: (typeof CARDS)[number]; first: boolean }) {
  return (
    <Link
      href="/proto/card-detail"
      className="ease-chrome flex min-h-[64px] items-center gap-3 px-3 py-2.5 lg:surface-1 lg:hairline lg:rounded-xl"
      style={!first ? { boxShadow: "inset 0 1px 0 0 var(--p-hair)" } : undefined}
    >
      {/* foil thumb */}
      <div className="aspect-[63/88] w-10 shrink-0 overflow-hidden rounded-lg hairline" style={{ background: card.grad }} />

      {/* identity */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-foreground">{card.name}</p>
        <p className="truncate text-xs text-muted-foreground">{card.code} · {card.set}</p>
      </div>

      {/* spark */}
      <div className="hidden w-16 shrink-0 sm:block">
        <Spark data={card.series} up={card.pct >= 0} />
      </div>

      {/* price + delta */}
      <div className="shrink-0 text-right">
        <p className="tnum text-sm font-bold text-foreground">{baht(card.price)}</p>
        <Delta pct={card.pct} className="justify-end" />
      </div>
    </Link>
  )
}
