"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowDown, ArrowUp, Eye, EyeOff, Lock } from "lucide-react"

import { LargeTitle } from "../_components/large-title"
import {
  PORTFOLIOS,
  PORTFOLIO_STATS,
  TOTAL_VALUE,
  TOTAL_PNL_PCT,
  fmt,
  fmtPct,
} from "../_data"

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

export default function IosPortfolioHubScreen() {
  const [hidden, setHidden] = useState(false)

  const totalCardCount = PORTFOLIOS.reduce((s, p) => {
    return s + (PORTFOLIO_STATS.get(p.id)?.count ?? 0)
  }, 0)

  return (
    <div className="pb-6">
      <LargeTitle
        title="พอร์ตโฟลิโอ"
        subtitle="เลือกพอร์ตเพื่อดูรายละเอียด"
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

      {/* Dashboard hero */}
      <div className="px-4 sm:px-6">
        <div className="hairline rounded-2xl bg-card p-4">
          <p className="text-eyebrow mb-1">มูลค่ารวมทุกพอร์ต</p>
          <p className="text-display tabular-nums">{hidden ? "••••••" : fmt(TOTAL_VALUE)}</p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <Delta value={TOTAL_PNL_PCT} />
            <span className="text-meta">·</span>
            <span className="text-meta">
              {PORTFOLIOS.length} พอร์ต · {totalCardCount} การ์ด
            </span>
          </div>
        </div>
      </div>

      {/* Portfolio grid */}
      <div className="mt-5">
        <p className="mb-2 px-4 text-eyebrow sm:px-6">พอร์ตของฉัน</p>
        <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-2 sm:px-6">
          {PORTFOLIOS.map((p) => {
            const stats = PORTFOLIO_STATS.get(p.id)!
            const thumbs = p.holdings.slice(0, 3)

            return (
              <Link
                key={p.id}
                href={`/proto/ios/portfolio/${p.id}`}
                className="ease-chrome block transition-transform active:scale-[0.98]"
              >
                <div className="hairline rounded-2xl bg-card p-4">
                  {/* Name + visibility badge */}
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-body-sm font-semibold">{p.name}</p>
                    {!p.isPublic && (
                      <Lock className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    )}
                  </div>

                  {/* Value */}
                  <p className="mt-2 text-price tabular-nums">{hidden ? "••••" : fmt(stats.value)}</p>
                  <div className="mt-0.5">
                    <Delta value={stats.pnlPct} />
                  </div>

                  {/* Holding thumbnails */}
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
    </div>
  )
}
