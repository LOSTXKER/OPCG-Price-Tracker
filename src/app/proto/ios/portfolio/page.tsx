"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowDown, ArrowUp, Eye, EyeOff, Lock } from "lucide-react"

import { LargeTitle } from "../_components/large-title"
import { GroupedSection } from "@/components/ui/grouped-list"
import {
  PORTFOLIOS,
  PORTFOLIO_STATS,
  TOTAL_VALUE,
  TOTAL_COST,
  TOTAL_PNL_PCT,
  ALLOCATION,
  fmt,
  fmtPct,
} from "../_data"

function Delta({ value, className = "" }: { value: number; className?: string }) {
  const up = value >= 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-price tabular-nums ${
        up ? "text-price-up" : "text-price-down"
      } ${className}`}
    >
      {up ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
      {fmtPct(value)}
    </span>
  )
}

export default function IosPortfolioHubScreen() {
  const [hidden, setHidden] = useState(false)

  const totalCardCount = PORTFOLIOS.reduce((s, p) => s + (PORTFOLIO_STATS.get(p.id)?.count ?? 0), 0)
  const totalPnl = TOTAL_VALUE - TOTAL_COST

  return (
    <div className="pb-6">
      <LargeTitle
        title="พอร์ตโฟลิโอ"
        subtitle={`${PORTFOLIOS.length} พอร์ต · ${totalCardCount} การ์ด`}
        trailing={
          <button
            type="button"
            aria-label={hidden ? "แสดงยอด" : "ซ่อนยอด"}
            onClick={() => setHidden((h) => !h)}
            className="ease-chrome flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:text-foreground"
          >
            {hidden ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
          </button>
        }
      />

      <div className="md:mx-auto md:max-w-6xl">
        {/* Dashboard hero */}
        <div className="px-4 sm:px-6">
          <div className="hairline rounded-2xl bg-card p-4">
            <p className="text-eyebrow mb-1">มูลค่ารวมทุกพอร์ต</p>
            <p className="text-display tabular-nums">
              {hidden ? "••••••" : fmt(TOTAL_VALUE)}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <Delta value={TOTAL_PNL_PCT} />
              <span className="text-meta tabular-nums">
                {hidden ? "••••••" : `${totalPnl >= 0 ? "+" : ""}${fmt(totalPnl)}`}
              </span>
              <span className="text-meta">·</span>
              <span className="text-meta">
                {PORTFOLIOS.length} พอร์ต · {totalCardCount} การ์ด
              </span>
            </div>
          </div>
        </div>

        {/* Portfolio picker grid */}
        <div className="mt-5">
          <p className="mb-2 px-4 text-eyebrow sm:px-6">พอร์ตของฉัน</p>
          <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
            {PORTFOLIOS.map((p) => {
              const stats = PORTFOLIO_STATS.get(p.id)!
              const thumbs = p.holdings.slice(0, 4)

              return (
                <Link
                  key={p.id}
                  href={`/proto/ios/portfolio/${p.id}`}
                  className="ease-chrome block transition-transform active:scale-[0.98]"
                >
                  <div className="hairline h-full rounded-2xl bg-card p-4">
                    {/* Name + lock */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-body-sm font-semibold">{p.name}</p>
                      {!p.isPublic && (
                        <Lock className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      )}
                    </div>

                    {/* Value + P/L */}
                    <p className="mt-2 text-price tabular-nums font-semibold">
                      {hidden ? "••••" : fmt(stats.value)}
                    </p>
                    <div className="mt-0.5">
                      <Delta value={stats.pnlPct} />
                    </div>

                    {/* Holding thumbnails + card count */}
                    {thumbs.length > 0 && (
                      <div className="mt-3 flex items-end gap-1.5">
                        {thumbs.map((h, i) => (
                          <div
                            key={i}
                            className="hairline relative aspect-[63/88] w-8 shrink-0 overflow-hidden rounded-md bg-muted"
                          >
                            <Image
                              src={h.card.img}
                              alt={h.card.name}
                              fill
                              sizes="32px"
                              className="object-contain"
                            />
                          </div>
                        ))}
                        <span className="text-meta ml-auto">{stats.count} การ์ด</span>
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Allocation preview — cross-portfolio top holdings */}
        <div className="mt-5">
          <GroupedSection label="สัดส่วนการถือครอง (ทุกพอร์ต)">
            {ALLOCATION.slice(0, 5).map((row, i) => {
              const isOther = row.code === ""
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  {/* Thumbnail — skip for "อื่นๆ" bucket */}
                  {isOther ? (
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
                      <span className="text-micro text-muted-foreground">···</span>
                    </div>
                  ) : (
                    <div className="hairline relative aspect-[63/88] w-5 shrink-0 overflow-hidden rounded-sm bg-muted">
                      <Image src={row.img} alt={row.name} fill sizes="20px" className="object-contain" />
                    </div>
                  )}

                  {/* Name + bar */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-sm font-medium">{row.name}</p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary/70"
                        style={{ width: `${Math.max(row.percent, 2)}%` }}
                      />
                    </div>
                  </div>

                  {/* Percent + value */}
                  <div className="shrink-0 text-right">
                    <p className="text-body-sm tabular-nums font-semibold">
                      {row.percent.toFixed(1)}%
                    </p>
                    <p className="text-meta tabular-nums">
                      {hidden ? "••••" : fmt(row.value)}
                    </p>
                  </div>
                </div>
              )
            })}
          </GroupedSection>
        </div>
      </div>
    </div>
  )
}
