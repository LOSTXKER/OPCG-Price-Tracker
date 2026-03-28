"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { PriceChart, type PriceChartStats } from "@/components/cards/price-chart"

type PriceRow = {
  scrapedAt: string
  priceJpy: number | null
  priceThb?: number | null
  source?: string
}

export type CardDetailPriceChartProps = {
  cardCode: string
  data: PriceRow[]
  onPeriodChange?: (period: string) => void
}

function computeLocalStats(rows: PriceRow[]): PriceChartStats | null {
  const jpyPrices = rows
    .filter((p) => p.priceJpy != null)
    .map((p) => p.priceJpy!)
  if (jpyPrices.length === 0) return null
  return {
    high: Math.max(...jpyPrices),
    low: Math.min(...jpyPrices),
    avg: Math.round(
      jpyPrices.reduce((a, b) => a + b, 0) / jpyPrices.length,
    ),
  }
}

export function CardDetailPriceChart({
  cardCode,
  data: initialData,
  onPeriodChange: onPeriodChangeExternal,
}: CardDetailPriceChartProps) {
  const [period, setPeriod] = useState("30d")
  const [data, setData] = useState<PriceRow[]>(initialData)
  const [stats, setStats] = useState<PriceChartStats | null>(() =>
    computeLocalStats(initialData),
  )
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const fetchPriceData = useCallback(
    async (p: string) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setLoading(true)
      try {
        const res = await fetch(
          `/api/cards/${encodeURIComponent(cardCode)}/prices?period=${p}`,
          { signal: controller.signal },
        )
        if (!res.ok) throw new Error("Failed to fetch")
        const json = await res.json()
        const rows: PriceRow[] = (json.prices ?? []).map(
          (r: Record<string, unknown>) => ({
            scrapedAt: r.scrapedAt as string,
            priceJpy: r.priceJpy as number | null,
            priceThb: r.priceThb as number | null,
            source: r.source as string | undefined,
          }),
        )
        setData(rows)
        setStats({
          high: (json.high as number) ?? 0,
          low: (json.low as number) ?? 0,
          avg: (json.avg as number) ?? 0,
        })
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
      data={data}
      period={period}
      onPeriodChange={handlePeriodChange}
      stats={stats}
      loading={loading}
    />
  )
}
