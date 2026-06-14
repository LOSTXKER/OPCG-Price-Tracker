"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ChevronDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Delta, ScrubChart, Spark, baht } from "../_components/kit"
import { PF, PF_SERIES, MOVERS, HOLDINGS } from "../_components/mock"

const RANGES = ["1D", "1W", "1M", "3M", "1Y", "ALL"] as const

export default function ProtoPortfolio() {
  const [range, setRange] = useState<(typeof RANGES)[number]>("1M")
  const [scrub, setScrub] = useState<number | null>(null)

  const data = PF_SERIES[range]
  const [amt, pct] = PF.delta[range]
  const start = data[0]
  const scrubbing = scrub !== null
  const shownVal = scrubbing ? data[scrub] : PF.total
  const shownAmt = scrubbing ? data[scrub] - start : amt
  const shownPct = scrubbing ? ((data[scrub] - start) / start) * 100 : pct

  return (
    <div className="pb-24">
      {/* top bar */}
      <header className="frost sticky top-0 z-20 flex items-center justify-between px-4 py-3">
        <Link href="/proto" className="flex size-9 items-center justify-center rounded-full surface-2 hairline">
          <ArrowLeft className="size-4" />
        </Link>
        <button className="surface-2 hairline flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold">
          ทุกเกม <ChevronDown className="size-3.5" />
        </button>
        <button className="flex size-9 items-center justify-center rounded-full surface-2 hairline" style={{ color: "var(--primary)" }}>
          <Plus className="size-4" />
        </button>
      </header>

      {/* HERO */}
      <section className="glow-honey px-5 pb-2 pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          มูลค่าคอลเลกชัน · {scrubbing ? "ในช่วง" : range}
        </p>
        <div key={scrubbing ? "s" + scrub : "t" + range} className={cn(!scrubbing && "rise")}>
          <p className="tnum mt-1 text-[44px] font-extrabold leading-none text-foreground">{baht(shownVal)}</p>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Delta pct={shownPct} amount={baht(Math.abs(shownAmt))} size="lg" />
          <span className="text-sm text-muted-foreground">{scrubbing ? "จากต้นช่วง" : range}</span>
        </div>
      </section>

      {/* chart + range */}
      <section className="mt-2">
        <ScrubChart data={data} up={pct >= 0} height={180} onScrub={setScrub} onScrubEnd={() => setScrub(null)} />
        <div className="mt-2 flex justify-between px-5">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "ease-chrome rounded-lg px-2.5 py-1.5 text-xs font-bold",
                r === range ? "text-[var(--primary-foreground)]" : "text-muted-foreground",
              )}
              style={r === range ? { background: "var(--primary)" } : undefined}
            >
              {r}
            </button>
          ))}
        </div>
      </section>

      {/* KPI quartet */}
      <section className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-2xl surface-1 hairline">
        {[
          { l: "Market Value", v: baht(PF.total) },
          { l: "Cost Basis", v: baht(PF.costBasis) },
          { l: "All-time P/L", v: "+" + baht(PF.pl), up: true },
          { l: "ROI", v: "+" + PF.roi + "%", up: true },
        ].map((k) => (
          <div key={k.l} className="surface-1 p-4" style={{ boxShadow: "inset 0 0 0 0.5px var(--p-hair)" }}>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{k.l}</p>
            <p className="tnum mt-1 text-lg font-bold" style={{ color: k.up ? "var(--price-up)" : "var(--foreground)" }}>
              {k.v}
            </p>
          </div>
        ))}
      </section>
      <p className="mt-2 px-1 text-[11px] text-muted-foreground">
        P/L แยก inflow/outflow แล้ว — ซื้อการ์ดเพิ่มไม่นับเป็นกำไร
      </p>

      {/* top movers */}
      <section className="mt-6">
        <h2 className="mb-2 px-1 text-sm font-bold text-foreground">มูฟเวอร์วันนี้</h2>
        <div className="no-sb flex gap-3 overflow-x-auto pb-1">
          {MOVERS.map((m) => (
            <div key={m.code} className="w-40 shrink-0 rounded-2xl surface-1 hairline p-3">
              <p className="truncate text-xs font-semibold text-foreground">{m.name}</p>
              <p className="text-[10px] text-muted-foreground">{m.grade}</p>
              <div className="my-2">
                <Spark data={m.series} up={m.pct >= 0} w={140} h={32} />
              </div>
              <div className="flex items-center justify-between">
                <span className="tnum text-sm font-bold text-foreground">{m.val}</span>
                <Delta pct={m.pct} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* holdings */}
      <section className="mt-6 px-1">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">รายการถือครอง</h2>
          <span className="tnum text-xs text-muted-foreground">{HOLDINGS.length} ใบ</span>
        </div>
        <div className="overflow-hidden rounded-2xl surface-1 hairline">
          {HOLDINGS.map((h, i) => (
            <div key={h.code} className="flex items-center gap-3 px-4 py-3" style={i ? { boxShadow: "inset 0 1px 0 0 var(--p-hair)" } : undefined}>
              <div className="flex h-11 w-8 shrink-0 items-center justify-center rounded-md text-[9px] font-bold text-white/80" style={{ background: "linear-gradient(150deg,#2c1f0e,#7a5a28)" }}>
                {h.qty}×
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{h.name}</p>
                <p className="text-[11px] text-muted-foreground">{h.code} · {h.grade}</p>
              </div>
              <div className="text-right">
                <p className="tnum text-sm font-bold text-foreground">{baht(h.val)}</p>
                <Delta pct={h.pct} className="justify-end" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
