"use client"

import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  ArrowRightLeft,
  BarChart3,
  BookOpen,
  Briefcase,
  Camera,
  Clock,
  Heart,
  LayoutGrid,
  LineChart,
  PackageOpen,
  Search,
  Settings,
  Sparkles,
  Swords,
  Tag,
  TrendingUp,
  XIcon,
  type LucideIcon,
} from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { SearchResultRow } from "@/components/shared/search-result-row"
import type { SetPickerItem } from "@/components/shared/set-picker"
import { getCardName, getSetName, t, type TranslationKey } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import { useCardSearch } from "@/hooks/use-card-search"
import { useRecentSearches } from "@/hooks/use-recent-searches"
import { useSearchKeyboardNav } from "@/hooks/use-search-keyboard-nav"

const MAX_SET_RESULTS = 4

const PhotoSearchButton = dynamic(
  () => import("@/app/search/photo-search-button").then((module) => module.PhotoSearchButton),
  { ssr: false },
)

/** Navigation shortcuts surfaced in the palette (cards + "go to" pages). */
const NAV_ACTIONS: { href: string; labelKey: TranslationKey; icon: LucideIcon }[] = [
  // IA-NAV-06: labels match the canonical destination names used by the header
  // nav + bottom-nav ("หน้าแรก"/"ชุดการ์ด") so a place has one name everywhere.
  { href: "/", labelKey: "home", icon: LineChart },
  { href: "/opcg/sets", labelKey: "sets", icon: LayoutGrid },
  { href: "/opcg/market-overview", labelKey: "marketOverview", icon: BarChart3 },
  { href: "/opcg/decks", labelKey: "decksAndTools", icon: Swords },
  { href: "/portfolio", labelKey: "portfolioNav", icon: Briefcase },
  { href: "/watchlist", labelKey: "watchlistNav", icon: Heart },
  { href: "/opcg/trending", labelKey: "footerTrending", icon: TrendingUp },
  { href: "/opcg/compare", labelKey: "compareCards", icon: ArrowRightLeft },
  { href: "/honey", labelKey: "honeyPageTitle", icon: Sparkles },
  // IA-NAV-04: complete the palette — every top destination is reachable.
  { href: "/guide", labelKey: "guide", icon: BookOpen },
  { href: "/pricing", labelKey: "pricing", icon: Tag },
  { href: "/settings", labelKey: "settingsTitle", icon: Settings },
]

/**
 * Compact palette trigger. The desktop chrome carries its own inline search
 * button inside the ticker (restored 2026-08-28), so this stays available for
 * any surface that wants the standalone control.
 */
export function CommandSearchTrigger({
  onClick,
  className,
}: {
  onClick: () => void
  className?: string
}) {
  const lang = useUIStore((s) => s.language);
  return (
    <button
      data-header-search
      type="button"
      onClick={onClick}
      aria-label={t(lang, "searchCardsDots")}
      className={cn(
        "surface-3 hairline ease-chrome flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-xl px-0 text-label text-foreground transition-[background-color,box-shadow] hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        "md:h-9 md:w-20 md:justify-start md:px-2.5 lg:w-28 lg:px-3 xl:w-44",
        className,
      )}
    >
      <Search className="size-4 shrink-0 text-foreground/70" aria-hidden />
      <span className="hidden min-w-0 flex-1 truncate text-left md:inline lg:hidden">
        {t(lang, "search")}
      </span>
      <span className="hidden min-w-0 flex-1 truncate text-left lg:inline">
        {t(lang, "searchCardsDots")}
      </span>
      <kbd className="hidden shrink-0 rounded-md bg-background/70 px-1.5 py-0.5 font-mono text-micro text-muted-foreground xl:inline">
        /
      </kbd>
    </button>
  )
}

export function CommandSearchModal({
  open,
  onClose,
  sets = [],
}: {
  open: boolean
  onClose: () => void
  sets?: SetPickerItem[]
}) {
  const router = useRouter()
  const lang = useUIStore((s) => s.language)
  const listboxId = useId()
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const [photoSearchOpen, setPhotoSearchOpen] = useState(false)

  const openPhotoSearch = useCallback(() => {
    onClose()
    setPhotoSearchOpen(true)
  }, [onClose])

  // This palette is opened by global header buttons/keyboard shortcuts rather
  // than a DialogTrigger nested under its Root. Remember the last focused
  // element while closed so Base UI can still restore focus after Escape.
  useEffect(() => {
    if (open) return

    const rememberFocus = (event: FocusEvent) => {
      if (
        event.target instanceof HTMLElement &&
        !event.target.closest('[data-slot="dialog-content"]')
      ) {
        restoreFocusRef.current = event.target
      }
    }

    if (
      document.activeElement instanceof HTMLElement &&
      document.activeElement !== document.body &&
      !document.activeElement.closest('[data-slot="dialog-content"]')
    ) {
      restoreFocusRef.current = document.activeElement
    }

    document.addEventListener("focusin", rememberFocus, true)
    return () => document.removeEventListener("focusin", rememberFocus, true)
  }, [open])

  // Shared engine: 8-result cap + zero debounce keep the palette's snappy feel.
  const { query, setQuery, results, loading, error, reset } = useCardSearch({
    limit: 8,
    debounceMs: 0,
  })
  const { recent, push: pushRecent, refresh: refreshRecent } = useRecentSearches()

  const goToCard = useCallback((code: string) => {
    onClose()
    router.push(`/opcg/cards/${code}`)
  }, [onClose, router])

  const goToPage = useCallback((href: string) => {
    onClose()
    router.push(href)
  }, [onClose, router])

  const commitSearch = useCallback((q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return
    pushRecent(trimmed)
    onClose()
    router.push(`/opcg/search?q=${encodeURIComponent(trimmed)}`)
  }, [onClose, pushRecent, router])

  const filteredRecent = useMemo(() => {
    const tq = query.trim().toLowerCase()
    if (!tq) return recent
    return recent.filter((r) => r.toLowerCase().includes(tq))
  }, [recent, query])

  const normalizedQuery = query.trim().toLowerCase()
  const setMatches = useMemo(() => {
    if (!normalizedQuery) return []

    return sets
      .filter((set) =>
        set.code.toLowerCase().includes(normalizedQuery) ||
        set.name.toLowerCase().includes(normalizedQuery) ||
        (set.nameEn ?? "").toLowerCase().includes(normalizedQuery) ||
        (set.nameTh ?? "").toLowerCase().includes(normalizedQuery),
      )
      .slice(0, MAX_SET_RESULTS)
  }, [normalizedQuery, sets])

  // Nav shortcuts: all of them when the box is empty (quick links), otherwise
  // those whose localized label matches the query.
  const matchedNav = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return NAV_ACTIONS
    return NAV_ACTIONS.filter((a) => t(lang, a.labelKey).toLowerCase().includes(q))
  }, [query, lang])

  const allItems = useMemo(() => {
    const items: { type: "result" | "set" | "search" | "nav" | "recent"; key: string }[] = []
    for (const r of results) items.push({ type: "result", key: r.cardCode })
    for (const set of setMatches) items.push({ type: "set", key: set.code })
    if (query.trim().length >= 2) items.push({ type: "search", key: query.trim() })
    for (const a of matchedNav) items.push({ type: "nav", key: a.href })
    if (results.length === 0 && setMatches.length === 0) {
      for (const r of filteredRecent) items.push({ type: "recent", key: r })
    }
    return items
  }, [results, setMatches, matchedNav, filteredRecent, query])

  const setBase = results.length
  const searchIndex = setBase + setMatches.length
  const hasSearchAction = query.trim().length >= 2
  const navBase = searchIndex + (hasSearchAction ? 1 : 0)
  const recentBase = navBase + matchedNav.length

  const { activeIdx, setActiveIdx, onKeyDown: handleKeyDown } = useSearchKeyboardNav({
    length: allItems.length,
    onSelect: (i) => {
      const item = allItems[i]
      if (item.type === "result") goToCard(item.key)
      else if (item.type === "set") goToPage(`/opcg/sets/${item.key}`)
      else if (item.type === "nav") goToPage(item.key)
      else commitSearch(item.key)
    },
    onCommit: () => commitSearch(query),
    arrowUpFloor: -1,
  })

  // A fresh result batch drops any stale keyboard highlight (debounceMs:0 means
  // an in-flight ArrowDown could otherwise retarget onto a different card and
  // mis-fire on Enter). setTimeout keeps the setState out of the effect body.
  useEffect(() => {
    const tm = setTimeout(() => setActiveIdx(-1), 0)
    return () => clearTimeout(tm)
  }, [results, setMatches, setActiveIdx])

  useEffect(() => {
    if (!open) return
    // Async tick keeps the reset out of the synchronous effect body; the
    // modal opens on the same frame either way. refresh picks up recents added
    // by other surfaces while this always-mounted modal was closed.
    const tm = setTimeout(() => {
      refreshRecent()
      reset()
      setActiveIdx(-1)
    }, 0)
    return () => clearTimeout(tm)
  }, [open, refreshRecent, reset, setActiveIdx])

  const activeOptionId =
    activeIdx >= 0 ? `${listboxId}-option-${activeIdx}` : undefined

  return (
    <>
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent
        showCloseButton={false}
        finalFocus={photoSearchOpen ? false : restoreFocusRef}
        className="top-[15vh] block max-w-lg translate-y-0 overflow-hidden rounded-2xl p-0 sm:max-w-lg"
      >
        <DialogTitle className="sr-only">
          {t(lang, "searchCardsDots")}
        </DialogTitle>
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-hair px-4">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setActiveIdx(-1)
              }}
              onKeyDown={handleKeyDown}
              placeholder={t(lang, "searchCardsCodesDots")}
              className="h-12 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
              role="combobox"
              aria-label={t(lang, "searchCardsDots")}
              aria-expanded={open}
              aria-autocomplete="list"
              aria-controls={listboxId}
              aria-activedescendant={activeOptionId}
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => reset()}
                className="tap-safe flex size-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
              >
                <XIcon className="size-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => commitSearch(query)}
              disabled={!query.trim()}
              className="min-h-11 shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground motion-base hover:bg-primary/90 disabled:opacity-30 sm:min-h-0"
            >
              {t(lang, "search")}
            </button>
            <DialogClose
              aria-label={t(lang, "close")}
              className="rounded-md border border-transparent dark:border-hair bg-muted/40 px-1.5 py-0.5 font-mono text-micro text-muted-foreground"
            >
              ESC
            </DialogClose>
          </div>

          <div className="border-b border-hair p-2">
            <button
              data-command-photo-search
              type="button"
              onClick={openPhotoSearch}
              className="ease-chrome flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <Camera className="size-4 text-primary" aria-hidden />
              <span className="flex-1">{t(lang, "photoSearchTitle")}</span>
              <span className="hidden max-w-[14rem] truncate text-meta sm:inline">
                {t(lang, "photoSearchDescription")}
              </span>
            </button>
          </div>

          {/* Results */}
          <div
            id={listboxId}
            role="listbox"
            aria-label={t(lang, "searchCardsDots")}
            className="max-h-[50vh] overflow-y-auto"
          >
            {loading && results.length === 0 && (
              <div className="p-2 space-y-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                    <Skeleton className="size-10 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-32 rounded-sm" />
                      <Skeleton className="h-3 w-20 rounded-sm" />
                    </div>
                    <Skeleton className="h-4 w-16 shrink-0 rounded-sm" />
                  </div>
                ))}
              </div>
            )}

            {results.length > 0 && (
              <div className="p-2">
                <p className="px-2 py-1.5 text-eyebrow text-muted-foreground/60">
                  {t(lang, "card")}
                </p>
                {results.map((card, i) => (
                  <button
                    key={card.cardCode}
                    id={`${listboxId}-option-${i}`}
                    type="button"
                    role="option"
                    aria-selected={activeIdx === i}
                    onClick={() => goToCard(card.cardCode)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left motion-base",
                      activeIdx === i ? "bg-accent" : "hover:bg-accent/60"
                    )}
                  >
                    <SearchResultRow
                      card={card}
                      lang={lang}
                      thumbFit="contain"
                      thumbClassName="rounded-lg"
                      alt={getCardName(lang, card)}
                    />
                  </button>
                ))}
              </div>
            )}

            {setMatches.length > 0 && (
              <div className="p-2">
                <p className="px-2 py-1.5 text-eyebrow text-muted-foreground/60">
                  {t(lang, "sets")}
                </p>
                {setMatches.map((set, i) => {
                  const itemIndex = setBase + i
                  return (
                    <button
                      key={set.code}
                      id={`${listboxId}-option-${itemIndex}`}
                      type="button"
                      role="option"
                      aria-selected={activeIdx === itemIndex}
                      onClick={() => goToPage(`/opcg/sets/${set.code}`)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left motion-base",
                        activeIdx === itemIndex ? "bg-accent" : "hover:bg-accent/60",
                      )}
                    >
                      <span className="surface-2 flex size-10 shrink-0 items-center justify-center rounded-lg">
                        <PackageOpen className="size-4 text-muted-foreground" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {getSetName(lang, set)}
                        </span>
                        <span className="text-code text-muted-foreground">
                          {set.code.toUpperCase()}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {hasSearchAction && (
              <div className="px-2 pb-2">
                <button
                  id={`${listboxId}-option-${searchIndex}`}
                  type="button"
                  role="option"
                  aria-selected={activeIdx === searchIndex}
                  onClick={() => commitSearch(query)}
                  className={cn(
                    "flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-meta motion-base hover:bg-accent/60 hover:text-foreground",
                    activeIdx === searchIndex && "bg-accent text-foreground",
                  )}
                >
                  <Search className="size-3" aria-hidden />
                  {t(lang, "viewAllResults")} &ldquo;{query.trim()}&rdquo;
                </button>
              </div>
            )}

            {/* Pages — navigation shortcuts (all when empty, filtered when typing) */}
            {matchedNav.length > 0 && (
              <div className="p-2">
                <p className="px-2 py-1.5 text-eyebrow text-muted-foreground/60">
                  {t(lang, "pages")}
                </p>
                {matchedNav.map((action, i) => {
                  const Icon = action.icon
                  return (
                    <button
                      key={action.href}
                      id={`${listboxId}-option-${navBase + i}`}
                      type="button"
                      role="option"
                      aria-selected={activeIdx === navBase + i}
                      onClick={() => goToPage(action.href)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm motion-base",
                        activeIdx === navBase + i ? "bg-accent" : "hover:bg-accent/60"
                      )}
                    >
                      <Icon className="size-4 text-muted-foreground" />
                      {t(lang, action.labelKey)}
                    </button>
                  )
                })}
              </div>
            )}

            {error && query.trim().length >= 2 && !loading && (
              <div className="border-b border-destructive/10 px-4 py-3 text-center text-sm text-destructive">
                Search failed. Please try again.
              </div>
            )}

            {results.length === 0 && setMatches.length === 0 && !loading && filteredRecent.length > 0 && (
              <div className="p-2">
                <p className="px-2 py-1.5 text-eyebrow text-muted-foreground/60">
                  {t(lang, "recentSearches")}
                </p>
                {filteredRecent.map((item, i) => (
                  <button
                    key={item}
                    id={`${listboxId}-option-${recentBase + i}`}
                    type="button"
                    role="option"
                    aria-selected={activeIdx === recentBase + i}
                    onClick={() => commitSearch(item)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm motion-base",
                      activeIdx === recentBase + i ? "bg-accent" : "hover:bg-accent/60"
                    )}
                  >
                    <Clock className="size-3.5 text-muted-foreground" />
                    {item}
                  </button>
                ))}
              </div>
            )}

            {!loading &&
              query.trim().length >= 2 &&
              results.length === 0 &&
              setMatches.length === 0 &&
              !error && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                {t(lang, "noResultsFor")} &ldquo;{query.trim()}&rdquo;
              </div>
            )}

            {!loading && query.trim().length < 2 && filteredRecent.length === 0 && matchedNav.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground/50">
                {t(lang, "typeToSearch")}
              </div>
            )}
          </div>
      </DialogContent>
    </Dialog>
    <PhotoSearchButton
      open={photoSearchOpen}
      onOpenChange={setPhotoSearchOpen}
      trigger={null}
      finalFocus={restoreFocusRef}
    />
    </>
  )
}
