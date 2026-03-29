"use client"

import dynamic from "next/dynamic"
import { useUIStore } from "@/stores/ui-store"
import { t } from "@/lib/i18n"
import { type AllocationSlice } from "./portfolio-allocation-chart"

const PortfolioHistoryChart = dynamic(
  () => import("./portfolio-history-chart").then((m) => m.PortfolioHistoryChart),
  { ssr: false, loading: () => <div className="h-48 animate-pulse rounded-lg bg-muted" /> }
)

const PortfolioAllocationChart = dynamic(
  () => import("./portfolio-allocation-chart").then((m) => m.PortfolioAllocationChart),
  { ssr: false, loading: () => <div className="h-48 animate-pulse rounded-lg bg-muted" /> }
)

interface PortfolioChartsProps {
  history: { label: string; value: number }[]
  allocation: AllocationSlice[]
}

export function PortfolioCharts({ history, allocation }: PortfolioChartsProps) {
  const lang = useUIStore((s) => s.language)
  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="panel p-5 lg:col-span-7">
        <p className="mb-4 text-sm font-semibold">{t(lang, "history")}</p>
        <PortfolioHistoryChart data={history} />
      </div>
      <div className="panel p-5 lg:col-span-5">
        <p className="mb-4 text-sm font-semibold">{t(lang, "allocation")}</p>
        <PortfolioAllocationChart data={allocation} />
      </div>
    </div>
  )
}
