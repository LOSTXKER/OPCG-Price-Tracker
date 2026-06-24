"use client"

import dynamic from "next/dynamic"
import { Surface } from "@/components/ui/surface"
import { useUIStore } from "@/stores/ui-store"
import { t } from "@/lib/i18n"

const PortfolioHistoryChart = dynamic(
  () =>
    import("./portfolio-history-chart").then((m) => m.PortfolioHistoryChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-52 animate-pulse rounded-lg bg-muted" />
    ),
  },
)

interface PortfolioChartsProps {
  history: { label: string; value: number }[]
}

export function PortfolioCharts({ history }: PortfolioChartsProps) {
  const lang = useUIStore((s) => s.language)

  return (
    <Surface variant="panel" className="p-4 sm:p-5">
      <p className="mb-4 text-eyebrow">
        {t(lang, "history")}
      </p>
      <PortfolioHistoryChart data={history} />
    </Surface>
  )
}
