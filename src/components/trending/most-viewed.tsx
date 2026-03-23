import Image from "next/image"
import Link from "next/link"
import { Eye } from "lucide-react"

import { PriceDisplay } from "@/components/shared/price-display"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { cn } from "@/lib/utils"

const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8+M9QDwADggGAgxkG+QAAAABJRU5ErkJggg=="

export interface MostViewedProps {
  cards: Array<{
    cardCode: string
    nameJp: string
    rarity: string
    imageUrl?: string | null
    priceJpy?: number | null
    priceChange24h?: number | null
    viewCount: number
    set?: { code: string }
  }>
}

export function MostViewed({ cards }: MostViewedProps) {
  const list = cards.slice(0, 10)

  return (
    <section className="space-y-3">
      <h2 className="font-heading text-lg font-semibold tracking-tight">
        Most viewed
      </h2>
      <ol className="flex list-none flex-col gap-2 p-0">
        {list.map((card, i) => {
          const rank = i + 1
          const href = `/cards/${card.cardCode}`
          const change = card.priceChange24h

          return (
            <li key={card.cardCode}>
              <Link
                href={href}
                className="focus-visible:ring-ring block rounded-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <div className="hover:bg-muted/40 flex items-center gap-3 rounded-xl border bg-card p-2 ring-1 ring-foreground/10 transition-colors">
                  <span className="text-muted-foreground w-7 shrink-0 text-center font-mono text-sm font-bold">
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
                    <p className="truncate text-sm font-medium leading-tight">
                      {card.nameJp}
                    </p>
                    <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-2 text-[11px]">
                      {card.set?.code ? (
                        <span className="font-mono">{card.set.code}</span>
                      ) : null}
                      <RarityBadge rarity={card.rarity} size="sm" />
                      <span className="inline-flex items-center gap-0.5">
                        <Eye className="size-3 opacity-70" aria-hidden />
                        {card.viewCount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                    <PriceDisplay
                      priceJpy={card.priceJpy ?? null}
                      showChange={false}
                      size="sm"
                    />
                    {change != null ? (
                      <span
                        className={cn(
                          "font-mono text-[11px] font-semibold",
                          change > 0 && "text-emerald-600 dark:text-emerald-400",
                          change < 0 && "text-red-600 dark:text-red-400",
                          change === 0 && "text-muted-foreground"
                        )}
                      >
                        {change > 0 ? "+" : ""}
                        {change.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-[11px]">—</span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
