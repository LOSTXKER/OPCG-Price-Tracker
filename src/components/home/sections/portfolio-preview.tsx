"use client"

import Link from "next/link"
import { Briefcase, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"

import { Price } from "@/components/shared/price-inline"
import { useAuthState } from "@/hooks/use-auth-state"
import { invalidateSettings } from "@/hooks/use-settings"
import { ApiError, apiGet } from "@/lib/api/client"
import { t } from "@/lib/i18n"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { formatCount, formatPct } from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"

type PortfolioItem = {
  quantity: number
  purchasePrice: number | null
  card: { latestPriceJpy: number | null }
}

type PortfolioSummary = {
  totalValue: number
  totalCards: number
  unrealizedPnl: number
  unrealizedPnlPct: number
  hasCostBasis: boolean
}

function summarizePortfolios(portfolios: { items: PortfolioItem[] }[]): PortfolioSummary {
  let totalValue = 0
  let totalCost = 0
  let totalCards = 0
  let hasCostBasis = false

  for (const p of portfolios) {
    for (const it of p.items) {
      const px = it.card.latestPriceJpy ?? 0
      const qty = it.quantity
      totalValue += px * qty
      totalCards += qty
      if (it.purchasePrice != null && it.purchasePrice > 0) {
        hasCostBasis = true
        totalCost += it.purchasePrice * qty
      }
    }
  }

  const unrealizedPnl = hasCostBasis ? totalValue - totalCost : 0
  const unrealizedPnlPct = hasCostBasis && totalCost > 0 ? (unrealizedPnl / totalCost) * 100 : 0

  return { totalValue, totalCards, unrealizedPnl, unrealizedPnlPct, hasCostBasis }
}

const METRIC_CLASS =
  "panel group flex flex-1 flex-col justify-between gap-1.5 p-4 motion-base hover:-translate-y-0.5 hover:[&_.metric-arrow]:translate-x-0.5 hover:[&_.metric-arrow]:text-primary hover:[&_.metric-value]:text-primary"

function MetricHeader({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-eyebrow">
        <Briefcase className="size-3.5" />
        {children}
      </span>
      <ChevronRight
        aria-hidden
        className="metric-arrow size-4 shrink-0 text-muted-foreground/60 motion-base"
      />
    </span>
  )
}

export function HomePortfolioPreview() {
  const lang = useUIStore((s) => s.language)
  const { authed } = useAuthState()
  const [data, setData] = useState<PortfolioSummary | null>(null)
  const [empty, setEmpty] = useState(false)
  const [fetchDone, setFetchDone] = useState(false)

  useEffect(() => {
    if (authed !== true) return
    let cancelled = false
    ;(async () => {
      try {
        const json = await apiGet<{ portfolios?: { items: PortfolioItem[] }[] }>("/api/portfolio")
        if (cancelled) return
        if (!json.portfolios?.length) {
          setEmpty(true)
        } else {
          setData(summarizePortfolios(json.portfolios))
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          invalidateSettings()
          const supabase = createClient()
          await supabase.auth.signOut()
        }
        /* swallow other errors */
      } finally {
        if (!cancelled) setFetchDone(true)
      }
    })()
    return () => { cancelled = true }
  }, [authed])

  const loading = authed === null || (authed === true && !fetchDone)

  if (loading) {
    return (
      <div className={METRIC_CLASS}>
        <MetricHeader>{t(lang, "myPortfolio")}</MetricHeader>
        <div className="h-6 w-24 animate-pulse rounded bg-muted" />
        <div className="h-3 w-20 animate-pulse rounded bg-muted" />
      </div>
    )
  }

  if (authed === false) {
    return (
      <Link href="/portfolio" className={METRIC_CLASS}>
        <MetricHeader>{t(lang, "myPortfolio")}</MetricHeader>
        <span className="metric-value font-price text-xl font-bold leading-none">—</span>
        <span className="text-meta">{t(lang, "loginToTrack")}</span>
      </Link>
    )
  }

  if (empty || !data) {
    return (
      <Link href="/portfolio" className={METRIC_CLASS}>
        <MetricHeader>{t(lang, "myPortfolio")}</MetricHeader>
        <span className="metric-value font-price text-xl font-bold leading-none">—</span>
        <span className="text-meta">{t(lang, "createOne")}</span>
      </Link>
    )
  }

  return (
    <Link href="/portfolio" className={METRIC_CLASS}>
      <MetricHeader>{t(lang, "myPortfolio")}</MetricHeader>
      <span className="metric-value font-price text-xl font-bold leading-none tabular-nums">
        <Price jpy={data.totalValue} />
      </span>
      <span className="flex items-center gap-1.5 text-meta">
        {data.hasCostBasis && (
          <span
            className={cn(
              "font-price font-semibold tabular-nums",
              data.unrealizedPnl >= 0 ? "text-price-up" : "text-price-down",
            )}
          >
            {data.unrealizedPnl >= 0 ? "+" : ""}
            {formatPct(data.unrealizedPnlPct)}%
          </span>
        )}
        <span>
          {formatCount(data.totalCards)} {t(lang, "cardUnit")}
        </span>
      </span>
    </Link>
  )
}
