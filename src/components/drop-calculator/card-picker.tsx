"use client"

import { useState } from "react"
import Image from "next/image"
import { Check } from "lucide-react"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { FilterModal } from "@/components/shared/filter-modal"
import { Price } from "@/components/shared/price-inline"
import { SetPicker } from "@/components/shared/set-picker"
import { FilterButton, ToolbarSearch } from "@/components/ui/toolbar"
import { BLUR_DATA_URL } from "@/lib/constants/ui"
import { RARITY_HEX } from "@/lib/constants/rarities"
import { getCardName, t, type Language } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import type { CardItem, SetListItem } from "./types"

interface CardPickerProps {
  sets: SetListItem[]
  selectedCode: string
  setsLoading: boolean
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
  onSetChange: (code: string) => void
}

interface BrowseControlsProps {
  lang: Language
  layout: "sidebar" | "toolbar"
  sets: SetListItem[]
  selectedCode: string
  setsLoading: boolean
  cardSearch: string
  activeFilterCount: number
  showFilters: boolean
  onSetChange: (code: string) => void
  onSearchChange: (value: string) => void
  onOpenFilters: () => void
}

function BrowseControls({
  lang,
  layout,
  sets,
  selectedCode,
  setsLoading,
  cardSearch,
  activeFilterCount,
  showFilters,
  onSetChange,
  onSearchChange,
  onOpenFilters,
}: BrowseControlsProps) {
  const setPicker = (
    <SetPicker
      sets={sets}
      selectedCode={selectedCode}
      loading={setsLoading}
      onSelect={(code) => {
        if (code) onSetChange(code)
      }}
      variant="inline"
      prominent
      triggerClassName={layout === "toolbar" ? "tap-safe h-11 sm:h-10" : undefined}
    />
  )

  if (layout === "sidebar") {
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <p className="text-eyebrow px-0.5">{t(lang, "selectSet")}</p>
          {setPicker}
        </div>
        <div className="space-y-1.5">
          <p className="text-eyebrow px-0.5">{t(lang, "search")}</p>
          <ToolbarSearch
            value={cardSearch}
            onValueChange={onSearchChange}
            placeholder={t(lang, "searchByNameOrCode")}
            aria-label={t(lang, "searchByNameOrCode")}
            size="sm"
            containerClassName="w-full border-hair bg-background"
            className="w-full"
          />
        </div>
        <FilterButton
          count={activeFilterCount}
          active={showFilters || activeFilterCount > 0}
          onClick={onOpenFilters}
          aria-label={t(lang, "filter")}
          aria-haspopup="dialog"
          aria-expanded={showFilters}
          appearance="outline"
          className="w-full md:h-9 [&>span]:w-full [&>span]:justify-start"
        >
          {t(lang, "filter")}
        </FilterButton>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {setPicker}
      <div className="flex min-w-0 items-center gap-2">
        <ToolbarSearch
          value={cardSearch}
          onValueChange={onSearchChange}
          placeholder={t(lang, "searchByNameOrCode")}
          aria-label={t(lang, "searchByNameOrCode")}
          size="sm"
          containerClassName="min-w-0 flex-1"
          className="w-full"
        />
        <FilterButton
          count={activeFilterCount}
          active={showFilters || activeFilterCount > 0}
          onClick={onOpenFilters}
          aria-label={t(lang, "filter")}
          aria-haspopup="dialog"
          aria-expanded={showFilters}
          iconOnly
          className="shrink-0"
        >
          <span className="hidden sm:inline">{t(lang, "filter")}</span>
        </FilterButton>
      </div>
    </div>
  )
}

export function CardPicker({
  sets,
  selectedCode,
  setsLoading,
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
  onSetChange,
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
                  aria-pressed={rarityFilter.includes(r)}
                  onClick={() => toggleRarity(r)}
                  className={cn(
                    "ease-chrome min-h-11 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors md:min-h-0",
                    rarityFilter.includes(r)
                      ? "text-white"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                  style={
                    rarityFilter.includes(r)
                      ? { backgroundColor: RARITY_HEX[r] ?? "#6B7280" }
                      : undefined
                  }
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
                  aria-pressed={variantFilter === v.code}
                  onClick={() =>
                  onVariantChange(variantFilter === v.code ? null : v.code)
                }
                className={cn(
                  "ease-chrome min-h-11 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors md:min-h-0",
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

      <div className="lg:flex lg:gap-8">
        <aside className="hidden w-52 shrink-0 lg:block">
          <div className="sticky top-32">
            <BrowseControls
              lang={lang}
              layout="sidebar"
              sets={sets}
              selectedCode={selectedCode}
              setsLoading={setsLoading}
              cardSearch={cardSearch}
              activeFilterCount={activeFilterCount}
              showFilters={showFilters}
              onSetChange={onSetChange}
              onSearchChange={onSearchChange}
              onOpenFilters={() => setShowFilters(true)}
            />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-5 lg:hidden">
            <BrowseControls
              lang={lang}
              layout="toolbar"
              sets={sets}
              selectedCode={selectedCode}
              setsLoading={setsLoading}
              cardSearch={cardSearch}
              activeFilterCount={activeFilterCount}
              showFilters={showFilters}
              onSetChange={onSetChange}
              onSearchChange={onSearchChange}
              onOpenFilters={() => setShowFilters(true)}
            />
          </div>

          <div className="grid grid-cols-3 gap-x-2.5 gap-y-4 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {cards.map((card) => {
              const name = getCardName(lang, card as never)
              const selected = wantSet.has(card.id)
              return (
                <button
                  key={card.id}
                  type="button"
                  aria-pressed={selected}
                  aria-label={
                    selected
                      ? `${t(lang, "remove")} ${name}`
                      : `${t(lang, "selectWantedCards")} ${name}`
                  }
                  onClick={() => onToggleWant(card.id)}
                  className="group ease-chrome flex min-w-0 flex-col gap-1.5 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div
                    className={cn(
                      "surface-1 ease-chrome relative aspect-[63/88] w-full overflow-hidden rounded-lg shadow-[var(--panel-shadow)] group-lift",
                      selected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    )}
                  >
                    {card.imageUrl ? (
                      <Image
                        src={card.imageUrl}
                        alt={name}
                        fill
                        className="object-contain"
                        sizes="(max-width: 640px) 30vw, (max-width: 1280px) 16vw, 12vw"
                        placeholder="blur"
                        blurDataURL={BLUR_DATA_URL}
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-meta">No Image</div>
                    )}
                    {selected && (
                      <>
                        <div className="pointer-events-none absolute inset-0 bg-primary/5" />
                        <span className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--elev-raised)]">
                          <Check className="size-3.5" strokeWidth={3} />
                        </span>
                      </>
                    )}
                  </div>
                  <div className="min-w-0 px-0.5">
                    <p className="text-price text-foreground">
                      {card.latestPriceJpy != null && card.latestPriceJpy > 0 ? (
                        <Price jpy={card.latestPriceJpy} />
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </p>
                    <div className="mt-0.5 flex items-center justify-between gap-1.5">
                      <span className="text-meta truncate leading-snug" title={name}>
                        {name}
                      </span>
                      <RarityBadge rarity={card.rarity} size="sm" />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
          {cards.length === 0 && (
            <p className="py-8 text-center text-meta">{t(lang, "noCardsResult")}</p>
          )}
        </div>
      </div>
    </section>
  )
}
