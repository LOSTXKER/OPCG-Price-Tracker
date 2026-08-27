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
import { apiGet } from "@/lib/api/client"
import { getCardEffect, getCardName, getSetName, t, type Currency, type Language } from "@/lib/i18n"
import {
  formatByCurrency,
  formatUsdByCurrency,
  jpyToDisplayValue,
  usdToDisplayValue,
} from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"

import { dateAtIndex, RANGE_DAYS, type ChartRange, type ChartSeries } from "./card-chart"
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
import { deriveRawPriceChart } from "./price-history"
import type { CardDetailProps, CardListing, CardSourcePrice } from "./types"
import { useCardDetailTabs } from "./use-card-detail-tabs"

type CardDetailTabsModel = ReturnType<typeof useCardDetailTabs>

interface LatestSale {
  source: string
  primary: string
  updatedAt: string | null
}

type ChartDataRow = CardDetailProps["card"]["chartData"][number]

type PriceHistoryApiResponse = {
  prices: ChartDataRow[]
}

const RANGE_API_PERIOD: Partial<Record<ChartRange, string>> = {
  "3M": "90d",
  "1Y": "1y",
  All: "all",
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
  chartLoading: boolean
  chartError: boolean
  retryChart: () => void
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
  meecardListings: { rows: CardListing[] }
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
  // Pre-hydration the page must render Thai: the site is Thai-first, <html lang>
  // is th, and a cookieless crawler only ever sees this first pass. "TH" matches
  // both the ui-store default and getServerLanguage's default, so the rehydrate
  // re-render behaves exactly as before — only the default side changed.
  const displayLang: Language = hydrated ? lang : "TH"
  // Until hydrated, keep the same SSR defaults used by the original component.
  const currencyPreference = useUIStore((state) => state.currency)
  const currency: Currency = hydrated ? currencyPreference : "THB"

  const [edition, setEditionState] = useState<Edition>("JP")
  const [range, setRange] = useState<ChartRange>("1M")
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [remoteHistory, setRemoteHistory] = useState<
    Partial<Record<ChartRange, ChartDataRow[]>>
  >({})
  const [remoteHistoryErrors, setRemoteHistoryErrors] = useState<
    Partial<Record<ChartRange, true>>
  >({})
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
  const [selectedGrade, setSelectedGradeState] = useState<GradeKey>(() =>
    gradeData.raw.hasData ? "raw" : defaultGradeKey(gradeData),
  )

  const setEdition: Dispatch<SetStateAction<Edition>> = (nextEdition) => {
    setActiveIndex(null)
    setEditionState(nextEdition)
  }

  const setSelectedGrade: Dispatch<SetStateAction<GradeKey>> = (nextGrade) => {
    setActiveIndex(null)
    setSelectedGradeState(nextGrade)
  }

  const datum = gradeData[selectedGrade]
  const gradeLabel = datum.tier.label
  const chartMode = gradeToChartMode(selectedGrade)
  const latest = statToDisplayValue(datum.value, currency)

  const needsRemoteHistory = range in RANGE_API_PERIOD
  const hasRemoteHistory = Object.prototype.hasOwnProperty.call(remoteHistory, range)
  const hasRemoteHistoryError = remoteHistoryErrors[range] === true
  const chartLoading =
    hydrated &&
    edition === "JP" &&
    selectedGrade === "raw" &&
    needsRemoteHistory &&
    !hasRemoteHistory &&
    !hasRemoteHistoryError
  const chartError =
    hydrated &&
    edition === "JP" &&
    selectedGrade === "raw" &&
    needsRemoteHistory &&
    hasRemoteHistoryError
  const chartRows = useMemo(
    () => (needsRemoteHistory ? remoteHistory[range] ?? [] : card.chartData),
    [card.chartData, needsRemoteHistory, range, remoteHistory],
  )

  useEffect(() => {
    const period = RANGE_API_PERIOD[range]
    if (
      !hydrated ||
      edition !== "JP" ||
      selectedGrade !== "raw" ||
      !period ||
      hasRemoteHistory ||
      hasRemoteHistoryError
    ) {
      return
    }

    const controller = new AbortController()
    const url = `/api/cards/${encodeURIComponent(card.cardCode)}/prices?period=${period}&source=YUYUTEI&grade=raw`
    void apiGet<PriceHistoryApiResponse>(url, controller.signal)
      .then((response) => {
        setRemoteHistory((current) => ({ ...current, [range]: response.prices }))
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setRemoteHistoryErrors((current) => ({ ...current, [range]: true }))
        }
      })

    return () => controller.abort()
  }, [
    card.cardCode,
    edition,
    hasRemoteHistory,
    hasRemoteHistoryError,
    hydrated,
    range,
    selectedGrade,
  ])

  const retryChart = () => {
    setRemoteHistoryErrors((current) => {
      const next = { ...current }
      delete next[range]
      return next
    })
  }

  const rawChart = useMemo(
    () =>
      deriveRawPriceChart(chartRows, {
        days: range === "All" ? Number.POSITIVE_INFINITY : RANGE_DAYS[range],
        currency,
      }),
    [chartRows, currency, range],
  )

  const seriesList = useMemo<ChartSeries[]>(() => {
    if (
      !hydrated ||
      edition !== "JP" ||
      selectedGrade !== "raw" ||
      rawChart.points.length === 0
    ) {
      return []
    }
    const first = rawChart.points[0]!
    const last = rawChart.points.at(-1)!
    return [
      {
        key: "raw",
        label: gradeLabel,
        points: rawChart.points,
        dateIsos: rawChart.dateIsos,
        color:
          last > first
            ? "var(--price-up)"
            : last < first
              ? "var(--price-down)"
              : "var(--muted-foreground)",
        isEst: false,
      },
    ]
  }, [edition, gradeLabel, hydrated, rawChart, selectedGrade])

  const primaryPoints = seriesList[0]?.points ?? []
  const primaryDateIsos = seriesList[0]?.dateIsos ?? []
  const resolvedActiveIndex =
    activeIndex != null && primaryPoints.length > 0
      ? Math.max(0, Math.min(primaryPoints.length - 1, activeIndex))
      : null
  const activeValue =
    resolvedActiveIndex != null
      ? primaryPoints[resolvedActiveIndex]!
      : primaryPoints.at(-1) ?? latest
  const open = primaryPoints[0] ?? null
  const shownDelta =
    primaryPoints.length >= 2 && open != null && activeValue != null && open !== 0
      ? ((activeValue - open) / open) * 100
      : null
  const shownDate =
    resolvedActiveIndex != null && primaryPoints.length > 1
      ? `${dateAtIndex({
          i: 0,
          len: primaryPoints.length,
          range,
          latestUpdatedAt,
          dateIsos: primaryDateIsos,
          lang: displayLang,
        })} – ${dateAtIndex({
          i: resolvedActiveIndex,
          len: primaryPoints.length,
          range,
          latestUpdatedAt,
          dateIsos: primaryDateIsos,
          lang: displayLang,
        })}`
      : null

  const priceLow = primaryPoints.length >= 2 ? Math.min(...primaryPoints) : null
  const priceHigh = primaryPoints.length >= 2 ? Math.max(...primaryPoints) : null
  const pricePos =
    priceLow != null && priceHigh != null && priceHigh > priceLow && activeValue != null
      ? Math.max(0, Math.min(100, ((activeValue - priceLow) / (priceHigh - priceLow)) * 100))
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
    // The price-history tab lands on the chart; the duplicate dated table was removed.
    { id: "sources", label: t(displayLang, "priceHistory") },
    { id: "market", label: t(displayLang, "sellingNow") },
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

  // Only real, active listings ever reach the page now. When the marketplace
  // flag is off there simply are none, and the rail falls back to its honest
  // "no listings yet" state — the fabricated "Sample Meecard listings" rows are
  // gone from the indexable HTML entirely.
  const meecardListings = useMemo(
    () => ({ rows: marketplaceEnabled ? (listings ?? []) : ([] as CardListing[]) }),
    [listings, marketplaceEnabled],
  )

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
    chartLoading,
    chartError,
    retryChart,
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
    meecardListings,
  }
}
