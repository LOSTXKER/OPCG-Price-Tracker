"use client"

import Image from "next/image"
import Link from "next/link"

import { RarityBadge } from "@/components/shared/rarity-badge"
import { BLUR_DATA_URL } from "@/lib/constants/ui"
import { getCardName } from "@/lib/i18n"
import type { TrendingCard, ViewedCard } from "@/lib/data/home"
import { Price } from "@/components/shared/price-inline"
import { useUIStore } from "@/stores/ui-store"

export function HomeFeaturedCard({
  card,
}: {
  card: {
    cardCode: string
    nameJp: string
    nameEn?: string | null
    nameTh?: string | null
    rarity: string
    imageUrl: string | null
    latestPriceJpy: number | null
    set: { code: string }
  }
}) {
  const lang = useUIStore((s) => s.language)
  const name = getCardName(lang, card)

  return (
    <Link
      href={`/cards/${card.cardCode}`}
      className="group flex flex-col items-center lg:col-span-4"
    >
      <p className="mb-3 self-start text-xs text-muted-foreground">
        มูลค่าสูงสุด
      </p>
      <div className="relative aspect-[63/88] w-full max-w-[180px] overflow-hidden rounded bg-muted">
        {card.imageUrl && (
          <Image
            src={card.imageUrl}
            alt={name}
            fill
            className="object-contain"
            sizes="180px"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        )}
      </div>
      <div className="mt-4 w-full text-center">
        <p className="truncate text-sm font-medium">{name}</p>
        <div className="mt-0.5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <span>{card.set.code.toUpperCase()}</span>
          <span>&middot;</span>
          <RarityBadge rarity={card.rarity} size="sm" />
        </div>
        <p className="mt-2 font-price text-xl font-semibold">
          <Price jpy={card.latestPriceJpy ?? 0} />
        </p>
      </div>
    </Link>
  )
}

export function HomeMarketTable({
  cards,
  type,
  showViews,
}: {
  cards: (TrendingCard & { viewCount?: number })[]
  type: "gainers" | "losers"
  showViews?: boolean
}) {
  const lang = useUIStore((s) => s.language)

  if (cards.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-muted-foreground">
        ไม่มีข้อมูล
      </p>
    )
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-border text-[11px] text-muted-foreground">
          <th className="px-4 py-2 font-normal">#</th>
          <th className="px-2 py-2 font-normal">การ์ด</th>
          <th className="hidden px-2 py-2 font-normal sm:table-cell">ชุด</th>
          <th className="px-2 py-2 text-right font-normal">ราคา</th>
          <th className="px-4 py-2 text-right font-normal">
            {showViews ? "เข้าชม" : "%"}
          </th>
        </tr>
      </thead>
      <tbody>
        {cards.slice(0, 8).map((card, i) => {
          const change = card.priceChange24h
          const isUp = change != null && change > 0
          const isDown = change != null && change < 0
          const name = getCardName(lang, card)
          return (
            <tr
              key={card.cardCode}
              className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/40"
            >
              <td className="px-4 py-2.5 align-middle">
                <span className="font-price text-xs text-muted-foreground">
                  {i + 1}
                </span>
              </td>
              <td className="px-2 py-2.5 align-middle">
                <Link
                  href={`/cards/${card.cardCode}`}
                  className="flex items-center gap-2.5 hover:text-primary"
                >
                  <div className="relative size-8 shrink-0 overflow-hidden rounded bg-muted">
                    {card.imageUrl && (
                      <Image
                        src={card.imageUrl}
                        alt={name}
                        fill
                        className="object-contain"
                        sizes="32px"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium leading-tight">
                      {name}
                    </p>
                    <RarityBadge
                      rarity={card.rarity}
                      size="sm"
                      className="mt-0.5"
                    />
                  </div>
                </Link>
              </td>
              <td className="hidden px-2 py-2.5 align-middle text-xs text-muted-foreground sm:table-cell">
                {card.set?.code?.toUpperCase()}
              </td>
              <td className="px-2 py-2.5 text-right align-middle font-price text-[13px]">
                {card.priceJpy != null ? <Price jpy={card.priceJpy} /> : "—"}
              </td>
              <td className="px-4 py-2.5 text-right align-middle">
                {showViews ? (
                  <span className="font-price text-xs text-muted-foreground">
                    {(card as ViewedCard).viewCount?.toLocaleString()}
                  </span>
                ) : (
                  <span
                    className={`font-price text-xs ${
                      isUp
                        ? "text-price-up"
                        : isDown
                          ? "text-price-down"
                          : "text-muted-foreground"
                    }`}
                  >
                    {change != null
                      ? `${change > 0 ? "+" : ""}${change.toFixed(1)}%`
                      : "—"}
                  </span>
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export function HomeMostViewed({ cards }: { cards: ViewedCard[] }) {
  const lang = useUIStore((s) => s.language)

  return (
    <section>
      <h2 className="mb-4 text-sm font-semibold">การ์ดที่มีคนดูมากสุด</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {cards.map((card) => {
          const name = getCardName(lang, card)
          return (
            <Link
              key={card.cardCode}
              href={`/cards/${card.cardCode}`}
              className="flex w-[130px] shrink-0 flex-col items-center"
            >
              <div className="relative aspect-[63/88] w-full overflow-hidden rounded bg-muted">
                {card.imageUrl && (
                  <Image
                    src={card.imageUrl}
                    alt={name}
                    fill
                    className="object-contain"
                    sizes="140px"
                  />
                )}
              </div>
              <p className="mt-2 w-full truncate text-center text-xs font-medium">
                {name}
              </p>
              <p className="font-price text-sm font-semibold text-primary">
                {card.priceJpy != null ? <Price jpy={card.priceJpy} /> : "—"}
              </p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
