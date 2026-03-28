"use client"

import { PortfolioHistoryChart } from "./portfolio-history-chart"
import { PortfolioAllocationChart, type AllocationSlice } from "./portfolio-allocation-chart"

interface PortfolioChartsProps {
  history: { label: string; value: number }[]
  allocation: AllocationSlice[]
}

export function PortfolioCharts({ history, allocation }: PortfolioChartsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="panel p-5 lg:col-span-7">
        <p className="mb-4 text-sm font-semibold">ประวัติย้อนหลัง</p>
        <PortfolioHistoryChart data={history} />
      </div>
      <div className="panel p-5 lg:col-span-5">
        <p className="mb-4 text-sm font-semibold">สัดส่วนการถือ</p>
        <PortfolioAllocationChart data={allocation} />
      </div>
    </div>
  )
}
