import Image from "next/image"
import Link from "next/link"

import { PriceDisplay } from "@/components/shared/price-display"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { cn } from "@/lib/utils"

const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8+M9QDwADggGAgxkG+QAAAABJRU5ErkJggg=="

export interface TopMoversProps {
  title: string
  icon: React.ReactNode
  cards: Array<{
    cardCode: string
    nameJp: string
    rarity: string
    imageUrl?: string | null
    priceJpy?: number | null
    priceChange24h?: number | null
    set?: { code: string }
  }>
  type: "gainers" | "losers"
}

function MoverRow({
  rank,
  card,
  type,
  layout,
}: {
  rank: number
  card: TopMoversProps["cards"][number]
  type: TopMoversProps["type"]
  layout: "scroll" | "list"
}) {
  const href = `/cards/${card.cardCode}`
  const change = card.priceChange24h
  const positive = change != null && change > 0
  const negative = change != null && change < 0
  const accent =
    type === "gainers"
      ? positive
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-muted-foreground"
      : negative
        ? "text-red-600 dark:text-red-400"
        : "text-muted-foreground"

  const row = (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-card p-2 ring-1 ring-foreground/10 transition-colors hover:bg-muted/40",
        layout === "scroll" && "w-[220px] shrink-0 snap-start sm:w-[240px]"
      )}
    >
      <span
        className={cn(
          "text-muted-foreground w-6 shrink-0 text-center font-mono text-sm font-semibold",
          layout === "list" && "w-8 text-base"
        )}
      >
        {rank}
      </span>
      <div className="bg-muted/50 relative aspect-[63/88] w-10 shrink-0 overflow-hidden rounded-md sm:w-11">
        {card.imageUrl ? (
          <Image
            src={card.imageUrl}
            alt={card.nameJp}
            fill
            className="object-cover"
            sizes="48px"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            unoptimized={
              card.imageUrl.startsWith("http://") ||
              card.imageUrl.startsWith("https://")
            }
          />
        ) : (
          <div className="bg-muted size-full" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">{card.nameJp}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          {card.set?.code ? (
            <span className="text-muted-foreground font-mono text-[10px]">
              {card.set.code}
            </span>
          ) : null}
          <RarityBadge rarity={card.rarity} size="sm" />
        </div>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
          <PriceDisplay
            priceJpy={card.priceJpy ?? null}
            showChange={false}
            size="sm"
          />
          {change != null ? (
            <span className={cn("font-mono text-xs font-semibold", accent)}>
              {change > 0 ? "+" : ""}
              {change.toFixed(1)}%
            </span>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl">
      {row}
    </Link>
  )
}

export function TopMovers({ title, icon, cards, type }: TopMoversProps) {
  return (
    <section className="space-y-3">
      <h2 className="font-heading flex items-center gap-2 text-lg font-semibold tracking-tight">
        <span className="text-primary [&_svg]:size-5" aria-hidden>
          {icon}
        </span>
        {title}
      </h2>

      <div className="flex gap-3 overflow-x-auto pb-1 md:hidden snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {cards.map((card, i) => (
          <MoverRow
            key={card.cardCode}
            rank={i + 1}
            card={card}
            type={type}
            layout="scroll"
          />
        ))}
      </div>

      <ul className="hidden list-none flex-col gap-2 p-0 md:flex">
        {cards.map((card, i) => (
          <li key={card.cardCode}>
            <MoverRow
              rank={i + 1}
              card={card}
              type={type}
              layout="list"
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
