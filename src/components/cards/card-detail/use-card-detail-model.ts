"use client"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react"

import { useHydrated } from "@/hooks/use-hydrated"
import { getCardEffect, getCardName, getSetName, t, type Currency, type Language } from "@/lib/i18n"
import {
  formatByCurrency,
  formatUsdByCurrency,
  jpyToDisplayValue,
  usdToDisplayValue,
} from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"

import { dateAtIndex, type ChartRange, type ChartSeries } from "./card-chart"
import type { Edition } from "./edition-toggle"
import {
  buildGradeData,
  defaultGradeKey,
  gradeToChartMode,
  GRADE_TIERS,
  type GradeDatum,
  type GradeKey,
  type Stat,
} from "./grades"
import { MARKET_FEED_SAMPLE_PREVIEW_COUNT } from "./market-table-layout"
import { mockGradeSeries, mockMeecardListings, mockRecentSales, type MockSale } from "./mock"
import type { CardDetailProps, CardListing, CardSourcePrice } from "./types"
import { useCardDetailTabs } from "./use-card-detail-tabs"

type CardDetailTabsModel = ReturnType<typeof useCardDetailTabs>

interface LatestSale {
  source: string
  primary: string
  updatedAt: string | null
}

export interface ProvenanceModel {
  kindColor: string
  kindLabel: string
  referenceLabel: string
  sourceCode: string
}

export interface CardDetailModel {
  hydrated: boolean
  displayLang: Language
  currency: Currency
  edition: Edition
  setEdition: Dispatch<SetStateAction<Edition>>
  range: ChartRange
  selectRange: (range: ChartRange) => void
  activeIndex: number | null
  setActiveIndex: Dispatch<SetStateAction<number | null>>
  lightboxOpen: boolean
  setLightboxOpen: Dispatch<SetStateAction<boolean>>
  alertOpen: boolean
  setAlertOpen: Dispatch<SetStateAction<boolean>>
  gradeActiveRef: RefObject<HTMLButtonElement | null>
  navRef: CardDetailTabsModel["navRef"]
  tabRefs: CardDetailTabsModel["tabRefs"]
  activeTab: string
  tabIndicator: { left: number; width: number }
  scrollToSection: (id: string) => void
  set: CardDetailProps["card"]["set"]
  displayName: string
  setName: string
  effectText: string | null
  gradeData: Record<GradeKey, GradeDatum>
  gradeDisplayValues: Record<GradeKey, number | null>
  selectedGrade: GradeKey
  setSelectedGrade: Dispatch<SetStateAction<GradeKey>>
  datum: GradeDatum
  gradeLabel: string
  seriesList: ChartSeries[]
  activeValue: number | null
  shownDelta: number | null
  shownDate: string | null
  priceLow: number | null
  priceHigh: number | null
  pricePos: number
  windowLabel: string
  provenance: ProvenanceModel | null
  tabs: { id: string; label: string }[]
  handleShare: () => Promise<void>
  latestSale: LatestSale | null
  saleHistory: MockSale[]
  meecardListings: { rows: CardListing[]; isSample: boolean }
}

function statToDisplayValue(stat: Stat, currency: Currency): number | null {
  if (stat.usd != null) return usdToDisplayValue(stat.usd, currency)
  if (stat.jpy != null) return jpyToDisplayValue(stat.jpy, currency)
  return null
}

function firstSource(rows: CardSourcePrice[] | undefined, source: string) {
  return rows?.find((row) => row.source?.toUpperCase() === source)
}

/**
 * Owns the card-detail interaction state and all data derived from it. The
 * consuming component remains presentation-only and keeps the existing DOM
 * order, markup, URLs, and client boundary unchanged.
 */
export function useCardDetailModel({
  card,
  siblings,
  snkrdunkPrices,
  sourcePricesRaw,
  sourcePricesPsa10,
  latestUpdatedAt,
  listings,
  marketplaceEnabled = false,
}: CardDetailProps): CardDetailModel {
  const lang = useUIStore((state) => state.language)
  const hydrated = useHydrated()
  const displayLang: Language = hydrated ? lang : "EN"
  // Until hydrated, keep the same SSR defaults used by the original component.
  const currencyPreference = useUIStore((state) => state.currency)
  const currency: Currency = hydrated ? currencyPreference : "THB"

  const [edition, setEdition] = useState<Edition>("JP")
  const [range, setRange] = useState<ChartRange>("1M")
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)
  const gradeActiveRef = useRef<HTMLButtonElement | null>(null)
  const { navRef, tabRefs, activeTab, tabIndicator, scrollToSection } = useCardDetailTabs(displayLang)

  const set = card.set
  const displayName = getCardName(displayLang, card)
  const setName = getSetName(displayLang, set)
  const effectText = getCardEffect(displayLang, card)

  const rawYuyu = firstSource(sourcePricesRaw, "YUYUTEI")
  const psaSnk = firstSource(sourcePricesPsa10, "SNKRDUNK")

  // The entire pricing surface is grade-driven. EN has no source yet, so it
  // intentionally resolves to an empty ladder instead of modeled values.
  const gradeData = useMemo(() => {
    if (edition === "EN") {
      return buildGradeData({
        rawAnchorJpy: null,
        rawAnchorThb: null,
        psa10AskUsd: null,
        psa10SoldUsd: null,
        rawLastSoldUsd: null,
        rawDelta30d: null,
      })
    }
    return buildGradeData({
      rawAnchorJpy: rawYuyu?.askPriceJpy ?? card.price?.priceJpy ?? card.latestPriceJpy,
      rawAnchorThb: rawYuyu?.askPriceThb ?? card.price?.priceThb ?? card.latestPriceThb,
      psa10AskUsd: psaSnk?.askPriceUsd ?? snkrdunkPrices?.psa10AskUsd ?? null,
      psa10SoldUsd: psaSnk?.soldPriceUsd ?? snkrdunkPrices?.psa10SoldUsd ?? null,
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

  // Open on the real raw reference when available, matching the original page.
  const [selectedGrade, setSelectedGrade] = useState<GradeKey>(() =>
    gradeData.raw.hasData ? "raw" : defaultGradeKey(gradeData),
  )

  const datum = gradeData[selectedGrade]
  const gradeLabel = datum.tier.label
  const chartMode = gradeToChartMode(selectedGrade)
  const latest = statToDisplayValue(datum.value, currency)
  const up = (datum.delta30d?.pct ?? 0) >= 0
  const rangeFactor = Math.sqrt(
    (range === "7D" ? 7 : range === "1M" ? 30 : range === "3M" ? 90 : range === "1Y" ? 365 : 730) / 30,
  )
  const rangeDeltaPct = datum.delta30d?.pct != null ? datum.delta30d.pct * rangeFactor : null
  const chartUp = (rangeDeltaPct ?? 0) >= 0

  const seriesList = useMemo<ChartSeries[]>(() => {
    if (!hydrated || !datum.hasData) return []
    const base = statToDisplayValue(datum.value, currency)
    if (base == null || base <= 0) return []
    const seriesMap = mockGradeSeries(
      [{ key: selectedGrade, base, up: chartUp, pct: rangeDeltaPct }],
      range,
    )
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
  const shownDelta =
    open != null && activeValue != null && open !== 0 ? ((activeValue - open) / open) * 100 : null
  const shownDate =
    activeIndex != null && primaryPoints.length > 1
      ? `${dateAtIndex({ i: 0, len: primaryPoints.length, range, latestUpdatedAt, lang: displayLang })} – ${dateAtIndex({ i: activeIndex, len: primaryPoints.length, range, latestUpdatedAt, lang: displayLang })}`
      : null

  const barPoints = useMemo(() => {
    if (!hydrated || !datum.hasData || latest == null || latest <= 0) return []
    const seriesMap = mockGradeSeries(
      [{ key: selectedGrade, base: latest, up, pct: datum.delta30d?.pct ?? null }],
      range,
    )
    return seriesMap[selectedGrade] ?? []
  }, [hydrated, datum.hasData, datum.delta30d?.pct, selectedGrade, latest, up, range])
  const priceLow = barPoints.length >= 2 ? Math.min(...barPoints) : null
  const priceHigh = barPoints.length >= 2 ? Math.max(...barPoints) : null
  const pricePos =
    priceLow != null && priceHigh != null && priceHigh > priceLow && latest != null
      ? Math.max(0, Math.min(100, ((latest - priceLow) / (priceHigh - priceLow)) * 100))
      : 50

  const marketRows = useMemo<CardSourcePrice[]>(() => {
    if (edition === "EN") return []
    const base = chartMode === "raw" ? sourcePricesRaw : sourcePricesPsa10
    let rows = base ? [...base] : []
    if (chartMode === "raw") {
      rows = rows.filter((row) => row.source.toUpperCase() !== "SNKRDUNK")
    }
    if (rows.length === 0) {
      if (chartMode === "raw") {
        const priceJpy = rawYuyu?.askPriceJpy ?? card.price?.priceJpy ?? card.latestPriceJpy
        if (priceJpy != null) {
          rows = [
            {
              source: "YUYUTEI",
              askPriceJpy: priceJpy,
              askPriceThb: rawYuyu?.askPriceThb ?? card.price?.priceThb ?? card.latestPriceThb,
              askPriceUsd: null,
              soldPriceJpy: null,
              soldPriceThb: null,
              soldPriceUsd: null,
              updatedAt: rawYuyu?.updatedAt ?? latestUpdatedAt ?? null,
            },
          ]
        }
      } else {
        const askPriceUsd = psaSnk?.askPriceUsd ?? snkrdunkPrices?.psa10AskUsd ?? null
        const soldPriceUsd = psaSnk?.soldPriceUsd ?? snkrdunkPrices?.psa10SoldUsd ?? null
        if (askPriceUsd != null || soldPriceUsd != null) {
          rows = [
            {
              source: "SNKRDUNK",
              askPriceJpy: null,
              askPriceThb: null,
              askPriceUsd,
              soldPriceJpy: null,
              soldPriceThb: null,
              soldPriceUsd,
              updatedAt: psaSnk?.updatedAt ?? latestUpdatedAt ?? null,
            },
          ]
        }
      }
    }
    const priceOf = (row: CardSourcePrice) =>
      row.askPriceUsd ??
      row.askPriceThb ??
      row.askPriceJpy ??
      row.soldPriceUsd ??
      row.soldPriceThb ??
      row.soldPriceJpy ??
      Infinity
    return rows.sort((a, b) => priceOf(a) - priceOf(b))
  }, [
    edition,
    chartMode,
    sourcePricesRaw,
    sourcePricesPsa10,
    rawYuyu,
    psaSnk,
    snkrdunkPrices,
    card.price?.priceJpy,
    card.price?.priceThb,
    card.latestPriceJpy,
    card.latestPriceThb,
    latestUpdatedAt,
  ])

  const windowLabel = t(
    displayLang,
    range === "7D"
      ? "window7D"
      : range === "1M"
        ? "window1M"
        : range === "3M"
          ? "window3M"
          : range === "1Y"
            ? "window1Y"
            : "windowAll",
  )

  const heroIsSold = datum.lastSaleSource != null
  const heroSourceCode = datum.lastSaleSource ?? (chartMode === "raw" ? "YUYUTEI" : "SNKRDUNK")
  const provenance = datum.value.isEst
    ? null
    : {
        kindColor: heroIsSold ? "var(--price-up-text)" : "var(--muted-foreground)",
        kindLabel: heroIsSold ? t(displayLang, "lastSold") : t(displayLang, "askPriceVerb"),
        referenceLabel: t(displayLang, "referenceBadge"),
        sourceCode: heroSourceCode,
      }

  const tabs = [
    { id: "overview", label: t(displayLang, "overview") },
    { id: "sources", label: t(displayLang, "saleHistorySampleTitle") },
    {
      id: "market",
      label: t(displayLang, marketplaceEnabled ? "sellingNow" : "sellingNowSampleTitle"),
    },
    ...(siblings.length > 0 ? [{ id: "versions", label: t(displayLang, "otherVersions") }] : []),
  ]

  useEffect(() => {
    gradeActiveRef.current?.scrollIntoView({ block: "nearest", inline: "center" })
  }, [selectedGrade])

  const selectRange = (nextRange: ChartRange) => {
    setActiveIndex(null)
    setRange(nextRange)
  }

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : ""
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: displayName, url })
      } else {
        await navigator.clipboard?.writeText(url)
      }
    } catch {
      // The user dismissed the native share sheet.
    }
  }

  const recentSales = useMemo<LatestSale[]>(
    () =>
      marketRows
        .filter((row) => row.soldPriceUsd != null || row.soldPriceJpy != null)
        .map((row) => ({
          source: row.source,
          primary:
            row.soldPriceUsd != null
              ? formatUsdByCurrency(row.soldPriceUsd, currency).primary
              : row.soldPriceJpy != null
                ? formatByCurrency(row.soldPriceJpy, currency, row.soldPriceThb).primary
                : "—",
          updatedAt: row.updatedAt,
        })),
    [marketRows, currency],
  )
  const latestSale = recentSales.length
    ? recentSales.reduce((a, b) => (new Date(b.updatedAt ?? 0) > new Date(a.updatedAt ?? 0) ? b : a))
    : null

  const saleHistory = useMemo(
    () =>
      mockRecentSales(
        card.price?.priceJpy ?? card.latestPriceJpy,
        latestUpdatedAt ?? null,
        MARKET_FEED_SAMPLE_PREVIEW_COUNT,
      ),
    [card.price?.priceJpy, card.latestPriceJpy, latestUpdatedAt],
  )

  const meecardListings = useMemo(() => {
    const real = listings ?? []
    if (marketplaceEnabled) {
      if (real.length > 0) return { rows: real, isSample: false }
      return { rows: [] as CardListing[], isSample: false }
    }
    return {
      rows: mockMeecardListings(
        card.price?.priceJpy ?? card.latestPriceJpy,
        latestUpdatedAt ?? null,
        MARKET_FEED_SAMPLE_PREVIEW_COUNT,
      ),
      isSample: true,
    }
  }, [listings, marketplaceEnabled, card.price?.priceJpy, card.latestPriceJpy, latestUpdatedAt])

  const gradeDisplayValues = Object.fromEntries(
    GRADE_TIERS.map((tier) => [tier.key, statToDisplayValue(gradeData[tier.key].value, currency)]),
  ) as Record<GradeKey, number | null>

  return {
    hydrated,
    displayLang,
    currency,
    edition,
    setEdition,
    range,
    selectRange,
    activeIndex,
    setActiveIndex,
    lightboxOpen,
    setLightboxOpen,
    alertOpen,
    setAlertOpen,
    gradeActiveRef,
    navRef,
    tabRefs,
    activeTab,
    tabIndicator,
    scrollToSection,
    set,
    displayName,
    setName,
    effectText,
    gradeData,
    gradeDisplayValues,
    selectedGrade,
    setSelectedGrade,
    datum,
    gradeLabel,
    seriesList,
    activeValue,
    shownDelta,
    shownDate,
    priceLow,
    priceHigh,
    pricePos,
    windowLabel,
    provenance,
    tabs,
    handleShare,
    latestSale,
    saleHistory,
    meecardListings,
  }
}
