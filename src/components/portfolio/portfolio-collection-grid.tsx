"use client"

import { memo } from "react"
import Image from "next/image"
import { Pencil } from "lucide-react"

import { GameBadge } from "@/components/shared/game-badge"
import { Price } from "@/components/shared/price-inline"
import { getCardName, t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { formatPct } from "@/lib/utils/currency"
import type { AssetRow } from "@/lib/types/portfolio"

import { holdingValue, pnlCalc } from "./assets-table/utils"

export function PortfolioCollectionGrid({
  assets,
  lang,
  onEdit,
  onSelect,
  hideBalance = false,
  showGameBadge = false,
}: {
  assets: AssetRow[]
  lang: Language
  onEdit: (row: AssetRow) => void
  /** Tap a tile → open the holding detail sheet (VISION §5.3). */
  onSelect: (row: AssetRow) => void
  hideBalance?: boolean
  /** Overlay a game tag on each tile — pass true only when holdings span ≥2 games. */
  showGameBadge?: boolean
}) {
  return (
    // 2→3→4 columns: the grid sits beside a 360px context rail on lg:, so
    // fewer, LARGER tiles — the card art is the hero of this page.
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
      {assets.map((row) => (
        <CollectionTile
          key={row.itemId}
          row={row}
          lang={lang}
          onEdit={() => onEdit(row)}
          onSelect={() => onSelect(row)}
          hideBalance={hideBalance}
          showGameBadge={showGameBadge}
        />
      ))}
    </div>
  )
}

const CollectionTile = memo(function CollectionTile({
  row,
  lang,
  onEdit,
  onSelect,
  hideBalance,
  showGameBadge = false,
}: {
  row: AssetRow
  lang: Language
  onEdit: () => void
  onSelect: () => void
  hideBalance: boolean
  showGameBadge?: boolean
}) {
  const name = getCardName(lang as "TH" | "EN" | "JP", row)
  const code = row.baseCode ?? row.cardCode
  const value = holdingValue(row)
  const pnl = pnlCalc(row)
  // Fall back to 24h change when there's no cost basis to compute P/L.
  const deltaPct = pnl ? pnl.pct : row.priceChange24h
  const hasDelta = deltaPct != null

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onSelect}
        className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
        title={t(lang, "viewDetails")}
      >
        <div className="surface-1 hairline relative aspect-[63/88] overflow-hidden rounded-xl">
          {row.imageUrl ? (
            <Image
              src={row.imageUrl}
              alt={name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-meta text-muted-foreground/40">
              {code}
            </div>
          )}
          {/* qty badge */}
          <span className="absolute right-1.5 top-1.5 rounded-md bg-black/55 px-1.5 py-0.5 font-price text-overlay font-semibold tabular-nums text-white backdrop-blur-sm">
            ×{row.quantity}
          </span>
          {showGameBadge && (
            <GameBadge
              game={row.game}
              className="absolute bottom-1.5 left-1.5 z-10 bg-black/55 text-white backdrop-blur-sm"
            />
          )}
        </div>

        <div className="mt-2 min-w-0">
          <p className="truncate text-sm font-semibold leading-tight transition-colors group-hover:text-primary">
            {name}
          </p>
          <p className="mt-0.5 truncate font-price text-meta text-muted-foreground/60">{code}</p>
          <div className="mt-1 flex items-baseline justify-between gap-1.5">
            <span className="font-price text-sm font-bold tabular-nums">
              {hideBalance ? "••••" : <Price jpy={value} />}
            </span>
            {hasDelta && !hideBalance && (
              <span
                className={cn(
                  "font-price text-micro font-semibold tabular-nums",
                  deltaPct >= 0 ? "text-price-up" : "text-price-down",
                )}
              >
                {deltaPct >= 0 ? "+" : ""}
                {formatPct(deltaPct)}%
              </span>
            )}
          </div>
        </div>
      </button>

      {/* edit — hover on desktop, always tappable on mobile */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onEdit()
        }}
        aria-label={t(lang, "edit")}
        title={t(lang, "edit")}
        className="ease-chrome absolute left-1.5 top-1.5 inline-flex size-7 items-center justify-center rounded-lg bg-black/55 text-white backdrop-blur-sm transition-opacity hover:bg-black/70 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:opacity-0 sm:group-hover:opacity-100"
      >
        <Pencil className="size-3.5" />
      </button>
    </div>
  )
})
