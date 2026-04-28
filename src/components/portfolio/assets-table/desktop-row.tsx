"use client"

import { memo } from "react"
import Image from "next/image"
import Link from "next/link"

import { Price } from "@/components/shared/price-inline"
import { getCardName, type Language } from "@/lib/i18n"
import type { AssetRow } from "@/lib/types/portfolio"
import { cn } from "@/lib/utils"
import { formatJpyAmount, formatPct } from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"

import { AssetActionMenu } from "./action-menu"
import { holdingValue, pnlCalc } from "./utils"

export const AssetRowComponent = memo(function AssetRowComponent({
  row,
  lang,
  onEdit,
  onRemove,
  hideBalance = false,
}: {
  row: AssetRow
  lang: Language
  onEdit: () => void
  onRemove: () => void
  hideBalance?: boolean
}) {
  const currency = useUIStore((s) => s.currency)
  const name = getCardName(lang as "TH" | "EN" | "JP", row)
  const value = holdingValue(row)
  const pnlResult = pnlCalc(row)

  return (
    <tr className="group cursor-pointer border-b border-border/10 transition-colors hover:bg-muted/30">
      <td className="py-3.5 pl-5 pr-3 align-middle">
        <Link href={`/cards/${row.cardCode}`} className="flex items-center gap-3.5">
          <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted/60 ring-1 ring-border/20">
            {row.imageUrl ? (
              <Image
                src={row.imageUrl}
                alt={name}
                fill
                className="object-contain"
                sizes="44px"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-overlay text-muted-foreground/40">
                {row.baseCode ?? row.cardCode}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">{name}</p>
            <p className="mt-0.5 font-mono text-meta text-muted-foreground/60">
              {row.baseCode ?? row.cardCode}
              <span className="ml-1.5 font-sans text-foreground/40">×{row.quantity}</span>
            </p>
          </div>
        </Link>
      </td>
      <td className="py-3.5 pr-3 text-right align-middle">
        <span className="font-price text-sm font-bold tabular-nums">
          {hideBalance ? "••••" : <Price jpy={value} />}
        </span>
      </td>
      <td className="py-3.5 pr-3 text-right align-middle">
        {hideBalance ? (
          <span className="font-price text-xs text-muted-foreground/40">••••</span>
        ) : row.purchasePrice != null ? (
          <span className="font-price text-sm tabular-nums text-muted-foreground">
            {formatJpyAmount(row.purchasePrice * row.quantity, currency)}
          </span>
        ) : (
          <span className="font-price text-xs text-muted-foreground/40">—</span>
        )}
      </td>
      <td className="py-3.5 pr-3 text-right align-middle">
        {hideBalance ? (
          <span className="font-price text-xs text-muted-foreground/40">••••</span>
        ) : pnlResult ? (
          <p
            className={cn(
              "font-price text-sm font-bold leading-tight tabular-nums",
              pnlResult.pnl >= 0 ? "text-price-up" : "text-price-down",
            )}
          >
            {pnlResult.pnl >= 0 ? "+" : ""}
            {formatJpyAmount(pnlResult.pnl, currency)}
            <span
              className={cn(
                "ml-1 font-price text-micro font-normal tabular-nums",
                pnlResult.pct >= 0 ? "text-price-up/60" : "text-price-down/60",
              )}
            >
              ({pnlResult.pct >= 0 ? "+" : ""}
              {formatPct(pnlResult.pct)}%)
            </span>
          </p>
        ) : (
          <span className="font-price text-xs text-muted-foreground/40">—</span>
        )}
      </td>
      <td className="py-3.5 pr-5 text-right align-middle">
        <div className="flex items-center justify-end">
          <AssetActionMenu lang={lang} onEdit={onEdit} onRemove={onRemove} />
        </div>
      </td>
    </tr>
  )
})
