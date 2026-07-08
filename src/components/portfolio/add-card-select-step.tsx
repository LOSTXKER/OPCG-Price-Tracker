"use client"

import { type ReactNode } from "react"
import Image from "next/image"
import {
  Check,
  ChevronDown,
  Filter,
  Loader2,
  Package,
  RotateCcw,
  Search,
  X,
} from "lucide-react"

import {
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { SetPicker } from "@/components/shared/set-picker"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { RARITY_HEX } from "@/lib/constants/rarities"
import { getGameConfig } from "@/lib/game-config"
import { useUIStore } from "@/stores/ui-store"
import { t, type Language } from "@/lib/i18n"
import { type CardWithSet, type SetInfo } from "./add-card-types"

type RarityOpt = { code: string; label: string }
type ColorOpt = { code: string; label: string; bg: string }
type TypeOpt = { code: string; label: string }

/**
 * The filter cluster (set + rarity + color + type). Rendered twice by the same
 * SelectStep: as the always-visible LEFT RAIL on desktop, and inside the
 * collapsible panel on mobile. Options come from the CURRENT GAME's config
 * (getGameConfig) — a section only renders when that game defines it, so a game
 * with no colours simply shows fewer filters (multi-game ready, no OPCG hardcode).
 */
function FilterControls({
  lang,
  activeRarity,
  setActiveRarity,
  activeColor,
  setActiveColor,
  activeCardType,
  setActiveCardType,
  rarityOptions,
  colorOptions,
  typeOptions,
  activeFilterCount,
  clearAllFilters,
}: {
  lang: Language
  activeRarity: string | null
  setActiveRarity: (r: string | null) => void
  activeColor: string | null
  setActiveColor: (c: string | null) => void
  activeCardType: string | null
  setActiveCardType: (t: string | null) => void
  rarityOptions: RarityOpt[]
  colorOptions: ColorOpt[]
  typeOptions: TypeOpt[]
  activeFilterCount: number
  clearAllFilters: () => void
}) {
  return (
    <div className="space-y-3.5">
      {/* Set is NOT here — it lives as a prominent control up in the search row
          (เบส: ผู้ใช้เลือกชุดก่อน). The modal holds only rarity / colour / type. */}
      {rarityOptions.length > 0 && (
        <div>
          <span className="mb-1.5 block text-eyebrow">{t(lang, "rarity")}</span>
          <div className="flex flex-wrap gap-1.5">
            {rarityOptions.map((r) => (
              <button
                key={r.code}
                onClick={() => setActiveRarity(activeRarity === r.code ? null : r.code)}
                className={cn(
                  "ease-chrome rounded-lg px-2.5 py-1 text-xs font-semibold",
                  activeRarity === r.code
                    ? "text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
                style={activeRarity === r.code ? { backgroundColor: RARITY_HEX[r.code] ?? "#6B7280" } : undefined}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {colorOptions.length > 0 && (
        <div>
          <span className="mb-1.5 block text-eyebrow">{t(lang, "color")}</span>
          <div className="flex flex-wrap gap-1.5">
            {colorOptions.map((c) => (
              <button
                key={c.code}
                onClick={() => setActiveColor(activeColor === c.code ? null : c.code)}
                className={cn(
                  "ease-chrome flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium",
                  activeColor === c.code
                    ? "border-primary/40 bg-primary/5 text-primary"
                    : "border-hair bg-background text-muted-foreground hover:text-foreground"
                )}
              >
                <span className={cn("size-2.5 rounded-full", c.bg)} />
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {typeOptions.length > 0 && (
        <div>
          <span className="mb-1.5 block text-eyebrow">{t(lang, "type")}</span>
          <div className="flex flex-wrap gap-1.5">
            {typeOptions.map((ty) => (
              <button
                key={ty.code}
                onClick={() => setActiveCardType(activeCardType === ty.code ? null : ty.code)}
                className={cn(
                  "ease-chrome rounded-lg border px-2.5 py-1 text-xs font-medium",
                  activeCardType === ty.code
                    ? "border-primary/40 bg-primary/5 text-primary"
                    : "border-hair bg-background text-muted-foreground hover:text-foreground"
                )}
              >
                {ty.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeFilterCount > 0 && (
        <button
          onClick={clearAllFilters}
          className="text-xs font-medium text-primary hover:underline"
        >
          {t(lang, "clearAllFilters")}
        </button>
      )}
    </div>
  )
}

/**
 * "Search / filter → pick a card" body. Search-hero. On desktop the filters live
 * in an always-visible left rail (two panes: rail | results) so filtering never
 * covers the cards; on mobile they open in a full-screen sheet behind the filter
 * toggle. An optional `footer` (commit bar) renders inside the picker so the mobile
 * sheet covers it — no button clash.
 */
export function SelectStep({
  query,
  setQuery,
  loading,
  displayCards,
  showEmpty,
  isFiltered,
  sets,
  activeSet,
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
  isSelected,
  showHeader = true,
  footer,
  selected,
}: {
  query: string
  setQuery: (q: string) => void
  loading: boolean
  displayCards: CardWithSet[]
  showEmpty: boolean
  isFiltered: boolean
  sets: SetInfo[]
  activeSet: string | null
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
  /** Multi-pick mode: predicate → matching rows render selected (Check + highlight). */
  isSelected?: (card: CardWithSet) => boolean
  /** Hide the built-in DialogHeader when the host supplies its own (alerts). */
  showHeader?: boolean
  /** Commit bar (e.g. watchlist "add N") rendered inside the picker so the filter
   *  overlay covers it — keeps the host from stacking a second button under it. */
  footer?: ReactNode
  /** Multi-pick: the cards picked so far. When non-empty, a horizontal preview
   *  strip (thumbnail + remove) renders above the footer. Remove toggles through
   *  onSelectCard (tapping a selected card again deselects it). */
  selected?: CardWithSet[]
}) {
  const lang = useUIStore((s) => s.language)
  const currentGame = useUIStore((s) => s.currentGame)

  // Filters follow the current game — no OPCG hardcode. Empty sections vanish.
  const gameCfg = getGameConfig(currentGame)
  const rarityOptions = (gameCfg?.rarityFilterOptions ?? []) as RarityOpt[]
  const colorOptions = (gameCfg?.colors ?? []) as ColorOpt[]
  const typeOptions = (gameCfg?.cardTypes ?? []) as TypeOpt[]

  // Count only the modal's own facets (set has its own control up top now).
  const modalFilterCount = [activeRarity, activeColor, activeCardType].filter(
    Boolean,
  ).length

  const filterProps = {
    lang,
    activeRarity,
    setActiveRarity,
    activeColor,
    setActiveColor,
    activeCardType,
    setActiveCardType,
    rarityOptions,
    colorOptions,
    typeOptions,
    activeFilterCount,
    clearAllFilters,
  }

  const list = (
    <>
      {!isFiltered && (
        <p className="px-4 pt-2 pb-1 text-meta text-muted-foreground/60">
          {t(lang, "highestValue")}
        </p>
      )}

      {loading && displayCards.length === 0 ? (
        <div className="space-y-0.5 px-2 pt-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5">
              <Skeleton className="size-10 shrink-0 rounded-sm" />
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
          <p className="text-meta text-muted-foreground/60">{t(lang, "noCardsFoundDesc")}</p>
        </div>
      ) : (
        <div className="space-y-0.5 px-2 pb-3 pt-1">
          {displayCards.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelectCard(card)}
              className={cn(
                "ease-chrome flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted/70",
                isSelected?.(card) && "bg-primary/5"
              )}
            >
              <div className="relative aspect-[63/88] w-10 shrink-0 overflow-hidden rounded-sm bg-muted/50">
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

              {/* Trailing affordance tells you what a tap does: a checkbox on
                  select-then-confirm surfaces (isSelected passed), a chevron on
                  surfaces that advance to a next step (portfolio/alerts). No price
                  here — picking a card is about identity, not value. */}
              {isSelected ? (
                <span
                  className={cn(
                    "ease-chrome flex size-5 shrink-0 items-center justify-center rounded-full border",
                    isSelected(card)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border"
                  )}
                >
                  {isSelected(card) && <Check className="size-3" strokeWidth={3} />}
                </span>
              ) : (
                <ChevronDown className="size-4 shrink-0 -rotate-90 text-muted-foreground/30" />
              )}
            </button>
          ))}
        </div>
      )}

      {loading && displayCards.length > 0 && (
        <div className="flex items-center justify-center py-3">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </>
  )

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {showHeader && (
        <DialogHeader className="border-b border-hair px-5 pt-4 pb-3">
          <DialogTitle>{t(lang, "addCardToPortfolio")}</DialogTitle>
        </DialogHeader>
      )}

      {/* Set (the primary browse axis — เบส: ผู้ใช้เลือกชุดก่อน) sits prominently
          above the search + filter row. Rarity/colour/type live in the filter modal. */}
      <div className="space-y-2 border-b border-hair px-4 pt-3 pb-3">
        <SetPicker
          sets={sets.map((s) => ({ ...s, cardCount: s._count.cards }))}
          selectedCode={activeSet}
          onSelect={selectSetCode}
          variant="inline"
          nullable
          prominent
        />
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
            <input
              type="search"
              placeholder={t(lang, "searchLong")}
              className="h-9 w-full rounded-lg border border-hair bg-muted/30 pl-9 pr-8 text-sm outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary/40 focus:bg-background focus:ring-1 focus:ring-primary/20"
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

          {/* Opens the filter modal (centered on desktop, full-screen on mobile).
              Badge counts only the modal's facets — set has its own control above. */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "ease-chrome relative flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-sm",
              showFilters || modalFilterCount > 0
                ? "border-primary/40 bg-primary/5 text-primary"
                : "border-hair bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Filter className="size-3.5" />
            <span className="hidden sm:inline">{t(lang, "filter")}</span>
            {modalFilterCount > 0 && (
              <span className="flex size-4.5 items-center justify-center rounded-full bg-primary text-micro text-primary-foreground">
                {modalFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Results — single column; filters open in the modal below. */}
      <div className="min-h-0 flex-1 overflow-y-auto">{list}</div>

      {/* Picked-so-far preview — a horizontal thumbnail strip above the commit bar
          (เบส: หน้าที่เลือกหลายใบ ให้เห็นการ์ดที่เลือก). Remove taps toggle the card
          back off via onSelectCard. Only shows in multi-pick surfaces. */}
      {selected && selected.length > 0 && (
        <div className="shrink-0 border-t border-hair px-3 pb-2.5 pt-2">
          <span className="mb-1.5 block text-eyebrow">
            {t(lang, "selectedCards")} ({selected.length})
          </span>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {selected.map((c) => (
              <div key={c.id} className="relative shrink-0">
                <div className="relative aspect-[63/88] w-12 overflow-hidden rounded-md border border-hair bg-muted/50">
                  {c.imageUrl ? (
                    <Image
                      src={c.imageUrl}
                      alt={c.nameEn ?? c.nameJp}
                      fill
                      className="object-contain"
                      sizes="48px"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <Package className="size-4 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onSelectCard(c)}
                  aria-label={t(lang, "remove")}
                  className="tap-safe absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-background shadow-[var(--elev-raised)] hover:bg-danger"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {footer}

      {/* Filters — a CoinMarketCap-style modal: full-screen on mobile, a centered
          card on desktop (เบส). Rendered INSIDE the picker (absolute, not a portal)
          so it works in a Dialog / the z-100 compare modal without nesting portals. */}
      {showFilters && (
        <>
          {/* desktop backdrop — dark blur (mobile panel is full-screen) */}
          <button
            type="button"
            aria-label={t(lang, "close")}
            onClick={() => setShowFilters(false)}
            className="absolute inset-0 z-20 hidden bg-black/40 animate-in fade-in-0 supports-backdrop-filter:backdrop-blur-sm md:block"
          />
          <div className="absolute inset-0 z-30 flex flex-col bg-background animate-in fade-in-0 slide-in-from-bottom-3 duration-[var(--dur-base)] md:inset-auto md:left-1/2 md:top-1/2 md:max-h-[85%] md:w-[26rem] md:max-w-[calc(100%-2rem)] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:border md:border-hair md:shadow-[var(--elev-overlay)]">
            <div className="flex items-center justify-between border-b border-hair px-4 py-3">
              <span className="text-h4">{t(lang, "filter")}</span>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                aria-label={t(lang, "close")}
                className="tap-safe -mr-1 flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              <FilterControls {...filterProps} />
            </div>
            {/* Reset (left) + Apply (right) — CoinMarketCap footer */}
            <div className="flex items-center gap-3 border-t border-hair p-3">
              <button
                type="button"
                onClick={() => {
                  setActiveRarity(null)
                  setActiveColor(null)
                  setActiveCardType(null)
                }}
                disabled={modalFilterCount === 0}
                className="ease-chrome flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium text-primary hover:bg-primary/5 disabled:opacity-40"
              >
                <RotateCcw className="size-3.5" />
                {t(lang, "reset")}
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="ease-chrome h-11 flex-1 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {t(lang, "apply")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
