"use client"

import Image from "next/image"
import { Search } from "lucide-react"

import { RarityBadge } from "@/components/shared/rarity-badge"
import { Price } from "@/components/shared/price-inline"
import { BLUR_DATA_URL } from "@/lib/constants/ui"
import { getCardName, t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import type { CardItem } from "./types"

interface CardPickerProps {
  cards: CardItem[]
  uniqueRarities: string[]
  wantSet: Set<number>
  wantCount: number
  cardSearch: string
  rarityFilter: string
  onToggleWant: (cardId: number) => void
  onSearchChange: (value: string) => void
  onRarityChange: (value: string) => void
}

export function CardPicker({
  cards,
  uniqueRarities,
  wantSet,
  wantCount,
  cardSearch,
  rarityFilter,
  onToggleWant,
  onSearchChange,
  onRarityChange,
}: CardPickerProps) {
  const lang = useUIStore((s) => s.language)

  return (
    <section className="min-w-0 space-y-4">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-h3">{t(lang, "selectWantedCards")}</h2>
        {wantCount > 0 && (
          <span className="text-meta">{wantCount} {t(lang, "cardsCount")}</span>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder={t(lang, "searchByNameOrCode")}
            value={cardSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 w-full rounded-full border border-border bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
          />
        </div>
        <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          <button
            type="button"
            onClick={() => onRarityChange("all")}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
              rarityFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {t(lang, "allRarity")}
          </button>
          {uniqueRarities.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onRarityChange(r)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                rarityFilter === r
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {cards.map((card) => {
          const name = getCardName(lang, card as never)
          const selected = wantSet.has(card.id)
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onToggleWant(card.id)}
              className={cn(
                "group relative overflow-hidden rounded-xl text-left transition-all",
                selected
                  ? "ring-2 ring-primary"
                  : "ring-1 ring-border/50 hover:ring-border"
              )}
            >
              <div className="relative aspect-[63/88] bg-muted">
                {card.imageUrl ? (
                  <Image src={card.imageUrl} alt={name} fill className="object-contain" sizes="120px" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
                ) : (
                  <div className="flex size-full items-center justify-center text-meta">No Image</div>
                )}
                {selected && (
                  <div className="pointer-events-none absolute inset-0 bg-primary/5" />
                )}
              </div>
              <div className="px-2 py-1.5">
                <p className="truncate text-body-sm leading-tight">{name}</p>
                <div className="mt-1 flex items-center justify-between gap-1">
                  <RarityBadge rarity={card.rarity} size="sm" />
                  {card.latestPriceJpy != null && card.latestPriceJpy > 0 && (
                    <span className="font-price text-xs tabular-nums text-muted-foreground"><Price jpy={card.latestPriceJpy} /></span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
      {cards.length === 0 && (
        <p className="py-8 text-center text-meta">{t(lang, "noCardsResult")}</p>
      )}
    </section>
  )
}
