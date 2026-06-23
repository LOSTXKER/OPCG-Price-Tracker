"use client"

import Image from "next/image"
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { Bell, ChevronRight, Eye, MoveHorizontal, Share2, ShoppingBag, Tag } from "lucide-react"

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
import { CardSetAlertDialog } from "@/components/cards/card-set-alert-dialog"

import { ScrubChart, RANGES, dateAtIndex, type ChartRange, type ChartSeries } from "./card-detail/card-chart"
import { mockGradeSeries, mockMeecardListings, mockRecentSales } from "./card-detail/mock"
import { MARKET_FEED_MOCK_COUNT, MARKET_FEED_MOCK_LISTINGS_COUNT } from "./card-detail/market-table-layout"
import { SEGMENT_ACTIVE, SEGMENT_BTN, SEGMENT_IDLE, SEGMENT_TRACK } from "./card-detail/market-feed-shared"
import {
  buildGradeData,
  defaultGradeKey,
  gradeToChartMode,
  GRADE_TIERS,
  type GradeKey,
  type Stat,
} from "./card-detail/grades"
import { GradeLogo } from "./card-detail/grade-logo"
import { Delta, EstMark } from "./card-detail/grade-value"
import { EditionToggle, type Edition } from "./card-detail/edition-toggle"
import { SourceLogo, sourceLabel } from "./card-detail/source-logo"
import { MeecardAsksRail, listingMatchesGrade } from "./card-detail/asks-rail"
import { RecentSales } from "./card-detail/recent-sales"
import { SectionHead } from "./card-detail/section-head"
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
  /** Server-resolved marketplace flag — must match SSR for hydration-safe mock vs live. */
  marketplaceEnabled?: boolean
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


const COLOR_DOT: Record<string, string> = {
  red: "bg-red-500",
  green: "bg-green-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  black: "bg-zinc-700",
  yellow: "bg-yellow-400",
}

export function CardDetail({
  card,
  siblings,
  relatedCards,
  snkrdunkPrices,
  sourcePricesRaw,
  sourcePricesPsa10,
  latestUpdatedAt,
  listings,
  marketplaceEnabled = false,
}: CardDetailProps) {
  const lang = useUIStore((s) => s.language)
  const hydrated = useHydrated()
  const displayLang: Language = hydrated ? lang : "EN"
  // Guard currency the same way as displayLang: until hydrated, render the SSR
  // default (THB) so server & client first paint match for users with a
  // persisted non-THB preference, then swap post-hydration.
  const currencyPref = useUIStore((s) => s.currency)
  const currency = hydrated ? currencyPref : "THB"

  const [edition, setEdition] = useState<Edition>("JP")
  const [range, setRange] = useState<ChartRange>("1M")
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)
  const [showStickyBuy, setShowStickyBuy] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const stickySentinelRef = useRef<HTMLDivElement | null>(null)
  const navRef = useRef<HTMLElement | null>(null)
  const tabRefs = useRef<Record<string, HTMLAnchorElement | null>>({})
  const [tabIndicator, setTabIndicator] = useState<{ left: number; width: number }>({ left: 0, width: 0 })
  const gradeActiveRef = useRef<HTMLButtonElement | null>(null)

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
    gradeData.raw.hasData ? "raw" : defaultGradeKey(gradeData),
  )

  const datum = gradeData[selectedGrade]
  const gradeLabel = datum.tier.label
  const chartMode = gradeToChartMode(selectedGrade)
  // External source rows are labelled with the condition the SOURCE actually
  // carries (Raw via Yuyutei · PSA 10 via SNKRDUNK), never the selected modeled
  // tier — so a modeled "PSA 9" view never makes the real PSA 10 ask read as PSA 9.
  const latest = statToDisplayValue(datum.value, currency)
  const up = (datum.delta30d?.pct ?? 0) >= 0
  // The % + line must follow the SELECTED range, not a fixed 30d. We hold one real anchor
  // (the grade's 30d delta); scale it sub-linearly by √(windowDays/30) so each range shows a
  // DISTINCT, damped move (7D smaller, 1Y bigger) instead of a flat 30d everywhere. 1M = the
  // real 30d; 7D/3M/1Y/All are MODELED from it (swap for real per-range history when the
  // pipeline lands). chartUp keeps the line colour + pill arrow + % in agreement per range.
  const rangeFactor = Math.sqrt(
    (range === "7D" ? 7 : range === "1M" ? 30 : range === "3M" ? 90 : range === "1Y" ? 365 : 730) / 30,
  )
  const rangeDeltaPct = datum.delta30d?.pct != null ? datum.delta30d.pct * rangeFactor : null
  const chartUp = (rangeDeltaPct ?? 0) >= 0
  // Hero label honesty (VISION §5.1): a settled sale vs a listing ask must read
  // differently. Raw = Yuyutei ask → "ราคาตั้งขาย"; graded with a real SNKRDUNK
  // sale → "ขายล่าสุด". Modeled tiers (PSA 9/8, isEst) keep their EstMark instead.
  const heroIsSold = datum.lastSaleSource != null
  const heroSourceCode = datum.lastSaleSource ?? (chartMode === "raw" ? "YUYUTEI" : "SNKRDUNK")

  // Chart series — ONE line for the selected grade only. Grade compare/overlays were
  // removed for clarity; per-grade prices still live in the grade selector chips above.
  const seriesList = useMemo<ChartSeries[]>(() => {
    if (!hydrated || !datum.hasData) return []
    const base = statToDisplayValue(datum.value, currency)
    if (base == null || base <= 0) return []
    const seriesMap = mockGradeSeries([{ key: selectedGrade, base, up: chartUp, pct: rangeDeltaPct }], range)
    return [
      {
        key: selectedGrade,
        label: gradeLabel,
        points: seriesMap[selectedGrade] ?? [],
        color: chartUp ? "var(--price-up)" : "var(--price-down)",
        isEst: datum.value.isEst,
      },
    ]
  }, [hydrated, datum.hasData, datum.value, rangeDeltaPct, chartUp, selectedGrade, gradeLabel, range, currency])

  const primaryPoints = seriesList[0]?.points ?? []
  const activeValue = activeIndex != null && primaryPoints[activeIndex] != null ? primaryPoints[activeIndex] : latest
  const open = primaryPoints[0] ?? null
  // % is ALWAYS the change of the DISPLAYED line over the selected window (open→now at rest,
  // open→scrubbed while scrubbing) — so it follows the range filter and matches the line, never
  // a stale fixed 30d. (open = primaryPoints[0] = the range's first point.)
  const shownDelta =
    open != null && activeValue != null && open !== 0 ? ((activeValue - open) / open) * 100 : null
  // While scrubbing, the % covers open→hovered — so show that DATE SPAN (not just the hovered
  // date) so it's clear what window the % is for. At rest the window word (windowLabel) is used.
  const shownDate =
    activeIndex != null && primaryPoints.length > 1
      ? `${dateAtIndex({ i: 0, len: primaryPoints.length, range, latestUpdatedAt, lang: displayLang })} – ${dateAtIndex({ i: activeIndex, len: primaryPoints.length, range, latestUpdatedAt, lang: displayLang })}`
      : null

  // CoinMarketCap-style low/high bar — min/max of the series over the SAME window
  // as the chart (one date filter for both, per เบส). Marker = where the CURRENT
  // price sits between them. Honest by construction: "low" agrees with the headline
  // % move (a riser's low is its window-open price, not a fabricated −7%).
  const barPoints = useMemo(() => {
    if (!hydrated || !datum.hasData || latest == null || latest <= 0) return []
    const m = mockGradeSeries(
      [{ key: selectedGrade, base: latest, up, pct: datum.delta30d?.pct ?? null }],
      range,
    )
    return m[selectedGrade] ?? []
  }, [hydrated, datum.hasData, datum.delta30d?.pct, selectedGrade, latest, up, range])
  const priceLow = barPoints.length >= 2 ? Math.min(...barPoints) : null
  const priceHigh = barPoints.length >= 2 ? Math.max(...barPoints) : null
  const pricePos =
    priceLow != null && priceHigh != null && priceHigh > priceLow && latest != null
      ? Math.max(0, Math.min(100, ((latest - priceLow) / (priceHigh - priceLow)) * 100))
      : 50

  const meecardAsks = useMemo(
    () => (listings ?? []).filter((l) => listingMatchesGrade(l.condition, gradeLabel)).sort((a, b) => a.priceJpy - b.priceJpy),
    [listings, gradeLabel],
  )
  const meecardLowest = meecardAsks[0] ?? null

  // Per-source market rows for the selected family — raw → sourcePricesRaw,
  // graded → sourcePricesPsa10 (each row carries the latest ask + sold for that
  // source). Only sources we actually scraped appear — never an invented row.
  // Falls back to one synthesized row from the anchor so the table is never empty.
  const marketRows = useMemo<SourcePriceRow[]>(() => {
    if (edition === "EN") return []
    const base = chartMode === "raw" ? sourcePricesRaw : sourcePricesPsa10
    let rows: SourcePriceRow[] = base ? [...base] : []
    // Raw: drop SNKRDUNK — its USD raw figures are graded-dominated/noisy (grades.ts),
    // so a raw "sold" from it reads wildly off (e.g. ฿1.48M vs Yuyutei ฿349). Raw
    // reference = Japanese retail (Yuyutei). Graded keeps SNKRDUNK (reliable there).
    if (chartMode === "raw") rows = rows.filter((r) => r.source.toUpperCase() !== "SNKRDUNK")
    if (rows.length === 0) {
      if (chartMode === "raw") {
        const jpy = rawYuyu?.askPriceJpy ?? card.price?.priceJpy ?? card.latestPriceJpy
        if (jpy != null)
          rows = [{ source: "YUYUTEI", askPriceJpy: jpy, askPriceThb: rawYuyu?.askPriceThb ?? card.price?.priceThb ?? card.latestPriceThb, askPriceUsd: null, soldPriceJpy: null, soldPriceThb: null, soldPriceUsd: null, updatedAt: rawYuyu?.updatedAt ?? latestUpdatedAt ?? null }]
      } else {
        const askUsd = psaSnk?.askPriceUsd ?? snkrdunkPrices?.psa10AskUsd ?? null
        const soldUsd = psaSnk?.soldPriceUsd ?? snkrdunkPrices?.psa10SoldUsd ?? null
        if (askUsd != null || soldUsd != null)
          rows = [{ source: "SNKRDUNK", askPriceJpy: null, askPriceThb: null, askPriceUsd: askUsd, soldPriceJpy: null, soldPriceThb: null, soldPriceUsd: soldUsd, updatedAt: psaSnk?.updatedAt ?? latestUpdatedAt ?? null }]
      }
    }
    const priceOf = (r: SourcePriceRow) => r.askPriceUsd ?? r.askPriceThb ?? r.askPriceJpy ?? r.soldPriceUsd ?? r.soldPriceThb ?? r.soldPriceJpy ?? Infinity
    // Order is fixed to cheapest-first — the old fresh/price toggle lived in MarketsTable,
    // which was replaced by the sale-history feed.
    return rows.sort((a, b) => priceOf(a) - priceOf(b))
  }, [edition, chartMode, sourcePricesRaw, sourcePricesPsa10, rawYuyu, psaSnk, snkrdunkPrices, card.price?.priceJpy, card.price?.priceThb, card.latestPriceJpy, card.latestPriceThb, latestUpdatedAt])

  // Readable timeframe for the change delta — a bare "1M" reads as "1 million" next to
  // a big ฿ figure. At rest shows the window word; while scrubbing the chart shows the date.
  const windowLabel = t(
    displayLang,
    range === "7D" ? "window7D" : range === "1M" ? "window1M" : range === "3M" ? "window3M" : range === "1Y" ? "window1Y" : "windowAll",
  )

  // Provenance line, built as an array so separators interleave cleanly (no orphan
  // dots when a part is absent). Order: what-it-is (ask/sold pill) → reference source →
  // (median, when ≥2 sources). Edition·grade is intentionally NOT shown here — it's
  // already carried by the grade chips + chart header — so the line reads as plain words
  // ("ราคาตั้งขาย · อ้างอิง Yuyu-tei"). Freshness ("อัปเดต …") is deliberately omitted (เบส).
  const provenanceParts: ReactNode[] = []
  if (!datum.value.isEst) {
    // ONE pill template — ask & sold share EVERY class; only the hue changes (grey vs
    // green), fed through the SAME bg+text formula, so the two are visually identical in
    // size, shape and weight — different colour only. (เบส: "ใช้แบบเดียวกัน แค่เปลี่ยนสี".)
    const kindColor = heroIsSold ? "var(--price-up)" : "var(--muted-foreground)"
    provenanceParts.push(
      <span
        key="kind"
        className="inline-flex items-center rounded-full px-2 py-0.5 text-micro font-semibold leading-none"
        style={{ background: `color-mix(in srgb, ${kindColor} 16%, transparent)`, color: kindColor }}
      >
        {heroIsSold ? t(displayLang, "lastSold") : t(displayLang, "askPriceVerb")}
      </span>,
      <span key="src" className="inline-flex items-center gap-1 whitespace-nowrap font-medium text-foreground/80">
        <span className="font-normal text-muted-foreground">{t(displayLang, "referenceBadge")}</span>
        <SourceLogo source={heroSourceCode} size={13} /> {sourceLabel(heroSourceCode)}
      </span>,
    )
  }
  // NOTE: the "median across sources" link was removed — the per-source reference table
  // it pointed at (#sources) was replaced by the sample sale-history feed, so the claim
  // had no real breakdown to land on. Re-add it when a real per-source table returns.
  // NOTE: freshness ("อัปเดต X ago") is intentionally NOT pushed here (เบส) — the page
  // still passes daysSinceUpdate, so re-add a push if a "last updated" cue is wanted once
  // daily data is live (a stale-amber .status-warn pill was the prior treatment).

  const TABS: { id: string; label: string }[] = [
    { id: "overview", label: t(displayLang, "overview") },
    { id: "sources", label: t(displayLang, "saleHistoryTitle") },
    { id: "market", label: t(displayLang, "sellingNow") },
    // "เวอร์ชันอื่น" only when the card actually has sibling variants to scroll to.
    ...(siblings.length > 0 ? [{ id: "versions", label: t(displayLang, "otherVersions") }] : []),
  ]

  const scrollToSection = (id: string) => {
    setActiveTab(id)
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

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

  // Scrollspy — the tabs are in-page anchors, so the active underline must follow
  // the section currently under the sticky chrome. The threshold is measured from
  // the sticky tab bar's own bottom edge, so it stays exact across breakpoints
  // (mobile header 56 + tabs vs desktop ticker 44 + header 56 + tabs).
  useEffect(() => {
    const ids = ["overview", "sources", "market", "versions"]
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el != null)
    if (sections.length === 0) return
    let raf = 0
    const sync = () => {
      raf = 0
      const offset = (navRef.current?.getBoundingClientRect().bottom ?? 100) + 4
      // Active = the section most recently crossed under the tab bar (greatest top
      // still ≤ offset). Ties (side-by-side columns on desktop, e.g. #sources left
      // and #specs right share a top) break to the FIRST id → main column wins.
      let current = sections[0].id
      let bestTop = -Infinity
      for (const el of sections) {
        const top = el.getBoundingClientRect().top - offset
        if (top <= 0 && top > bestTop) {
          bestTop = top
          current = el.id
        }
      }
      setActiveTab(current)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(sync)
    }
    sync()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  // Sliding underline — measure the active tab's box and animate a single
  // indicator to it (re-measures on tab change + language/width changes).
  useEffect(() => {
    const measure = () => {
      const el = tabRefs.current[activeTab]
      if (el) setTabIndicator({ left: el.offsetLeft, width: el.offsetWidth })
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [activeTab, displayLang])

  // Keep the selected grade chip in view on narrow screens (the rail scrolls x).
  useEffect(() => {
    gradeActiveRef.current?.scrollIntoView({ block: "nearest", inline: "center" })
  }, [selectedGrade])

  const colorDot = COLOR_DOT[(card.colorEn ?? card.color)?.toLowerCase() ?? ""]
  const chartHeights = "h-[210px] sm:h-[280px] lg:h-[320px]"
  // Quiet utility action — niche features (portfolio/alert/compare/share) sit in
  // the buy box BELOW the transact CTAs, so they're borderless muted ghosts (not
  // outlines that compete with Buy). border-0 + hover overrides neutralize
  // CompareButton's own border + primary-tinted variant.
  const utilityBtn =
    "ease-chrome flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border-0 bg-transparent text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4"
  // Filled-neutral secondary CTA (ลงขาย / เพิ่มพอร์ต) — sits under the gold buy.
  const secondaryBtn =
    "ease-chrome flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-foreground/[0.06] text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4"

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : ""
    try {
      if (typeof navigator !== "undefined" && navigator.share) await navigator.share({ title: displayName, url })
      else await navigator.clipboard?.writeText(url)
    } catch {
      /* user dismissed the share sheet — nothing to do */
    }
  }

  // Recent-sales feed for the buy-box rail — REAL settled sales only, one per
  // source that reports a sold price. Raw (Yuyutei = listing only) has none, so
  // the feed renders an honest empty state instead of fabricated comps.
  const recentSales = useMemo(
    () =>
      marketRows
        .filter((r) => r.soldPriceUsd != null || r.soldPriceJpy != null)
        .map((r) => ({
          source: r.source,
          primary:
            r.soldPriceUsd != null
              ? formatUsdByCurrency(r.soldPriceUsd, currency).primary
              : r.soldPriceJpy != null
                ? formatByCurrency(r.soldPriceJpy, currency, r.soldPriceThb).primary
                : "—",
          updatedAt: r.updatedAt,
        })),
    [marketRows, currency],
  )
  // Buy-box shows only the single freshest settled sale (the full per-source
  // sold list lives in the #sources table — repeating every row here was pure
  // duplication on the same screen). new Date(string) is deterministic, so this
  // stays render-pure (no Date.now()).
  const latestSale = recentSales.length
    ? recentSales.reduce((a, b) => (new Date(b.updatedAt ?? 0) > new Date(a.updatedAt ?? 0) ? b : a))
    : null

  // Multi-source recent-sale history feed for the #sources section — SAMPLE data
  // for now (badged "ตัวอย่าง"), seeded by the raw price + anchored to the freshest
  // scrape time. Swap for the real persisted SNKRDUNK/Yuyutei sales list later.
  const saleHistory = useMemo(
    () => mockRecentSales(card.price?.priceJpy ?? card.latestPriceJpy, latestUpdatedAt ?? null, MARKET_FEED_MOCK_COUNT),
    [card.price?.priceJpy, card.latestPriceJpy, latestUpdatedAt],
  )

  // Meecard marketplace asks — real listings once marketplace is enabled; while
  // flag-gated, always show deterministic mock (badged "ตัวอย่าง") so the rail
  // reads full even if stray test rows exist in the DB.
  const meecardListings = useMemo(() => {
    const real = listings ?? []
    if (marketplaceEnabled) {
      if (real.length > 0) return { rows: real, isSample: false as const }
      return { rows: [] as CardListing[], isSample: false as const }
    }
    return {
      rows: mockMeecardListings(card.price?.priceJpy ?? card.latestPriceJpy, latestUpdatedAt ?? null, MARKET_FEED_MOCK_LISTINGS_COUNT),
      isSample: true as const,
    }
  }, [listings, marketplaceEnabled, card.price?.priceJpy, card.latestPriceJpy, latestUpdatedAt])

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

      {/* ── 3-COL: hero card image (left) · identity+price+trade (center) · stats+actions (right) ── */}
      <div className="mt-6 flex flex-col gap-y-6 lg:grid lg:grid-cols-[200px_minmax(0,1fr)_320px] lg:items-start lg:gap-x-8 lg:gap-y-0 xl:grid-cols-[240px_minmax(0,1fr)_360px] xl:gap-x-10">
        {/* COL 1 — the card is the hero: a large portrait (tap to zoom) */}
        <div className="order-1 lg:col-start-1 lg:row-start-1">
          <button
            type="button"
            onClick={() => card.imageUrl && setLightboxOpen(true)}
            disabled={!card.imageUrl}
            className={cn(
              "surface-1 ease-chrome relative mx-auto block aspect-[63/88] w-44 overflow-hidden rounded-xl hairline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-52 lg:mx-0 lg:w-full",
              card.imageUrl ? "cursor-zoom-in hover:ring-2 hover:ring-primary/40" : "cursor-default",
            )}
            aria-label={displayName}
          >
            {card.imageUrl ? (
              <Image src={card.imageUrl} alt={displayName} fill className="object-contain" sizes="(min-width:1280px) 240px, (min-width:1024px) 200px, 208px" placeholder="blur" blurDataURL={BLUR_DATA_URL} priority />
            ) : (
              <Skeleton className="absolute inset-0 size-full" />
            )}
          </button>
        </div>

        {/* COL 2 — identity + price instrument (mobile order 2 · desktop center) */}
        <div id="overview" className="order-2 min-w-0 scroll-mt-[7.75rem] md:scroll-mt-[10.5rem] lg:order-none lg:col-start-2 lg:row-start-1">
          {/* identity — name is now a proper title beside the hero image */}
          <div className="min-w-0">
            <div className="flex items-start gap-1.5">
              <h1 className="text-h2 min-w-0 break-words text-foreground sm:text-h1">{displayName}</h1>
              <WatchlistStar cardId={card.id} size="md" />
            </div>
            <div className="text-meta mt-1 flex flex-wrap items-center gap-1.5">
              <RarityBadge rarity={card.rarity} size="sm" />
              <span>· {card.baseCode ?? card.cardCode}</span>
              {colorDot && <span aria-hidden className={cn("size-2 rounded-full", colorDot)} />}
              {card.isParallel && <span>· {t(displayLang, "parallel")}</span>}
              <span
                className="inline-flex items-center gap-1 tnum"
                title={t(displayLang, "views")}
                aria-label={`${card.viewCount.toLocaleString()} ${t(displayLang, "views")}`}
              >
                · <Eye className="size-3" aria-hidden /> {card.viewCount.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <EditionToggle value={edition} onChange={setEdition} enAvailable={false} />
            {/* grade ladder — quick chips */}
            <div role="group" aria-label={t(displayLang, "chooseGrade")} className="scroll-fade-x no-sb -mx-1 flex items-stretch gap-1 overflow-x-auto px-1">
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
                      ref={active ? gradeActiveRef : undefined}
                      aria-pressed={active}
                      aria-label={tier.label}
                      disabled={disabled}
                      onClick={() => setSelectedGrade(tier.key)}
                      className={cn(
                        "ease-chrome flex shrink-0 flex-col items-start gap-0.5 rounded-lg px-2.5 py-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                        disabled && "cursor-not-allowed opacity-40",
                      )}
                    >
                      <span className="text-label flex items-center gap-1 font-semibold">
                        {graded && <GradeLogo family={tier.family} size={12} />}
                        {num}
                      </span>
                      <span className={cn("text-meta tnum", active ? "text-foreground/75" : "text-muted-foreground/80")}>
                        {hint != null ? compactDisplayValue(hint, currency) : "—"}
                      </span>
                    </button>
                  </Fragment>
                )
              })}
            </div>
          </div>

          <div key={`${selectedGrade}-${range}`} className="rise mt-3">
            {/* price + change on ONE line (CMC/Robinhood): big number, then the % move
                over the selected chart window — or the hovered date span while scrubbing.
                Single % indicator (the 24h/7d/30d row was removed per เบส). */}
            <div className="flex flex-wrap items-end gap-x-2.5 gap-y-1">
              <span className="tnum text-display leading-none text-foreground">
                {activeValue == null ? "—" : formatDisplayValue(activeValue, currency)}
              </span>
              {datum.hasData && datum.value.isEst && <EstMark lang={displayLang} className="pb-1.5" />}
              {shownDelta != null && (
                <span className="inline-flex items-baseline gap-x-1.5 pb-1">
                  <Delta pct={shownDelta} lang={displayLang} size="lg" />
                  <span className="text-meta">{shownDate ?? windowLabel}</span>
                </span>
              )}
            </div>
          </div>

          {/* provenance — ONE scannable line of plain words: ask/sold kind · reference
              source · (median). Built from provenanceParts so dots never orphan; hidden
              entirely when empty (e.g. an est tier with no real source). */}
          {provenanceParts.length > 0 && (
            <p className="text-meta mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
              {provenanceParts.map((node, i) => (
                <Fragment key={i}>
                  {i > 0 && <span className="text-muted-foreground/55">·</span>}
                  {node}
                </Fragment>
              ))}
            </p>
          )}

          {/* low / high position bar (CoinMarketCap-style) — REAL min/max over the SAME
              window as the chart (one date filter for both); the marker shows where the
              current price sits between them. Client-only (needs the series) → no SSR mismatch. */}
          {hydrated && priceLow != null && priceHigh != null && priceHigh > priceLow && (
            <>
            {/* sr-only summary — the visual bar below is aria-hidden (decorative), so the
                low/high figures reach screen-reader users through this sentence instead. */}
            <span className="sr-only">
              {t(displayLang, "low")} {compactDisplayValue(priceLow, currency)}, {t(displayLang, "high")} {compactDisplayValue(priceHigh, currency)}
            </span>
            <div className="mt-3 flex max-w-sm items-center gap-2" aria-hidden>
              <span className="text-meta tnum shrink-0 text-muted-foreground/70">
                {t(displayLang, "low")} {compactDisplayValue(priceLow, currency)}
              </span>
              <div className="relative h-1.5 flex-1 rounded-full bg-foreground/10">
                <div className="absolute inset-y-0 left-0 rounded-full bg-foreground/30" style={{ width: `${pricePos}%` }} />
                <span
                  className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-foreground"
                  style={{ left: `${pricePos}%` }}
                />
              </div>
              <span className="text-meta tnum inline-flex shrink-0 items-center gap-1 text-muted-foreground/70">
                {t(displayLang, "high")} {compactDisplayValue(priceHigh, currency)}
                {datum.value.isEst && <EstMark lang={displayLang} />}
              </span>
            </div>
            </>
          )}
        </div>

        {/* COL 3 — BUY BOX rail (flat, no card border): transact + ขายล่าสุด feed */}
        <div className="order-3 min-w-0 border-t border-[var(--p-hair)] pt-4 lg:order-none lg:col-start-3 lg:row-start-1 lg:border-l lg:border-t-0 lg:border-[var(--p-hair)] lg:pl-8 lg:pt-0">
          {/* transact — gold "ดูประกาศขาย" is the page's one gold element */}
          <div className="space-y-2">
            <a
              href="#market"
              className="ease-chrome flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              <ShoppingBag className="size-4" aria-hidden /> {t(displayLang, "viewAsksCta")}
            </a>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`/seller/listings/new?cardCode=${encodeURIComponent(card.cardCode)}`}
                className={secondaryBtn}
              >
                <Tag className="size-4" aria-hidden /> {t(displayLang, "sellCta")}
              </a>
              <CardAddToPortfolio cardId={card.id} cardName={displayName} variant="ghost" className={secondaryBtn} />
            </div>
            <div className="grid grid-cols-2 gap-1">
              <button type="button" onClick={() => setAlertOpen(true)} className={utilityBtn}>
                <Bell className="size-4" aria-hidden /> {t(displayLang, "setPriceAlertShort")}
              </button>
              <button type="button" onClick={() => void handleShare()} className={utilityBtn}>
                <Share2 className="size-4" aria-hidden /> {t(displayLang, "shareButton")}
              </button>
            </div>
          </div>

          {/* ขายล่าสุด — ONE headline settled sale (freshest). The full per-source
              sold breakdown lives in the #sources table, so the whole row is a
              link there instead of repeating every source here. */}
          <div className="hairline-t mt-4 pt-3">
            <p className="text-eyebrow mb-1">{t(displayLang, "lastSold")}</p>
            {latestSale ? (
              <a
                href="#sources"
                className="ease-chrome -mx-1 flex items-center gap-2 rounded-lg px-1 py-1.5 hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <SourceLogo source={latestSale.source} size={18} />
                <span className="text-label min-w-0 flex-1 truncate font-medium text-foreground">{sourceLabel(latestSale.source)}</span>
                <span className="text-price tnum shrink-0 text-foreground">{latestSale.primary}</span>
                <span className="text-meta tnum shrink-0">{hydrated && latestSale.updatedAt ? relativeTime(latestSale.updatedAt, displayLang) : ""}</span>
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/40" aria-hidden />
              </a>
            ) : (
              <p className="text-meta py-2">
                {t(displayLang, "noLatestSales")} ·{" "}
                <a href="#sources" className="underline hover:text-foreground">{t(displayLang, "saleHistoryTitle")}</a>
              </p>
            )}
          </div>

          <CardSetAlertDialog
            cardId={card.id}
            cardName={displayName}
            currentPriceJpy={card.price?.priceJpy ?? card.latestPriceJpy}
            open={alertOpen}
            onOpenChange={setAlertOpen}
          />
        </div>
      </div>

      {/* Sentinel — drives the mobile sticky-buy bar: once the hero buy box scrolls
          off the top, this passes y<72 and the bar appears (shopping-journey CTA). */}
      <div ref={stickySentinelRef} className="h-px" aria-hidden />

      {/* TABS — sticky section nav under the global header. Underline tabs with a
          single sliding indicator that animates between tabs on click/scrollspy.
          Frosted bg + bottom hairline; sticks below the mobile header (top-14)
          and below the desktop ticker + header (top-[6.25rem]). */}
      <nav
        ref={navRef}
        aria-label={t(displayLang, "cardSectionsNav")}
        className="frost ease-chrome sticky top-14 z-30 mt-6 shadow-[inset_0_-1px_0_0_var(--p-hair)] md:top-[6.25rem]"
      >
        <div className="no-sb relative flex gap-5 overflow-x-auto">
          {TABS.map((tab) => (
            <a
              key={tab.id}
              ref={(el) => {
                tabRefs.current[tab.id] = el
              }}
              href={`#${tab.id}`}
              aria-current={tab.id === activeTab ? "page" : undefined}
              onClick={(e) => {
                e.preventDefault()
                scrollToSection(tab.id)
              }}
              className={cn(
                "ease-chrome inline-flex min-h-11 shrink-0 items-center py-2.5 text-sm font-semibold focus-visible:outline-none",
                tab.id === activeTab ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </a>
          ))}
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-0 h-0.5 rounded-full bg-foreground transition-[transform,width] duration-300 ease-out"
            style={{ transform: `translateX(${tabIndicator.left}px)`, width: tabIndicator.width }}
          />
        </div>
      </nav>

      {/* ── price chart + side ad column ────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        {/* CHART — range selector + single-grade line (grade is chosen via the chips above) */}
        <div className="min-w-0">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-eyebrow">{t(displayLang, "priceHistory")} · {gradeLabel}</p>
            <div className="flex flex-wrap items-center gap-2">
              <div role="group" aria-label={t(displayLang, "priceHistory")} className={SEGMENT_TRACK}>
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
                      SEGMENT_BTN,
                      "tnum",
                      rg === range ? SEGMENT_ACTIVE : SEGMENT_IDLE,
                    )}
                  >
                    {rg}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {!datum.hasData ? (
            <div className={cn("flex items-center justify-center rounded-xl bg-foreground/[0.025] p-5 text-center", chartHeights)}>
              <div>
                <p className="text-h5 text-foreground">{t(displayLang, "noEditionPrice")}</p>
                <p className="text-meta mt-1 max-w-sm">{t(displayLang, "noEditionPriceDesc")}</p>
              </div>
            </div>
          ) : hydrated ? (
            // key remounts on grade/range change → the `.rise` fade-in plays (reduced-motion safe)
            <div key={`${selectedGrade}-${range}`} className="rise">
              <ScrubChart
                series={seriesList}
                activeIndex={activeIndex}
                onScrub={setActiveIndex}
                onScrubEnd={() => setActiveIndex(null)}
                lang={displayLang}
                latestUpdatedAt={latestUpdatedAt}
                range={range}
                indexed={false}
              />
            </div>
          ) : (
            <Skeleton className={cn("rounded-xl", chartHeights)} />
          )}
          {/* sr-only live region — announces the scrubbed/focused value for screen-reader +
              keyboard users (the chart's data is otherwise pointer-only). */}
          <div aria-live="polite" className="sr-only">
            {activeIndex != null && activeValue != null ? `${shownDate ?? windowLabel} · ${formatDisplayValue(activeValue, currency)}` : ""}
          </div>

          {/* touch-only scrub hint — desktop now inspects on hover, so the hint is
              redundant there and shows only on phones where the drag isn't obvious */}
          {datum.hasData && hydrated && (
            <p className="text-meta mt-2 flex items-center justify-center gap-1.5 sm:hidden">
              <MoveHorizontal className="size-3.5" aria-hidden /> {t(displayLang, "dragChartHint")}
            </p>
          )}

        </div>

        {/* side ad — beside the chart on desktop only. VISION §5.6 forbids ads in the
            card-detail price/sold zone; on mobile this column collapses INTO that zone
            (single-column, lands right after the chart), so it's hidden <lg and kept as
            a desktop side rail where it sits beside — not inside — the price story.
            The `auto` grid track also collapses when AdSlot renders null (PRO = ad-free). */}
        <aside className="order-last hidden min-w-0 lg:order-none lg:block">
          <AdSlot placement="card-detail-chart-side" className="min-h-[320px] w-full lg:w-[320px] xl:w-[360px]" />
        </aside>
      </div>

      {/* ── below the chart — two paired rows on lg:
          ROW 1: ประวัติการซื้อขายล่าสุด (left) · ข้อมูลการ์ด (right)
          ROW 2: ขายอยู่บน Meecard (left) · โฆษณา (right)
          Right rail is 320–360px under the chart's side-ad for one continuous
          right column. Not sticky — scrolls with the page. <lg stacks. ───────── */}
      <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-x-10 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* ROW 1 LEFT — recent sales */}
        <section id="sources" className="min-w-0 scroll-mt-[7.75rem] md:scroll-mt-[10.5rem]">
          <RecentSales sales={saleHistory} isSample currency={currency} lang={displayLang} />
        </section>

        {/* ROW 1 RIGHT — card info (specs + effect) */}
        <aside id="specs" className="min-w-0 scroll-mt-[7.75rem] md:scroll-mt-[10.5rem]">
          <div className="lg:border-l lg:border-[var(--p-hair)] lg:pl-8">
            <SectionHead title={t(displayLang, "cardInfo")} />
            <CardDetailSpecs card={card} lang={displayLang} />
            {effectText?.trim() && (
              <div
                className="mt-4 pt-4"
                style={{ boxShadow: "inset 3px 0 0 0 color-mix(in srgb, var(--primary) 40%, transparent), inset 0 1px 0 0 var(--p-hair)" }}
              >
                <div className="pl-4">
                  <p className="text-eyebrow mb-1.5">{t(displayLang, "effect")}</p>
                  <CardEffectText text={effectText} />
                </div>
              </div>
            )}
            {/* CardTierMeta intentionally not rendered — sample-only Tier/meta share. */}
          </div>
        </aside>
      </div>

      <div className="hairline-t mt-10 grid grid-cols-1 gap-x-8 gap-y-12 pt-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-x-10 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* ROW 2 LEFT — Meecard asks */}
        <section id="market" className="min-w-0 scroll-mt-[7.75rem] md:scroll-mt-[10.5rem]">
          <MeecardAsksRail
            cardId={card.id}
            cardCode={card.cardCode}
            cardName={displayName}
            listings={meecardListings.rows}
            isSample={meecardListings.isSample}
            currentPriceJpy={card.price?.priceJpy ?? card.latestPriceJpy}
            currency={currency}
            lang={displayLang}
          />
        </section>

        {/* ROW 2 RIGHT — ad column. Desktop: side rail beside Meecard asks. Mobile:
            stacks BELOW the asks (single column) — i.e. in the discovery transition
            right before "other versions", which sits OUTSIDE the VISION §5.6 price/sold
            zone, so it's the single ad mobile carries now that the page-tail banner is
            gone. The chart-side ad stays hidden <lg (that one IS in the price zone). */}
        <aside className="min-w-0">
          <div className="lg:border-l lg:border-[var(--p-hair)] lg:pl-8">
            <AdSlot placement="card-detail-info-below" className="min-h-[120px] w-full lg:min-h-[320px]" />
          </div>
        </aside>
      </div>

      {/* ── full width: other versions + other cards in the set ─────────────── */}
      {siblings.length > 0 && (
        <section id="versions" className="mt-12 scroll-mt-[7.75rem] md:scroll-mt-[10.5rem]">
          <SectionHead title={`${t(displayLang, "otherVersions")} (${siblings.length})`} />
          <SiblingGrid siblings={siblings} lang={displayLang} cols={3} smCols={6} mainCardCode={card.cardCode} />
        </section>
      )}

      <div className="mt-12">
        <CardDetailRelated relatedCards={relatedCards ?? []} set={set} lang={displayLang} />
      </div>

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
              <p className="text-eyebrow">{gradeLabel} · Meecard</p>
              <p className="text-h4 tnum leading-none text-foreground">
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
              className="ease-chrome ml-auto flex min-h-11 max-w-[200px] flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              <ShoppingBag className="size-4" aria-hidden /> {t(displayLang, "viewAsksCta")}
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
