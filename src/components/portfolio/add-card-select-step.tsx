"use client"

import Image from "next/image"
import {
  ChevronDown,
  Filter,
  Loader2,
  Package,
  Search,
  X,
} from "lucide-react"

import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { RARITY_HEX } from "@/lib/constants/rarities"
import { opcgConfig } from "@/lib/game-config"
import { useUIStore } from "@/stores/ui-store"
import { t } from "@/lib/i18n"
import { formatJpyAmount } from "@/lib/utils/currency"
import { SET_TYPE_LABELS, type CardWithSet, type SetInfo } from "./add-card-types"

const RARITY_OPTIONS = opcgConfig.rarityFilterOptions
const COLOR_OPTIONS = opcgConfig.colors
const TYPE_OPTIONS = opcgConfig.cardTypes

export function SelectStep({
  query,
  setQuery,
  loading,
  displayCards,
  showEmpty,
  isFiltered,
  activeType,
  setActiveType,
  activeSet,
  activeSetInfo,
  availableTypes,
  filteredSets,
  setDropdownOpen,
  setSetDropdownOpen,
  setDropdownRef,
  selectSetCode,
  activeRarity,
  setActiveRarity,
  activeColor,
  setActiveColor,
  activeCardType,
  setActiveCardType,
  showFilters,
  setShowFilters,
  activeFilterCount,
  clearAllFilters,
  onSelectCard,
}: {
  query: string
  setQuery: (q: string) => void
  loading: boolean
  displayCards: CardWithSet[]
  showEmpty: boolean
  isFiltered: boolean
  sets: SetInfo[]
  activeType: string | null
  setActiveType: (t: string | null) => void
  activeSet: string | null
  activeSetInfo: SetInfo | undefined
  availableTypes: string[]
  filteredSets: SetInfo[]
  setDropdownOpen: boolean
  setSetDropdownOpen: (open: boolean) => void
  setDropdownRef: React.RefObject<HTMLDivElement | null>
  selectSetCode: (code: string | null) => void
  activeRarity: string | null
  setActiveRarity: (r: string | null) => void
  activeColor: string | null
  setActiveColor: (c: string | null) => void
  activeCardType: string | null
  setActiveCardType: (t: string | null) => void
  showFilters: boolean
  setShowFilters: (v: boolean) => void
  activeFilterCount: number
  clearAllFilters: () => void
  onSelectCard: (card: CardWithSet) => void
}) {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)

  return (
    <>
      <DialogHeader className="border-b border-border/40 px-5 pt-5 pb-4">
        <DialogTitle>{t(lang, "addCardToPortfolio")}</DialogTitle>
        <DialogDescription>{t(lang, "addCardToPortfolioDesc")}</DialogDescription>
      </DialogHeader>

      {/* Search + filter controls */}
      <div className="space-y-2 border-b border-border/30 px-4 pt-3 pb-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
            <input
              type="search"
              placeholder={t(lang, "searchLong")}
              className="h-9 w-full rounded-lg border border-border bg-muted/30 pl-9 pr-8 text-sm outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary/40 focus:bg-background focus:ring-1 focus:ring-primary/20"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "relative flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors",
              showFilters || activeFilterCount > 0
                ? "border-primary/40 bg-primary/5 text-primary"
                : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Filter className="size-3.5" />
            <span className="hidden sm:inline">{t(lang, "filter")}</span>
            {activeFilterCount > 0 && (
              <span className="flex size-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="space-y-3 rounded-lg border border-border/40 bg-muted/10 p-3">
            {/* Set filter */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t(lang, "set")}</span>
              </div>
              <div className="relative" ref={setDropdownRef}>
                <button
                  onClick={() => setSetDropdownOpen(!setDropdownOpen)}
                  className={cn(
                    "flex h-8 w-full items-center justify-between rounded-md border px-2.5 text-sm transition-colors",
                    activeSet
                      ? "border-primary/30 bg-primary/5 text-primary"
                      : "border-border/60 bg-background text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Package className="size-3.5 shrink-0" />
                    <span className="truncate">
                      {activeSetInfo
                        ? `${activeSetInfo.code.toUpperCase()} — ${activeSetInfo.nameEn ?? activeSetInfo.name}`
                        : t(lang, "allSets")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {activeSet && (
                      <button
                        onClick={(e) => { e.stopPropagation(); selectSetCode(null) }}
                        className="rounded p-0.5 hover:bg-primary/10"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                    <ChevronDown className={cn("size-3.5 transition-transform", setDropdownOpen && "rotate-180")} />
                  </div>
                </button>

                {setDropdownOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-border bg-background shadow-lg">
                    <div className="flex flex-wrap gap-1 border-b border-border/40 px-2.5 py-2">
                      <button
                        onClick={() => setActiveType(null)}
                        className={cn(
                          "rounded px-2 py-0.5 text-[11px] font-medium transition-colors",
                          activeType === null
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {t(lang, "allTab")}
                      </button>
                      {availableTypes.map((type) => (
                        <button
                          key={type}
                          onClick={() => setActiveType(activeType === type ? null : type)}
                          className={cn(
                            "rounded px-2 py-0.5 text-[11px] font-medium transition-colors",
                            activeType === type
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          {SET_TYPE_LABELS[type] ?? type}
                        </button>
                      ))}
                    </div>
                    <div className="max-h-48 overflow-y-auto p-1">
                      <button
                        onClick={() => selectSetCode(null)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-sm transition-colors",
                          !activeSet ? "bg-primary/8 font-medium text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        )}
                      >
                        {t(lang, "allSets")}
                      </button>
                      {filteredSets.map((s) => (
                        <button
                          key={s.code}
                          onClick={() => selectSetCode(s.code)}
                          className={cn(
                            "flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left transition-colors",
                            activeSet === s.code ? "bg-primary/8 text-primary" : "hover:bg-muted/60"
                          )}
                        >
                          <span className={cn(
                            "shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-bold",
                            activeSet === s.code && "bg-primary/15 text-primary"
                          )}>
                            {s.code.toUpperCase()}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-xs">
                            {s.nameEn ?? s.name}
                          </span>
                          <span className="shrink-0 text-[10px] text-muted-foreground">{s._count.cards}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Rarity chips */}
            <div>
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t(lang, "rarity")}</span>
              <div className="flex flex-wrap gap-1.5">
                {RARITY_OPTIONS.map((r) => (
                  <button
                    key={r.code}
                    onClick={() => setActiveRarity(activeRarity === r.code ? null : r.code)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                      activeRarity === r.code
                        ? "text-white shadow-sm"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                    style={activeRarity === r.code ? { backgroundColor: RARITY_HEX[r.code] ?? "#6B7280" } : undefined}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color chips */}
            <div>
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t(lang, "color")}</span>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setActiveColor(activeColor === c.code ? null : c.code)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                      activeColor === c.code
                        ? "border-primary/40 bg-primary/5 text-primary"
                        : "border-border/50 bg-background text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className={cn("size-2.5 rounded-full", c.bg)} />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Card type chips */}
            <div>
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t(lang, "type")}</span>
              <div className="flex flex-wrap gap-1.5">
                {TYPE_OPTIONS.map((t) => (
                  <button
                    key={t.code}
                    onClick={() => setActiveCardType(activeCardType === t.code ? null : t.code)}
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                      activeCardType === t.code
                        ? "border-primary/40 bg-primary/5 text-primary"
                        : "border-border/50 bg-background text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-xs font-medium text-primary hover:underline"
              >
                {t(lang, "clearAllFilters")}
              </button>
            )}
          </div>
        )}

        {/* Active filter tags (when filter panel is closed) */}
        {!showFilters && activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {activeSet && activeSetInfo && (
              <FilterTag
                label={activeSetInfo.code.toUpperCase()}
                onRemove={() => selectSetCode(null)}
              />
            )}
            {activeRarity && (
              <FilterTag
                label={RARITY_OPTIONS.find((r) => r.code === activeRarity)?.label ?? activeRarity}
                onRemove={() => setActiveRarity(null)}
              />
            )}
            {activeColor && (
              <FilterTag
                label={COLOR_OPTIONS.find((c) => c.code === activeColor)?.label ?? activeColor}
                onRemove={() => setActiveColor(null)}
              />
            )}
            {activeCardType && (
              <FilterTag
                label={TYPE_OPTIONS.find((t) => t.code === activeCardType)?.label ?? activeCardType}
                onRemove={() => setActiveCardType(null)}
              />
            )}
            <button
              onClick={clearAllFilters}
              className="text-[11px] font-medium text-muted-foreground hover:text-primary"
            >
              {t(lang, "clearAll")}
            </button>
          </div>
        )}
      </div>

      {/* Card list */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {!isFiltered && (
          <p className="px-4 pt-2 pb-1 text-[11px] text-muted-foreground/60">
            {t(lang, "highestValue")} — {t(lang, "addCardToPortfolioDesc")}
          </p>
        )}

        {loading && displayCards.length === 0 ? (
          <div className="space-y-0.5 px-2 pt-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5">
                <Skeleton className="size-10 shrink-0 rounded" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : showEmpty ? (
          <div className="flex h-40 flex-col items-center justify-center gap-1.5">
            <Search className="size-7 text-muted-foreground/15" />
            <p className="text-sm text-muted-foreground">{t(lang, "noCardsFound")}</p>
            <p className="text-xs text-muted-foreground/60">{t(lang, "noCardsFoundDesc")}</p>
          </div>
        ) : (
          <div className="space-y-0.5 px-2 pb-3 pt-1">
            {displayCards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => onSelectCard(card)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/60"
              >
                <div className="relative aspect-[63/88] w-10 shrink-0 overflow-hidden rounded bg-muted/50">
                  {card.imageUrl ? (
                    <Image
                      src={card.imageUrl}
                      alt={card.nameEn ?? card.nameJp}
                      fill
                      className="object-contain"
                      sizes="40px"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <Package className="size-4 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {card.nameEn ?? card.nameJp}
                  </p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="font-mono text-xs text-muted-foreground">
                      {card.cardCode}
                    </span>
                    {card.rarity && <RarityBadge rarity={card.rarity} size="sm" />}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {card.latestPriceJpy != null && (
                    <p className="font-price text-sm font-semibold tabular-nums text-primary">
                      {formatJpyAmount(card.latestPriceJpy, currency)}
                    </p>
                  )}
                </div>

                <ChevronDown className="size-4 shrink-0 -rotate-90 text-muted-foreground/30" />
              </button>
            ))}
          </div>
        )}

        {loading && displayCards.length > 0 && (
          <div className="flex items-center justify-center py-3">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </>
  )
}

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary">
      {label}
      <button onClick={onRemove} className="rounded-full p-0.5 hover:bg-primary/10">
        <X className="size-2.5" />
      </button>
    </span>
  )
}
