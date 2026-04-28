"use client"

import { memo } from "react"
import Image from "next/image"
import Link from "next/link"

import { Price } from "@/components/shared/price-inline"
import { getCardName, t, type Language } from "@/lib/i18n"
import type { AssetRow } from "@/lib/types/portfolio"
import { cn } from "@/lib/utils"
import { formatJpyAmount, formatPct } from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"

import { AssetActionMenu, ChangeCell } from "./action-menu"
import { holdingValue, pnlCalc } from "./utils"

export const MobileAssetCard = memo(function MobileAssetCard({
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
            <div className="min-w-0 leading-tight">
              <p className="font-price text-sm font-bold tabular-nums">
                {hideBalance ? "••••" : <Price jpy={value} />}
              </p>
              {hideBalance ? (
                <p className="mt-0.5 font-price text-micro tabular-nums text-muted-foreground/40">
                  ••
                </p>
              ) : (
                <div className="mt-0.5 flex items-center gap-1.5">
                  <ChangeCell value={row.priceChange24h} />
                  <span aria-hidden className="text-micro text-muted-foreground/30">·</span>
                  <ChangeCell value={row.priceChange7d} label="7d" />
                </div>
              )}
            </div>
            {hideBalance ? (
              <div className="text-right leading-tight">
                <p className="font-price text-sm font-semibold tabular-nums text-muted-foreground/40">
                  ••••
                </p>
              </div>
            ) : pnlResult ? (
              <div className="text-right leading-tight">
                <p
                  className={cn(
                    "font-price text-sm font-semibold tabular-nums",
                    pnlResult.pnl >= 0 ? "text-price-up" : "text-price-down",
                  )}
                >
                  {pnlResult.pnl >= 0 ? "+" : ""}
                  {formatJpyAmount(pnlResult.pnl, currency)}
                  <span
                    className={cn(
                      "ml-1 font-price text-micro font-normal tabular-nums",
                      pnlResult.pct >= 0 ? "text-price-up/70" : "text-price-down/70",
                    )}
                  >
                    ({pnlResult.pct >= 0 ? "+" : ""}
                    {formatPct(pnlResult.pct)}%)
                  </span>
                </p>
                {row.purchasePrice != null && (
                  <p className="mt-0.5 font-price text-micro tabular-nums text-muted-foreground/60">
                    <span className="font-sans">{t(lang, "costBasis")}</span>{" "}
                    {formatJpyAmount(row.purchasePrice * row.quantity, currency)}
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
})
