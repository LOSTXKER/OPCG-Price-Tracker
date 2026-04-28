"use client"

import Link from "next/link"
import { Briefcase } from "lucide-react"
import { useEffect, useState } from "react"

import { Price } from "@/components/shared/price-inline"
import { useAuthState } from "@/hooks/use-auth-state"
import { invalidateSettings } from "@/hooks/use-settings"
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

const CARD_BASE = "group flex flex-col rounded-xl border p-4 transition-colors"
const CARD_STYLE = cn(
  CARD_BASE,
  "border-border/40 bg-gradient-to-br from-card to-muted/20 hover:border-border",
)

export function HomePortfolioPreview() {
  const lang = useUIStore((s) => s.language)
  const { authed } = useAuthState()
  const [data, setData] = useState<PortfolioSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [empty, setEmpty] = useState(false)

  useEffect(() => {
    if (authed !== true) {
      setLoading(false)
      return
    }
    fetch("/api/portfolio")
      .then(async (r) => {
        if (r.status === 401) {
          invalidateSettings()
          const supabase = createClient()
          await supabase.auth.signOut()
          return null
        }
        return r.ok ? r.json() : null
      })
      .then((json) => {
        if (!json?.portfolios?.length) {
          setEmpty(true)
          setLoading(false)
          return
        }
        setData(summarizePortfolios(json.portfolios))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [authed])

  if (authed === null || loading) {
    return (
      <div className={CARD_STYLE}>
        <div className="flex items-center gap-2">
          <Briefcase className="size-4 text-muted-foreground" />
          <span className="text-xs font-semibold">{t(lang, "myPortfolio")}</span>
        </div>
        <div className="mt-2 h-7 w-24 animate-pulse rounded bg-muted" />
        <div className="mt-1.5 h-4 w-28 animate-pulse rounded bg-muted" />
      </div>
    )
  }

  if (authed === false) {
    return (
      <Link href="/portfolio" className={CARD_STYLE}>
        <div className="flex items-center gap-2">
          <Briefcase className="size-4 text-muted-foreground" />
          <span className="text-xs font-semibold">{t(lang, "myPortfolio")}</span>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{t(lang, "loginToTrack")}</p>
      </Link>
    )
  }

  if (empty || !data) {
    return (
      <Link href="/portfolio" className={CARD_STYLE}>
        <div className="flex items-center gap-2">
          <Briefcase className="size-4 text-muted-foreground" />
          <span className="text-xs font-semibold">{t(lang, "myPortfolio")}</span>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{t(lang, "createOne")}</p>
      </Link>
    )
  }

  return (
    <Link href="/portfolio" className={CARD_STYLE}>
      <div className="flex items-center gap-2">
        <Briefcase className="size-4 text-muted-foreground" />
        <span className="text-xs font-semibold">{t(lang, "myPortfolio")}</span>
      </div>
      <p className="mt-2 font-price text-xl font-bold leading-none">
        <Price jpy={data.totalValue} />
      </p>
      <div className="mt-auto flex items-center gap-2 pt-1.5 text-xs">
        {data.hasCostBasis && (
          <span
            className={cn(
              "font-price font-bold",
              data.unrealizedPnl >= 0 ? "text-price-up" : "text-price-down",
            )}
          >
            {data.unrealizedPnl >= 0 ? "+" : ""}
            <Price jpy={data.unrealizedPnl} /> ({data.unrealizedPnl >= 0 ? "+" : ""}
            {formatPct(data.unrealizedPnlPct)}%)
          </span>
        )}
        <span className="text-muted-foreground">
          {formatCount(data.totalCards)} {t(lang, "cardUnit")}
        </span>
      </div>
    </Link>
  )
}
