"use client"

import Link from "next/link"
import { BarChart3, ChevronRight } from "lucide-react"

import { Price } from "@/components/shared/price-inline"
import { t } from "@/lib/i18n"
import { formatCount } from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"

const METRIC_CLASS =
  "panel group flex flex-1 flex-col justify-between gap-1.5 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md hover:[&_.metric-arrow]:translate-x-0.5 hover:[&_.metric-arrow]:text-primary hover:[&_.metric-value]:text-primary"

export function HomeMarketValueCard({
  totalValue,
  totalCards,
}: {
  totalValue: number
  totalCards: number
}) {
  const lang = useUIStore((s) => s.language)

  return (
    <Link href="/market-overview" className={METRIC_CLASS}>
      <span className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-eyebrow">
          <BarChart3 className="size-3.5" />
          {t(lang, "marketValueTotal")}
        </span>
        <ChevronRight
          aria-hidden
          className="metric-arrow size-4 shrink-0 text-muted-foreground/60 transition-all"
        />
      </span>
      <span className="metric-value font-price text-xl font-bold leading-none tabular-nums">
        <Price jpy={totalValue} />
      </span>
      <span className="text-meta">
        {formatCount(totalCards)} {t(lang, "cardUnit")}
      </span>
    </Link>
  )
}
