import Link from "next/link"
import Image from "next/image"

import { cn } from "@/lib/utils"

export type ThumbCard = {
  cardCode: string
  name: string
  imageUrl: string | null
  /** optional label above the thumb (e.g. "Leader" / "DON!!"). */
  label?: string
}

type Size = "sm" | "md" | "lg" | "xl"

const SIZE: Record<Size, { w: string; maxW: string; sizes: string }> = {
  sm: { w: "w-12", maxW: "max-w-12", sizes: "48px" },
  md: { w: "w-14", maxW: "max-w-14", sizes: "56px" },
  lg: { w: "w-16", maxW: "max-w-16", sizes: "64px" },
  xl: { w: "w-20", maxW: "max-w-20", sizes: "80px" },
}

/**
 * A row of example-card thumbnails (aspect-[63/88], links to the card page)
 * shared by the guide subpages. Renders just the flex row of thumbs — callers
 * own any surrounding Surface / eyebrow heading / trailing caption, since those
 * wrappers differ per page. `className` overrides the container (e.g. gap).
 */
export function CardThumbStrip({
  cards,
  size = "md",
  showCaption = false,
  scroll = false,
  className,
}: {
  cards: ThumbCard[]
  size?: Size
  showCaption?: boolean
  scroll?: boolean
  className?: string
}) {
  const s = SIZE[size]
  return (
    <div className={cn("flex gap-2", scroll && "overflow-x-auto pb-1", className)}>
      {cards.map((card) => (
        <Link key={card.cardCode} href={`/cards/${card.cardCode}`} className="group shrink-0">
          {card.label && <p className="mb-1.5 text-center text-eyebrow">{card.label}</p>}
          <div className={cn("relative aspect-[63/88] overflow-hidden rounded-lg bg-muted", s.w)}>
            {card.imageUrl ? (
              <Image src={card.imageUrl} alt={card.name} fill className="object-contain" sizes={s.sizes} />
            ) : (
              <div className="size-full bg-muted" />
            )}
          </div>
          {showCaption && (
            <p className={cn("mt-1 truncate text-center text-meta", s.maxW)}>{card.name}</p>
          )}
        </Link>
      ))}
    </div>
  )
}
