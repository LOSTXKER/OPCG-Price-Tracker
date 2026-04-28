"use client"

import Link from "next/link"
import { BarChart3 } from "lucide-react"

import { Price } from "@/components/shared/price-inline"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { formatCount } from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"

const CARD_BASE = "group flex flex-col rounded-xl border p-4 transition-colors"
const CARD_STYLE = cn(
  CARD_BASE,
  "border-border/40 bg-gradient-to-br from-card to-muted/20 hover:border-border",
)

export function HomeMarketValueCard({
  totalValue,
  totalCards,
}: {
  totalValue: number
  totalCards: number
}) {
  const lang = useUIStore((s) => s.language)

  return (
    <Link href="/market-overview" className={CARD_STYLE}>
      <div className="flex items-center gap-2">
        <BarChart3 className="size-4 text-muted-foreground" />
        <span className="text-xs font-semibold">{t(lang, "marketValueTotal")}</span>
      </div>
      <p className="mt-2 font-price text-xl font-bold leading-none">
        <Price jpy={totalValue} />
      </p>
      <p className="mt-auto pt-1.5 text-meta">
        {formatCount(totalCards)} {t(lang, "cardUnit")}
      </p>
    </Link>
  )
}
