"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowDown, ArrowUp, Search, SlidersHorizontal } from "lucide-react"

import { LargeTitle } from "./_components/large-title"
import { GroupedSection } from "@/components/ui/grouped-list"
import { CATALOG, fmt, fmtPct } from "./_data"

/**
 * Home / Market — the showcase's tab-1 screen. Large Title + iOS search field
 * → segmented game filter → horizontal "movers" rail (the one place cards get
 * to be tactile/tappable-big) → the full catalog as a grouped-inset list
 * (density, iOS Settings grammar, ≥52px rows).
 */

type Filter = "all" | "opcg" | "pokemon"

function Delta({ value }: { value: number }) {
  const up = value >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-price tabular-nums ${up ? "text-price-up" : "text-price-down"}`}>
      {up ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
      {fmtPct(value)}
    </span>
  )
}

export default function IosHomeScreen() {
  const [filter, setFilter] = useState<Filter>("all")

  const rows = useMemo(
    () => (filter === "all" ? CATALOG : CATALOG.filter((c) => c.game === filter)),
    [filter],
  )

  const movers = useMemo(
    () => [...CATALOG].sort((a, b) => Math.abs(b.d24) - Math.abs(a.d24)).slice(0, 6),
    [],
  )

  return (
    <div className="pb-6 md:mx-auto md:max-w-6xl">
      <LargeTitle
        title="ตลาด"
        subtitle="ราคาการ์ด One Piece · Pokémon อัปเดตวันนี้"
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

      {/* iOS-style search field */}
      <div className="px-4 sm:px-6">
        <div className="flex h-10 items-center gap-2 rounded-xl bg-muted px-3 text-muted-foreground">
          <Search className="size-4 shrink-0" />
          <span className="text-body-sm">ค้นหาการ์ด, เซ็ต...</span>
        </div>
      </div>

      {/* Game filter — segmented, iOS pill style */}
      <div className="mt-4 flex items-center gap-2 px-4 sm:px-6">
        <div role="radiogroup" className="inline-flex items-center gap-0.5 rounded-full bg-muted p-0.5">
          {(
            [
              { key: "all" as const, label: "ทุกเกม" },
              { key: "opcg" as const, label: "One Piece" },
              { key: "pokemon" as const, label: "Pokémon" },
            ]
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
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label="ตัวกรอง"
          className="ease-chrome ml-auto flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:text-foreground"
        >
          <SlidersHorizontal className="size-4" />
        </button>
      </div>

      {/* Movers — horizontal rail on mobile/tablet, a real 6-col grid on
          desktop (VISION: การ์ด=พระเอก — let the tiles breathe on a wide screen
          instead of scrolling a mobile rail sideways). */}
      <div className="mt-5">
        <p className="mb-2 px-4 text-eyebrow sm:px-6">มูฟเวอร์วันนี้</p>
        <div className="no-sb flex gap-3 overflow-x-auto px-4 pb-1 sm:px-6 lg:grid lg:grid-cols-6 lg:gap-4 lg:overflow-visible">
          {movers.map((c) => (
            <Link
              key={c.code}
              href={`/proto/ios/cards/${c.code}`}
              className="ease-chrome w-28 shrink-0 transition-transform active:scale-[0.97] lg:w-full"
            >
              <div className="hairline relative aspect-[63/88] w-28 overflow-hidden rounded-xl bg-muted lg:w-full">
                <Image src={c.img} alt={c.name} fill sizes="(min-width: 1024px) 15vw, 112px" className="object-contain" />
              </div>
              <p className="mt-1.5 truncate text-body-sm font-medium">{c.name}</p>
              <div className="flex items-center justify-between">
                <span className="text-meta tabular-nums">{fmt(c.priceThb)}</span>
                <Delta value={c.d24} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Full catalog — grouped inset list */}
      <div className="mt-5">
        <GroupedSection label={`การ์ดทั้งหมด · ${rows.length}`}>
          {rows.map((c) => (
            <Link
              key={c.code}
              href={`/proto/ios/cards/${c.code}`}
              className="ease-chrome block transition-colors active:bg-muted/60"
            >
              <div className="flex min-h-[60px] items-center gap-3 px-4 py-2.5">
                <div className="hairline relative aspect-[63/88] w-9 shrink-0 overflow-hidden rounded-md bg-muted">
                  <Image src={c.img} alt={c.name} fill sizes="36px" className="object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-sm font-medium">{c.name}</p>
                  <p className="truncate text-meta font-mono">{c.code}</p>
                </div>
                {/* 7d column — desktop only, CMC-style extra column density */}
                <div className="hidden w-16 shrink-0 text-right lg:block">
                  <p className="text-eyebrow">7d</p>
                  <Delta value={c.d7} />
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-price tabular-nums">{fmt(c.priceThb)}</p>
                  <Delta value={c.d24} />
                </div>
              </div>
            </Link>
          ))}
        </GroupedSection>
      </div>
    </div>
  )
}
