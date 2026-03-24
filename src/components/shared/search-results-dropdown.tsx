"use client"

import Image from "next/image"
import { Clock } from "lucide-react"

import { RarityBadge } from "@/components/shared/rarity-badge"
import { getCardName } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { Price } from "@/components/shared/price-inline"
import { useUIStore } from "@/stores/ui-store"

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

export function SearchResultsDropdown({
  results,
  filteredRecent,
  loading,
  activeIdx,
  onSelectCard,
  onSelectRecent,
}: {
  results: SearchResult[]
  filteredRecent: string[]
  loading: boolean
  activeIdx: number
  onSelectCard: (code: string) => void
  onSelectRecent: (query: string) => void
}) {
  const lang = useUIStore((s) => s.language)
  return (
    <div className="absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
      <div className="max-h-80 overflow-y-auto">
        {loading && results.length === 0 && (
          <div className="px-4 py-3 text-sm text-muted-foreground">
            กำลังค้นหา...
          </div>
        )}

        {results.length > 0 && (
          <div className="p-1">
            {results.map((card, i) => (
              <button
                key={card.cardCode}
                type="button"
                onClick={() => onSelectCard(card.cardCode)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent",
                  activeIdx === i && "bg-accent"
                )}
              >
                <div className="relative size-10 shrink-0 overflow-hidden rounded bg-muted">
                  {card.imageUrl ? (
                    <Image
                      src={card.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <div className="size-full bg-muted" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{getCardName(lang, card)}</p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {card.set?.code && (
                      <span className="font-mono">{card.set.code}</span>
                    )}
                    <RarityBadge rarity={card.rarity} size="sm" />
                  </div>
                </div>
                {card.latestPriceJpy != null && (
                  <span className="shrink-0 font-mono text-sm font-semibold">
                    <Price jpy={Math.round(card.latestPriceJpy)} />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {results.length === 0 && !loading && filteredRecent.length > 0 && (
          <div className="p-1">
            <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
              ค้นหาล่าสุด
            </p>
            {filteredRecent.map((item, i) => (
              <button
                key={item}
                type="button"
                onClick={() => onSelectRecent(item)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                  activeIdx === i && "bg-accent"
                )}
              >
                <Clock className="size-3.5 text-muted-foreground" />
                {item}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
