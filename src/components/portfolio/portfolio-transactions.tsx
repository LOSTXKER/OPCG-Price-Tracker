"use client"

import Image from "next/image"
import { ArrowDownCircle, ArrowUpCircle, MinusCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { getCardName, getLocale, t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { formatJpyAmount } from "@/lib/utils/currency"

export type TransactionRow = {
  id: number
  type: string
  quantity: number
  pricePerUnit: number | null
  note: string | null
  createdAt: string
  card: {
    cardCode: string
    nameJp: string
    nameEn: string | null
    imageUrl: string | null
    rarity: string
  }
}

type TypeConfig = { labelKey: "buy" | "sell" | "remove"; icon: typeof ArrowUpCircle; colorClass: string }

const TYPE_CONFIG: Record<string, TypeConfig> = {
  BUY: { labelKey: "buy", icon: ArrowDownCircle, colorClass: "text-price-up" },
  SELL: { labelKey: "sell", icon: ArrowUpCircle, colorClass: "text-price-down" },
  REMOVE: { labelKey: "remove", icon: MinusCircle, colorClass: "text-muted-foreground" },
}

export function PortfolioTransactions({ transactions }: { transactions: TransactionRow[] }) {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)
  const locale = getLocale(lang)

  if (transactions.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        {t(lang, "noTransactions")}
      </p>
    )
  }

  return (
    <div className="space-y-1">
      {transactions.map((tx) => {
        const cfg = TYPE_CONFIG[tx.type] ?? TYPE_CONFIG.REMOVE
        const Icon = cfg.icon
        const name = getCardName(lang, tx.card)
        const date = new Date(tx.createdAt)
        const label = t(lang, cfg.labelKey)

        return (
          <div key={tx.id} className="flex items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-muted/40">
            <Icon className={cn("size-5 shrink-0", cfg.colorClass)} />
            <div className="relative size-8 shrink-0 overflow-hidden rounded bg-muted">
              {tx.card.imageUrl ? (
                <Image src={tx.card.imageUrl} alt={name} fill className="object-contain" sizes="32px" />
              ) : (
                <div className="size-full bg-muted" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{name}</p>
              <p className="text-xs text-muted-foreground">
                {label} ×{tx.quantity}
                {tx.pricePerUnit != null && ` @ ${formatJpyAmount(tx.pricePerUnit, currency)}`}
              </p>
            </div>
            <div className="shrink-0 text-right">
              {tx.pricePerUnit != null && (
                <p className={cn("font-price text-sm font-medium tabular-nums", cfg.colorClass)}>
                  {tx.type === "BUY" ? "-" : "+"}{formatJpyAmount(tx.pricePerUnit * tx.quantity, currency)}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">
                {date.toLocaleDateString(locale, { day: "numeric", month: "short", year: "2-digit" })}
                {" "}
                {date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
