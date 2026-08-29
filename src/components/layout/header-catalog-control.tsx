"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  Package,
  PackageOpen,
  Search,
  X,
} from "lucide-react"

import { GameSwitcher } from "@/components/layout/game-switcher"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { IconButton } from "@/components/ui/icon-button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ResponsiveDialogContent } from "@/components/ui/responsive-dialog-content"
import { Skeleton } from "@/components/ui/skeleton"
import { useSearchKeyboardNav } from "@/hooks/use-search-keyboard-nav"
import {
  isActiveGamePrefix,
  isGamePrefix,
  resolveActiveGamePrefix,
} from "@/lib/game/constants"
import { getGameConfig } from "@/lib/game-config"
import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/ui-store"
import type { SetPickerItem } from "@/components/shared/set-picker"

type HeaderSetSectionKind =
  | "results"
  | "booster"
  | "extra"
  | "other"

export type HeaderSetSection = {
  kind: HeaderSetSectionKind
  items: SetPickerItem[]
}

// The database currently has no release dates for its 51 set rows. Keep the
// undated fallback intuitive by ordering the main booster lines before extra,
// promo, and starter sets. Dates still take precedence once populated.
const HEADER_SET_TYPE_RANK: Record<string, number> = {
  BOOSTER: 0,
  EXTRA_BOOSTER: 1,
  PROMO: 2,
  STARTER: 3,
  OTHER: 4,
}

function releaseTime(value?: string | null): number | null {
  if (!value) return null
  const time = Date.parse(value)
  return Number.isFinite(time) ? time : null
}

export function compareHeaderSetsNewestFirst(
  a: SetPickerItem,
  b: SetPickerItem,
): number {
  const aTime = releaseTime(a.releaseDate)
  const bTime = releaseTime(b.releaseDate)

  if (aTime != null && bTime != null && aTime !== bTime) return bTime - aTime
  if (aTime != null && bTime == null) return -1
  if (aTime == null && bTime != null) return 1

  const aTypeRank = HEADER_SET_TYPE_RANK[a.type] ?? 5
  const bTypeRank = HEADER_SET_TYPE_RANK[b.type] ?? 5
  if (aTypeRank !== bTypeRank) return aTypeRank - bTypeRank

  return b.code.localeCompare(a.code, undefined, {
    numeric: true,
    sensitivity: "base",
  })
}

function normalizedSearchText(set: SetPickerItem): string {
  return [set.code, set.name, set.nameEn, set.nameTh]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase()
}

export function buildHeaderSetSections(
  sets: readonly SetPickerItem[],
  query: string,
): HeaderSetSection[] {
  const sorted = [...sets].sort(compareHeaderSetsNewestFirst)
  const normalizedQuery = query.trim().toLocaleLowerCase()

  if (normalizedQuery) {
    return [
      {
        kind: "results",
        items: sorted.filter((set) =>
          normalizedSearchText(set).includes(normalizedQuery),
        ),
      },
    ]
  }

  const sections: HeaderSetSection[] = []
  const boosters = sorted.filter((set) => set.type === "BOOSTER")
  const extras = sorted.filter((set) => set.type === "EXTRA_BOOSTER")
  const others = sorted.filter(
    (set) => set.type !== "BOOSTER" && set.type !== "EXTRA_BOOSTER",
  )

  if (boosters.length > 0) sections.push({ kind: "booster", items: boosters })
  if (extras.length > 0) sections.push({ kind: "extra", items: extras })
  if (others.length > 0) sections.push({ kind: "other", items: others })

  return sections
}

export function getHeaderSetCode(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean)
  const setIndex =
    segments[0] === "sets"
      ? 0
      : isGamePrefix(segments[0]) && segments[1] === "sets"
        ? 1
        : -1

  const encoded = setIndex >= 0 ? segments[setIndex + 1] : undefined
  if (!encoded) return null

  try {
    return decodeURIComponent(encoded)
  } catch {
    return encoded
  }
}

export function resolveHeaderGame(pathname: string, fallback: string): string {
  const prefix = pathname.split("/").filter(Boolean)[0]
  return isActiveGamePrefix(prefix)
    ? prefix
    : resolveActiveGamePrefix(fallback)
}

export function getHeaderSetHref(game: string, code: string): string {
  return `/${resolveActiveGamePrefix(game)}/sets/${encodeURIComponent(code)}`
}

export function getHeaderSetDisplayName(
  set: SetPickerItem,
  language: Language,
): string {
  if (language === "TH") {
    return set.nameTh?.trim() || set.nameEn?.trim() || set.name
  }
  if (language === "EN") return set.nameEn?.trim() || set.name
  return set.name
}

function sectionLabel(kind: HeaderSetSectionKind, language: Language) {
  if (kind === "booster") return "Booster Pack"
  if (kind === "extra") return "Extra Booster"
  if (kind === "other") return t(language, "starterAndOtherSets")
  return null
}

function SetArtwork({
  set,
  size = "list",
}: {
  set: SetPickerItem
  /** `trigger` is the phone context row's inline thumbnail (box-shaped). */
  size?: "list" | "trigger"
}) {
  const box =
    size === "trigger"
      ? "h-7 w-5 rounded-sm"
      : "size-8 rounded-md"

  if (!set.imageUrl) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center bg-muted",
          box,
        )}
      >
        <Package className="size-3.5 text-muted-foreground/50" aria-hidden />
      </span>
    )
  }

  return (
    <span className={cn("relative shrink-0 overflow-hidden bg-muted", box)}>
      <Image
        src={set.imageUrl}
        alt=""
        fill
        sizes={size === "trigger" ? "20px" : "32px"}
        className={size === "trigger" ? "object-cover" : "object-contain"}
      />
    </span>
  )
}

function CatalogPanel({
  game,
  sets,
  loading,
  error,
  onRetry,
  open,
  onClose,
}: {
  game: string
  sets: readonly SetPickerItem[]
  loading: boolean
  error: boolean
  onRetry: () => void
  open: boolean
  onClose: () => void
}) {
  const language = useUIStore((state) => state.language)
  const pathname = usePathname() ?? "/"
  const selectedCode = getHeaderSetCode(pathname)
  const [query, setQuery] = useState("")
  const optionRefs = useRef<Array<HTMLAnchorElement | null>>([])
  const listId = useId()

  const sections = useMemo(
    () => buildHeaderSetSections(sets, query),
    [sets, query],
  )
  const visibleSets = useMemo(
    () => sections.flatMap((section) => section.items),
    [sections],
  )

  const selectOption = useCallback((index: number) => {
    optionRefs.current[index]?.click()
  }, [])

  const {
    activeIdx,
    setActiveIdx,
    onKeyDown: handleSearchKeyDown,
    resetActive,
  } = useSearchKeyboardNav({
    length: visibleSets.length,
    onSelect: selectOption,
    onCommit: () => selectOption(0),
    onEscape: onClose,
  })

  useEffect(() => {
    resetActive()
  }, [visibleSets, resetActive])

  useEffect(() => {
    if (!open) {
      setQuery("")
      resetActive()
    }
  }, [open, resetActive])

  useEffect(() => {
    if (activeIdx < 0) return
    optionRefs.current[activeIdx]?.scrollIntoView({ block: "nearest" })
  }, [activeIdx])

  let optionIndex = 0

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-hair p-3">
        <label className="relative block">
          <span className="sr-only">{t(language, "searchSetByCodeOrName")}</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            autoFocus
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder={t(language, "searchSetByCodeOrName")}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={
              activeIdx >= 0 ? `${listId}-option-${activeIdx}` : undefined
            }
            className="h-11 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 md:h-10 md:text-sm"
          />
        </label>
      </div>

      <div
        id={listId}
        role="listbox"
        aria-label={t(language, "selectSet")}
        aria-busy={loading}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        {loading ? (
          <div className="space-y-1 px-3 py-2" aria-label={t(language, "loading")}>
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-11 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="flex min-h-32 flex-col items-center justify-center gap-3 px-5 text-center">
            <p className="text-body-sm text-muted-foreground">
              {t(language, "setsLoadError")}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              {t(language, "retry")}
            </Button>
          </div>
        ) : visibleSets.length === 0 ? (
          <p className="px-4 py-8 text-center text-body-sm text-muted-foreground">
            {t(language, "noSetsFound")}
          </p>
        ) : (
          sections.map((section) => {
            const label = sectionLabel(section.kind, language)
            return (
              <div key={section.kind}>
                {label && (
                  <div className="sticky top-0 z-10 flex items-center justify-between border-b border-hair bg-popover px-3 py-1.5">
                    <span className="text-eyebrow">{label}</span>
                    <span className="text-micro text-muted-foreground">
                      {section.items.length}
                    </span>
                  </div>
                )}
                {section.items.map((set) => {
                  const index = optionIndex++
                  const displayName = getHeaderSetDisplayName(set, language)
                  const isCurrent =
                    selectedCode?.toLocaleLowerCase() ===
                    set.code.toLocaleLowerCase()
                  const active = activeIdx === index

                  return (
                    <Link
                      key={set.code}
                      ref={(node) => {
                        optionRefs.current[index] = node
                      }}
                      id={`${listId}-option-${index}`}
                      href={getHeaderSetHref(game, set.code)}
                      prefetch={false}
                      role="option"
                      tabIndex={-1}
                      aria-selected={isCurrent}
                      aria-current={isCurrent ? "page" : undefined}
                      onFocus={() => setActiveIdx(index)}
                      onMouseEnter={() => setActiveIdx(index)}
                      onClick={onClose}
                      className={cn(
                        "ease-chrome flex min-h-11 items-center gap-2.5 px-3 py-1.5 text-left transition-colors",
                        active && "bg-muted",
                        isCurrent && "font-medium text-foreground",
                      )}
                    >
                      <SetArtwork set={set} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-code text-muted-foreground">
                          {set.code}
                        </span>
                        <span className="block truncate text-body-sm text-foreground">
                          {displayName}
                        </span>
                      </span>
                      {set.cardCount != null && (
                        <span className="shrink-0 text-meta tabular-nums">
                          {set.cardCount}
                        </span>
                      )}
                      <ChevronRight
                        className="size-4 shrink-0 text-muted-foreground/60"
                        aria-hidden
                      />
                    </Link>
                  )
                })}
              </div>
            )
          })
        )}
      </div>

      <div className="shrink-0 border-t border-hair p-2">
        <Link
          href={`/${resolveActiveGamePrefix(game)}/sets`}
          prefetch={false}
          onClick={onClose}
          className="ease-chrome flex min-h-11 items-center gap-2 rounded-lg px-3 text-body-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <span className="flex size-8 items-center justify-center rounded-md bg-muted">
            <LayoutGrid className="size-4 text-muted-foreground" aria-hidden />
          </span>
          <span className="flex-1">{t(language, "viewAllSets")}</span>
          <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
        </Link>
      </div>
    </div>
  )
}

export function HeaderCatalogControl({
  game,
  sets,
  loading,
  error,
  onRetry,
  presentation,
  className,
}: {
  game: string
  sets: readonly SetPickerItem[]
  loading: boolean
  error: boolean
  onRetry: () => void
  presentation: "desktop" | "mobile"
  className?: string
}) {
  const language = useUIStore((state) => state.language)
  const pathname = usePathname() ?? "/"
  const [open, setOpen] = useState(false)
  // A `/sets/<code>` URL names its own set. A card page cannot — its URL holds
  // only the card, and the set is NOT derivable from the card code (reprints
  // and promos keep their old code in a new set), so the card page publishes
  // the real one to the store and this control falls back to it. Owner request
  // 2026-08-28: "เวลาไปหน้าการ์ดไหนก็ตาม อยากให้ navbar ชุดการ์ดเลือกชุดนั้นด้วย".
  const publishedSetCode = useUIStore((state) => state.activeSetCode)
  const selectedCode = getHeaderSetCode(pathname) ?? publishedSetCode
  const selectedSet = sets.find(
    (set) =>
      selectedCode?.toLocaleLowerCase() === set.code.toLocaleLowerCase(),
  )
  const gameLabel = getGameConfig(game)?.shortName ?? game.toUpperCase()
  const selectedName = selectedSet
    ? getHeaderSetDisplayName(selectedSet, language)
    : null

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)")
    const closeHiddenSurface = (event: MediaQueryListEvent) => {
      if (
        (presentation === "mobile" && event.matches) ||
        (presentation === "desktop" && !event.matches)
      ) {
        setOpen(false)
      }
    }

    media.addEventListener("change", closeHiddenSurface)
    return () => media.removeEventListener("change", closeHiddenSurface)
  }, [presentation])

  const triggerLabel = selectedSet
    ? `${selectedSet.code} · ${selectedName}`
    : selectedCode ?? t(language, "selectSet")

  const trigger = (
    <button
      type="button"
      aria-label={triggerLabel}
      className={cn(
        "surface-2 hairline ease-chrome flex min-w-0 items-center gap-1.5 rounded-full text-left text-label text-foreground transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        presentation === "mobile"
          ? // Its own row since 2026-08-29, so it finally gets real width: no
            // max-width cap, and room on the left for the set's box art.
            "h-9 min-w-11 flex-1 ps-1.5 pe-2.5"
          : "h-11 w-44 px-2.5 lg:h-10 lg:w-40 lg:py-1 lg:pe-2.5 lg:ps-1 xl:w-56",
      )}
    />
  )

  const triggerContent =
    presentation === "mobile" ? (
      <>
        {selectedSet ? (
          <SetArtwork set={selectedSet} size="trigger" />
        ) : (
          <PackageOpen
            className="ms-1 size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
        )}
        {/* Two lines when a set is chosen — the code stays scannable while the
            full name is finally readable instead of truncated to "The Azure…". */}
        <span className="min-w-0 flex-1">
          {selectedSet ? (
            <>
              <span className="block truncate text-xs font-semibold leading-tight text-foreground">
                {selectedSet.code.toUpperCase()}
              </span>
              <span className="block truncate text-xs leading-tight text-muted-foreground">
                {selectedName}
              </span>
            </>
          ) : (
            <span className="block truncate">{t(language, "selectSet")}</span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </>
    ) : (
      <>
        {/* Same box art the phone row uses (owner call 2026-08-29): collectors
            recognise packaging long before they recognise "op14". PackageOpen
            stays as the fallback when no set is chosen yet. */}
        {selectedSet ? (
          <SetArtwork set={selectedSet} size="trigger" />
        ) : (
          <PackageOpen
            className="size-3.5 shrink-0 text-muted-foreground"
            aria-hidden
          />
        )}
        <span className="min-w-0 flex-1 truncate">
          {selectedSet ? (
            <>
              <span className="block truncate text-xs font-semibold leading-tight text-foreground">
                {selectedSet.code.toUpperCase()}
              </span>
              {/* The name yields below xl — the merged chrome row shares its
                  width with the movers rail, which needs it more. */}
              <span className="hidden truncate text-xs leading-tight text-muted-foreground xl:block">
                {selectedName}
              </span>
            </>
          ) : (
            triggerLabel
          )}
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </>
    )

  const sharedPanelProps = {
    game,
    sets,
    loading,
    error,
    onRetry,
    open,
    onClose: () => setOpen(false),
  }

  return (
    <div
      data-header-catalog-control={presentation}
      className={cn(
        "flex items-center",
        presentation === "desktop" && "shrink-0",
        presentation === "mobile" && "min-w-0 flex-1 gap-1",
        className,
      )}
    >
      <GameSwitcher
        game={game}
        appearance="standalone"
        compactOnNarrow={presentation === "mobile"}
        className={cn(
          presentation === "mobile"
            ? "min-[360px]:px-2.5"
            : "mr-1 px-2.5",
        )}
      />

      <ChevronRight
        className={cn(
          "size-3 shrink-0 text-muted-foreground/60",
          presentation === "mobile" && "hidden min-[430px]:block",
        )}
        aria-hidden
      />

      {presentation === "mobile" ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={trigger}>{triggerContent}</DialogTrigger>
          <ResponsiveDialogContent showCloseButton={false}>
            <div className="flex min-h-14 shrink-0 items-center gap-2 border-b border-hair px-4">
              <DialogTitle className="flex min-w-0 flex-1 items-center gap-1.5">
                <span>{gameLabel}</span>
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <span className="truncate">{t(language, "selectSet")}</span>
              </DialogTitle>
              <DialogDescription className="sr-only">
                {t(language, "searchSetByCodeOrName")}
              </DialogDescription>
              <DialogClose
                render={
                  <IconButton
                    aria-label={t(language, "close")}
                    className="-mr-1"
                  >
                    <X className="size-4" />
                  </IconButton>
                }
              />
            </div>
            <CatalogPanel {...sharedPanelProps} />
          </ResponsiveDialogContent>
        </Dialog>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger render={trigger}>{triggerContent}</PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={8}
            collisionPadding={16}
            showArrow={false}
            className="flex h-[min(36rem,var(--available-height))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden p-0"
          >
            <CatalogPanel {...sharedPanelProps} />
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
