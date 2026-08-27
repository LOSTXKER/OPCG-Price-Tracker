"use client"

import type { KeyboardEvent } from "react"
import { Layers3 } from "lucide-react"

import {
  getGameConfig,
  getLaunchReadyGameConfigs,
} from "@/lib/game-config"
import { GameCrest } from "@/components/shared/game-crest"
import { ALL_GAMES } from "@/lib/game/constants"
import { t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"

export type GameChip = {
  slug: string
  /** Fallback label for unregistered games. Registered games may provide the
   *  canonical MINE-rail label through `GameConfig.filterName`. */
  label: string
  /** Pre-formatted per-game value (unit-labelled count). Omit for name-only
   *  chips — e.g. portfolio, where the money lives in the breakdown panel. */
  value?: string
  logoUrl?: string | null
}

/** @internal Keeps roadmap/demo identities out of real selection controls. */
export function getLaunchReadyGameChips(
  games: readonly GameChip[],
  launchReadySlugs: ReadonlySet<string> = new Set(
    getLaunchReadyGameConfigs().map((game) => game.slug),
  ),
): GameChip[] {
  const seen = new Set<string>()
  return games.filter((game) => {
    if (!launchReadySlugs.has(game.slug) || seen.has(game.slug)) return false
    seen.add(game.slug)
    return true
  })
}

/** @internal Exported for keyboard regression coverage. */
export function getGameFilterTargetIndex(
  key: string,
  currentIndex: number,
  itemCount: number,
): number | null {
  if (itemCount <= 0 || currentIndex < 0 || currentIndex >= itemCount) return null
  if (key === "Home") return 0
  if (key === "End") return itemCount - 1
  if (key === "ArrowRight" || key === "ArrowDown") {
    return (currentIndex + 1) % itemCount
  }
  if (key === "ArrowLeft" || key === "ArrowUp") {
    return (currentIndex - 1 + itemCount) % itemCount
  }
  return null
}

function handleGameFilterKeyDown(event: KeyboardEvent<HTMLDivElement>) {
  const target = event.target
  if (!(target instanceof HTMLElement)) return

  const current = target.closest<HTMLButtonElement>('button[role="radio"]')
  if (!current || !event.currentTarget.contains(current)) return

  const radios = Array.from(
    event.currentTarget.querySelectorAll<HTMLButtonElement>(
      'button[role="radio"]:not(:disabled)',
    ),
  )
  const currentIndex = radios.indexOf(current)
  const nextIndex = getGameFilterTargetIndex(event.key, currentIndex, radios.length)
  if (nextIndex == null) return

  event.preventDefault()
  const next = radios[nextIndex]
  if (!next) return
  next.focus()
  if (next !== current) next.click()
}

/**
 * The "one collection, every game" filter for a unified personal surface
 * (portfolio / watchlist / alerts). The caller passes only games with real data.
 * Keep the game context visible as soon as one launch-ready data game exists:
 * the owner wants the collection scope to remain explicit even before a second
 * catalog launches. Coming-soon roadmap content deliberately lives outside
 * selection controls.
 *
 * `rail` keeps the original segmented presentation for workflows that benefit
 * from seeing every option at once. `select` is the compact MINE-toolbar form:
 * one `เกม: <scope>` trigger, with the same launch-ready choices in its menu.
 * The latter avoids creating a third tab row on portfolio/watchlist/alerts
 * while still making the collection scope explicit before a second catalog
 * launches.
 */
export function GameFilterChips({
  games,
  activeGame,
  onSelect,
  allValue,
  variant = "rail",
  className,
}: {
  games: GameChip[]
  activeGame: string
  onSelect: (game: string) => void
  /** Aggregate value shown on the "All games" chip (e.g. the cross-game total). */
  allValue?: string
  variant?: "rail" | "select"
  className?: string
}) {
  const lang = useUIStore((s) => s.language)
  const launchReadyGames = getLaunchReadyGameChips(games)

  if (launchReadyGames.length === 0) return null

  const hasActiveSelection =
    activeGame === ALL_GAMES || launchReadyGames.some((game) => game.slug === activeGame)
  const effectiveValue = hasActiveSelection ? activeGame : ALL_GAMES

  if (variant === "select") {
    const selectedGame = launchReadyGames.find(
      (game) => game.slug === effectiveValue,
    )
    const selectedLabel =
      effectiveValue === ALL_GAMES
        ? t(lang, "allGames")
        : getGameConfig(selectedGame?.slug ?? "")?.filterName ??
          selectedGame?.label ??
          t(lang, "allGames")

    return (
      <div
        data-slot="game-scope-select"
        className={cn("min-w-0 max-w-full shrink-0", className)}
      >
        <Select
          value={effectiveValue}
          onValueChange={(value) => {
            if (value) onSelect(value)
          }}
        >
          <SelectTrigger
            aria-label={`${t(lang, "filterByGame")}: ${selectedLabel}`}
            className="h-11 max-w-full shrink-0 border-border bg-background px-2.5 sm:h-9"
          >
            <span className="text-meta shrink-0">{t(lang, "game")}:</span>
            <span className="flex min-w-0 items-center gap-1.5 text-label text-foreground">
              <ScopeMark game={selectedGame} all={effectiveValue === ALL_GAMES} />
              <span className="truncate">{selectedLabel}</span>
              {effectiveValue === ALL_GAMES && allValue ? (
                <span className="shrink-0 text-code text-muted-foreground">
                  {allValue}
                </span>
              ) : selectedGame?.value ? (
                <span className="shrink-0 text-code text-muted-foreground">
                  {selectedGame.value}
                </span>
              ) : null}
            </span>
          </SelectTrigger>
          <SelectContent
            align="start"
            alignItemWithTrigger={false}
            sideOffset={6}
            className="w-auto min-w-(--anchor-width) p-1"
          >
            <SelectItem value={ALL_GAMES}>
              <ScopeMark all />
              <span>{t(lang, "allGames")}</span>
              {allValue ? (
                <span className="ml-auto text-code text-muted-foreground">
                  {allValue}
                </span>
              ) : null}
            </SelectItem>
            {launchReadyGames.map((game) => (
              <SelectItem key={game.slug} value={game.slug}>
                <ScopeMark game={game} />
                <span>
                  {getGameConfig(game.slug)?.filterName ?? game.label}
                </span>
                {game.value ? (
                  <span className="ml-auto text-code text-muted-foreground">
                    {game.value}
                  </span>
                ) : null}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "no-sb relative -mx-0.5 flex h-11 w-fit max-w-full items-center gap-0.5 overflow-x-auto rounded-full px-0.5 before:pointer-events-none before:absolute before:inset-x-0 before:inset-y-1 before:rounded-full before:bg-muted/50 before:content-[''] md:h-auto md:bg-muted/50 md:p-0.5 md:before:hidden",
        className,
      )}
    >
      <div
        role="radiogroup"
        aria-label={t(lang, "filterByGame")}
        className="contents"
        onKeyDown={handleGameFilterKeyDown}
      >
        <Seg
          active={activeGame === ALL_GAMES}
          tabIndex={activeGame === ALL_GAMES || !hasActiveSelection ? 0 : -1}
          onClick={() => onSelect(ALL_GAMES)}
          label={t(lang, "allGames")}
          value={allValue}
        />
        {launchReadyGames.map((g) => (
          <Seg
            key={g.slug}
            active={activeGame === g.slug}
            tabIndex={activeGame === g.slug ? 0 : -1}
            onClick={() => onSelect(g.slug)}
            label={getGameConfig(g.slug)?.filterName ?? g.label}
            value={g.value}
            game={g}
          />
        ))}
      </div>
    </div>
  )
}

function ScopeMark({
  game,
  all = false,
}: {
  game?: GameChip
  all?: boolean
}) {
  if (all) {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Layers3 className="size-3.5" aria-hidden />
      </span>
    )
  }

  if (game) {
    return (
      <GameCrest
        game={{
          slug: game.slug,
          nameEn: game.label,
          logoUrl: game.logoUrl,
        }}
        size={20}
        variant="selector"
        decorative
      />
    )
  }

  return null
}

function Seg({
  active,
  tabIndex,
  onClick,
  label,
  value,
  game,
}: {
  active: boolean
  tabIndex: 0 | -1
  onClick: () => void
  label: string
  value?: string
  game?: GameChip
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-label={value ? `${label}, ${value}` : label}
      aria-checked={active}
      tabIndex={tabIndex}
      onClick={onClick}
      className={cn(
        "motion-base relative isolate inline-flex h-11 shrink-0 snap-start items-center justify-center gap-2 rounded-full px-3 py-2 before:pointer-events-none before:absolute before:inset-x-0 before:inset-y-1 before:rounded-full before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:h-8 md:gap-1.5 md:px-2.5 md:py-1 md:before:hidden [&>*]:relative [&>*]:z-10",
        active
          ? "text-primary before:bg-primary/15 md:bg-primary/15"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {game ? <ScopeMark game={game} /> : null}
      <span className="whitespace-nowrap text-body-sm font-medium">{label}</span>
      {value && <span className="whitespace-nowrap text-price">{value}</span>}
    </button>
  )
}
