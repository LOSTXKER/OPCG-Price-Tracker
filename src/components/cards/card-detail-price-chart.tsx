"use client"

import { useMemo, useState } from "react"

import { PriceChart } from "@/components/cards/price-chart"

export type CardDetailPriceChartProps = {
  data: {
    scrapedAt: string
    priceJpy: number
    priceThb?: number | null
  }[]
}

export function CardDetailPriceChart({ data }: CardDetailPriceChartProps) {
  const [period, setPeriod] = useState("30d")

  const filtered = useMemo(() => {
    if (period === "7d") {
      const cutoff = Date.now() - 7 * 86_400_000
      return data.filter((d) => new Date(d.scrapedAt).getTime() >= cutoff)
    }
    return data
  }, [data, period])

  return <PriceChart data={filtered} period={period} onPeriodChange={setPeriod} />
}
