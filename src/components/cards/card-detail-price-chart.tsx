"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { PriceChart, type ChartSeriesDef, type MergedChartRow } from "@/components/cards/price-chart"
import type { ChartSourceOption } from "@/lib/data/card-detail"
import { t } from "@/lib/i18n"
import { jpyToDisplayValue, usdToDisplayValue, type Currency } from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"

const TREND_UP = "#22C55E"
const TREND_DOWN = "#EF4444"

function getTrendColor(data: MergedChartRow[], dataKey: string): string {
  let first: number | undefined
  let last: number | undefined
  for (const row of data) {
    const v = row[dataKey]
    if (typeof v === "number") {
      if (first === undefined) first = v
      last = v
    }
  }
  if (first === undefined || last === undefined) return TREND_UP
  return last >= first ? TREND_UP : TREND_DOWN
}

const SERIES_DATAKEYS: Record<string, string> = {
  YUYUTEI: "yuyutei",
  SNKRDUNK_RAW: "snkrdunkRaw",
  SNKRDUNK_PSA10: "psa10",
}

type PriceRow = {
  scrapedAt: string
  priceJpy: number | null
  priceThb?: number | null
  priceUsd?: number | null
  source?: string
  gradeCondition?: string | null
}

export type CardDetailPriceChartProps = {
  cardCode: string
  data: PriceRow[]
  availableSources?: ChartSourceOption[]
  priceMode?: "raw" | "psa10"
  onPeriodChange?: (period: string) => void
}

function classifyRow(row: PriceRow): string | null {
  if (row.source === "YUYUTEI") return "YUYUTEI"
  if (row.source === "SNKRDUNK" && !row.gradeCondition) return "SNKRDUNK_RAW"
  if (row.source === "SNKRDUNK" && row.gradeCondition === "PSA 10") return "SNKRDUNK_PSA10"
  return null
}

function buildMergedData(
  rows: PriceRow[],
  seriesIds: string[],
  displayCurrency: Currency,
): MergedChartRow[] {
  const buckets = new Map<string, MergedChartRow>()

  for (const row of rows) {
    const seriesId = classifyRow(row)
    if (!seriesId || !seriesIds.includes(seriesId)) continue

    const dataKey = SERIES_DATAKEYS[seriesId]
    let value: number | null = null

    if (seriesId === "YUYUTEI" && row.priceJpy != null) {
      value = jpyToDisplayValue(row.priceJpy, displayCurrency)
    } else if (
      (seriesId === "SNKRDUNK_RAW" || seriesId === "SNKRDUNK_PSA10") &&
      row.priceUsd != null
    ) {
      value = usdToDisplayValue(row.priceUsd, displayCurrency)
    }

    if (value == null) return []

    const ts = row.scrapedAt
    const existing = buckets.get(ts)
    if (existing) {
      existing[dataKey] = value
    } else {
      buckets.set(ts, { scrapedAt: ts, [dataKey]: value })
    }
  }

  return Array.from(buckets.values()).sort(
    (a, b) => new Date(a.scrapedAt).getTime() - new Date(b.scrapedAt).getTime(),
  )
}

export function CardDetailPriceChart({
  cardCode,
  data: initialData,
  availableSources,
  priceMode = "raw",
  onPeriodChange: onPeriodChangeExternal,
}: CardDetailPriceChartProps) {
  const displayCurrency = useUIStore((s) => s.currency) as Currency
  const lang = useUIStore((s) => s.language)

  const seriesLabels = useMemo<Record<string, string>>(() => ({
    YUYUTEI: t(lang, "marketPrice"),
    SNKRDUNK_RAW: t(lang, "lastSold"),
    SNKRDUNK_PSA10: t(lang, "lastSold"),
  }), [lang])

  const allSeriesIds = useMemo(() => {
    if (!availableSources || availableSources.length === 0) return ["YUYUTEI"]
    return availableSources.map((s) => s.id)
  }, [availableSources])

  const activeSeriesIds = useMemo(() => {
    if (priceMode === "psa10") {
      return allSeriesIds.filter((id) => id === "SNKRDUNK_PSA10")
    }
    return allSeriesIds.filter((id) => id === "YUYUTEI")
  }, [allSeriesIds, priceMode])

  const [period, setPeriod] = useState("30d")
  const [data, setData] = useState<PriceRow[]>(initialData)
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const mergedData = useMemo(
    () => buildMergedData(data, allSeriesIds, displayCurrency),
    [data, allSeriesIds, displayCurrency],
  )

  const stats = useMemo(() => {
    const primaryKey = activeSeriesIds[0] ? (SERIES_DATAKEYS[activeSeriesIds[0]] ?? activeSeriesIds[0]) : null
    if (!primaryKey || mergedData.length === 0) return null

    const values: number[] = []
    for (const row of mergedData) {
      const v = row[primaryKey]
      if (typeof v === "number") values.push(v)
    }
    if (values.length === 0) return null

    const high = Math.max(...values)
    const low = Math.min(...values)
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    const first = values[0]
    const last = values[values.length - 1]
    const change = first ? ((last - first) / first) * 100 : 0

    return { high, low, avg, change }
  }, [mergedData, activeSeriesIds])

  const seriesDefs = useMemo<ChartSeriesDef[]>(
    () =>
      activeSeriesIds.map((id) => {
        const dataKey = SERIES_DATAKEYS[id] ?? id
        return {
          id,
          label: seriesLabels[id] ?? id,
          color: getTrendColor(mergedData, dataKey),
          dataKey,
        }
      }),
    [activeSeriesIds, seriesLabels, mergedData],
  )

  const visibleSeries = useMemo(
    () => new Set(activeSeriesIds),
    [activeSeriesIds],
  )

  const fetchPriceData = useCallback(
    async (p: string) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setLoading(true)
      try {
        const params = new URLSearchParams({ period: p })
        const res = await fetch(
          `/api/cards/${encodeURIComponent(cardCode)}/prices?${params}`,
          { signal: controller.signal },
        )
        if (!res.ok) throw new Error("Failed to fetch")
        const json = await res.json()
        const rows: PriceRow[] = (json.prices ?? []).map(
          (r: Record<string, unknown>) => ({
            scrapedAt: r.scrapedAt as string,
            priceJpy: r.priceJpy as number | null,
            priceThb: r.priceThb as number | null,
            priceUsd: r.priceUsd as number | null,
            source: r.source as string | undefined,
            gradeCondition: (r.gradeCondition as string | null) ?? null,
          }),
        )
        setData(rows)
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return
      } finally {
        setLoading(false)
      }
    },
    [cardCode],
  )

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  const handlePeriodChange = useCallback(
    (p: string) => {
      setPeriod(p)
      onPeriodChangeExternal?.(p)
      fetchPriceData(p)
    },
    [fetchPriceData, onPeriodChangeExternal],
  )

  return (
    <PriceChart
      mergedData={mergedData}
      series={seriesDefs}
      visibleSeries={visibleSeries}
      period={period}
      onPeriodChange={handlePeriodChange}
      loading={loading}
      stats={stats}
    />
  )
}
