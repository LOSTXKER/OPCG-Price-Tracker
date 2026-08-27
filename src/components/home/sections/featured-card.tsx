"use client"

import Image from "next/image"
import Link from "next/link"
import { Crown } from "lucide-react"

import { Price } from "@/components/shared/price-inline"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { BLUR_DATA_URL } from "@/lib/constants/ui"
import { getCardName, t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"

export type HomeFeaturedCardData = {
  cardCode: string
  nameJp: string
  nameEn?: string | null
  nameTh?: string | null
  rarity: string
  imageUrl: string | null
  latestPriceJpy: number | null
  set: { code: string }
}

export function HomeFeaturedCard({
  card,
}: {
  card: HomeFeaturedCardData
}) {
  const lang = useUIStore((s) => s.language)
  const name = getCardName(lang, card)

  return (
    <Link
      href={`/opcg/cards/${card.cardCode}`}
      className="group ease-chrome flex h-full flex-col gap-3 p-4 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:flex-row sm:items-center sm:gap-4 sm:p-5 lg:flex-col lg:items-start lg:gap-2 lg:p-3"
      data-slot="highest-value-card"
    >
      <div className="relative aspect-[63/88] w-[100px] shrink-0 overflow-hidden rounded-lg bg-muted sm:w-[112px] lg:w-[72px]">
        {card.imageUrl && (
          <Image
            src={card.imageUrl}
            alt={name}
            fill
            className="object-contain motion-slow group-hover:scale-105"
            sizes="(min-width: 1024px) 72px, (min-width: 640px) 112px, 100px"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            loading="eager"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-eyebrow">
          <Crown className="size-3.5 text-primary" aria-hidden />
          {t(lang, "highestValue")}
        </p>
        <p className="mt-1.5 line-clamp-2 text-h4 sm:line-clamp-1 lg:text-h5 xl:text-h4">{name}</p>
        <div className="mt-1 flex items-center gap-1.5 text-meta">
          <span className="font-mono">{card.set.code.toUpperCase()}</span>
          <span>&middot;</span>
          <RarityBadge rarity={card.rarity} size="sm" />
        </div>
        <p
          className="mt-2 whitespace-nowrap font-price text-h3 text-foreground lg:text-h4 xl:text-h3"
          data-slot="highest-value-price"
        >
          <Price jpy={card.latestPriceJpy ?? 0} />
        </p>
      </div>
    </Link>
  )
}
