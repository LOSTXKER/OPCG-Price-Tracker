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

export const MobileAssetCard = memo(function MobileAssetCard({
  row,
  lang,
  onEdit,
  onRemove,
}: {
  row: AssetRow
  lang: Language
  onEdit: () => void
  onRemove: () => void
}) {
  const currency = useUIStore((s) => s.currency)
  const name = getCardName(lang as "TH" | "EN" | "JP", row)
  const value = holdingValue(row)
  const pnlResult = pnlCalc(row)

  return (
    <div className="px-4 py-3.5">
      <div className="flex gap-3">
        <Link href={`/cards/${row.cardCode}`} className="shrink-0">
          <div className="relative size-14 overflow-hidden rounded-lg bg-muted">
            {row.imageUrl ? (
              <Image
                src={row.imageUrl}
                alt={name}
                fill
                className="object-contain"
                sizes="56px"
              />
            ) : (
              <div className="size-full bg-muted" />
            )}
          </div>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight">{name}</p>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {row.baseCode ?? row.cardCode}
                <span className="ml-1.5 text-foreground/60">×{row.quantity}</span>
              </p>
            </div>
            <div className="flex shrink-0 items-center">
              <AssetActionMenu lang={lang} onEdit={onEdit} onRemove={onRemove} />
            </div>
          </div>
          <div className="mt-2 flex items-end justify-between gap-2">
            <div>
              <p className="font-price text-sm font-bold tabular-nums">
                <Price jpy={value} />
              </p>
              {row.currentPrice != null && (
                <p className="font-price text-meta tabular-nums">
                  @ <Price jpy={row.currentPrice} />
                </p>
              )}
            </div>
            {pnlResult && (
              <div className="text-right">
                <p
                  className={cn(
                    "font-price text-sm font-semibold tabular-nums",
                    pnlResult.pnl >= 0 ? "text-price-up" : "text-price-down",
                  )}
                >
                  {pnlResult.pnl >= 0 ? "+" : ""}
                  {formatJpyAmount(pnlResult.pnl, currency)}
                </p>
                <p
                  className={cn(
                    "font-price text-micro tabular-nums",
                    pnlResult.pct >= 0 ? "text-price-up/70" : "text-price-down/70",
                  )}
                >
                  ({pnlResult.pct >= 0 ? "+" : ""}
                  {formatPct(pnlResult.pct)}%)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
