"use client"

import { PortfolioHistoryChart } from "./portfolio-history-chart"
import { PortfolioAllocationChart, type AllocationSlice } from "./portfolio-allocation-chart"
import { useUIStore } from "@/stores/ui-store"
import { t } from "@/lib/i18n"

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
