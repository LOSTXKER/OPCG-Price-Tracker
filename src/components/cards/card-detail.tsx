"use client"

import Image from "next/image"
import { Fragment, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react"
import { ArrowUpRight, BadgeCheck, ExternalLink, Info, ShoppingBag } from "lucide-react"

import { Breadcrumb } from "@/components/shared/breadcrumb"
import type { CardListing } from "@/components/cards/card-listings-section"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { AdSlot } from "@/components/ads/ad-slot"
import { BLUR_DATA_URL } from "@/lib/constants/ui"
import { t, getCardName, getSetName, getCardEffect, type Currency, type Language } from "@/lib/i18n"
import {
  compactDisplayValue,
  formatByCurrency,
  formatDisplayValue,
  formatUsdByCurrency,
  jpyToDisplayValue,
  usdToDisplayValue,
} from "@/lib/utils/currency"
import { relativeTime } from "@/lib/utils/time"
import { cn } from "@/lib/utils"
import { useHydrated } from "@/hooks/use-hydrated"
import { useUIStore } from "@/stores/ui-store"

import { WatchlistStar } from "@/components/shared/watchlist-star"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { CardAddToPortfolio } from "@/components/cards/card-add-to-portfolio"
import { CardDetailActions } from "./card-detail/actions"

import { ScrubChart, RANGES, dateAtIndex, type ChartRange, type ChartSeries } from "./card-detail/card-chart"
import { mockGradeSeries } from "./card-detail/mock"
import {
  buildGradeData,
  defaultGradeKey,
  gradeToChartMode,
  GRADE_TIERS,
  type GradeKey,
  type Stat,
} from "./card-detail/grades"
import { GradeLogo } from "./card-detail/grade-logo"
import { Delta, EstMark, StatValue } from "./card-detail/grade-value"
import { EditionToggle, type Edition } from "./card-detail/edition-toggle"
import { SourceLogo } from "./card-detail/source-logo"
import { MeecardAsksRail, listingMatchesGrade } from "./card-detail/asks-rail"
import { CardTierMeta } from "./card-detail/tier-meta"
import { SiblingGrid } from "./card-detail-sibling-grid"
import { CardDetailRelated } from "./card-detail-related"
import { CardDetailSpecs } from "./card-detail-specs"
import { CardEffectText } from "./card-effect-text"

export interface SiblingCard {
  id: number
  cardCode: string
  nameJp: string
  nameEn: string | null
  rarity: string
  isParallel: boolean
  imageUrl: string | null
  latestPriceJpy: number | null
  set: { code: string }
}

export interface RelatedCard {
  id: number
  cardCode: string
  nameJp: string
  nameEn: string | null
  nameTh?: string | null
  rarity: string
  isParallel: boolean
  imageUrl: string | null
  latestPriceJpy: number | null
  set: { code: string }
}

export interface CardDetailProps {
  card: {
    id: number
    cardCode: string
    baseCode: string | null
    nameJp: string
    nameEn?: string | null
    nameTh?: string | null
    cardType: string
    color: string
    colorEn?: string | null
    rarity: string
    isParallel: boolean
    cost?: number | null
    power?: number | null
    counter?: number | null
    life?: number | null
    attribute?: string | null
    trait?: string | null
    effectJp?: string | null
    effectEn?: string | null
    effectTh?: string | null
    viewCount: number
    imageUrl: string | null
    latestPriceJpy: number | null
    latestPriceThb: number | null
    priceChange24h: number | null
    priceChange7d: number | null
    priceChange30d: number | null
    set: { code: string; name: string; nameEn?: string | null; nameTh?: string | null }
    price: { priceJpy: number; priceThb: number | null; inStock: boolean } | null
    chartData: { scrapedAt: string; priceJpy: number | null; priceThb: number | null; priceUsd: number | null; source?: string; gradeCondition?: string | null; type?: string | null }[]
  }
  siblings: SiblingCard[]
  communityPrice?: { avgThb: number | null; reportCount: number } | null
  relatedCards?: RelatedCard[]
  snkrdunkPrices?: {
    minPriceUsd: number | null
    psa10AskUsd: number | null
    psa10SoldUsd: number | null
    lastSoldUsd: number | null
  } | null
  availableSources?: { id: string; label: string; source?: string; grade?: string; currency: "JPY" | "USD" }[]
  sourcePricesRaw?: { source: string; askPriceJpy: number | null; askPriceThb: number | null; askPriceUsd: number | null; soldPriceJpy: number | null; soldPriceThb: number | null; soldPriceUsd: number | null; updatedAt: string | null }[]
  sourcePricesPsa10?: { source: string; askPriceJpy: number | null; askPriceThb: number | null; askPriceUsd: number | null; soldPriceJpy: number | null; soldPriceThb: number | null; soldPriceUsd: number | null; updatedAt: string | null }[]
  /** ISO timestamp of the most recent price observation across all sources. */
  latestUpdatedAt?: string | null
  /**
   * Days since `latestUpdatedAt` — pre-computed on the server because the
   * React 19 purity rule forbids `Date.now()` during render.
   */
  daysSinceUpdate?: number | null
  /** Active marketplace listings for this card (passed from server). */
  listings?: CardListing[]
}

function statToDisplayValue(stat: Stat, currency: Currency): number | null {
  if (stat.usd != null) return usdToDisplayValue(stat.usd, currency)
  if (stat.jpy != null) return jpyToDisplayValue(stat.jpy, currency)
  return null
}

type SourcePriceRow = NonNullable<CardDetailProps["sourcePricesRaw"]>[number]

function sameSource(row: SourcePriceRow | undefined, source: string) {
  return row?.source?.toUpperCase() === source
}

function firstSource(rows: SourcePriceRow[] | undefined, source: string) {
  return rows?.find((row) => sameSource(row, source))
}

/** One row of price evidence from an external reference source. */
type SourceRow = {
  id: string
  source: string
  label: string
  verified: boolean
  jpy: number | null
  thb: number | null
  usd: number | null
  updatedAt: string | null
}

// Compare is scoped to ONE family at a time (raw OR graded) so overlaid lines
// share a currency + price scale — never Raw(JPY) vs Graded(USD) on one axis.
const RAW_KEYS: GradeKey[] = ["raw_a", "raw_b", "raw_c"]
const GRADED_KEYS: GradeKey[] = ["psa_10", "psa_9", "psa_8", "bgs_95"]
// Distinct compare hues (no gold — reserved for transact CTAs; no green/red —
// those signal trend on the solo line). Used only when 2+ grades are overlaid.
const COMPARE_PALETTE = ["#4a90e2", "#5ec9a7", "#b07ce8", "#e0699b"]

const COLOR_DOT: Record<string, string> = {
  red: "bg-red-500",
  green: "bg-green-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  black: "bg-zinc-700",
  yellow: "bg-yellow-400",
}

/** Pure freshness label from the server-precomputed day count — never calls a
 *  render-time clock (React 19 purity), so server & client render identically. */
function relativeDaysLabel(days: number | null | undefined, lang: Language): string {
  if (days == null) return "—"
  if (days <= 0) return lang === "EN" ? "today" : lang === "JP" ? "今日" : "วันนี้"
  if (days >= 30) {
    const m = Math.floor(days / 30)
    return lang === "EN" ? `${m}mo ago` : lang === "JP" ? `${m}か月前` : `${m} เดือนที่แล้ว`
  }
  return lang === "EN" ? `${days}d ago` : lang === "JP" ? `${days}日前` : `${days} วันที่แล้ว`
}

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
}

/** A flat market-stat row (label left · value right). */
function StatRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--p-hair)] py-2.5">
      <span className="text-meta min-w-0 truncate">{label}</span>
      <span className="tnum inline-flex shrink-0 items-center gap-1 text-right text-sm font-semibold text-foreground">
        {children}
      </span>
    </div>
  )
}

export function CardDetail({
  card,
  siblings,
  relatedCards,
  snkrdunkPrices,
  sourcePricesRaw,
  sourcePricesPsa10,
  latestUpdatedAt,
  daysSinceUpdate,
  listings,
}: CardDetailProps) {
  const lang = useUIStore((s) => s.language)
  const hydrated = useHydrated()
  const displayLang: Language = hydrated ? lang : "EN"
  // Guard currency the same way as displayLang: until hydrated, render the SSR
  // default (THB) so server & client first paint match for users with a
  // persisted non-THB preference, then swap post-hydration.
  const currencyPref = useUIStore((s) => s.currency)
  const currency = hydrated ? currencyPref : "THB"
  const mounted = useMounted()

  const [edition, setEdition] = useState<Edition>("JP")
  const [range, setRange] = useState<ChartRange>("1M")
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [compareGrades, setCompareGrades] = useState<Set<GradeKey>>(() => new Set())
  const [provTab, setProvTab] = useState<"sold" | "asks">("asks")
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [showStickyBuy, setShowStickyBuy] = useState(false)
  const stickySentinelRef = useRef<HTMLDivElement | null>(null)

  const set = card.set
  const displayName = getCardName(displayLang, card)
  const setName = getSetName(displayLang, set)
  const effectText = getCardEffect(displayLang, card)

  const rawYuyu = firstSource(sourcePricesRaw, "YUYUTEI")
  const psaSnk = firstSource(sourcePricesPsa10, "SNKRDUNK")

  // The whole pricing surface is grade-driven: buildGradeData turns the real
  // scrape anchors (Yuyutei raw · SNKRDUNK PSA10) into a full grade ladder,
  // flagging every modeled tier with `isEst`. EN edition has no source yet, so
  // it resolves to an honest empty ladder instead of fabricated numbers.
  const gradeData = useMemo(() => {
    if (edition === "EN") {
      return buildGradeData({ rawAnchorJpy: null, rawAnchorThb: null, psa10AskUsd: null, psa10SoldUsd: null, rawLastSoldUsd: null, rawDelta30d: null })
    }
    return buildGradeData({
      rawAnchorJpy: rawYuyu?.askPriceJpy ?? card.price?.priceJpy ?? card.latestPriceJpy,
      rawAnchorThb: rawYuyu?.askPriceThb ?? card.price?.priceThb ?? card.latestPriceThb,
      psa10AskUsd: psaSnk?.askPriceUsd ?? snkrdunkPrices?.psa10AskUsd ?? null,
      psa10SoldUsd: psaSnk?.soldPriceUsd ?? snkrdunkPrices?.psa10SoldUsd ?? null,
      // RAW is anchored to Yuyutei (JPY) only — SNKRDUNK's USD figures are
      // graded-dominated/noisy for ungraded cards, so a raw last-sale sourced
      // from it reads wildly off the Yuyutei market price. Modeled (est) until a
      // trusted raw sold source lands.
      rawLastSoldUsd: null,
      rawDelta30d: card.priceChange30d,
    })
  }, [
    edition,
    rawYuyu?.askPriceJpy,
    rawYuyu?.askPriceThb,
    psaSnk?.askPriceUsd,
    psaSnk?.soldPriceUsd,
    snkrdunkPrices?.psa10AskUsd,
    snkrdunkPrices?.psa10SoldUsd,
    card.price?.priceJpy,
    card.price?.priceThb,
    card.latestPriceJpy,
    card.latestPriceThb,
    card.priceChange30d,
  ])

  // Default to the RAW market reference — the price most cards actually trade at
  // — instead of the speculative PSA 10 premium, so a cheap card never opens with
  // an overstated graded headline. Falls back to the proto default when raw is dry.
  const [selectedGrade, setSelectedGrade] = useState<GradeKey>(() =>
    gradeData.raw_a.hasData ? "raw_a" : defaultGradeKey(gradeData),
  )

  const datum = gradeData[selectedGrade]
  const gradeLabel = datum.tier.label
  const chartMode = gradeToChartMode(selectedGrade)
  // External source rows are labelled with the condition the SOURCE actually
  // carries (Raw via Yuyutei · PSA 10 via SNKRDUNK), never the selected modeled
  // tier — so a modeled "PSA 9" view never makes the real PSA 10 ask read as PSA 9.
  const sourceConditionLabel = chartMode === "raw" ? t(displayLang, "rawCondition") : t(displayLang, "psa10Condition")
  const editionLabel = edition === "EN" ? t(displayLang, "enEdition") : t(displayLang, "jpEdition")
  const latest = statToDisplayValue(datum.value, currency)
  const up = (datum.delta30d?.pct ?? 0) >= 0

  // Per-grade chart series — primary (selectedGrade) first, then same-family
  // compare grades the user toggled on. mockGradeSeries pools them on one display-
  // currency scale; a solo line keeps the green/red trend color, compare uses palette.
  const familyKeys = chartMode === "raw" ? RAW_KEYS : GRADED_KEYS
  const familyGrades = familyKeys.filter((k) => gradeData[k].hasData)
  const seriesList = useMemo<ChartSeries[]>(() => {
    if (!mounted || !datum.hasData) return []
    const keys = chartMode === "raw" ? RAW_KEYS : GRADED_KEYS
    const ordered = [selectedGrade, ...keys.filter((k) => k !== selectedGrade && compareGrades.has(k))]
    const inputs = ordered
      .map((k) => ({ k, base: statToDisplayValue(gradeData[k].value, currency), trendUp: (gradeData[k].delta30d?.pct ?? 0) >= 0 }))
      .filter((i) => i.base != null && i.base > 0)
    if (!inputs.length) return []
    const seriesMap = mockGradeSeries(inputs.map((i) => ({ key: i.k, base: i.base, up: i.trendUp })), range)
    const solo = inputs.length === 1
    return inputs.map((i, idx) => ({
      key: i.k,
      label: gradeData[i.k].tier.label,
      points: seriesMap[i.k] ?? [],
      color: solo ? (up ? "var(--price-up)" : "var(--price-down)") : COMPARE_PALETTE[idx % COMPARE_PALETTE.length],
      isEst: gradeData[i.k].value.isEst,
    }))
  }, [mounted, datum.hasData, chartMode, selectedGrade, compareGrades, gradeData, currency, range, up])

  const primaryPoints = seriesList[0]?.points ?? []
  const activeValue = activeIndex != null && primaryPoints[activeIndex] != null ? primaryPoints[activeIndex] : latest
  const open = primaryPoints[0] ?? null
  const shownDelta =
    activeIndex != null && open != null && activeValue != null
      ? ((activeValue - open) / open) * 100
      : datum.delta30d?.pct ?? null
  const shownDate =
    activeIndex != null ? dateAtIndex({ i: activeIndex, len: primaryPoints.length, range, latestUpdatedAt, lang: displayLang }) : null

  const switchFamily = (graded: boolean) => {
    const keys = graded ? GRADED_KEYS : RAW_KEYS
    const def = keys.find((k) => gradeData[k].hasData) ?? keys[0]
    setActiveIndex(null)
    setCompareGrades(new Set())
    setSelectedGrade(def)
  }
  const toggleCompare = (k: GradeKey) => {
    setActiveIndex(null)
    setCompareGrades((prev) => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else if (next.size < 3) next.add(k)
      return next
    })
  }
  const seriesColor = new Map(seriesList.map((s) => [s.key, s.color]))

  // 30-day band — modeled around the reference value until a real comp range
  // lands (flagged `est`). Feeds the range bar + "30-day range" stat + asks-rail high.
  const band = latest != null ? { lo: Math.round(latest * 0.93), hi: Math.round(latest * 1.06) } : null
  const markerPct =
    band && band.hi > band.lo && latest != null ? Math.max(0, Math.min(100, ((latest - band.lo) / (band.hi - band.lo)) * 100)) : 50

  const meecardAsks = useMemo(
    () => (listings ?? []).filter((l) => listingMatchesGrade(l.condition, gradeLabel)).sort((a, b) => a.priceJpy - b.priceJpy),
    [listings, gradeLabel],
  )
  const meecardLowest = meecardAsks[0] ?? null

  // External reference sources for the selected grade family. Only sources we
  // actually scraped appear — never an invented eBay/TCGplayer row.
  const { askRows, soldRows } = useMemo<{ askRows: SourceRow[]; soldRows: SourceRow[] }>(() => {
    const asks: SourceRow[] = []
    const sold: SourceRow[] = []
    const push = (arr: SourceRow[], row: SourceRow) => {
      if (row.jpy != null || row.usd != null) arr.push(row)
    }
    if (edition !== "EN") {
      if (chartMode === "raw") {
        // Raw is a Yuyutei-only market reference (see grades.ts) — SNKRDUNK USD is
        // reserved for graded tiers where it's reliable.
        push(asks, { id: "yuyu-ask", source: "YUYUTEI", label: "Yuyu-tei", verified: true, jpy: rawYuyu?.askPriceJpy ?? card.price?.priceJpy ?? card.latestPriceJpy, thb: rawYuyu?.askPriceThb ?? card.price?.priceThb ?? card.latestPriceThb, usd: null, updatedAt: rawYuyu?.updatedAt ?? latestUpdatedAt ?? null })
      } else {
        push(asks, { id: "snk-psa-ask", source: "SNKRDUNK", label: "SNKRDUNK", verified: true, jpy: psaSnk?.askPriceJpy ?? null, thb: psaSnk?.askPriceThb ?? null, usd: psaSnk?.askPriceUsd ?? snkrdunkPrices?.psa10AskUsd ?? null, updatedAt: psaSnk?.updatedAt ?? latestUpdatedAt ?? null })
        push(sold, { id: "snk-psa-sold", source: "SNKRDUNK", label: "SNKRDUNK", verified: true, jpy: psaSnk?.soldPriceJpy ?? null, thb: psaSnk?.soldPriceThb ?? null, usd: psaSnk?.soldPriceUsd ?? snkrdunkPrices?.psa10SoldUsd ?? null, updatedAt: psaSnk?.updatedAt ?? latestUpdatedAt ?? null })
      }
    }
    return { askRows: asks, soldRows: sold }
  }, [edition, chartMode, rawYuyu, psaSnk, snkrdunkPrices, card.price?.priceJpy, card.price?.priceThb, card.latestPriceJpy, card.latestPriceThb, latestUpdatedAt])

  const realSourceCount = new Set([...askRows, ...soldRows].map((r) => r.source)).size
  const provRows = provTab === "sold" ? soldRows : askRows

  const rowPrimary = (r: SourceRow) => {
    if (r.usd != null) return formatUsdByCurrency(r.usd, currency).primary
    if (r.jpy != null) return formatByCurrency(r.jpy, currency, r.thb).primary
    return "—"
  }

  const updatedLabel = relativeDaysLabel(daysSinceUpdate, displayLang)
  const TABS: { id: string; label: string }[] = [
    { id: "overview", label: t(displayLang, "overview") },
    { id: "sources", label: t(displayLang, "referenceSources") },
    { id: "market", label: t(displayLang, "sellingNow") },
    { id: "specs", label: t(displayLang, "tabSpecs") },
  ]

  useEffect(() => {
    const sentinel = stickySentinelRef.current
    if (!sentinel) return
    const updateStickyBuy = () => setShowStickyBuy(sentinel.getBoundingClientRect().top < 72)
    updateStickyBuy()
    window.addEventListener("scroll", updateStickyBuy, { passive: true })
    window.addEventListener("resize", updateStickyBuy)
    let observer: IntersectionObserver | null = null
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(updateStickyBuy)
      observer.observe(sentinel)
    }
    return () => {
      window.removeEventListener("scroll", updateStickyBuy)
      window.removeEventListener("resize", updateStickyBuy)
      observer?.disconnect()
    }
  }, [])

  const colorDot = COLOR_DOT[(card.colorEn ?? card.color)?.toLowerCase() ?? ""]
  const chartHeights = "h-[210px] sm:h-[280px] lg:h-[320px]"

  return (
    <div className="relative mx-auto max-w-7xl scroll-smooth pb-[calc(8.5rem+env(safe-area-inset-bottom))] md:pb-8">
      {/* breadcrumb row */}
      <div className="min-w-0">
        <div className="hidden min-w-0 sm:block">
          <Breadcrumb
            items={[
              { label: t(displayLang, "home"), href: "/" },
              { label: t(displayLang, "sets"), href: "/sets" },
              { label: setName, href: `/sets/${set.code}` },
              { label: card.baseCode ?? card.cardCode },
            ]}
          />
        </div>
        <p className="text-meta min-w-0 truncate sm:hidden">
          {set.code.toUpperCase()} · {card.baseCode ?? card.cardCode} · {card.rarity}
        </p>
      </div>

      {/* ── TOP 3-COL: identity · price instrument · market stats ─────────── */}
      <div className="mt-5 flex flex-col gap-y-6 lg:grid lg:grid-cols-[300px_minmax(0,1fr)_260px] lg:gap-x-10 lg:gap-y-0">
        {/* COL 1 — identity (mobile order 1 · desktop left/top) */}
        <div id="overview" className="order-1 min-w-0 scroll-mt-20 lg:order-none lg:col-start-1 lg:row-start-1">
          <div className="flex items-start gap-3 lg:flex-col">
            <button
              type="button"
              onClick={() => card.imageUrl && setLightboxOpen(true)}
              className="surface-1 ease-chrome relative block aspect-[63/88] w-24 shrink-0 cursor-zoom-in overflow-hidden rounded-xl hairline hover:ring-2 hover:ring-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:w-32"
              aria-label={displayName}
            >
              {card.imageUrl ? (
                <Image src={card.imageUrl} alt={displayName} fill className="object-contain" sizes="(max-width: 1024px) 96px, 128px" placeholder="blur" blurDataURL={BLUR_DATA_URL} priority />
              ) : (
                <Skeleton className="absolute inset-0 size-full" />
              )}
            </button>
            <div className="min-w-0 lg:mt-3">
              <div className="flex items-start gap-1.5">
                <h1 className="text-h3 min-w-0 break-words text-foreground">{displayName}</h1>
                <WatchlistStar cardId={card.id} size="md" />
              </div>
              <div className="text-meta mt-1 flex flex-wrap items-center gap-1.5">
                <RarityBadge rarity={card.rarity} size="sm" />
                <span>· {card.baseCode ?? card.cardCode}</span>
                {colorDot && <span aria-hidden className={cn("size-2 rounded-full", colorDot)} />}
                {card.isParallel && <span>· {t(displayLang, "parallel")}</span>}
              </div>
              <a href="#sources" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
                {t(displayLang, "viewSaleHistory")} <ArrowUpRight className="size-3" aria-hidden />
              </a>
            </div>
          </div>
        </div>

        {/* acquire rail — buy CTA + secondary actions (mobile order 3, after price ·
            desktop: left column, under the image) */}
        <div className="order-3 space-y-3 lg:order-none lg:col-start-1 lg:row-start-2">
          <a
            href="#market"
            className="ease-chrome flex w-full items-center justify-center gap-1.5 rounded-xl px-5 py-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            <ShoppingBag className="size-4" aria-hidden /> {t(displayLang, "buyOnMeecard")}
          </a>
          <CardDetailActions
            cardId={card.id}
            cardCode={card.cardCode}
            displayName={displayName}
            rarity={card.rarity}
            imageUrl={card.imageUrl}
            currentPriceJpy={card.price?.priceJpy ?? card.latestPriceJpy}
            lang={displayLang}
            className="sm:grid-cols-2"
          />
        </div>

        {/* COL 2 — price instrument (mobile order 2 · desktop middle, spans both rows) */}
        <div className="order-2 min-w-0 lg:order-none lg:col-start-2 lg:row-start-1 lg:row-span-2">
          <div className="space-y-2">
            <EditionToggle value={edition} onChange={setEdition} enAvailable={false} />
            {/* grade ladder — quick chips */}
            <div role="group" aria-label={t(displayLang, "chooseGrade")} className="no-sb -mx-1 flex items-stretch gap-1 overflow-x-auto px-1">
              {GRADE_TIERS.map((tier, i) => {
                const d = gradeData[tier.key]
                const active = tier.key === selectedGrade
                const disabled = !d.hasData && !active
                const graded = tier.family !== "raw"
                const num = graded ? tier.short.replace(/^(PSA|BGS|CGC)\s*/i, "") : tier.short
                const dividerBefore = graded && GRADE_TIERS[i - 1]?.family === "raw"
                const hint = statToDisplayValue(d.value, currency)
                return (
                  <Fragment key={tier.key}>
                    {dividerBefore && <span aria-hidden className="mx-0.5 w-px shrink-0 self-stretch bg-[var(--p-hair)]" />}
                    <button
                      type="button"
                      aria-pressed={active}
                      disabled={disabled}
                      onClick={() => setSelectedGrade(tier.key)}
                      className={cn(
                        "ease-chrome flex shrink-0 flex-col items-start gap-0.5 rounded-lg px-2.5 py-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
                        disabled && "cursor-not-allowed opacity-40",
                      )}
                    >
                      <span className="flex items-center gap-1 text-xs font-semibold">
                        {graded && <GradeLogo family={tier.family} size={12} />}
                        {num}
                      </span>
                      <span className={cn("text-overlay tnum", active ? "text-foreground/75" : "text-muted-foreground/50")}>
                        {hint != null ? formatDisplayValue(hint, currency) : "—"}
                      </span>
                    </button>
                  </Fragment>
                )
              })}
            </div>
          </div>

          <div key={`${selectedGrade}-${range}`} className="rise mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
            <span className="tnum text-display leading-none text-foreground">
              {activeValue == null ? "—" : formatDisplayValue(activeValue, currency)}
            </span>
            {shownDelta != null && (
              <span className="flex items-center pb-1">
                <Delta pct={shownDelta} lang={displayLang} size="lg" />
                <span className="ml-1.5 text-meta text-foreground/60">{shownDate ?? range}</span>
              </span>
            )}
            {datum.hasData && datum.value.isEst && <EstMark lang={displayLang} className="pb-1.5" />}
          </div>

          <p className="text-meta mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span>{t(displayLang, "midPrice")} · {editionLabel} · {gradeLabel}</span>
            {realSourceCount >= 2 && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <a href="#sources" className="inline-flex items-center gap-1 hover:text-foreground">
                  {t(displayLang, "medianSources")} <Info className="size-3.5" aria-hidden />
                </a>
              </>
            )}
            <span className="text-muted-foreground/40">·</span>
            <span className="text-muted-foreground/60">{updatedLabel}</span>
          </p>

          {/* 30-day range bar — reference price located within its modeled band */}
          {band && (
            <div className="mt-4 max-w-sm">
              <div className="relative h-1.5 rounded-full bg-foreground/10">
                <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${markerPct}%`, background: "var(--price-up)", opacity: 0.55 }} />
                <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background" style={{ left: `${markerPct}%`, background: "var(--price-up)" }} />
              </div>
              <div className="text-overlay mt-1 flex justify-between text-muted-foreground">
                <span className="tnum">{t(displayLang, "low")} · {compactDisplayValue(band.lo, currency)}</span>
                <span className="tnum inline-flex items-center gap-1">
                  {t(displayLang, "high")} · {compactDisplayValue(band.hi, currency)} <EstMark lang={displayLang} />
                </span>
              </div>
            </div>
          )}
        </div>

        {/* COL 3 — market stats (mobile order 4, last · desktop right) */}
        <div className="order-4 min-w-0 border-t border-[var(--p-hair)] lg:order-none lg:col-start-3 lg:row-start-1 lg:row-span-2 lg:border-t-0 lg:pl-2">
          <p className="text-eyebrow mb-1 hidden lg:block">{t(displayLang, "marketStats")}</p>
          <StatRow label={t(displayLang, "lastSold")}>
            <StatValue stat={datum.lastSale} size="stat" />
            {datum.lastSale.isEst && <EstMark lang={displayLang} />}
          </StatRow>
          <StatRow label={t(displayLang, "lowestListing")}>
            {meecardLowest != null ? (
              <span>{formatByCurrency(meecardLowest.priceJpy, currency, meecardLowest.priceThb).primary}</span>
            ) : (
              <>
                <StatValue stat={datum.lowestAsk} size="stat" />
                {datum.lowestAsk.isEst && <EstMark lang={displayLang} />}
              </>
            )}
          </StatRow>
          <StatRow label={t(displayLang, "range30d")}>
            {band ? (
              <>
                <span>{compactDisplayValue(band.lo, currency)} – {compactDisplayValue(band.hi, currency)}</span>
                <EstMark lang={displayLang} />
              </>
            ) : (
              <span className="text-muted-foreground/40">—</span>
            )}
          </StatRow>
        </div>
      </div>

      {/* TABS */}
      <nav className="no-sb mt-7 flex gap-5 overflow-x-auto border-t border-[var(--p-hair)]">
        {TABS.map((tab, i) => (
          <a
            key={tab.id}
            href={`#${tab.id}`}
            className={cn(
              "shrink-0 border-b-2 py-2.5 text-sm font-semibold",
              i === 0 ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </a>
        ))}
      </nav>

      {/* ── chart + reference sources (2-col on lg) ─────────────────────────── */}
      <div id="sources" className="mt-6 grid grid-cols-1 gap-x-8 gap-y-6 scroll-mt-20 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* CHART — filter (Raw|Graded) + range + compare overlay */}
        <div className="min-w-0">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-eyebrow">{t(displayLang, "priceHistory")} · {gradeLabel}</p>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-full bg-foreground/[0.045] p-0.5 ring-1 ring-[var(--p-hair)]" role="group" aria-label={t(displayLang, "chooseGrade")}>
                {([["raw", t(displayLang, "gradeModeRaw")], ["graded", t(displayLang, "gradeModeGraded")]] as const).map(([mode, label]) => {
                  const on = (mode === "raw") === (chartMode === "raw")
                  return (
                    <button
                      key={mode}
                      type="button"
                      aria-pressed={on}
                      onClick={() => switchFamily(mode === "graded")}
                      className={cn(
                        "ease-chrome rounded-full px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                        on ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
              <div className="inline-flex gap-0.5 rounded-full bg-foreground/[0.045] p-0.5 ring-1 ring-[var(--p-hair)]">
                {RANGES.map((rg) => (
                  <button
                    key={rg}
                    type="button"
                    aria-pressed={rg === range}
                    onClick={() => {
                      setActiveIndex(null)
                      setRange(rg)
                    }}
                    className={cn(
                      "ease-chrome rounded-full px-2.5 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                      rg === range ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {rg}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* compare-grade toggles (same family only — one currency/scale) */}
          {familyGrades.length > 1 && (
            <div className="no-sb mb-3 flex items-center gap-1.5 overflow-x-auto">
              <span className="text-meta shrink-0">{t(displayLang, "compareGrades")}</span>
              {familyGrades
                .filter((k) => k !== selectedGrade)
                .map((k) => {
                  const on = compareGrades.has(k)
                  const atMax = !on && compareGrades.size >= 3
                  return (
                    <button
                      key={k}
                      type="button"
                      aria-pressed={on}
                      disabled={atMax}
                      onClick={() => toggleCompare(k)}
                      className={cn(
                        "ease-chrome inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        on ? "border-transparent bg-foreground/10 text-foreground" : "border-[var(--p-hair)] text-muted-foreground hover:text-foreground",
                        atMax && "cursor-not-allowed opacity-40",
                      )}
                    >
                      <span className="size-2 rounded-full" style={{ background: on ? seriesColor.get(k) ?? "var(--muted-foreground)" : "var(--muted-foreground)" }} />
                      {gradeData[k].tier.label}
                      {gradeData[k].value.isEst && <EstMark lang={displayLang} />}
                    </button>
                  )
                })}
            </div>
          )}

          {!datum.hasData ? (
            <div className={cn("flex items-center justify-center rounded-xl bg-foreground/[0.025] p-5 text-center", chartHeights)}>
              <div>
                <p className="text-sm font-semibold text-foreground">{t(displayLang, "noEditionPrice")}</p>
                <p className="text-meta mt-1 max-w-sm">{t(displayLang, "noEditionPriceDesc")}</p>
              </div>
            </div>
          ) : mounted ? (
            <ScrubChart
              series={seriesList}
              activeIndex={activeIndex}
              onScrub={setActiveIndex}
              onScrubEnd={() => setActiveIndex(null)}
              lang={displayLang}
              latestUpdatedAt={latestUpdatedAt}
              range={range}
            />
          ) : (
            <div className={cn("rounded-xl bg-muted/10", chartHeights)} aria-hidden />
          )}

          {/* legend — only when overlaying multiple grades */}
          {seriesList.length > 1 && (
            <div className="no-sb mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
              {seriesList.map((s) => (
                <span key={s.key} className="inline-flex items-center gap-1.5 text-xs">
                  <span className="size-2.5 rounded-full" style={{ background: s.color }} />
                  <span className="font-semibold text-foreground">{s.label}</span>
                  <span className="tnum text-muted-foreground">{s.points.length ? formatDisplayValue(s.points[s.points.length - 1], currency) : "—"}</span>
                  {s.isEst && <EstMark lang={displayLang} />}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* REFERENCE SOURCES — sits beside the chart on lg, stacks below on mobile */}
        <aside className="min-w-0 lg:border-l lg:border-[var(--p-hair)] lg:pl-6">
          <div className="mb-2">
            <p className="text-eyebrow">{t(displayLang, "referenceSources")}</p>
            <p className="text-meta mt-0.5">{t(displayLang, "marketEvidenceDesc")}</p>
          </div>
          <div className="mb-1 flex gap-4">
            {([["asks", t(displayLang, "asksTab")], ["sold", t(displayLang, "soldTab")]] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setProvTab(id)}
                aria-pressed={provTab === id}
                className={cn(
                  "border-b-2 pb-1.5 text-sm font-semibold",
                  provTab === id ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {provRows.length === 0 ? (
            <div className="mt-3 rounded-xl bg-foreground/[0.025] p-4">
              <p className="text-sm font-semibold text-foreground">{provTab === "sold" ? t(displayLang, "noLatestSales") : t(displayLang, "noLatestListings")}</p>
              <p className="text-meta mt-1">{t(displayLang, "notEnoughDataYet")}</p>
            </div>
          ) : (
            <div>
              {provRows.map((r) => (
                <div key={r.id} className="flex items-center gap-3 border-b border-[var(--p-hair)] py-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background/50 ring-1 ring-[var(--p-hair)]">
                    <SourceLogo source={r.source} size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-foreground">{r.label}</span>
                      {r.verified && (
                        <span className="text-overlay inline-flex items-center gap-0.5 text-muted-foreground">
                          <BadgeCheck className="size-3" style={{ color: "var(--price-up)" }} /> {t(displayLang, "referenceBadge")}
                        </span>
                      )}
                    </span>
                    <span className="text-meta">{sourceConditionLabel}{mounted && r.updatedAt ? ` · ${relativeTime(r.updatedAt, displayLang)}` : ""}</span>
                  </span>
                  <span className="tnum shrink-0 text-sm font-bold text-foreground">{rowPrimary(r)}</span>
                  <ExternalLink className="size-3.5 shrink-0 text-muted-foreground/40" aria-hidden />
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>

      {/* ── ขายบน Meecard / selling on our marketplace ─────────────────────── */}
      <section id="market" className="mt-10 scroll-mt-20">
        <h2 className="text-h3 mb-3">{t(displayLang, "sellingNow")}</h2>
        <div className="surface-1 hairline rounded-2xl">
          <MeecardAsksRail
            cardId={card.id}
            cardCode={card.cardCode}
            cardName={displayName}
            listings={listings ?? []}
            currentPriceJpy={card.price?.priceJpy ?? card.latestPriceJpy}
            currency={currency}
            selectedGradeLabel={gradeLabel}
            rangeHigh={band?.hi ?? null}
            embedded
            lang={displayLang}
          />
        </div>
      </section>

      {/* ── ข้อมูลการ์ด / card info ─────────────────────────────────────────── */}
      <section id="specs" className="mt-10 scroll-mt-20">
        <h2 className="text-h3 mb-3">{t(displayLang, "cardInfo")}</h2>
        <div className="grid gap-x-8 gap-y-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CardDetailSpecs card={card} lang={displayLang} />
            {effectText?.trim() && (
              <div className="mt-3" style={{ boxShadow: "inset 3px 0 0 0 color-mix(in srgb, var(--primary) 40%, transparent)" }}>
                <div className="pl-4">
                  <p className="text-eyebrow mb-1.5">{t(displayLang, "effect")}</p>
                  <CardEffectText text={effectText} />
                </div>
              </div>
            )}
          </div>
          <div className="mt-2 lg:mt-0">
            <CardTierMeta lang={displayLang} />
          </div>
        </div>
      </section>

      {/* ── related / other versions ───────────────────────────────────────── */}
      {siblings.length > 0 && (
        <section className="mt-10">
          <h2 className="text-h3 mb-3">{t(displayLang, "otherVersions")} ({siblings.length})</h2>
          <SiblingGrid siblings={siblings} lang={displayLang} cols={3} smCols={6} mainCardCode={card.cardCode} />
        </section>
      )}

      <div className="mt-10">
        <CardDetailRelated relatedCards={relatedCards ?? []} set={set} lang={displayLang} />
      </div>

      {/* in-feed ad — page tail only, never inside the price/data story */}
      <AdSlot placement="card-detail-mid" className="mt-10 aspect-[6/1] w-full" />

      <div ref={stickySentinelRef} className="h-px" aria-hidden />

      {/* lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[90vw] border-0 bg-transparent p-0 shadow-none ring-0 sm:max-w-[90vw] [&>[data-slot=dialog-close]]:text-white [&>[data-slot=dialog-close]]:hover:bg-white/20">
          <DialogTitle className="sr-only">{displayName}</DialogTitle>
          {card.imageUrl && (
            <Image src={card.imageUrl} alt={displayName} width={800} height={1120} className="mx-auto max-h-[90vh] w-auto rounded-lg object-contain" priority />
          )}
        </DialogContent>
      </Dialog>

      {/* mobile sticky buy */}
      {showStickyBuy && (
        <div className="frost ease-chrome fixed inset-x-0 z-40 md:hidden" style={{ bottom: "calc(4rem + env(safe-area-inset-bottom))", boxShadow: "inset 0 1px 0 0 var(--p-hair)" }}>
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">
            <div className="min-w-0">
              <p className="text-overlay font-semibold uppercase text-muted-foreground">{gradeLabel} · Meecard</p>
              <p className="tnum text-base font-extrabold leading-none text-foreground">
                {meecardLowest != null
                  ? formatByCurrency(meecardLowest.priceJpy, currency, meecardLowest.priceThb).primary
                  : latest == null
                    ? "—"
                    : formatDisplayValue(latest, currency)}
              </p>
            </div>
            <CardAddToPortfolio
              cardId={card.id}
              cardName={displayName}
              variant="outline"
              iconOnly
              className="surface-1 ring-inset flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-[var(--p-hair)] text-muted-foreground [&_svg]:size-5"
            />
            <a
              href="#market"
              className="ease-chrome ml-auto flex max-w-[200px] flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              <ShoppingBag className="size-4" aria-hidden /> {t(displayLang, "buyOnMeecard")}
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
