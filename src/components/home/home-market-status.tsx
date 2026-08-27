"use client"

import Link from "next/link"
import {
  ArrowLeftRight,
  ArrowRight,
  Banknote,
  Crown,
  Layers3,
  type LucideIcon,
} from "lucide-react"
import type { ReactNode } from "react"

import { HomeFeaturedCard, type HomeFeaturedCardData } from "./sections/featured-card"
import { Price } from "@/components/shared/price-inline"
import { Surface } from "@/components/ui/surface"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { formatCount } from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"

export function HomeMarketStatus({
  card,
  totalCards,
  totalValue,
  exchangeRate,
  className,
}: {
  card: HomeFeaturedCardData | null
  totalCards: number
  totalValue: number
  exchangeRate: number
  className?: string
}) {
  const lang = useUIStore((s) => s.language)

  return (
    <Surface
      as="section"
      variant="hero"
      aria-label={t(lang, "marketStats")}
      data-slot="home-market-status"
      className={cn("h-full overflow-hidden", className)}
    >
      <div className="grid h-full sm:grid-cols-[minmax(0,1.2fr)_minmax(12rem,0.8fr)] lg:grid-cols-2">
        <div className="min-w-0">
          {card ? (
            <HomeFeaturedCard card={card} />
          ) : (
            <div
              className="flex h-full flex-col justify-center p-5"
              data-slot="highest-value-unavailable"
            >
              <p className="flex items-center gap-1.5 text-eyebrow">
                <Crown className="size-3.5 text-primary" aria-hidden />
                {t(lang, "highestValue")}
              </p>
              <p className="mt-2 font-price text-h3 text-foreground">—</p>
            </div>
          )}
        </div>

        <div
          className="grid min-w-0 grid-rows-3 divide-y divide-hair border-t border-hair sm:border-l sm:border-t-0"
          data-slot="home-market-metrics"
        >
          <MarketMetric
            icon={Banknote}
            label={t(lang, "totalValue")}
            href="/opcg/market-overview"
            slot="total-value"
            value={<Price jpy={totalValue} className="text-foreground" />}
          />
          <MarketMetric
            icon={Layers3}
            label={t(lang, "totalCards")}
            slot="total-cards"
            value={formatCount(totalCards)}
          />
          <MarketMetric
            icon={ArrowLeftRight}
            label="JPY/THB"
            slot="exchange-rate"
            value={exchangeRate.toFixed(3)}
          />
        </div>
      </div>
    </Surface>
  )
}

function MarketMetric({
  icon: Icon,
  label,
  value,
  href,
  slot,
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  href?: string
  slot: string
}) {
  const content = (
    <>
      <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
        <Icon className="size-4 shrink-0" aria-hidden />
        <span className="truncate text-label">{label}</span>
        {href && (
          <ArrowRight
            className="ml-auto size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        )}
      </div>
      <div className="mt-1 truncate font-price text-h4 tabular-nums text-foreground">
        {value}
      </div>
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        data-slot={slot}
        className="group ease-chrome flex min-h-11 min-w-0 flex-col justify-center px-4 py-2.5 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring lg:px-3"
      >
        {content}
      </Link>
    )
  }

  return (
    <div
      data-slot={slot}
      className="flex min-h-11 min-w-0 flex-col justify-center px-4 py-2.5 lg:px-3"
    >
      {content}
    </div>
  )
}
