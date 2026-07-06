"use client"

import { memo } from "react"
import Image from "next/image"
import Link from "next/link"

import { GameBadge } from "@/components/shared/game-badge"
import { Price } from "@/components/shared/price-inline"
import { getCardName, type Language } from "@/lib/i18n"
import type { AssetRow } from "@/lib/types/portfolio"
import { cn } from "@/lib/utils"
import { formatPct } from "@/lib/utils/currency"

import { AssetEditButton } from "./action-menu"
import { holdingValue, pnlCalc } from "./utils"

/**
 * Mobile holdings row (<sm). Two lines only — name/code on the left, value + P/L
 * on the right. The dense extras (24h/7d change, cost basis, notes) live in the
 * edit dialog so the list scans cleanly on a phone.
 */
export const MobileAssetCard = memo(function MobileAssetCard({
  row,
  lang,
  onEdit,
  hideBalance = false,
  showGameBadge = false,
}: {
  row: AssetRow
  lang: Language
  onEdit: () => void
  hideBalance?: boolean
  showGameBadge?: boolean
}) {
  const name = getCardName(lang as "TH" | "EN" | "JP", row)
  const value = holdingValue(row)
  const pnlResult = pnlCalc(row)

  return (
    <div className="flex items-center gap-3 py-3">
      <Link href={`/cards/${row.cardCode}`} className="shrink-0">
        <div className="relative aspect-[63/88] w-11 overflow-hidden rounded-md bg-muted ring-1 ring-hair">
          {row.imageUrl ? (
            <Image src={row.imageUrl} alt={name} fill className="object-cover" sizes="44px" />
          ) : (
            <div className="size-full bg-muted" />
          )}
        </div>
      </Link>

      <Link href={`/cards/${row.cardCode}`} className="min-w-0 flex-1">
        <p className="truncate text-body-sm font-medium leading-tight">{name}</p>
        <p className="mt-0.5 font-mono text-meta">
          {row.baseCode ?? row.cardCode}
          <span className="ml-1.5 font-sans text-foreground/60">×{row.quantity}</span>
          {showGameBadge && <GameBadge game={row.game} className="ml-1.5 align-middle" />}
        </p>
      </Link>

      <div className="shrink-0 text-right leading-tight">
        <p className="tabular-nums text-body-sm font-semibold">
          {hideBalance ? "••••" : <Price jpy={value} />}
        </p>
        {pnlResult && (
          <p
            className={cn(
              "mt-0.5 tabular-nums text-micro font-medium",
              pnlResult.pct >= 0 ? "text-price-up" : "text-price-down",
            )}
          >
            {hideBalance
              ? "••"
              : `${pnlResult.pct >= 0 ? "+" : ""}${formatPct(pnlResult.pct)}%`}
          </p>
        )}
      </div>

      <AssetEditButton lang={lang} onEdit={onEdit} />
    </div>
  )
})
