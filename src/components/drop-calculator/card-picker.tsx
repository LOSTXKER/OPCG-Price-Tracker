"use client"

import Image from "next/image"
import { Check, Search } from "lucide-react"

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
    <section className="min-w-0 lg:col-start-1">
      <div className="panel space-y-3 p-4">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">{t(lang, "selectWantedCards")}</h2>
            {wantCount > 0 && (
              <span className="text-xs text-muted-foreground">{wantCount} {t(lang, "cardsCount")}</span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{t(lang, "clickToSelect")}</p>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder={t(lang, "searchByNameOrCode")}
            value={cardSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 w-full rounded-lg border-0 bg-muted/60 pl-8 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:bg-muted focus:ring-1 focus:ring-border"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
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
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 md:grid-cols-5 lg:grid-cols-5">
          {cards.map((card) => {
            const name = getCardName(lang, card as never)
            const selected = wantSet.has(card.id)
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => onToggleWant(card.id)}
                className={cn(
                  "group relative overflow-hidden rounded-lg border text-left transition-all",
                  selected
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border/40 hover:border-border hover:shadow-sm"
                )}
              >
                <div className="relative aspect-[63/88] bg-muted">
                  {card.imageUrl ? (
                    <Image src={card.imageUrl} alt={name} fill className="object-contain" sizes="120px" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
                  ) : (
                    <div className="flex size-full items-center justify-center text-xs text-muted-foreground">No Image</div>
                  )}
                  {selected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/10 backdrop-blur-[1px]">
                      <div className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                        <Check className="size-4" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="px-1.5 py-1">
                  <p className="truncate text-xs font-medium leading-tight">{name}</p>
                  <div className="mt-0.5 flex items-center justify-between">
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
          <p className="py-8 text-center text-sm text-muted-foreground">{t(lang, "noCardsResult")}</p>
        )}
      </div>
    </section>
  )
}
