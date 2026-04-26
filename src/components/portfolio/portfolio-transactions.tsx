"use client"

import { useState } from "react"
import Image from "next/image"
import { ArrowDownCircle, ArrowUpCircle, MinusCircle, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getCardName, getLocale, t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { formatJpyAmount } from "@/lib/utils/currency"
import { useConfirm } from "@/components/shared/confirm-dialog"

export type { TransactionRow } from "@/lib/types/portfolio"
import type { TransactionRow } from "@/lib/types/portfolio"

type TypeConfig = { labelKey: "buy" | "sell" | "remove"; icon: typeof ArrowUpCircle; colorClass: string }

const TYPE_CONFIG: Record<string, TypeConfig> = {
  BUY: { labelKey: "buy", icon: ArrowDownCircle, colorClass: "text-price-up" },
  SELL: { labelKey: "sell", icon: ArrowUpCircle, colorClass: "text-price-down" },
  REMOVE: { labelKey: "remove", icon: MinusCircle, colorClass: "text-muted-foreground" },
}

interface Props {
  transactions: TransactionRow[]
  onDelete?: (txId: number) => Promise<void>
}

export function PortfolioTransactions({ transactions, onDelete }: Props) {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)
  const locale = getLocale(lang)
  const confirm = useConfirm()
  const [deletingId, setDeletingId] = useState<number | null>(null)

  if (transactions.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        {t(lang, "noTransactions")}
      </p>
    )
  }

  const handleDelete = async (tx: TransactionRow) => {
    if (!onDelete) return
    const ok = await confirm({
      title: t(lang, "deleteTransactionTitle"),
      description: t(lang, "deleteTransactionDesc"),
      confirmLabel: t(lang, "deleteFilter"),
      variant: "destructive",
    })
    if (!ok) return
    setDeletingId(tx.id)
    try {
      await onDelete(tx.id)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="divide-y divide-border/20">
      {transactions.map((tx) => {
        const cfg = TYPE_CONFIG[tx.type] ?? TYPE_CONFIG.REMOVE
        const Icon = cfg.icon
        const name = getCardName(lang, tx.card)
        const date = new Date(tx.createdAt)
        const label = t(lang, cfg.labelKey)
        const isDeleting = deletingId === tx.id

        return (
          <div
            key={tx.id}
            className={cn(
              "group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/30",
              isDeleting && "pointer-events-none opacity-40"
            )}
          >
            <Icon className={cn("size-5 shrink-0", cfg.colorClass)} />
            <div className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-muted">
              {tx.card.imageUrl ? (
                <Image src={tx.card.imageUrl} alt={name} fill className="object-contain" sizes="36px" />
              ) : (
                <div className="size-full bg-muted" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{name}</p>
              <p className="text-xs text-muted-foreground">
                {label} ×{tx.quantity}
                {tx.pricePerUnit != null && ` @ ${formatJpyAmount(tx.pricePerUnit, currency)}`}
              </p>
            </div>
            <div className="shrink-0 text-right">
              {tx.pricePerUnit != null && (
                <p className={cn("font-price text-sm font-semibold tabular-nums", cfg.colorClass)}>
                  {tx.type === "BUY" ? "-" : "+"}{formatJpyAmount(tx.pricePerUnit * tx.quantity, currency)}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">
                {date.toLocaleDateString(locale, { day: "numeric", month: "short", year: "2-digit" })}
                {" "}
                {date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            {onDelete && (
              <button
                onClick={() => handleDelete(tx)}
                className="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                title={t(lang, "deleteFilter")}
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
