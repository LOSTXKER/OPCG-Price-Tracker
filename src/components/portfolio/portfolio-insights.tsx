"use client"

import dynamic from "next/dynamic"
import Image from "next/image"
import Link from "next/link"
import { Layers, TrendingUp, Calculator, Target } from "lucide-react"
import { Surface } from "@/components/ui/surface"
import { useUIStore } from "@/stores/ui-store"
import { t } from "@/lib/i18n"
import { formatJpyAmount, formatPct } from "@/lib/utils/currency"
import type { AllocationSlice } from "@/lib/types/portfolio"

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

const PortfolioAllocationChart = dynamic(
  () =>
    import("./portfolio-allocation-chart").then(
      (m) => m.PortfolioAllocationChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-52 animate-pulse rounded-lg bg-muted" />
    ),
  },
)

interface PortfolioInsightsProps {
  history: { label: string; value: number }[]
  allocation: AllocationSlice[]
}

const KPI_CONFIG = [
  { key: "totalCards" as const, icon: Layers },
  { key: "portfolioValue" as const, icon: TrendingUp },
  { key: "avgPerCard" as const, icon: Calculator },
  { key: "topConcentration" as const, icon: Target },
] as const

export function PortfolioInsights({ history, allocation }: PortfolioInsightsProps) {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)

  const totalValue = allocation.reduce((s, a) => s + a.value, 0)
  const topHolding = allocation.length > 0 ? allocation[0] : null
  const uniqueCards = allocation.length
  const concentrationPct = topHolding ? topHolding.percent : 0

  const kpiValues = [
    uniqueCards.toString(),
    formatJpyAmount(totalValue, currency),
    uniqueCards > 0 ? formatJpyAmount(totalValue / uniqueCards, currency) : "—",
    concentrationPct > 0 ? `${formatPct(concentrationPct)}%` : "—",
  ]

  const kpiIsPrice = [false, true, true, false]

  return (
    <div className="space-y-4">
      {/* KPI cards — minimal, matches hero language */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {KPI_CONFIG.map(({ key, icon: Icon }, i) => (
          <Surface key={key} variant="panel" className="p-4 ring-1 ring-border/30">
            <div className="flex items-center gap-1.5">
              <Icon className="size-3.5 text-muted-foreground/60" />
              <p className="text-eyebrow">{t(lang, key)}</p>
            </div>
            <p className={`mt-1.5 text-xl font-bold tabular-nums sm:text-2xl ${kpiIsPrice[i] ? "font-price" : ""}`}>
              {kpiValues[i]}
            </p>
          </Surface>
        ))}
      </div>

      {/* History chart */}
      <Surface variant="panel" className="p-4 sm:p-5">
        <p className="mb-4 text-eyebrow">
          {t(lang, "history")}
        </p>
        <PortfolioHistoryChart data={history} />
      </Surface>

      {/* Allocation + Holdings merged panel */}
      <Surface variant="panel" className="p-4 sm:p-5">
        <p className="mb-4 text-eyebrow">
          {t(lang, "allocation")}
        </p>
        <div className="flex flex-col gap-5 lg:flex-row lg:gap-6">
          {/* Donut chart */}
          <div className="shrink-0 lg:w-auto">
            <PortfolioAllocationChart data={allocation} totalValue={totalValue} />
          </div>

          {/* Holdings breakdown inline */}
          {allocation.length > 0 && (
            <div className="min-w-0 flex-1">
              <p className="mb-2 text-eyebrow lg:mt-0">
                {t(lang, "holdingsBreakdown")}
              </p>
              <div className="divide-y divide-border/20">
                {allocation.map((item, i) => (
                  <Link
                    key={`${item.name}-${i}`}
                    href={item.cardCode ? `/cards/${item.cardCode}` : "#"}
                    className="flex items-center gap-3 rounded-lg px-1 py-2.5 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex size-8 items-center justify-center rounded-lg text-xs font-bold text-muted-foreground">
                      {i + 1}
                    </div>
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={32}
                        height={44}
                        className="size-10 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex size-10 items-center justify-center rounded-md bg-muted text-meta">
                        ?
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      {item.cardCode && (
                        <p className="text-meta">{item.cardCode}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-price text-sm font-semibold tabular-nums">
                        {formatJpyAmount(item.value, currency)}
                      </p>
                      <p className="text-meta tabular-nums">
                        {formatPct(item.percent)}%
                      </p>
                    </div>
                    {allocation.length > 1 && (
                      <div className="hidden w-24 sm:block">
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${Math.min(item.percent, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </Surface>
    </div>
  )
}
