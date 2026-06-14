"use client"

import { useState } from "react"
import Link from "next/link"
import { BadgeCheck, Lock, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { Segmented, baht } from "../_components/kit"
import { AdSlot, FeaturedBadge } from "../_components/ads"
import { MKT, type MktListing } from "../_components/mock"

type SubTab = "buy" | "sell" | "orders"

/* ── small reusable inline pieces ───────────────────────────────────────── */
function GradePill({ grade, className }: { grade: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-black/40 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm",
        className,
      )}
    >
      {grade}
    </span>
  )
}

function SellerChip({ l }: { l: MktListing }) {
  return (
    <span className="tnum flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground">
      <Star className="size-3 shrink-0 fill-current" style={{ color: "var(--primary)" }} />
      <span className="shrink-0">{l.rating.toFixed(1)}</span>
      <span className="truncate">{l.seller}</span>
      {l.verified && <BadgeCheck className="size-3 shrink-0" style={{ color: "var(--primary)" }} />}
    </span>
  )
}

export default function ProtoMarketplace() {
  const [tab, setTab] = useState<SubTab>("buy")

  const featured = MKT.find((m) => m.featured) ?? MKT[0]
  const rest = MKT.filter((m) => m !== featured)

  return (
    <div className="mx-auto max-w-[460px] pb-12 lg:max-w-6xl">
      <div className="flex items-end justify-between px-4 pt-5 lg:px-8">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">ตลาดซื้อขาย</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">live market · เก็บเงิน escrow ปลอดภัย</p>
        </div>
      </div>

      {/* sub-tabs (cosmetic) */}
      <div className="px-4 pt-4 lg:px-8">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "buy", label: "ซื้อ" },
            { value: "sell", label: "ขาย" },
            { value: "orders", label: "ออเดอร์" },
          ]}
        />
      </div>

      <div className="px-4 lg:px-8">
        {/* FEATURED promoted listing — wide hero */}
        <Link
          href="/proto/card-detail"
          className="glow-honey ease-chrome mt-4 flex gap-4 rounded-2xl surface-1 hairline p-4"
        >
          <div
            className="aspect-[63/88] w-24 shrink-0 overflow-hidden rounded-lg hairline lg:w-28"
            style={{ background: featured.grad }}
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <GradePill grade={featured.grade} />
              <span className="text-[10px] font-semibold text-muted-foreground">{featured.edition}</span>
              <FeaturedBadge />
            </div>
            <h2 className="mt-1.5 truncate text-lg font-extrabold tracking-tight text-foreground">
              {featured.name}
            </h2>
            <p className="text-xs text-muted-foreground">{featured.code}</p>
            <div className="mt-1.5">
              <SellerChip l={featured} />
            </div>
            <div className="mt-auto flex items-end justify-between gap-3 pt-3">
              <span className="tnum text-2xl font-extrabold leading-none text-foreground">
                {baht(featured.price)}
              </span>
              <span
                className="ease-chrome flex h-10 items-center justify-center rounded-xl px-5 text-sm font-bold"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
              >
                ซื้อเลย
              </span>
            </div>
          </div>
        </Link>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <Lock className="size-3" /> เก็บเงินใน escrow ปลอดภัย
        </p>

        {/* Ad — marketplace browse permits ads (VISION §4.6: discovery surface) */}
        <AdSlot format="banner" className="mt-4" />

        {/* GRID of remaining listings */}
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
          {rest.map((l) => (
            <Link
              key={l.code + l.seller}
              href="/proto/card-detail"
              className="ease-chrome flex flex-col rounded-2xl surface-1 hairline p-2.5"
            >
              <div
                className="relative aspect-[63/88] w-full overflow-hidden rounded-lg hairline"
                style={{ background: l.grad }}
              >
                <GradePill grade={l.grade} className="absolute left-1.5 top-1.5" />
                <span className="absolute right-1.5 top-1.5 rounded-md bg-black/40 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                  {l.edition}
                </span>
                {l.featured && (
                  <span className="absolute bottom-1.5 left-1.5">
                    <FeaturedBadge />
                  </span>
                )}
              </div>
              <p className="mt-2 truncate text-sm font-semibold text-foreground">{l.name}</p>
              <p className="tnum text-base font-extrabold text-foreground">{baht(l.price)}</p>
              <div className="mt-1">
                <SellerChip l={l} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
