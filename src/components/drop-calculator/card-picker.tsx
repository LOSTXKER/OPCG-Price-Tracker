"use client"

import { useState } from "react"
import Image from "next/image"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { FilterModal } from "@/components/shared/filter-modal"
import { Price } from "@/components/shared/price-inline"
import { FilterButton, ToolbarSearch } from "@/components/ui/toolbar"
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
  rarityFilter: string[]
  variantFilter: string | null
  onToggleWant: (cardId: number) => void
  onSearchChange: (value: string) => void
  onRarityChange: (values: string[]) => void
  onVariantChange: (value: string | null) => void
}

export function CardPicker({
  cards,
  uniqueRarities,
  wantSet,
  wantCount,
  cardSearch,
  rarityFilter,
  variantFilter,
  onToggleWant,
  onSearchChange,
  onRarityChange,
  onVariantChange,
}: CardPickerProps) {
  const lang = useUIStore((s) => s.language)
  const [showFilters, setShowFilters] = useState(false)

  const toggleRarity = (value: string) => {
    onRarityChange(
      rarityFilter.includes(value)
        ? rarityFilter.filter((r) => r !== value)
        : [...rarityFilter, value]
    )
  }

  // ปกติ / พาราเลล — reuse the shared variant i18n keys (regular/parallel).
  const variantOptions = [
    { code: "regular", label: t(lang, "regular") },
    { code: "parallel", label: t(lang, "parallel") },
  ]

  const activeFilterCount = rarityFilter.length + (variantFilter ? 1 : 0)

  return (
    <section className="min-w-0 space-y-4">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-h3">{t(lang, "selectWantedCards")}</h2>
        {wantCount > 0 && (
          <span className="text-meta">{wantCount} {t(lang, "cardsCount")}</span>
        )}
      </div>

      {/* Search stays outside; only rarity (a secondary facet) moves into the
          FilterModal opened by the "ตัวกรอง" button. */}
      <div className="flex items-center gap-2">
        <ToolbarSearch
          value={cardSearch}
          onValueChange={onSearchChange}
          placeholder={t(lang, "searchByNameOrCode")}
          aria-label={t(lang, "searchByNameOrCode")}
          size="sm"
          containerClassName="min-w-0 flex-1 sm:max-w-72"
        />
        <FilterButton
          count={activeFilterCount}
          active={showFilters || activeFilterCount > 0}
          onClick={() => setShowFilters(true)}
          aria-label={t(lang, "filter")}
          aria-haspopup="dialog"
          aria-expanded={showFilters}
          iconOnly
          className="shrink-0"
        >
          <span className="hidden sm:inline">{t(lang, "filter")}</span>
        </FilterButton>
      </div>

      <FilterModal
        open={showFilters}
        onOpenChange={setShowFilters}
        onReset={() => {
          onRarityChange([])
          onVariantChange(null)
        }}
        resetDisabled={activeFilterCount === 0}
      >
        {uniqueRarities.length > 0 && (
          <div>
            <span className="mb-1.5 block text-eyebrow">{t(lang, "rarityFilter")}</span>
            <div className="flex flex-wrap gap-1.5">
              {uniqueRarities.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggleRarity(r)}
                  className={cn(
                    "ease-chrome rounded-lg px-2.5 py-1 text-xs font-semibold",
                    rarityFilter.includes(r)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Version — ปกติ / พาราเลล. Filters the display by isParallel; the drop
            math reads the full set so this is display-only (set-scoped math intact). */}
        <div>
          <span className="mb-1.5 block text-eyebrow">{t(lang, "variant")}</span>
          <div className="flex flex-wrap gap-1.5">
            {variantOptions.map((v) => (
              <button
                key={v.code}
                type="button"
                onClick={() =>
                  onVariantChange(variantFilter === v.code ? null : v.code)
                }
                className={cn(
                  "ease-chrome rounded-lg border px-2.5 py-1 text-xs font-medium",
                  variantFilter === v.code
                    ? "border-primary/40 bg-primary/5 text-primary"
                    : "border-hair bg-background text-muted-foreground hover:text-foreground"
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </FilterModal>

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
