"use client"

import { Fragment, useMemo, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { ArrowUpRight, BellPlus, GitCompareArrows, Info, MoveHorizontal, ShieldCheck, Share2, ShoppingBag } from "lucide-react"

import { buildGradeData, defaultGradeKey, GRADE_TIERS, type GradeKey } from "@/components/cards/card-detail/grades"
import { Amount, Delta } from "@/components/cards/card-detail/grade-value"
import { GradeLogo } from "@/components/cards/card-detail/grade-logo"
import { CardDetailInfoTabs } from "@/components/cards/card-detail/info-tabs"
import { CardTierMeta } from "@/components/cards/card-detail/tier-meta"
import { EditionToggle, type Edition } from "@/components/cards/card-detail/edition-toggle"
import { CardDetailSpecs } from "@/components/cards/card-detail-specs"
import { CardEffectText } from "@/components/cards/card-effect-text"
import { SectionHead } from "@/components/cards/card-detail/section-head"
import { WatchlistStar } from "@/components/shared/watchlist-star"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { Breadcrumb } from "@/components/shared/breadcrumb"
import { getLocale, type Language } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { jpyToDisplayValue, usdToDisplayValue, formatDisplayValue, type Currency } from "@/lib/utils/currency"
import { cn } from "@/lib/utils"
import { ASKS, CARDS, EFFECT } from "../_components/mock"
import { baht, Segmented, ScrubChart } from "../_components/kit"
import { AdSlot } from "../_components/ads"
import { OwnershipPanel, MeecardAsksRail } from "../_components/collectr-bits"

const UPDATED_AT = "2026-06-10T00:00:00.000Z"

const card = {
  id: 0,
  cardCode: "OP13-118_p3",
  baseCode: "OP13-118",
  cardType: "LEADER",
  color: "RED",
  colorEn: "Red",
  rarity: "SEC",
  isParallel: true,
  cost: null as number | null,
  power: 5000,
  counter: null as number | null,
  life: 5,
  attribute: "Strike",
  trait: "Straw Hat Crew / The Four Emperors",
  imageUrl: null as string | null,
}

/**
 * PROTO — card-trade-e · "world-class pass" (Card Ladder / Robinhood / StockX).
 * Same data as card-trade-d, recomposed against the 6-lens UX critique:
 *  1. Quiet grade selector with TINY muted price hints (recognition over recall —
 *     glanceable ladder, never competing with the one hero number).
 *  2. Hero reconciled + grade-locked: labelled "อ้างอิงยอดขาย" (not "เฉลี่ย", which
 *     the chart footer owns) with source + recency; a last-sale / lowest-ask(this
 *     grade) / 30d TRIAD anchors it; asks + buy CTA filter to the selected grade.
 *  3. Chart LEADS the main column directly under the hero price (Card Ladder /
 *     Robinhood) — framed, dominant, always in the fold; image+buy ride a sidebar.
 *  4. honey discipline: rarity neutral; the inline buy CTA is TONAL honey (solid
 *     gold reserved for the mobile sticky bar) so it never out-pops the price.
 *  5. Trust: risk-reversal strip under the CTA; live asks carry real seller proof.
 *  6. Mobile sticky buy bar; neutral card silhouettes (no rainbow placeholders);
 *     in-feed ad moved to the page tail so it never severs the card's data story.
 */
function QuietGradeSelect({
  gradeData,
  selected,
  onSelect,
  currency,
}: {
  gradeData: ReturnType<typeof buildGradeData>
  selected: GradeKey
  onSelect: (k: GradeKey) => void
  currency: Currency
}) {
  return (
    <div role="group" aria-label="เลือกเกรด" className="no-sb -mx-1 flex items-stretch gap-1.5 overflow-x-auto px-1 pb-0.5">
      {GRADE_TIERS.map((tier, i) => {
        const d = gradeData[tier.key]
        const active = tier.key === selected
        const disabled = !d.hasData && !active
        const graded = tier.family !== "raw"
        const num = graded ? tier.short.replace(/^(PSA|BGS|CGC)\s*/i, "") : tier.short
        const dividerBefore = graded && GRADE_TIERS[i - 1]?.family === "raw"
        // glanceable last-sale hint (recognition over recall) — tiny + muted so it
        // never competes with the one hero number; the selected chip brightens it.
        const hint =
          d.value.usd != null
            ? usdToDisplayValue(d.value.usd, currency)
            : d.value.jpy != null
              ? jpyToDisplayValue(d.value.jpy, currency)
              : null
        return (
          <Fragment key={tier.key}>
            {dividerBefore && <span aria-hidden className="mx-0.5 w-px shrink-0 self-stretch" style={{ background: "var(--p-hair)" }} />}
            <button
              type="button"
              aria-pressed={active}
              aria-label={tier.label}
              disabled={disabled}
              onClick={() => onSelect(tier.key)}
              className={cn(
                "ease-chrome ring-inset flex shrink-0 flex-col items-start gap-0.5 rounded-xl px-2.5 py-1.5 text-left",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]",
                active
                  ? "bg-foreground/15 text-foreground ring-1 ring-foreground/35"
                  : "surface-1 ring-1 ring-[var(--p-hair)] text-muted-foreground hover:text-foreground",
                disabled && "cursor-not-allowed opacity-40",
              )}
            >
              <span className="flex items-center gap-1 text-xs font-semibold">
                {graded && <GradeLogo family={tier.family} size={13} />}
                {num}
              </span>
              <span className={cn("text-overlay tnum", active ? "text-foreground/80" : "text-muted-foreground/55")}>
                {hint != null ? formatDisplayValue(hint, currency) : "—"}
              </span>
            </button>
          </Fragment>
        )
      })}
    </div>
  )
}

function IconBtn({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className="ease-chrome surface-1 ring-inset flex size-11 items-center justify-center rounded-full ring-1 ring-[var(--p-hair)] text-muted-foreground hover:text-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </button>
  )
}

/* Parallel / variant prints of this card — "เวอร์ชันอื่น". */
const SIBLINGS: MiniCard[] = [
  { code: "OP13-118", set: "OP13", rarity: "L", price: 18500 },
  { code: "OP13-118_p1", set: "OP13", rarity: "L", price: 96500 },
  { code: "OP13-118_p3", set: "OP13", rarity: "SEC", price: 488955, current: true },
  { code: "OP13-118_p4", set: "OP13", rarity: "SEC", price: 152000 },
  { code: "P-061", set: "PRB", rarity: "P", price: 24500 },
]
/* Other cards in the set — "การ์ดอื่นในเซ็ต" (reuse the home/browse mock cards). */
const RELATED: MiniCard[] = CARDS.slice(0, 6).map((c) => ({
  code: c.code,
  set: c.set,
  rarity: c.rarity,
  price: c.price,
}))

type MiniCard = { code: string; set?: string; rarity: string; price: number; current?: boolean }

/** Compact poster grid for siblings / related cards (mirrors SiblingGrid / CardDetailRelated).
 *  Art is a NEUTRAL card silhouette (not rainbow gradients) so the grids recede and
 *  don't out-shout the gold CTA / break accent discipline (aesthetic-usability). */
function MiniCardGrid({ cards }: { cards: MiniCard[] }) {
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
      {cards.map((c) => (
        <Link
          key={c.code}
          href="/proto/card-trade-e"
          className={cn("group flex flex-col gap-1.5 text-center", c.current && "pointer-events-none")}
          aria-current={c.current ? "page" : undefined}
        >
          <div
            className={cn(
              "ease-chrome surface-2 relative flex aspect-[63/88] w-full items-center justify-center overflow-hidden rounded-xl hairline group-hover:ring-2 group-hover:ring-primary/30",
              c.current && "ring-2 ring-primary/70",
            )}
          >
            <span className="text-overlay uppercase text-muted-foreground/40">{c.set ?? c.code}</span>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1">
              <span className="rounded bg-muted px-1 py-px text-overlay uppercase text-muted-foreground">{c.set ?? c.code}</span>
              <RarityBadge rarity={c.rarity} size="sm" />
            </div>
            <p className="tnum mt-0.5 text-xs font-semibold text-foreground">{baht(c.price)}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}

/* ── price instrument: hero number + interactive scrub chart (Robinhood-style) ──
 * The hero MORPHS to the hovered point as you drag the chart, so price + trend
 * read as one cause-and-effect instrument. Deterministic mock series (no RNG). */
const SCRUB_RANGES = ["1M", "3M", "1Y", "All"] as const
type ScrubRange = (typeof SCRUB_RANGES)[number]
const RANGE_CFG: Record<ScrubRange, { len: number; lo: number; span: number; phase: number }> = {
  "1M": { len: 30, lo: 0.9225, span: 30, phase: 0.4 }, // ≈ +8.4% over the month
  "3M": { len: 60, lo: 0.8, span: 90, phase: 1.1 },
  "1Y": { len: 80, lo: 0.52, span: 365, phase: 0.3 },
  All: { len: 110, lo: 0.3, span: 760, phase: 0.8 },
}
const RANGE_LABEL: Record<ScrubRange, string> = { "1M": "1 เดือน", "3M": "3 เดือน", "1Y": "1 ปี", All: "ทั้งหมด" }

function genSeries(len: number, start: number, end: number, amp: number, freq: number, phase: number) {
  return Array.from({ length: len }, (_, i) => {
    const t = i / (len - 1)
    const trend = start + (end - start) * t
    // sin(t·π) envelope → wiggle fades to 0 at both ends, so the series starts
    // EXACTLY at `start` and ends EXACTLY at `end` (the real current price). This
    // keeps the resting hero = latest price and the delta exact, with no end-kink.
    const env = Math.sin(t * Math.PI)
    const wave = Math.sin(t * Math.PI * 2 * freq + phase) * amp * env
    const wob = Math.sin(t * Math.PI * 2 * freq * 3.7 + phase * 1.3) * amp * 0.45 * env
    return Math.max(1, Math.round(trend + wave + wob))
  })
}

function ScrubInstrument({
  latest,
  gradeLabel,
  currency,
  lang,
  shownSales,
  lowVolume,
  lastSaleJpy,
  lastSaleUsd,
  lowestAsk,
  delta30d,
}: {
  latest: number
  gradeLabel: string
  currency: Currency
  lang: Language
  shownSales: number | null
  lowVolume: boolean
  lastSaleJpy: number | null
  lastSaleUsd: number | null
  lowestAsk: number | null
  delta30d: number | null
}) {
  const [range, setRange] = useState<ScrubRange>("1M")
  const [scrub, setScrub] = useState<number | null>(null)
  // Render the chart + series-derived stats CLIENT-ONLY (after mount). The resting
  // hero comes straight from props (`latest`, cfg-derived delta), so the SSR HTML
  // never depends on the mock series — no hydration mismatch, ever. useSyncExternalStore
  // is the lint-clean mount gate: server snapshot = false, client = true.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  const cfg = RANGE_CFG[range]
  const up30 = (delta30d ?? 0) >= 0
  const series = useMemo(() => {
    // up grades rise INTO `latest`; down grades fall into it (start above)
    const start = up30 ? latest * cfg.lo : latest * (2 - cfg.lo)
    return genSeries(cfg.len, start, latest, latest * 0.035, 2.2, cfg.phase)
  }, [latest, cfg, up30])

  const open = series[0]
  const hi = Math.max(...series)
  const lo = Math.min(...series)
  const avg = Math.round(series.reduce((a, b) => a + b, 0) / series.length)
  // resting delta is derived from the range config (deterministic, prop-based —
  // SSR-safe); the live series only drives the value while actively scrubbing.
  const restingDelta = (up30 ? 1 / cfg.lo - 1 : 1 / (2 - cfg.lo) - 1) * 100
  const shownVal = scrub != null ? series[scrub] : latest
  const shownDelta = scrub != null && open ? ((series[scrub] - open) / open) * 100 : restingDelta
  const dateAt = (i: number) => {
    const refTime = new Date(UPDATED_AT).getTime()
    if (Number.isNaN(refTime) || series.length < 2) return ""
    const days = (cfg.span * (series.length - 1 - i)) / (series.length - 1)
    return new Date(refTime - days * 86_400_000).toLocaleDateString(getLocale(lang), { day: "numeric", month: "short" })
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-eyebrow">{scrub != null ? dateAt(scrub) : `ราคาตลาด · ${gradeLabel}`}</p>
        <div className="mt-1 flex flex-wrap items-end gap-x-3 gap-y-1">
          <span className="tnum text-[42px] font-extrabold leading-none text-foreground lg:text-[52px]">
            {formatDisplayValue(shownVal, currency)}
          </span>
          <span className="flex items-center pb-2">
            <Delta pct={shownDelta} lang={lang} size="lg" />
            <span className="ml-1.5 text-sm text-muted-foreground">{scrub != null ? "จากช่วงเปิด" : RANGE_LABEL[range]}</span>
          </span>
        </div>
        {/* honest provenance — references recent sales, source + recency, thin-data flag */}
        <p className="text-meta mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="inline-flex items-center gap-1">
            อ้างอิง {shownSales?.toLocaleString()} ยอดขาย · 30 วัน · SNKRDUNK
            <span
              title="ราคาตลาด = ราคาอ้างอิงล่าสุดจากยอดขายจริง (SNKRDUNK · Yuyutei) ใน 30 วัน — ไม่ใช่ราคาตั้งขาย"
              aria-label="ที่มาของราคา"
              className="inline-flex cursor-help text-muted-foreground/70"
            >
              <Info className="size-3.5" aria-hidden />
            </span>
          </span>
          <span className="text-muted-foreground/50">· อัปเดต 2 ชม.</span>
          {lowVolume && (
            <span className="rounded-full px-1.5 py-0.5 text-overlay font-semibold uppercase text-muted-foreground" style={{ background: "var(--p-hair)" }}>
              ปริมาณน้อย
            </span>
          )}
        </p>
      </div>

      {/* live triad — last sale / lowest ask (THIS grade) / 30d move */}
      <dl className="grid grid-cols-3 overflow-hidden rounded-xl surface-1 hairline">
        <div className="px-3 py-2">
          <dt className="text-overlay uppercase text-muted-foreground">ขายล่าสุด</dt>
          <dd className="mt-0.5">
            <Amount jpy={lastSaleJpy} usd={lastSaleUsd} size="stat" className="text-foreground" />
          </dd>
        </div>
        <div className="px-3 py-2" style={{ boxShadow: "inset 1px 0 0 0 var(--p-hair)" }}>
          <dt className="text-overlay uppercase text-muted-foreground">ตั้งขายต่ำสุด · {gradeLabel}</dt>
          <dd className="tnum mt-0.5 text-sm font-bold text-foreground">
            {lowestAsk != null ? formatDisplayValue(lowestAsk, currency) : "—"}
          </dd>
        </div>
        <div className="px-3 py-2" style={{ boxShadow: "inset 1px 0 0 0 var(--p-hair)" }}>
          <dt className="text-overlay uppercase text-muted-foreground">30 วัน</dt>
          <dd className="mt-0.5">
            {delta30d != null ? <Delta pct={delta30d} lang={lang} /> : <span className="text-sm text-muted-foreground">—</span>}
          </dd>
        </div>
      </dl>

      {/* framed interactive chart — drag to scrub; the hero above morphs to the point */}
      <section className="overflow-hidden rounded-2xl surface-1 hairline p-4 lg:p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-eyebrow">ประวัติราคา · {gradeLabel}</p>
          <Segmented
            size="sm"
            value={range}
            onChange={(r) => {
              setScrub(null)
              setRange(r)
            }}
            options={SCRUB_RANGES.map((r) => ({ value: r, label: r }))}
          />
        </div>
        {mounted ? (
          <>
            <ScrubChart data={series} up={up30} height={300} onScrub={setScrub} onScrubEnd={() => setScrub(null)} />
            <p className="text-meta mt-2 flex items-center justify-center gap-1.5">
              <MoveHorizontal className="size-3.5" aria-hidden /> ลากบนกราฟเพื่อดูราคาแต่ละวัน
            </p>
            <dl className="hairline-t mt-2.5 grid grid-cols-3 gap-2 pt-2.5 text-center">
              {[
                { l: "สูงสุด", v: hi },
                { l: "เฉลี่ย", v: avg },
                { l: "ต่ำสุด", v: lo },
              ].map((s) => (
                <div key={s.l}>
                  <dt className="text-overlay uppercase text-muted-foreground">{s.l}</dt>
                  <dd className="tnum text-sm font-semibold text-foreground">{formatDisplayValue(s.v, currency)}</dd>
                </div>
              ))}
            </dl>
          </>
        ) : (
          <div className="rounded-lg bg-muted/20" style={{ height: 340 }} aria-hidden />
        )}
      </section>
    </div>
  )
}

export default function CardWorldClassProto() {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)
  const gradeData = useMemo(
    () =>
      buildGradeData({
        rawAnchorJpy: 430000,
        rawAnchorThb: 90300,
        psa10AskUsd: 15600,
        psa10SoldUsd: 15200,
        rawLastSoldUsd: 14800,
        rawDelta30d: 8.4,
      }),
    [],
  )
  const [selectedGrade, setSelectedGrade] = useState<GradeKey>(() => defaultGradeKey(gradeData))
  const [edition, setEdition] = useState<Edition>("JP")

  const displayName = "Monkey D. Luffy"
  const sub = `${card.baseCode} · Parallel`
  const datum = gradeData[selectedGrade]
  const gradeLabel = datum.tier.label
  const isGraded = datum.tier.family !== "raw"
  // Graded volume is genuinely thin (real DB: PSA 10 ≈ a couple of points) → say so.
  const shownSales = isGraded ? 37 : datum.sales30d
  const lowVolume = (shownSales ?? 999) < 60
  const unitValue =
    datum.value.usd != null
      ? usdToDisplayValue(datum.value.usd, currency)
      : datum.value.jpy != null
        ? jpyToDisplayValue(datum.value.jpy, currency)
        : null
  const marketHref = `/marketplace?cardCode=${encodeURIComponent(card.cardCode)}`
  const sellHref = `/seller/listings/new?cardCode=${encodeURIComponent(card.cardCode)}`

  // Lock the asks + buy CTA to the SELECTED grade so the "lowest ask" anchor and
  // the hero price describe the SAME card (StockX grade-locked spread). Off-grade
  // listings never masquerade as this grade's price.
  const gradeAsks = ASKS.filter((a) => a.grade === gradeLabel).sort((a, b) => a.price - b.price)
  const hasAsks = gradeAsks.length > 0
  const lowestAsk = hasAsks ? gradeAsks[0].price : null

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-6 lg:pb-12 lg:pt-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-eyebrow">PROTO · card-trade-e — world-class pass</p>
        <Link href="/cards/OP13-118_p3" className="text-meta inline-flex items-center gap-1 hover:text-foreground">
          เทียบหน้าจริง <ArrowUpRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      {/* breadcrumb — public, crawlable path (matches the real card-detail page) */}
      <Breadcrumb
        items={[
          { label: "หน้าแรก", href: "/proto" },
          { label: "เซ็ต", href: "/proto/browse" },
          { label: "OP13 · Carrying on His Will", href: "/proto/browse" },
          { label: card.baseCode },
        ]}
      />

      {/* identity — full width, neutral rarity (honey reserved for transact) */}
      <div className="mb-6 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="surface-2 ring-inset rounded-md px-1.5 py-0.5 text-micro font-bold uppercase text-muted-foreground ring-1 ring-[var(--p-hair)]">
            {card.rarity}
          </span>
          <span className="text-xs text-muted-foreground">{sub}</span>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          {/* name demoted: identifies, does not co-star with the price */}
          <h1 className="min-w-0 break-words text-xl font-bold tracking-tight text-foreground lg:text-2xl">{displayName}</h1>
          <WatchlistStar cardId={card.id} size="md" />
        </div>
      </div>

      {/* decision zone — image LEFT anchors a "card & trade" rail; price + the
          DOMINANT chart lead the right column. `display:contents` lets the desktop
          two-column split coexist with a clean MOBILE order (image → price → buy →
          asks → chart). The columns are independent flex items, so the tall card
          image can NEVER push the chart below the fold. */}
      <div className="flex flex-col gap-y-6 lg:flex-row lg:items-start lg:gap-x-7">
        {/* LEFT RAIL — card image + buy box + live asks, one cohesive panel */}
        <div className="contents lg:block lg:w-[280px] lg:shrink-0 lg:space-y-4 lg:self-start lg:sticky lg:top-6">
          {/* IMAGE — left anchor, prominent (grouped with the way to buy it) */}
          <div className="order-1 lg:order-none">
            <div className="mx-auto w-[55%] max-w-[210px] lg:mx-0 lg:w-full lg:max-w-none">
              <div
                className="relative aspect-[63/88] w-full overflow-hidden rounded-2xl hairline"
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
                  <p className="text-overlay font-semibold uppercase tracking-wider text-white/70">{card.baseCode}</p>
                  <p className="text-sm font-extrabold leading-tight text-white">{displayName}</p>
                </div>
              </div>
            </div>
          </div>

          {/* BUY box — TONAL honey CTA (not a solid slab) so it stops out-competing
              the hero price for first fixation; the solid-gold accent is reserved for
              the mobile sticky bar. CTA + count are LOCKED to the selected grade. */}
          <div className="order-4 lg:order-none">
            <div className="surface-1 hairline space-y-3 rounded-2xl p-4">
              <Link
                href={hasAsks ? marketHref : sellHref}
                className="ease-chrome flex w-full items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{
                  background: "var(--p-honey-soft)",
                  color: "var(--primary)",
                  boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--primary) 28%, transparent)",
                }}
              >
                {hasAsks ? (
                  <>
                    <ShoppingBag className="size-4" aria-hidden /> ดูประกาศ {gradeLabel} ({gradeAsks.length})
                  </>
                ) : (
                  <>
                    <BellPlus className="size-4" aria-hidden /> แจ้งเตือนเมื่อมีขาย {gradeLabel}
                  </>
                )}
              </Link>
              <Link
                href={sellHref}
                className="ease-chrome flex w-full items-center justify-center rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-muted/30"
              >
                ลงขายใบนี้
              </Link>
              <div className="flex items-center justify-center gap-2 pt-0.5">
                <IconBtn label="แจ้งเตือนราคา">
                  <BellPlus className="size-4" aria-hidden />
                </IconBtn>
                <IconBtn label="แชร์">
                  <Share2 className="size-4" aria-hidden />
                </IconBtn>
                <IconBtn label="เปรียบเทียบ">
                  <GitCompareArrows className="size-4" aria-hidden />
                </IconBtn>
              </div>
              {/* risk-reversal — lifts confidence on a high-ticket buy (loss-aversion) */}
              <p className="hairline-t flex items-center justify-center gap-1.5 pt-2.5 text-center text-overlay text-muted-foreground">
                <ShieldCheck className="size-3.5 shrink-0" style={{ color: "var(--price-up)" }} aria-hidden />
                คุ้มครองผู้ซื้อ · ตรวจการ์ดก่อนส่ง · คืนเงินถ้าไม่ตรงสภาพ
              </p>
            </div>
          </div>

          {/* ASKS — sellers of THE SELECTED GRADE only (no off-grade listing can
              masquerade as this grade's "lowest ask"). Empty grades → notify state. */}
          <div className="order-5 lg:order-none">
            <MeecardAsksRail cardCode={card.cardCode} asks={gradeAsks} currency={currency} lang={lang} />
          </div>
        </div>

        {/* RIGHT MAIN — selector → ScrubInstrument (hero morphs on scrub + chart) → comps */}
        <div className="contents lg:block lg:min-w-0 lg:flex-1 lg:space-y-5">
          {/* grade selector + edition — one row; JP/EN out of the price→chart corridor */}
          <div className="order-2 lg:order-none">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <QuietGradeSelect gradeData={gradeData} selected={selectedGrade} onSelect={setSelectedGrade} currency={currency} />
              </div>
              <div className="shrink-0 pt-0.5">
                <EditionToggle value={edition} onChange={setEdition} enAvailable={false} />
              </div>
            </div>
          </div>

          {/* INSTRUMENT — hero number morphs to the scrubbed chart point (Robinhood);
              price + provenance + triad + interactive chart are ONE bound unit. */}
          <div className="order-3 lg:order-none">
            {unitValue != null ? (
              <ScrubInstrument
                key={selectedGrade}
                latest={unitValue}
                gradeLabel={gradeLabel}
                currency={currency}
                lang={lang}
                shownSales={shownSales}
                lowVolume={lowVolume}
                lastSaleJpy={datum.lastSale.jpy}
                lastSaleUsd={datum.lastSale.usd}
                lowestAsk={lowestAsk}
                delta30d={datum.delta30d?.pct ?? null}
              />
            ) : (
              <p className="text-meta">ไม่มีข้อมูลราคาเกรดนี้</p>
            )}
          </div>

          {/* recent sales (proof of the line) + population — directly under the chart */}
          <div className="order-6 lg:order-none">
            <CardDetailInfoTabs
              cardCode={card.cardCode}
              cardName={displayName}
              listings={[]}
              compBase={datum.value.jpy ?? datum.value.usd}
              gradeLabel={gradeLabel}
              currency={datum.currency}
              latestUpdatedAt={UPDATED_AT}
              tabs={["comps", "population"]}
              lang={lang}
            />
          </div>
        </div>
      </div>

      {/* card facts — specs (wide) + your position + competitive meta */}
      <div className="mt-8 lg:grid lg:grid-cols-3 lg:gap-x-12">
        <div className="lg:col-span-2">
          <CardDetailSpecs card={card} lang={lang} />
        </div>
        <div className="mt-5 space-y-4 lg:mt-0">
          <OwnershipPanel selectedGradeLabel={gradeLabel} selectedValue={unitValue} currency={currency} />
          <CardTierMeta lang={lang} />
        </div>
      </div>

      {/* effect text — the card's ability (real CardEffectText highlighter) */}
      <div className="mt-8">
        <SectionHead title="เอฟเฟกต์การ์ด" />
        <div className="surface-1 hairline rounded-2xl p-5">
          <CardEffectText text={EFFECT} />
        </div>
      </div>

      {/* other versions / parallels — "เวอร์ชันอื่น" (mirrors SiblingGrid) */}
      <div className="mt-8">
        <SectionHead title={`เวอร์ชันอื่น (${SIBLINGS.length})`} />
        <MiniCardGrid cards={SIBLINGS} />
      </div>

      {/* other cards from the set — "การ์ดอื่นในเซ็ต" (mirrors CardDetailRelated) */}
      <div className="mt-8">
        <SectionHead
          title="การ์ดอื่นในเซ็ต OP13"
          action={
            <Link href="/proto/browse" className="text-meta hover:text-foreground">
              ดูทั้งหมด →
            </Link>
          }
        />
        <MiniCardGrid cards={RELATED} />
      </div>

      {/* in-feed ad — moved to the PAGE TAIL so it never severs the card's own data
          story (specs → effect → versions → related stay one common region) */}
      <div className="mt-8">
        <AdSlot format="banner" className="w-full" />
      </div>

      {/* MOBILE — sticky buy bar so the way-to-act is always one tap away */}
      <div
        className="frost fixed inset-x-0 bottom-0 z-50 lg:hidden"
        style={{ boxShadow: "inset 0 1px 0 0 var(--p-hair)" }}
      >
        <div
          className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <div className="min-w-0">
            <p className="text-overlay font-semibold uppercase text-muted-foreground">{gradeLabel}</p>
            <p className="tnum text-base font-extrabold leading-none text-foreground">
              {unitValue != null ? formatDisplayValue(unitValue, currency) : "—"}
            </p>
          </div>
          <Link
            href={marketHref}
            className="ease-chrome ml-auto flex max-w-[220px] flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            <ShoppingBag className="size-4" aria-hidden /> ดูประกาศขาย
          </Link>
        </div>
      </div>
    </div>
  )
}
