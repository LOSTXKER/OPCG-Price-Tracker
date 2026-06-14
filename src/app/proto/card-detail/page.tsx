"use client"

import { useState } from "react"
import Link from "next/link"
import {
  BadgeCheck, ChevronRight, Heart, Plus, Share2, Shield, Star,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Delta, Segmented, ScrubChart } from "../_components/kit"
import { VersionSwitch } from "../_components/chrome"
import { CARD, TIERS, COMPS, LISTINGS } from "../_components/mock"

type Edition = "JP" | "EN"
type Tab = "comps" | "listings" | "pop" | "meta"
const RANGES = ["1M", "3M", "1Y", "All"] as const

export default function ProtoCardDetail() {
  const [edition, setEdition] = useState<Edition>("JP")
  const [tierKey, setTierKey] = useState("psa10")
  const [range, setRange] = useState<(typeof RANGES)[number]>("3M")
  const [tab, setTab] = useState<Tab>("comps")
  const [saved, setSaved] = useState(false)

  const tiers = TIERS[edition]
  const tier = tiers.find((t) => t.key === tierKey) ?? tiers[tiers.length - 1]
  const hi = Math.max(...tier.series)
  const lo = Math.min(...tier.series)
  const avg = Math.round(tier.series.reduce((a, b) => a + b, 0) / tier.series.length)

  return (
    <div className="mx-auto max-w-[460px] pb-24 lg:max-w-5xl lg:pb-12">
      <VersionSwitch vision="/proto/card-detail" real="/proto/real/card-detail" active="vision" />
      {/* breadcrumb — public, crawlable path (no login wall, SEO) */}
      <nav className="flex items-center justify-between gap-2 px-4 pt-4 text-xs text-muted-foreground lg:px-8">
        <span className="flex min-w-0 items-center gap-1 truncate">
          <Link href="/proto" className="shrink-0 hover:text-foreground">หน้าแรก</Link>
          <ChevronRight className="size-3 shrink-0" />
          <Link href="/proto/browse" className="shrink-0 hover:text-foreground">ราคา</Link>
          <ChevronRight className="size-3 shrink-0" />
          <span className="truncate text-foreground">{CARD.code}</span>
        </span>
        <button className="flex size-8 shrink-0 items-center justify-center rounded-full surface-2 hairline">
          <Share2 className="size-4" />
        </button>
      </nav>

      <div className="lg:grid lg:grid-cols-[340px_1fr] lg:gap-10 lg:px-8 lg:pt-6">
        {/* LEFT — identity + image + CTA (sticky on desktop) */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <section className="glow-honey px-5 pb-2 pt-3 lg:px-0">
            <div className="mx-auto w-[58%] max-w-[230px] lg:w-full lg:max-w-none">
              <FoilCard />
            </div>
            <div className="mt-4 text-center lg:text-left">
              <div className="flex items-center justify-center gap-2 lg:justify-start">
                <span className="rounded-md px-1.5 py-0.5 text-[10px] font-bold" style={{ background: "var(--p-honey-soft)", color: "var(--primary)" }}>
                  {CARD.rarity}
                </span>
                <span className="text-xs text-muted-foreground">{CARD.sub}</span>
              </div>
              <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-foreground">{CARD.name}</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">{CARD.set} · {CARD.code}</p>
            </div>
            <div className="mt-4 flex justify-center lg:justify-start">
              <Segmented
                value={edition}
                onChange={setEdition}
                options={[{ value: "JP", label: "🇯🇵 JP" }, { value: "EN", label: "🇬🇧 EN" }]}
              />
            </div>
          </section>

          {/* desktop CTA (mobile uses sticky bottom bar) */}
          <div className="mt-5 hidden items-center gap-3 lg:flex">
            <button
              onClick={() => setSaved((s) => !s)}
              className="flex size-12 items-center justify-center rounded-xl surface-2 hairline"
              style={saved ? { color: "var(--primary)" } : undefined}
            >
              <Heart className={cn("size-5", saved && "fill-current")} />
            </button>
            <button className="ease-chrome flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-bold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
              <Plus className="size-4" /> เพิ่มเข้า Portfolio
            </button>
          </div>
        </div>

        {/* RIGHT — price + chart + tabs */}
        <div className="lg:min-w-0 lg:pt-1">
          {/* hero */}
          <section className="px-5 pt-5 text-center lg:px-0 lg:pt-0 lg:text-left">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {tier.label} · Market Price
            </p>
            <div key={tier.key + edition} className="rise mt-1 flex items-end justify-center gap-3 lg:justify-start">
              <span className="tnum text-[42px] font-extrabold leading-none text-foreground lg:text-[52px]">{tier.display}</span>
            </div>
            <div className="mt-2 flex items-center justify-center lg:justify-start">
              <Delta pct={tier.pct} size="lg" />
              <span className="ml-1.5 text-sm text-muted-foreground">30 วัน</span>
            </div>

            <div className="mt-4 grid grid-cols-3 rounded-2xl surface-1 hairline py-3">
              {[
                { l: "Last Sale", v: tier.display },
                { l: "Lowest Ask", v: `฿${(tier.price + 800).toLocaleString()}` },
                { l: "Sales 30d", v: "1,204" },
              ].map((s, i) => (
                <div key={s.l} className="px-2" style={i ? { borderLeft: "1px solid var(--p-hair)" } : undefined}>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.l}</p>
                  <p className="tnum mt-0.5 text-sm font-bold text-foreground">{s.v}</p>
                </div>
              ))}
            </div>
          </section>

          {/* grade chip rail */}
          <section className="mt-5">
            <div className="no-sb flex gap-2 overflow-x-auto px-5 pb-1 lg:px-0">
              {tiers.map((t) => {
                const active = t.key === tier.key
                return (
                  <button
                    key={t.key}
                    onClick={() => setTierKey(t.key)}
                    className={cn("ease-chrome flex shrink-0 flex-col items-start rounded-xl px-3.5 py-2 text-left", active ? "hairline" : "surface-1 hairline")}
                    style={active ? { background: "var(--p-honey-soft)", boxShadow: "inset 0 0 0 1px var(--primary)" } : undefined}
                  >
                    <span className={cn("flex items-center gap-1 text-xs font-bold", !active && "text-foreground")} style={active ? { color: "var(--primary)" } : undefined}>
                      {t.kind === "psa" && <Shield className="size-3" />}
                      {t.label}
                    </span>
                    <span className="tnum mt-0.5 text-[11px] text-muted-foreground">{t.display}</span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* chart */}
          <section className="mt-3 px-5 lg:px-0">
            <div className="rounded-2xl surface-1 hairline p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">{tier.label} · {CARD.code}</span>
                <Segmented size="sm" value={range} onChange={setRange} options={RANGES.map((r) => ({ value: r, label: r }))} />
              </div>
              <ScrubChart data={tier.series} up={tier.pct >= 0} />
              <div className="mt-2 grid grid-cols-3 gap-2 border-t pt-3 text-center" style={{ borderColor: "var(--p-hair)" }}>
                {[
                  { l: "High", v: `฿${hi.toLocaleString()}` },
                  { l: "Avg", v: `฿${avg.toLocaleString()}` },
                  { l: "Low", v: `฿${lo.toLocaleString()}` },
                ].map((s) => (
                  <div key={s.l}>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.l}</p>
                    <p className="tnum text-sm font-semibold text-foreground">{s.v}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* tabs */}
          <section className="mt-5 px-5 lg:px-0">
            <div className="no-sb flex gap-1 overflow-x-auto">
              {([["comps", "Sold Comps"], ["listings", "Listings"], ["pop", "Population"], ["meta", "Meta"]] as [Tab, string][]).map(([k, label]) => (
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
              {tab === "meta" && <Meta />}
            </div>
          </section>
        </div>
      </div>

      {/* mobile sticky CTA */}
      <div className="frost sticky bottom-0 z-20 mt-6 flex items-center gap-3 px-5 py-3 lg:hidden" style={{ boxShadow: "inset 0 1px 0 0 var(--p-hair)" }}>
        <button onClick={() => setSaved((s) => !s)} className="flex size-12 items-center justify-center rounded-xl surface-2 hairline" style={saved ? { color: "var(--primary)" } : undefined}>
          <Heart className={cn("size-5", saved && "fill-current")} />
        </button>
        <button className="ease-chrome flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-bold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
          <Plus className="size-4" /> เพิ่มเข้า Portfolio
        </button>
      </div>
    </div>
  )
}

/* ── foil card placeholder (art is the hero) ────────────────────────────── */
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
    <div className="rounded-2xl surface-1 hairline p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Tier ในเมตาปัจจุบัน</p>
          <p className="mt-0.5 text-lg font-extrabold text-foreground">Tier <span style={{ color: "var(--primary)" }}>S</span> · Leader</p>
        </div>
        <div className="text-right">
          <p className="tnum text-2xl font-extrabold text-foreground">24.3%</p>
          <p className="text-[11px] text-muted-foreground">meta share</p>
        </div>
      </div>
      <p className="mt-3 border-t pt-3 text-xs text-muted-foreground" style={{ borderColor: "var(--p-hair)" }}>จาก 1,840 เด็คใน 32 ทัวร์ · อัปเดต 6 ชม.ที่แล้ว</p>
    </div>
  )
}
