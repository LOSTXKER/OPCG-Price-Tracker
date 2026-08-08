"use client"

import { useCardPreviewStore, type CardPreviewData } from "@/stores/card-preview-store"
import { cn } from "@/lib/utils"
import { baseCardCode } from "@/lib/cards/card-code"

/**
 * Click-anywhere wrapper for a card image. Clicking the image opens the global
 * `CardMiniPreviewDialog` with shared CTAs (view details / watchlist / compare /
 * add to portfolio). No icon is layered on top of the image — just a cursor +
 * focus ring affordance so the artwork stays clean.
 */
export function CardImageButton({
  card,
  children,
  className,
  disabled,
}: {
  card: CardPreviewData
  children: React.ReactNode
  className?: string
  disabled?: boolean
}) {
  const show = useCardPreviewStore((s) => s.show)

  if (disabled) {
    return <div className={cn("relative", className)}>{children}</div>
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        show(card)
      }}
      aria-label={card.nameEn ?? card.nameJp ?? baseCardCode(card.cardCode)}
      className={cn(
        "group/cardimg relative cursor-zoom-in rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {children}
    </button>
  )
}
