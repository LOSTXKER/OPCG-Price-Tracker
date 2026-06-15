"use client"

import { useState } from "react"
import Link from "next/link"
import {
  BadgeCheck, Bell, ChevronRight, Plus, Scale, Share2, Shield, Star,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { baht, Delta, Segmented, ScrubChart } from "../_components/kit"
import { CARD, TIERS, COMPS, LISTINGS } from "../_components/mock"

type Edition = "JP" | "EN"
type Tab = "comps" | "listings" | "pop"
const RANGES = ["1M", "3M", "1Y", "All"] as const

const ICON_BTN =
  "ease-chrome flex size-9 items-center justify-center rounded-xl border border-border surface-2 text-muted-foreground hover:border-primary/40 hover:text-primary"

export default function ProtoCardTradeB() {
  const [edition, setEdition] = useState<Edition>("JP")
  const [tierKey, setTierKey] = useState("psa10")
  const [range, setRange] = useState<(typeof RANGES)[number]>("3M")
  const [tab, setTab] = useState<Tab>("comps")

  const tiers = TIERS[edition]
  const tier = tiers.find((t) => t.key === tierKey) ?? tiers[tiers.length - 1]
  const hi = Math.max(...tier.series)
  const lo = Math.min(...tier.series)
  const avg = Math.round(tier.series.reduce((a, b) => a + b, 0) / tier.series.length)

  return (
    <div className="relative mx-auto max-w-[460px] pb-24 lg:max-w-5xl lg:pb-12">
      {/* warm ambient — honey glow bleeds down from the navbar (VISION §1) */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[360px] w-screen -translate-x-1/2 -translate-y-10 md:-translate-y-12"
        style={{ background: "radial-gradient(120% 80% at 50% 0%, var(--p-honey-soft), transparent 65%)" }}
      />
      {/* breadcrumb */}
      <nav className="flex items-center gap-1 px-4 pt-4 text-xs text-muted-foreground lg:px-8">
        <Link href="/proto" className="shrink-0 hover:text-foreground">หน้าแรก</Link>
        <ChevronRight className="size-3 shrink-0" />
        <Link href="/proto/browse" className="shrink-0 hover:text-foreground">ราคา</Link>
        <ChevronRight className="size-3 shrink-0" />
        <span className="truncate text-foreground">{CARD.code}</span>
      </nav>

      {/* HEADER — name + price are ONE zone (top-left). Actions = quiet icons. */}
      <header className="px-5 pt-4 lg:px-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="rounded-md px-1.5 py-0.5 text-[10px] font-bold" style={{ background: "var(--p-honey-soft)", color: "var(--primary)" }}>{CARD.rarity}</span>
              <span className="text-xs text-muted-foreground">{CARD.sub}</span>
            </div>
            <h1 className="mt-1 flex items-center gap-2 text-xl font-bold tracking-tight text-foreground lg:text-2xl">
              {CARD.name}
              <Star className="size-4" style={{ color: "var(--primary)" }} />
            </h1>
            {/* BIG price right under the name — the single top focal point */}
            <div key={tier.key + edition} className="rise mt-2 flex items-end gap-3">
              <span className="tnum text-4xl font-extrabold leading-none text-foreground lg:text-5xl">{tier.display}</span>
              <span className="pb-1"><Delta pct={tier.pct} size="lg" /></span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {tier.label} · {edition} · {CARD.set} {CARD.code} · ขายล่าสุด <span className="tnum text-foreground/70">{baht(Math.round(tier.price * 0.96))}</span>
            </p>
          </div>

          {/* quiet utility icons */}
          <div className="flex shrink-0 items-center gap-1.5">
            <button title="เพิ่มพอร์ต" className={ICON_BTN}><Plus className="size-4" /></button>
            <button title="แชร์" className={ICON_BTN}><Share2 className="size-4" /></button>
            <button title="แจ้งเตือน" className={ICON_BTN}><Bell className="size-4" /></button>
            <button title="เปรียบเทียบ" className={ICON_BTN}><Scale className="size-4" /></button>
          </div>
        </div>

        {/* instrument — grade is picked often, so it sits right under the price
            (change grade → price above updates, no eye travel). JP/EN is rarely
            changed → kept small at the side. */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Segmented size="sm" value={edition} onChange={setEdition} options={[{ value: "JP", label: "🇯🇵 JP" }, { value: "EN", label: "🇬🇧 EN" }]} />
          <span className="mx-0.5 hidden h-5 w-px bg-[var(--p-hair)] sm:block" aria-hidden />
          <div className="no-sb flex min-w-0 flex-1 gap-2 overflow-x-auto py-0.5">
            {tiers.map((t) => {
              const active = t.key === tier.key
              return (
                <button
                  key={t.key}
                  onClick={() => setTierKey(t.key)}
                  className={cn(
                    "ease-chrome inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold",
                    active ? "bg-foreground/10 text-foreground ring-1 ring-foreground/15" : "surface-1 hairline text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.kind === "psa" && <Shield className="size-3" />}
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-4 border-t" style={{ borderColor: "var(--p-hair)" }} />
      </header>

      <div className="lg:grid lg:grid-cols-[300px_1fr] lg:gap-8 lg:px-8 lg:pt-6">
        {/* LEFT — card + trade controls (quiet sidebar) */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <section className="px-5 pb-2 pt-3 lg:px-0">
            <div className="mx-auto w-[52%] max-w-[200px] lg:w-full lg:max-w-[240px]">
              <FoilCard />
            </div>
          </section>

          {/* Buy / Sell — the one gold accent */}
          <section className="mt-4 px-5 lg:px-0">
            <div className="flex gap-2">
              <button title="เร็ว ๆ นี้" className="ease-chrome flex h-11 flex-1 items-center justify-center rounded-xl text-sm font-bold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>ซื้อเลย</button>
              <button title="เร็ว ๆ นี้" className="ease-chrome flex h-11 flex-1 items-center justify-center rounded-xl border border-border text-sm font-semibold text-foreground">ขาย</button>
            </div>
            <p className="mt-1.5 text-center text-[11px] text-muted-foreground">ซื้อขาย · เร็ว ๆ นี้</p>
          </section>

          <section className="mt-4 px-5 lg:px-0"><Meta /></section>
          <section className="mt-4 px-5 lg:px-0">
            <div className="flex aspect-[6/1] items-center justify-center rounded-2xl surface-1 hairline text-xs text-muted-foreground">โฆษณา</div>
          </section>
        </div>

        {/* RIGHT — the BIG chart is the focal point, then market tabs */}
        <div className="lg:min-w-0 lg:pt-1">
          <section className="px-5 pt-5 lg:px-0 lg:pt-0">
            <div className="rounded-2xl surface-1 hairline p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">{tier.label} · {CARD.code}</span>
                <Segmented size="sm" value={range} onChange={setRange} options={RANGES.map((r) => ({ value: r, label: r }))} />
              </div>
              <ScrubChart data={tier.series} up={tier.pct >= 0} height={400} />
              <p className="tnum mt-3 border-t pt-3 text-center text-xs text-muted-foreground" style={{ borderColor: "var(--p-hair)" }}>
                สูงสุด <span className="font-semibold text-foreground">฿{hi.toLocaleString()}</span>
                <span className="mx-2 opacity-40">·</span>
                เฉลี่ย <span className="font-semibold text-foreground">฿{avg.toLocaleString()}</span>
                <span className="mx-2 opacity-40">·</span>
                ต่ำสุด <span className="font-semibold text-foreground">฿{lo.toLocaleString()}</span>
              </p>
            </div>
          </section>

          <section className="mt-6 px-5 lg:px-0">
            <div className="no-sb flex gap-1 overflow-x-auto">
              {([["comps", "Sold Comps"], ["listings", "Listings"], ["pop", "Population"]] as [Tab, string][]).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={cn("ease-chrome shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold", tab === k ? "text-foreground surface-2 hairline" : "text-muted-foreground")}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="mt-3">
              {tab === "comps" && <Comps />}
              {tab === "listings" && <Listings />}
              {tab === "pop" && <Population />}
            </div>
          </section>
        </div>
      </div>

      {/* spec sheet — full-width section below */}
      <section className="mt-6 px-5 lg:px-8">
        <div className="panel p-5">
          <p className="mb-3 text-meta">รายละเอียดการ์ด</p>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-2.5 sm:grid-cols-3">
            {[
              ["ประเภท", "CHARACTER"], ["สี", "เขียว"], ["ค่าใช้จ่าย", "6"],
              ["พลัง", "7000"], ["คุณสมบัติ", "Strike"], ["ลักษณะ", "Fish-Man / Straw Hat"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3 border-b pb-2" style={{ borderColor: "var(--p-hair)" }}>
                <dt className="text-meta">{k}</dt>
                <dd className="text-sm font-semibold text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  )
}

/* ── foil card placeholder ──────────────────────────────────────────────── */
function FoilCard() {
  return (
    <div className="relative aspect-[63/88] overflow-hidden rounded-2xl hairline" style={{ background: "linear-gradient(150deg,#241808 0%,#3c2a12 35%,#6d4f23 62%,#e9b970 115%)" }}>
      <div className="absolute inset-0 opacity-40" style={{ background: "conic-gradient(from 210deg at 30% 20%, transparent, rgba(255,255,255,0.35), transparent 30%, rgba(233,185,112,0.4), transparent 60%)", mixBlendMode: "overlay" }} />
      <div className="absolute inset-x-0 bottom-0 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">{CARD.code}</p>
        <p className="text-sm font-extrabold leading-tight text-white">{CARD.name}</p>
      </div>
      <span className="absolute right-2 top-2 rounded-md bg-black/40 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">{CARD.rarity}</span>
    </div>
  )
}

/* ── tab panels ─────────────────────────────────────────────────────────── */
function SourceBadge({ s }: { s: string }) {
  const color = s === "eBay" ? "#7dd3fc" : s === "Yuyutei" ? "#fca5a5" : "var(--primary)"
  return <span className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: "var(--p-s2)", color }}>{s}</span>
}

function Comps() {
  return (
    <div className="overflow-hidden rounded-2xl surface-1 hairline">
      {COMPS.map((c, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3" style={i ? { boxShadow: "inset 0 1px 0 0 var(--p-hair)" } : undefined}>
          <SourceBadge s={c.source} />
          <span className="text-xs text-muted-foreground">{c.grade}</span>
          <span className="tnum ml-auto text-sm font-bold text-foreground">{c.price}</span>
          <span className="tnum w-12 text-right text-xs text-muted-foreground">{c.when}</span>
        </div>
      ))}
      <button className="flex w-full items-center justify-center gap-1 py-3 text-xs font-semibold text-muted-foreground" style={{ boxShadow: "inset 0 1px 0 0 var(--p-hair)" }}>
        ดูทั้งหมด 1,204 รายการ <ChevronRight className="size-3" />
      </button>
    </div>
  )
}

function Listings() {
  return (
    <div className="space-y-2">
      {LISTINGS.map((l, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl surface-1 hairline p-3">
          <div className="flex size-9 items-center justify-center rounded-lg surface-2 text-xs font-bold" style={{ color: "var(--primary)" }}>{l.seller[0].toUpperCase()}</div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 truncate text-sm font-semibold text-foreground">
              {l.seller}
              {l.verified && <BadgeCheck className="size-3.5" style={{ color: "var(--primary)" }} />}
            </p>
            <p className="tnum flex items-center gap-1 text-[11px] text-muted-foreground">
              <Star className="size-3 fill-current" style={{ color: "var(--primary)" }} /> {l.rating} · {l.sales} ขาย · {l.grade}
            </p>
          </div>
          <div className="text-right">
            <p className="tnum text-sm font-bold text-foreground">฿{l.price.toLocaleString()}</p>
            <p className="tnum text-[11px] text-muted-foreground">+฿{l.ship} ส่ง</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function Population() {
  const rows = [
    { g: "PSA 10", n: 412, pct: 18 },
    { g: "PSA 9", n: 1180, pct: 52 },
    { g: "PSA 8", n: 480, pct: 21 },
    { g: "≤ PSA 7", n: 205, pct: 9 },
  ]
  return (
    <div className="space-y-2 rounded-2xl surface-1 hairline p-4">
      <p className="text-xs text-muted-foreground">PSA population · 2,277 graded · <span style={{ color: "var(--primary)" }}>Gem rate 18%</span></p>
      {rows.map((r) => (
        <div key={r.g} className="flex items-center gap-3">
          <span className="w-16 text-xs font-semibold text-foreground">{r.g}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full surface-2">
            <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: "var(--primary)" }} />
          </div>
          <span className="tnum w-12 text-right text-xs text-muted-foreground">{r.n}</span>
        </div>
      ))}
    </div>
  )
}

function Meta() {
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Tier ในเมตา <span className="text-overlay uppercase text-muted-foreground/40">ตัวอย่าง</span></p>
          <p className="mt-0.5 text-lg font-extrabold text-foreground">Tier <span style={{ color: "var(--primary)" }}>A</span></p>
        </div>
        <div className="text-right">
          <p className="tnum text-2xl font-extrabold text-foreground">12.4%</p>
          <p className="text-[11px] text-muted-foreground">meta share</p>
        </div>
      </div>
    </div>
  )
}
