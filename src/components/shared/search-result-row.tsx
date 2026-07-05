"use client"

import Image from "next/image"

import { RarityBadge } from "@/components/shared/rarity-badge"
import { Price } from "@/components/shared/price-inline"
import { getCardName, type Language } from "@/lib/i18n"
import { BLUR_DATA_URL } from "@/lib/constants/ui"
import { cn } from "@/lib/utils"

export type SearchResult = {
  cardCode: string
  baseCode?: string | null
  nameJp: string
  nameEn?: string | null
  nameTh?: string | null
  rarity: string
  imageUrl?: string | null
  latestPriceJpy?: number | null
  set?: { code: string; name?: string }
}

/**
 * The inner content of a card search-result row — thumbnail + name + set/rarity
 * meta + price — shared by every search surface (home hero · Cmd-K palette ·
 * inline CardSearch dropdown). The interactive `<button>` wrapper (active/hover
 * styling, onClick, onMouseEnter) stays at each call site because it genuinely
 * differs per surface; only this structural body was duplicated. Cosmetic props
 * default to the dropdown's canonical look, so callers override just what varies.
 */
export function SearchResultRow({
  card,
  lang,
  size = "md",
  thumbFit = "cover",
  thumbClassName = "rounded",
  blur = false,
  nameClassName = "text-h5",
  priceClassName = "font-mono text-sm font-semibold",
  uppercaseSetCode = false,
  alt = "",
}: {
  card: SearchResult
  lang: Language
  /** md = 40px thumb (dropdown/palette) · sm = 36px thumb (hero). */
  size?: "sm" | "md"
  thumbFit?: "cover" | "contain"
  /** Thumbnail rounding/extra classes. */
  thumbClassName?: string
  blur?: boolean
  nameClassName?: string
  priceClassName?: string
  uppercaseSetCode?: boolean
  alt?: string
}) {
  const box = size === "sm" ? "size-9" : "size-10"
  const sizes = size === "sm" ? "36px" : "40px"
  return (
    <>
      <div className={cn("relative shrink-0 overflow-hidden bg-muted", box, thumbClassName)}>
        {card.imageUrl ? (
          <Image
            src={card.imageUrl}
            alt={alt}
            fill
            className={thumbFit === "contain" ? "object-contain" : "object-cover"}
            sizes={sizes}
            {...(blur ? { placeholder: "blur" as const, blurDataURL: BLUR_DATA_URL } : {})}
          />
        ) : (
          <div className="size-full bg-muted" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate", nameClassName)}>{getCardName(lang, card)}</p>
        <div className="flex items-center gap-1.5 text-meta">
          {card.set?.code && (
            <span className="font-mono">
              {uppercaseSetCode ? card.set.code.toUpperCase() : card.set.code}
            </span>
          )}
          <RarityBadge rarity={card.rarity} size="sm" />
        </div>
      </div>
      {card.latestPriceJpy != null && (
        <span className={cn("shrink-0", priceClassName)}>
          <Price jpy={Math.round(card.latestPriceJpy)} />
        </span>
      )}
    </>
  )
}
