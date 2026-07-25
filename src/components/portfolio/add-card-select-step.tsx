"use client"

import { type ReactNode } from "react"
import Image from "next/image"
import {
  Check,
  CircleAlert,
  Gamepad2,
  Loader2,
  Package,
  Search,
  X,
} from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ListRow } from "@/components/ui/list-row"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { FilterModal } from "@/components/shared/filter-modal"
import { SetPicker } from "@/components/shared/set-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { FilterButton, ToolbarSearch } from "@/components/ui/toolbar"
import { cn } from "@/lib/utils"
import { RARITY_HEX } from "@/lib/constants/rarities"
import { getCardTypeLabel, getColorOptions } from "@/lib/constants/card-config"
import { getActiveGameConfigs, getGameConfig } from "@/lib/game-config"
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
  activeVariant,
  setActiveVariant,
  rarityOptions,
  colorOptions,
  typeOptions,
  variantOptions,
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
  activeVariant: string | null
  setActiveVariant: (v: string | null) => void
  rarityOptions: RarityOpt[]
  colorOptions: ColorOpt[]
  typeOptions: TypeOpt[]
  variantOptions: { code: string; label: string }[]
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
                type="button"
                onClick={() => setActiveRarity(activeRarity === r.code ? null : r.code)}
                className={cn(
                  "ease-chrome min-h-11 rounded-lg px-2.5 py-1 text-xs font-semibold md:min-h-0",
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
                type="button"
                onClick={() => setActiveColor(activeColor === c.code ? null : c.code)}
                className={cn(
                  "ease-chrome flex min-h-11 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium md:min-h-0",
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
                type="button"
                onClick={() => setActiveCardType(activeCardType === ty.code ? null : ty.code)}
                className={cn(
                  "ease-chrome min-h-11 rounded-lg border px-2.5 py-1 text-xs font-medium md:min-h-0",
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

      {/* Version — เบส: rarity ไม่มี P- แล้ว, มาเลือก ปกติ / พาราเลล ที่นี่แทน. */}
      {variantOptions.length > 0 && (
        <div>
          <span className="mb-1.5 block text-eyebrow">{t(lang, "variant")}</span>
          <div className="flex flex-wrap gap-1.5">
            {variantOptions.map((v) => (
              <button
                key={v.code}
                type="button"
                onClick={() =>
                  setActiveVariant(activeVariant === v.code ? null : v.code)
                }
                className={cn(
                  "ease-chrome min-h-11 rounded-lg border px-2.5 py-1 text-xs font-medium md:min-h-0",
                  activeVariant === v.code
                    ? "border-primary/40 bg-primary/5 text-primary"
                    : "border-hair bg-background text-muted-foreground hover:text-foreground"
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={clearAllFilters}
          className="min-h-11 px-2 text-xs font-medium text-primary hover:underline md:min-h-0"
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
  loadError = false,
  onRetry,
  displayCards,
  showEmpty,
  isFiltered,
  activeGame,
  onGameChange,
  sets,
  activeSet,
  selectSetCode,
  activeRarity,
  setActiveRarity,
  activeColor,
  setActiveColor,
  activeCardType,
  setActiveCardType,
  activeVariant,
  setActiveVariant,
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
  loadError?: boolean
  onRetry?: () => void
  displayCards: CardWithSet[]
  showEmpty: boolean
  isFiltered: boolean
  /** Optional: when provided (CardPickerForm always wires this), scopes the
   *  picker to one game and keeps that context before set/search. A single
   *  launch-ready game is shown as fixed context; 2+ games render a Select.
   *  Hosts that drive SelectStep directly without game wiring fall back to the
   *  visitor's global `currentGame`. */
  activeGame?: string
  onGameChange?: (game: string) => void
  sets: SetInfo[]
  activeSet: string | null
  selectSetCode: (code: string | null) => void
  activeRarity: string | null
  setActiveRarity: (r: string | null) => void
  activeColor: string | null
  setActiveColor: (c: string | null) => void
  activeCardType: string | null
  setActiveCardType: (t: string | null) => void
  activeVariant: string | null
  setActiveVariant: (v: string | null) => void
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
  const storeGame = useUIStore((s) => s.currentGame)
  // The picker's own game selection wins once a host wires it (CardPickerForm
  // always does); a direct SelectStep host with no game wiring falls back to
  // the visitor's global game.
  const gameSlug = activeGame ?? storeGame

  // Filters follow the picker's active game — no OPCG hardcode. Empty sections vanish.
  const gameCfg = getGameConfig(gameSlug)
  const rarityOptions = (gameCfg?.rarityFilterOptions ?? []) as RarityOpt[]
  // Colour + type labels are baked English in the config — relabel to the user's
  // language (เบส: ภาษาตัวกรองต้องตรงกับที่ user เลือก).
  const colorLabels = new Map(getColorOptions(lang).map((o) => [o.value, o.label]))
  const colorOptions = (gameCfg?.colors ?? []).map((c) => ({
    ...c,
    label: colorLabels.get(c.code) ?? c.label,
  })) as ColorOpt[]
  const typeOptions = (gameCfg?.cardTypes ?? []).map((ty) => ({
    ...ty,
    label: getCardTypeLabel(ty.code, lang),
  })) as TypeOpt[]
  const variantOptions = [
    { code: "regular", label: t(lang, "regular") },
    { code: "parallel", label: t(lang, "parallel") },
  ]

  // The picker is scoped to exactly one launch-ready game. Keep that game context
  // visible before set/card selection even while only one catalog is available.
  // Roadmap games never enter getActiveGameConfigs().
  const gameOptions = getActiveGameConfigs().map((g) => ({
    value: g.slug,
    label: g.filterName ?? g.shortName ?? g.nameEn,
  }))
  const activeGameOption = gameOptions.find((game) => game.value === activeGame)

  // Count only the modal's own facets (set has its own control up top now).
  const modalFilterCount = [
    activeRarity,
    activeColor,
    activeCardType,
    activeVariant,
  ].filter(Boolean).length

  const filterProps = {
    lang,
    activeRarity,
    setActiveRarity,
    activeColor,
    setActiveColor,
    activeCardType,
    setActiveCardType,
    activeVariant,
    setActiveVariant,
    rarityOptions,
    colorOptions,
    typeOptions,
    variantOptions,
    activeFilterCount,
    clearAllFilters,
  }

  const list = (
    <>
      {!isFiltered && (
        <div className="border-b border-hair bg-muted/20 px-5 py-2">
          <p className="text-label text-muted-foreground">
            {t(lang, "highestValue")}
          </p>
        </div>
      )}

      {loading && displayCards.length === 0 ? (
        <div className="space-y-0.5 px-2 pt-1" role="status" aria-live="polite">
          <span className="sr-only">{t(lang, "loading")}</span>
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
      ) : loadError ? (
        <EmptyState
          icon={CircleAlert}
          variant="error"
          size="sm"
          title={t(lang, "loadFailed")}
          description={t(lang, "loadCardsFailedDesc")}
          className="mx-4 my-3"
          action={
            onRetry ? (
              <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                {t(lang, "retry")}
              </Button>
            ) : undefined
          }
        />
      ) : showEmpty ? (
        <div className="flex h-40 flex-col items-center justify-center gap-1.5">
          <Search className="size-7 text-muted-foreground/15" />
          <p className="text-sm text-muted-foreground">{t(lang, "noCardsFound")}</p>
          <p className="text-meta text-muted-foreground/60">{t(lang, "noCardsFoundDesc")}</p>
        </div>
      ) : (
        <div
          data-slot="card-picker-results-list"
          className="divide-y divide-hair pb-3"
        >
          {displayCards.map((card) => {
            const selectedState = Boolean(isSelected?.(card))
            const cardName = card.nameEn ?? card.nameJp

            return (
              <ListRow
                key={card.id}
                onClick={() => onSelectCard(card)}
                ariaLabel={`${cardName} ${card.cardCode}`}
                ariaPressed={isSelected ? selectedState : undefined}
                className={cn(
                  "min-h-0 px-5 py-2",
                  selectedState && "bg-primary/5",
                )}
                leading={
                  <div className="relative aspect-[63/88] w-10 overflow-hidden rounded-sm bg-muted/50">
                    {card.imageUrl ? (
                      <Image
                        src={card.imageUrl}
                        alt={cardName}
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
                }
                title={cardName}
                subtitle={
                  <>
                    <span className="text-code text-muted-foreground">
                      {card.cardCode}
                    </span>
                    {card.rarity && (
                      <RarityBadge rarity={card.rarity} size="sm" />
                    )}
                  </>
                }
                trailing={
                  isSelected ? (
                    <span
                      aria-hidden
                      className={cn(
                        "ease-chrome flex size-6 items-center justify-center rounded-full border",
                        selectedState
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background",
                      )}
                    >
                      {selectedState && (
                        <Check className="size-3.5" strokeWidth={3} />
                      )}
                    </span>
                  ) : undefined
                }
                chevron={!isSelected}
              />
            )
          })}
        </div>
      )}

      {loading && displayCards.length > 0 && (
        <div
          className="flex items-center justify-center py-3"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
          <span className="sr-only">{t(lang, "loading")}</span>
        </div>
      )}
    </>
  )

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {showHeader && (
        <DialogHeader className="border-b border-hair px-5 py-4">
          <DialogTitle className="text-h4">
            {t(lang, "addCardToPortfolio")}
          </DialogTitle>
          <DialogDescription className="mt-1 text-meta">
            {t(lang, "cardPickerDescription")}
          </DialogDescription>
        </DialogHeader>
      )}

      {/* Compact browse controls: game context + set, then search + facets.
          Rarity/colour/type live in the filter modal. Only launch-ready games
          enter the game control. */}
      <div className="border-b border-hair bg-muted/15 px-4 py-3 sm:px-5 sm:py-4">
        <div
          data-slot="card-picker-context-controls"
          className="grid gap-2 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)]"
        >
          {activeGame != null && onGameChange && gameOptions.length > 0 && (
            <div data-slot="card-picker-game-control" className="min-w-0">
              {gameOptions.length === 1 ? (
                /* Read-only context: same shell + same leading mark as the set
                   trigger beside it (เบส: ไอคอนชุดกับเกมต้องตรงกัน) — only the
                   soft fill and the missing chevron say "ไม่ต้องกด". */
                <div
                  data-slot="card-picker-game-static"
                  className="flex h-11 items-center gap-2 rounded-lg border border-hair bg-muted/45 px-2.5 text-sm sm:h-10"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-muted">
                    <Gamepad2
                      aria-hidden
                      className="size-3.5 text-muted-foreground/60"
                    />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-foreground">
                    {activeGameOption?.label}
                  </span>
                </div>
              ) : (
                <Select
                  value={activeGame}
                  onValueChange={(value) => {
                    if (value) onGameChange(value)
                  }}
                >
                  <SelectTrigger
                    aria-label={t(lang, "chooseGame")}
                    className="h-11 w-full border-hair bg-background px-2.5 text-sm sm:h-10"
                  >
                    <span
                      data-slot="select-value"
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-muted">
                        <Gamepad2
                          aria-hidden
                          className="size-3.5 text-muted-foreground/60"
                        />
                      </span>
                      <span className="truncate text-foreground">
                        {activeGameOption?.label}
                      </span>
                    </span>
                  </SelectTrigger>
                  <SelectContent
                    align="start"
                    alignItemWithTrigger={false}
                    sideOffset={6}
                  >
                    {gameOptions.map((game) => (
                      <SelectItem key={game.value} value={game.value}>
                        <Gamepad2
                          aria-hidden
                          className="size-3.5 text-muted-foreground/60"
                        />
                        <span>{game.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <div data-slot="card-picker-set-control" className="min-w-0">
            <SetPicker
              sets={sets.map((s) => ({ ...s, cardCount: s._count.cards }))}
              selectedCode={activeSet}
              onSelect={selectSetCode}
              variant="inline"
              nullable
              triggerClassName="h-11 border-hair bg-background sm:h-10"
            />
          </div>
        </div>

        <div data-slot="card-picker-search-control" className="mt-2 min-w-0">
          <div className="flex items-center gap-2">
            <ToolbarSearch
              type="search"
              value={query}
              onValueChange={setQuery}
              placeholder={t(lang, "searchLong")}
              aria-label={t(lang, "searchLong")}
              autoComplete="off"
              autoFocus
              clearLabel={t(lang, "clearAll")}
              containerClassName="h-11 flex-1 border-hair bg-background sm:h-10 dark:bg-background"
              className="w-full"
            />

            {/* Opens the filter modal (centered on desktop, full-screen on mobile).
                Badge counts only the modal's facets — set has its own control above. */}
            <FilterButton
              count={modalFilterCount}
              active={showFilters || modalFilterCount > 0}
              onClick={() => setShowFilters(!showFilters)}
              aria-label={t(lang, "filter")}
              aria-haspopup="dialog"
              aria-expanded={showFilters}
              appearance="outline"
              iconOnly
              className="h-11 shrink-0 sm:h-10"
            />
          </div>
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
                {/* X sits INSIDE the top-right corner — poking it outside gets
                    clipped by the strip's overflow-x-auto (เบส: กากบาทโดนทับ). */}
                <button
                  type="button"
                  onClick={() => onSelectCard(c)}
                  aria-label={t(lang, "remove")}
                  className="tap-safe absolute right-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-foreground/85 text-background shadow-[var(--elev-raised)] hover:bg-danger"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {footer}

      <FilterModal
        open={showFilters}
        onOpenChange={setShowFilters}
        blurBackdrop
        onReset={() => {
          setActiveRarity(null)
          setActiveColor(null)
          setActiveCardType(null)
          setActiveVariant(null)
        }}
        resetDisabled={modalFilterCount === 0}
      >
        <FilterControls {...filterProps} />
      </FilterModal>
    </div>
  )
}
