"use client"

import { useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  ChevronRight,
  ExternalLink,
  Eye,
  Heart,
  Info,
  Plus,
  Share2,
  Star,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Delta, Segmented, ScrubChart, baht } from "../../_components/kit"
import { VersionSwitch } from "../../_components/chrome"
import { AdSlot } from "../../_components/ads"
import { CARD, TIERS, SOURCES, SPECS, EFFECT, LISTINGS } from "../../_components/mock"

type Edition = "JP" | "EN"
type Mode = "raw" | "psa10"
type Tab = "specs" | "effect" | "listings"
const RANGES = ["7D", "1M", "3M", "1Y", "All"] as const

/* Source badge colours (mirrors the real SOURCE_META dot colours). */
const SOURCE_DOT: Record<string, string> = {
  Yuyutei: "#60a5fa",
  SNKRDUNK: "#34d399",
  "eBay (EN)": "#fbbf24",
}

export default function GroundedCardDetail() {
  const [edition, setEdition] = useState<Edition>("JP")
  const [mode, setMode] = useState<Mode>("raw")
  const [range, setRange] = useState<(typeof RANGES)[number]>("3M")
  const [tab, setTab] = useState<Tab>("specs")
  const [saved, setSaved] = useState(false)

  const tiers = TIERS[edition]
  // Headline tier follows the condition toggle: best Raw vs PSA 10.
  const rawTier = tiers.find((t) => t.key === "rawa") ?? tiers[0]
  const psaTier = tiers.find((t) => t.key === "psa10") ?? tiers[tiers.length - 1]
  const tier = mode === "raw" ? rawTier : psaTier
  const lastSold = tiers.find((t) => t.key === (mode === "raw" ? "rawb" : "psa9")) ?? tier

  const hi = Math.max(...tier.series)
  const lo = Math.min(...tier.series)
  const avg = Math.round(tier.series.reduce((a, b) => a + b, 0) / tier.series.length)

  return (
    <div className="mx-auto max-w-7xl pb-28 px-0 lg:pb-12">
      <VersionSwitch
        vision="/proto/card-detail"
        real="/proto/real/card-detail"
        active="real"
      />

      {/* breadcrumb — public, crawlable path */}
      <nav className="flex items-center gap-1.5 px-4 pt-4 text-xs text-muted-foreground lg:px-8">
        <Link href="/proto" className="shrink-0 hover:text-foreground">หน้าแรก</Link>
        <ChevronRight className="size-3 shrink-0" aria-hidden />
        <Link href="/proto/browse" className="shrink-0 hover:text-foreground">ราคา</Link>
        <ChevronRight className="size-3 shrink-0" aria-hidden />
        <span className="truncate text-foreground">{CARD.code}</span>
      </nav>

      <div className="grid gap-6 px-4 pt-5 lg:grid-cols-12 lg:gap-8 lg:px-8">
        {/* LEFT — card artwork only (sticky on desktop) */}
        <div className="lg:col-span-4">
          <div className="glow-honey lg:sticky lg:top-20 lg:self-start">
            <div className="mx-auto w-[58%] max-w-[230px] lg:w-full lg:max-w-none">
              <FoilCard />
            </div>
          </div>
        </div>

        {/* RIGHT — header + actions, price hub (+ source strip), then info tabs */}
        <div className="space-y-5 lg:col-span-8">
          {/* ── Header ── */}
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="tnum text-xs text-muted-foreground">{CARD.code}</span>
              <span
                className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                style={{ background: "var(--p-honey-soft)", color: "var(--primary)" }}
              >
                {CARD.rarity}
              </span>
              <span className="tnum inline-flex items-center gap-1 text-xs text-muted-foreground/60">
                <Eye className="size-3" aria-hidden /> 61,400 ดู
              </span>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="min-w-0 break-words text-2xl font-extrabold tracking-tight text-foreground lg:text-3xl">
                {CARD.name}
              </h1>
              <button
                type="button"
                onClick={() => setSaved((s) => !s)}
                aria-label="เพิ่มเข้า watchlist"
                className="ease-chrome flex size-9 shrink-0 items-center justify-center rounded-full surface-2 hairline"
                style={saved ? { color: "var(--primary)" } : undefined}
              >
                <Heart className={cn("size-4", saved && "fill-current")} />
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{CARD.set} · {CARD.sub}</p>
          </div>

          {/* ── Actions row ── */}
          <div className="flex w-full flex-wrap items-center gap-2">
            <button
              type="button"
              className="ease-chrome flex h-11 flex-1 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold sm:h-10 sm:flex-none"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              <Plus className="size-4" /> เพิ่มเข้า Portfolio
            </button>
            <button
              type="button"
              className="ease-chrome inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-medium text-muted-foreground surface-1 hairline hover:text-foreground"
            >
              <Bell className="size-3.5" /> ตั้งแจ้งเตือนราคา
            </button>
            <button
              type="button"
              aria-label="แชร์"
              className="ease-chrome flex size-10 shrink-0 items-center justify-center rounded-xl surface-1 hairline text-muted-foreground hover:text-foreground"
            >
              <Share2 className="size-4" />
            </button>
          </div>

          {/* ── PRICE HUB ── */}
          <div className="overflow-hidden rounded-2xl surface-1 hairline">
            {/* condition toggle (Raw / PSA 10) + additive JP/EN edition */}
            <div className="flex flex-wrap items-center gap-3 px-5 pt-4">
              <span className="text-xs font-medium text-muted-foreground">สภาพ</span>
              <Segmented
                size="sm"
                value={mode}
                onChange={setMode}
                options={[
                  { value: "raw", label: "Raw" },
                  { value: "psa10", label: "PSA 10" },
                ]}
              />
              <div className="ml-auto">
                <Segmented
                  size="sm"
                  value={edition}
                  onChange={setEdition}
                  options={[
                    { value: "JP", label: "🇯🇵 JP" },
                    { value: "EN", label: "🇬🇧 EN" },
                  ]}
                />
              </div>
            </div>

            {/* two-up: Market Price + Last Sold */}
            <div className="grid grid-cols-1 px-5 py-4 sm:grid-cols-2 sm:gap-6">
              <div className="pb-4 sm:pb-0">
                <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  ราคาตลาด (Market Price)
                  <Info className="size-3 text-muted-foreground/40" aria-hidden />
                </p>
                <div
                  key={tier.key + edition + mode}
                  className="rise mt-1 flex items-end gap-2"
                >
                  <span className="tnum text-2xl font-extrabold leading-none text-foreground sm:text-3xl">
                    {tier.display}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <Delta pct={tier.pct} />
                  <a
                    href="#"
                    className="inline-flex items-center gap-0.5 font-medium text-foreground/80 underline decoration-dotted decoration-muted-foreground/30 underline-offset-4 hover:text-foreground"
                  >
                    {mode === "raw" ? "Yuyu-tei" : "SNKRDUNK"}
                    <ExternalLink className="size-3" aria-hidden />
                  </a>
                </div>
              </div>

              <div
                className="pt-4 sm:pt-0 sm:pl-6"
                style={{ boxShadow: "inset 0 1px 0 0 var(--p-hair)" }}
              >
                <div className="sm:hidden" />
                <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  ขายล่าสุด (Last Sold)
                  <Info className="size-3 text-muted-foreground/40" aria-hidden />
                </p>
                <p className="tnum mt-1 text-xl font-semibold text-foreground/85">
                  {lastSold.display}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground/60">
                  SNKRDUNK · ราคาขายอ้างอิง
                </p>
              </div>
            </div>

            <div style={{ boxShadow: "inset 0 1px 0 0 var(--p-hair)" }} />

            {/* price-history chart + timeframe */}
            <div className="px-5 py-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  {mode === "raw" ? "Raw A" : "PSA 10"} · {CARD.code}
                </span>
                <Segmented
                  size="sm"
                  value={range}
                  onChange={setRange}
                  options={RANGES.map((r) => ({ value: r, label: r }))}
                />
              </div>
              <ScrubChart data={tier.series} up={tier.pct >= 0} />
              <div
                className="mt-3 grid grid-cols-3 gap-2 pt-3 text-center"
                style={{ boxShadow: "inset 0 1px 0 0 var(--p-hair)" }}
              >
                {[
                  { l: "สูงสุด", v: baht(hi) },
                  { l: "เฉลี่ย", v: baht(avg) },
                  { l: "ต่ำสุด", v: baht(lo) },
                ].map((s) => (
                  <div key={s.l}>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.l}</p>
                    <p className="tnum text-sm font-semibold text-foreground">{s.v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── SOURCES STRIP (multi-source ask / sold / updated) ── */}
            <SourcesStrip />
          </div>

          {/* in-feed ad (after the price block) */}
          <AdSlot format="banner" className="w-full" />

          {/* ── INFO TABS ── */}
          <div>
            <Segmented
              value={tab}
              onChange={setTab}
              options={[
                { value: "specs", label: "สเปก" },
                { value: "effect", label: "เอฟเฟกต์" },
                { value: "listings", label: "ประกาศขาย" },
              ]}
            />
            <div className="mt-3">
              {tab === "specs" && <SpecsPanel />}
              {tab === "effect" && <EffectPanel />}
              {tab === "listings" && <ListingsPanel />}
            </div>
          </div>
        </div>
      </div>

      {/* ── mobile sticky CTA (price + add to portfolio) ── */}
      <div
        className="frost fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 px-5 py-3 lg:hidden"
        style={{ boxShadow: "inset 0 1px 0 0 var(--p-hair)" }}
      >
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{tier.label}</p>
          <p className="tnum text-base font-extrabold text-foreground">{tier.display}</p>
        </div>
        <button
          type="button"
          onClick={() => setSaved((s) => !s)}
          aria-label="watchlist"
          className="flex size-11 shrink-0 items-center justify-center rounded-xl surface-2 hairline"
          style={saved ? { color: "var(--primary)" } : undefined}
        >
          <Heart className={cn("size-5", saved && "fill-current")} />
        </button>
        <button
          type="button"
          className="ease-chrome flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-bold"
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
        >
          <Plus className="size-4" /> เพิ่มเข้า Portfolio
        </button>
      </div>
    </div>
  )
}

/* ── foil card placeholder ──────────────────────────────────────────────── */
function FoilCard() {
  return (
    <div
      className="relative aspect-[63/88] overflow-hidden rounded-2xl hairline"
      style={{ background: "linear-gradient(150deg,#241808 0%,#3c2a12 35%,#6d4f23 62%,#e9b970 115%)" }}
    >
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "conic-gradient(from 210deg at 30% 20%, transparent, rgba(255,255,255,0.35), transparent 30%, rgba(233,185,112,0.4), transparent 60%)",
          mixBlendMode: "overlay",
        }}
      />
      <div className="absolute inset-x-0 bottom-0 p-3">
        <p className="tnum text-[10px] font-semibold uppercase tracking-wider text-white/70">{CARD.code}</p>
        <p className="text-sm font-extrabold leading-tight text-white">{CARD.name}</p>
      </div>
      <span className="absolute right-2 top-2 rounded-md bg-black/40 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
        {CARD.rarity}
      </span>
    </div>
  )
}

/* ── multi-source reference strip (real price-hub-sources) ──────────────── */
function SourcesStrip() {
  return (
    <div style={{ boxShadow: "inset 0 1px 0 0 var(--p-hair)" }}>
      <div className="px-5 pb-4 pt-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
            ตลาดอ้างอิง
          </span>
          <span className="tnum text-xs text-muted-foreground/60">({SOURCES.length})</span>
        </div>

        {/* mobile list (< sm) */}
        <div className="divide-y sm:hidden" style={{ borderColor: "var(--p-hair)" }}>
          {SOURCES.map((row, i) => {
            const best = i === 0
            const outlier = row.source === "eBay (EN)"
            return (
              <div key={row.source} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1 space-y-1">
                  <a
                    href="#"
                    className="inline-flex items-center gap-2 hover:underline underline-offset-2"
                  >
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: SOURCE_DOT[row.source] ?? "var(--muted-foreground)" }}
                    />
                    <span className="text-xs font-medium text-foreground">{row.source}</span>
                    <ExternalLink className="size-3 text-muted-foreground/50" aria-hidden />
                  </a>
                  <p className="text-xs text-muted-foreground/50">{row.updated}ที่แล้ว</p>
                </div>
                <div className="shrink-0 space-y-0.5 text-right">
                  <span className="inline-flex items-center justify-end gap-1">
                    {outlier && (
                      <AlertTriangle className="size-3 text-amber-500/80" aria-hidden />
                    )}
                    <span
                      className={cn(
                        "tnum text-xs font-semibold",
                        outlier ? "text-amber-400" : best ? "text-[var(--price-up)]" : "text-foreground",
                      )}
                    >
                      {row.ask}
                    </span>
                  </span>
                  <p className="tnum text-xs text-muted-foreground">ขายล่าสุด: {row.sold}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* desktop table (sm+) */}
        <div className="hidden sm:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr
                className="text-[11px] uppercase tracking-wider text-muted-foreground/60"
                style={{ boxShadow: "inset 0 -1px 0 0 var(--p-hair)" }}
              >
                <th className="pb-2 pr-3 font-medium">แหล่งอ้างอิง</th>
                <th className="pb-2 pr-3 text-right font-medium">ราคาตลาด</th>
                <th className="pb-2 pr-3 text-right font-medium">ขายล่าสุด</th>
                <th className="pb-2 text-right font-medium">อัปเดต</th>
              </tr>
            </thead>
            <tbody>
              {SOURCES.map((row, i) => {
                const best = i === 0
                const outlier = row.source === "eBay (EN)"
                return (
                  <tr
                    key={row.source}
                    style={{ boxShadow: "inset 0 -1px 0 0 var(--p-hair)" }}
                  >
                    <td className="py-2.5 pr-3">
                      <a
                        href="#"
                        className="flex items-center gap-2 hover:underline underline-offset-2"
                      >
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ background: SOURCE_DOT[row.source] ?? "var(--muted-foreground)" }}
                        />
                        <span className="text-xs font-medium text-foreground">{row.source}</span>
                        <ExternalLink className="size-3 text-muted-foreground/50" aria-hidden />
                      </a>
                    </td>
                    <td className="py-2.5 pr-3 text-right">
                      <span className="inline-flex items-center justify-end gap-1">
                        {outlier && (
                          <AlertTriangle className="size-3 text-amber-500/80" aria-hidden />
                        )}
                        <span
                          className={cn(
                            "tnum text-xs font-semibold",
                            outlier ? "text-amber-400" : best ? "text-[var(--price-up)]" : "text-foreground",
                          )}
                        >
                          {row.ask}
                        </span>
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-right">
                      <span className="tnum text-xs text-foreground/80">{row.sold}</span>
                    </td>
                    <td className="py-2.5 text-right text-xs text-muted-foreground/50">
                      {row.updated}ที่แล้ว
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ── info-tab panels ────────────────────────────────────────────────────── */
function SpecsPanel() {
  return (
    <div className="rounded-2xl surface-1 hairline p-5">
      <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">สเปกการ์ด</p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        {SPECS.map((s) => (
          <div key={s.label}>
            <dt className="text-[11px] uppercase tracking-wider text-muted-foreground/70">{s.label}</dt>
            <dd className="tnum mt-0.5 text-sm font-semibold text-foreground">{s.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function EffectPanel() {
  return (
    <div className="rounded-2xl surface-1 hairline p-5">
      <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">เอฟเฟกต์</p>
      <p className="text-sm leading-relaxed text-foreground/90">{EFFECT}</p>
    </div>
  )
}

function ListingsPanel() {
  return (
    <div className="space-y-2">
      {LISTINGS.map((l) => (
        <div key={l.seller} className="flex items-center gap-3 rounded-2xl surface-1 hairline p-3">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-lg surface-2 text-xs font-bold"
            style={{ color: "var(--primary)" }}
          >
            {l.seller[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 truncate text-sm font-semibold text-foreground">
              {l.seller}
              {l.verified && <BadgeCheck className="size-3.5" style={{ color: "var(--primary)" }} />}
            </p>
            <p className="tnum flex items-center gap-1 text-[11px] text-muted-foreground">
              <Star className="size-3 fill-current" style={{ color: "var(--primary)" }} /> {l.rating} · {l.sales} ขาย · {l.grade}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="tnum text-sm font-bold text-foreground">{baht(l.price)}</p>
            <p className="tnum text-[11px] text-muted-foreground">+{baht(l.ship)} ส่ง</p>
          </div>
          <button
            type="button"
            className="ease-chrome flex h-9 shrink-0 items-center rounded-lg px-3 text-xs font-bold"
            style={{ background: "var(--p-honey-soft)", color: "var(--primary)" }}
          >
            ซื้อ
          </button>
        </div>
      ))}
    </div>
  )
}
