"use client"

import Link from "next/link"
import { ChevronRight, Search } from "lucide-react"
import { Delta, Spark, baht } from "./_components/kit"
import { AdSlot } from "./_components/ads"
import { VersionSwitch } from "./_components/chrome"
import { CARDS, MOVERS, PF } from "./_components/mock"

// CARDS sorted by absolute % move — "ราคาขยับเยอะ" list
const MOST_MOVED = [...CARDS].sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct))

export default function ProtoHome() {
  const [pfAmount, pfPct] = PF.delta["1M"]

  return (
    <div className="mx-auto max-w-[460px] pb-12 lg:max-w-5xl">
      <VersionSwitch vision="/proto" real="/proto/real" active="vision" />
      {/* hero search — teleport bar (honey glow behind) */}
      <div className="glow-honey px-4 pt-3 lg:px-8">
        <Link
          href="/proto/browse"
          className="surface-2 hairline ease-chrome flex items-center gap-2.5 rounded-full px-4 py-3 text-sm text-muted-foreground"
        >
          <Search className="size-4 shrink-0" />
          ค้นการ์ด · เซ็ต · เด็ค...
        </Link>
      </div>

      {/* main + aside split on desktop */}
      <div className="mt-5 lg:grid lg:grid-cols-[1fr_320px] lg:gap-8 lg:px-8">
        <div className="min-w-0">
          {/* portfolio mini card */}
          <section className="px-4 lg:px-0">
            <Link
              href="/proto/portfolio"
              className="surface-1 hairline ease-chrome flex items-center gap-4 rounded-2xl px-4 py-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  พอร์ตของคุณ
                </p>
                <p className="tnum mt-1 text-2xl font-extrabold leading-none text-foreground">
                  {baht(PF.total)}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <Delta pct={pfPct} amount={`฿${pfAmount.toLocaleString()}`} />
                  <span className="text-xs text-muted-foreground">30 วัน</span>
                </div>
              </div>
              <div className="w-20 shrink-0">
                <Spark data={MOVERS[0].series} up={pfPct >= 0} w={80} h={40} />
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          </section>

          {/* มาแรงวันนี้ — horizontal rail */}
          <section className="mt-6">
            <div className="flex items-center justify-between px-4 lg:px-0">
              <h2 className="text-base font-extrabold tracking-tight text-foreground">มาแรงวันนี้</h2>
              <Link
                href="/proto/browse"
                className="flex items-center gap-0.5 text-xs font-semibold text-muted-foreground"
              >
                ดูทั้งหมด <ChevronRight className="size-3.5" />
              </Link>
            </div>
            <div className="no-sb mt-3 flex gap-3 overflow-x-auto px-4 pb-1 lg:px-0">
              {CARDS.slice(0, 6).map((card) => (
                <Link
                  key={card.code}
                  href="/proto/card-detail"
                  className="ease-chrome w-32 shrink-0"
                >
                  <div
                    className="aspect-[63/88] overflow-hidden rounded-lg hairline"
                    style={{ background: card.grad }}
                  />
                  <p className="mt-2 truncate text-sm font-semibold text-foreground">{card.name}</p>
                  <p className="text-[11px] text-muted-foreground">{card.code}</p>
                  <div className="mt-1 flex items-center justify-between gap-1">
                    <span className="tnum text-sm font-bold text-foreground">{baht(card.price)}</span>
                    <Delta pct={card.pct} />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* single in-feed ad — Home is a discovery surface where ads are allowed (VISION §4.6) */}
          <section className="mt-6 px-4 lg:px-0">
            <AdSlot format="feed" />
          </section>

          {/* ราคาขยับเยอะ — most-moved list */}
          <section className="mt-6">
            <h2 className="px-4 text-base font-extrabold tracking-tight text-foreground lg:px-0">
              ราคาขยับเยอะ
            </h2>
            <div className="mt-3 px-4 lg:px-0">
              <div className="overflow-hidden rounded-2xl surface-1 hairline">
                {MOST_MOVED.slice(0, 4).map((card, i) => (
                  <Link
                    key={card.code}
                    href="/proto/card-detail"
                    className="ease-chrome flex items-center gap-3 px-3 py-3"
                    style={i ? { boxShadow: "inset 0 1px 0 0 var(--p-hair)" } : undefined}
                  >
                    <div
                      className="aspect-[63/88] w-10 shrink-0 overflow-hidden rounded-lg hairline"
                      style={{ background: card.grad }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{card.name}</p>
                      <p className="text-[11px] text-muted-foreground">{card.code}</p>
                    </div>
                    <div className="w-16 shrink-0">
                      <Spark data={card.series} up={card.pct >= 0} w={64} h={24} />
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="tnum text-sm font-bold text-foreground">{baht(card.price)}</p>
                      <Delta pct={card.pct} className="justify-end" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* desktop aside — calm sidebar of top movers, same surfaces */}
        <aside className="mt-8 hidden lg:mt-0 lg:block">
          <h2 className="text-base font-extrabold tracking-tight text-foreground">มูฟเวอร์เด่น</h2>
          <div className="mt-3 overflow-hidden rounded-2xl surface-1 hairline">
            {MOVERS.map((m, i) => (
              <Link
                key={m.code}
                href="/proto/card-detail"
                className="ease-chrome flex items-center gap-3 px-4 py-3"
                style={i ? { boxShadow: "inset 0 1px 0 0 var(--p-hair)" } : undefined}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{m.name}</p>
                  <p className="text-[11px] text-muted-foreground">{m.grade}</p>
                </div>
                <div className="text-right">
                  <p className="tnum text-sm font-bold text-foreground">{m.val}</p>
                  <Delta pct={m.pct} className="justify-end" />
                </div>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
