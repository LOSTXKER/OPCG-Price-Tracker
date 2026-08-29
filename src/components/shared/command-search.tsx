"use client"

import dynamic from "next/dynamic"
import Image from "next/image"
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
  ArrowDown,
  ArrowRightLeft,
  ArrowUp,
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
import { ResponsiveDialogContent } from "@/components/ui/responsive-dialog-content"
import {
  Dialog,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog"
import { Price } from "@/components/shared/price-inline"
import { SearchResultRow } from "@/components/shared/search-result-row"
import type { SetPickerItem } from "@/components/shared/set-picker"
import { getCardName, getSetName, t, type TranslationKey } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import { useCardSearch } from "@/hooks/use-card-search"
import { useRecentSearches } from "@/hooks/use-recent-searches"
import { useSearchKeyboardNav } from "@/hooks/use-search-keyboard-nav"
import { useSearchSpotlight } from "@/hooks/use-search-spotlight"

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
 * The site's search entry point. Since the home hero dropped its own input
 * (owner call 2026-08-28, following CoinGecko), this is the ONLY search field a
 * visitor sees, so it is painted as a field — bordered box, real placeholder
 * text, visible `/` hint — rather than an icon button they have to recognise.
 * Navbar แบบ C (same evening): the field is a rounded capsule like every other
 * control on the bar, and sits at the far right of the nav row, after Honey.
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
        "hairline ease-chrome group flex h-11 w-11 items-center justify-center gap-2 rounded-full bg-card px-0 text-left text-label transition-[background-color,box-shadow,border-color] hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        "md:w-full md:justify-start md:px-3.5 lg:h-10",
        className,
      )}
    >
      <Search
        className="size-[18px] shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
        aria-hidden
      />
      <span className="hidden min-w-0 flex-1 truncate text-body-sm text-muted-foreground md:inline">
        {t(lang, "searchCardsDots")}
      </span>
      <kbd className="hairline hidden shrink-0 rounded-full bg-background px-1.5 py-0.5 font-sans text-micro text-muted-foreground md:inline">
        /
      </kbd>
    </button>
  )
}

type PaletteItem = {
  type: "result" | "set" | "search" | "nav" | "recent" | "spot-popular" | "spot-mover"
  key: string
}

/**
 * Before the visitor types, the palette is a discovery surface, not a blank
 * box (owner direction 2026-08-28, following CoinMarketCap's search popup):
 * recent searches, a chip rail of the most-viewed cards, the strongest 24h
 * movers with their real deltas, and the page shortcuts shrunk to pills.
 * The first keystroke swaps all of it for plain results.
 */
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
  const inputRef = useRef<HTMLInputElement | null>(null)
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
  // Discovery data arrives once, on the first open — never on page load.
  const { popular, movers } = useSearchSpotlight(open)

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
  const isEmptyQuery = normalizedQuery === ""

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

  // Nav shortcuts appear ONLY once you have typed something they match (owner
  // call 2026-08-29). Listing all twelve on the empty state was a wall of
  // pills for destinations the header and the bottom nav already carry — it
  // pushed the actual discovery (recents, popular, movers) up and out of view
  // on a phone, where the palette is now full-screen and those rows are the
  // reason to open it. Typed, they still earn their place: "พอร์ต" jumping to
  // the portfolio is command-palette behaviour worth keeping.
  const matchedNav = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return NAV_ACTIONS.filter((a) => t(lang, a.labelKey).toLowerCase().includes(q))
  }, [query, lang])

  // One flat list drives the keyboard order; it must mirror the visual order
  // of whichever mode is on screen.
  const allItems = useMemo(() => {
    const items: PaletteItem[] = []
    if (isEmptyQuery) {
      // Discovery mode: recents → popular chips → movers. No page pills.
      for (const r of filteredRecent) items.push({ type: "recent", key: r })
      for (const c of popular) items.push({ type: "spot-popular", key: c.cardCode })
      for (const c of movers) items.push({ type: "spot-mover", key: c.cardCode })
      return items
    }
    for (const r of results) items.push({ type: "result", key: r.cardCode })
    for (const set of setMatches) items.push({ type: "set", key: set.code })
    if (query.trim().length >= 2) items.push({ type: "search", key: query.trim() })
    for (const a of matchedNav) items.push({ type: "nav", key: a.href })
    if (results.length === 0 && setMatches.length === 0) {
      for (const r of filteredRecent) items.push({ type: "recent", key: r })
    }
    return items
  }, [isEmptyQuery, filteredRecent, popular, movers, matchedNav, results, setMatches, query])

  // Sections come and go per mode, so option indexes are looked up rather than
  // maintained as base-offset arithmetic per section.
  const itemIndexByKey = useMemo(() => {
    const map = new Map<string, number>()
    allItems.forEach((item, i) => map.set(`${item.type}:${item.key}`, i))
    return map
  }, [allItems])

  const indexOf = useCallback(
    (type: PaletteItem["type"], key: string) => itemIndexByKey.get(`${type}:${key}`) ?? -1,
    [itemIndexByKey],
  )

  const hasSearchAction = query.trim().length >= 2

  const { activeIdx, setActiveIdx, onKeyDown: handleKeyDown } = useSearchKeyboardNav({
    length: allItems.length,
    onSelect: (i) => {
      const item = allItems[i]
      if (!item) return
      if (item.type === "result" || item.type === "spot-popular" || item.type === "spot-mover") {
        goToCard(item.key)
      } else if (item.type === "set") goToPage(`/opcg/sets/${item.key}`)
      else if (item.type === "nav") goToPage(item.key)
      else commitSearch(item.key)
    },
    onCommit: () => commitSearch(query),
    arrowUpFloor: -1,
  })

  // A fresh item list drops any stale keyboard highlight (debounceMs:0 means
  // an in-flight ArrowDown could otherwise retarget onto a different card and
  // mis-fire on Enter). setTimeout keeps the setState out of the effect body.
  useEffect(() => {
    const tm = setTimeout(() => setActiveIdx(-1), 0)
    return () => clearTimeout(tm)
  }, [allItems, setActiveIdx])

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

  const optionClass = (index: number) =>
    cn(
      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left motion-base",
      activeIdx === index ? "bg-accent" : "hover:bg-accent/60",
    )

  const recentRows = (
    <div className="p-2">
      <p className="px-2 py-1.5 text-eyebrow text-muted-foreground/60">
        {t(lang, "recentSearches")}
      </p>
      {filteredRecent.map((item) => {
        const index = indexOf("recent", item)
        return (
          <button
            key={item}
            id={`${listboxId}-option-${index}`}
            type="button"
            role="option"
            aria-selected={activeIdx === index}
            onClick={() => commitSearch(item)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm motion-base",
              activeIdx === index ? "bg-accent" : "hover:bg-accent/60",
            )}
          >
            <Clock className="size-3.5 text-muted-foreground" />
            {item}
          </button>
        )
      })}
    </div>
  )

  return (
    <>
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      {/* Full-screen on a phone, floating card from `md` up (owner call
          2026-08-29). Search IS the task on a phone — a card floating at 15vh
          left a strip of the page showing above and below it while the
          keyboard ate the bottom, so the list had less room than the chrome it
          was covering. The shared shell owns that switch; this file only sets
          how wide the desktop card gets. */}
      <ResponsiveDialogContent
        showCloseButton={false}
        finalFocus={photoSearchOpen ? false : restoreFocusRef}
        className="md:top-[15vh] md:max-w-xl md:-translate-y-0 lg:max-w-2xl"
      >
        <DialogTitle className="sr-only">
          {t(lang, "searchCardsDots")}
        </DialogTitle>
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-hair px-4">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
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
                // Clearing swaps the popup back to its discovery state — hand
                // focus straight back to the field so arrow keys keep working.
                onClick={() => {
                  reset()
                  inputRef.current?.focus()
                }}
                className="ease-chrome grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <XIcon className="size-4" />
              </button>
            )}
            {/* One way out, spelled in words (owner selection 2026-08-29, from
                /proto/search-header). What was here before was an `ESC` chip:
                a real close button wearing a keyboard-hint costume, so nobody
                read it as pressable — and on a phone, where there is no Esc key
                at all, it advertised a shortcut that does not exist. "ยกเลิก"
                beside the field is the iOS search grammar people already know.
                Esc still closes the dialog; it just no longer needs a label.

                The old filled "ค้นหา" button is gone with it: the results list
                already ends in a "ดูผลทั้งหมด" row that runs the same commit,
                and before you type, that button was a dead 30%-opacity shape
                taking width from the input. */}
            <DialogClose
              className="ease-chrome -me-1 flex h-10 shrink-0 items-center rounded-full px-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              {t(lang, "cancel")}
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
            // Full-screen on a phone: the list takes every pixel the header
            // and the photo row leave behind (the shell is a flex column), so
            // it never stops short of the keyboard. From `md` the floating
            // card goes back to a capped height.
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain md:max-h-[min(60vh,34rem)] md:flex-none"
          >
            {isEmptyQuery ? (
              <>
                {filteredRecent.length > 0 && recentRows}

                {/* Most-viewed chip rail — CMC's "Top Boosted" slot. */}
                {popular.length > 0 && (
                  <div className="p-2 pb-0">
                    <p className="px-2 py-1.5 text-eyebrow text-muted-foreground/60">
                      {t(lang, "popular")}
                    </p>
                    <div className="no-sb flex gap-2 overflow-x-auto px-2 pb-1">
                      {popular.map((card) => {
                        const index = indexOf("spot-popular", card.cardCode)
                        return (
                          <button
                            key={card.cardCode}
                            id={`${listboxId}-option-${index}`}
                            type="button"
                            role="option"
                            aria-selected={activeIdx === index}
                            onClick={() => goToCard(card.cardCode)}
                            className={cn(
                              "hairline flex shrink-0 items-center gap-2.5 rounded-xl px-2.5 py-2 text-left motion-base",
                              activeIdx === index ? "bg-accent" : "bg-card hover:bg-muted",
                            )}
                          >
                            <span className="relative h-10 w-7 shrink-0 overflow-hidden rounded-[4px] bg-muted">
                              {card.imageUrl && (
                                <Image
                                  src={card.imageUrl}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  sizes="28px"
                                />
                              )}
                            </span>
                            <span className="min-w-0">
                              <span className="block max-w-[9rem] truncate text-sm font-medium">
                                {getCardName(lang, card)}
                              </span>
                              {card.latestPriceJpy != null && (
                                <span className="block font-price text-meta tabular-nums">
                                  <Price
                                    jpy={Math.round(card.latestPriceJpy)}
                                    thb={card.latestPriceThb}
                                  />
                                </span>
                              )}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Strongest 24h movers — CMC's "Trending" slot, with real
                    deltas: green/red is earned here and always arrow-paired. */}
                {movers.length > 0 && (
                  <div className="p-2 pb-0">
                    <div className="flex items-baseline justify-between px-2 py-1.5">
                      <p className="text-eyebrow text-muted-foreground/60">
                        {t(lang, "trendingShort")}
                      </p>
                      <button
                        type="button"
                        onClick={() => goToPage("/opcg/trending")}
                        className="text-meta motion-base hover:text-foreground"
                      >
                        {t(lang, "viewAll")}
                      </button>
                    </div>
                    {movers.map((card) => {
                      const index = indexOf("spot-mover", card.cardCode)
                      const change = card.priceChange24h ?? 0
                      const up = change > 0
                      const Arrow = up ? ArrowUp : ArrowDown
                      return (
                        <button
                          key={card.cardCode}
                          id={`${listboxId}-option-${index}`}
                          type="button"
                          role="option"
                          aria-selected={activeIdx === index}
                          onClick={() => goToCard(card.cardCode)}
                          className={optionClass(index)}
                        >
                          <SearchResultRow
                            card={{ ...card, set: card.set ?? undefined }}
                            lang={lang}
                            thumbFit="contain"
                            thumbClassName="rounded-lg"
                            alt={getCardName(lang, card)}
                          />
                          <span
                            className={cn(
                              "inline-flex shrink-0 items-center gap-0.5 font-price text-xs font-semibold tabular-nums",
                              up ? "text-price-up" : "text-price-down",
                            )}
                          >
                            <Arrow className="size-3" aria-hidden />
                            {up ? "+" : ""}
                            {change.toFixed(1)}%
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}

              </>
            ) : (
              <>
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
                    {results.map((card) => {
                      const index = indexOf("result", card.cardCode)
                      return (
                        <button
                          key={card.cardCode}
                          id={`${listboxId}-option-${index}`}
                          type="button"
                          role="option"
                          aria-selected={activeIdx === index}
                          onClick={() => goToCard(card.cardCode)}
                          className={optionClass(index)}
                        >
                          <SearchResultRow
                            card={card}
                            lang={lang}
                            thumbFit="contain"
                            thumbClassName="rounded-lg"
                            alt={getCardName(lang, card)}
                          />
                        </button>
                      )
                    })}
                  </div>
                )}

                {setMatches.length > 0 && (
                  <div className="p-2">
                    <p className="px-2 py-1.5 text-eyebrow text-muted-foreground/60">
                      {t(lang, "sets")}
                    </p>
                    {setMatches.map((set) => {
                      const index = indexOf("set", set.code)
                      return (
                        <button
                          key={set.code}
                          id={`${listboxId}-option-${index}`}
                          type="button"
                          role="option"
                          aria-selected={activeIdx === index}
                          onClick={() => goToPage(`/opcg/sets/${set.code}`)}
                          className={optionClass(index)}
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
                      id={`${listboxId}-option-${indexOf("search", query.trim())}`}
                      type="button"
                      role="option"
                      aria-selected={activeIdx === indexOf("search", query.trim())}
                      onClick={() => commitSearch(query)}
                      className={cn(
                        "flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-meta motion-base hover:bg-accent/60 hover:text-foreground",
                        activeIdx === indexOf("search", query.trim()) && "bg-accent text-foreground",
                      )}
                    >
                      <Search className="size-3" aria-hidden />
                      {t(lang, "viewAllResults")} &ldquo;{query.trim()}&rdquo;
                    </button>
                  </div>
                )}

                {/* Pages — navigation shortcuts whose label matches the query */}
                {matchedNav.length > 0 && (
                  <div className="p-2">
                    <p className="px-2 py-1.5 text-eyebrow text-muted-foreground/60">
                      {t(lang, "pages")}
                    </p>
                    {matchedNav.map((action) => {
                      const index = indexOf("nav", action.href)
                      const Icon = action.icon
                      return (
                        <button
                          key={action.href}
                          id={`${listboxId}-option-${index}`}
                          type="button"
                          role="option"
                          aria-selected={activeIdx === index}
                          onClick={() => goToPage(action.href)}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm motion-base",
                            activeIdx === index ? "bg-accent" : "hover:bg-accent/60",
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
                  recentRows
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
              </>
            )}
          </div>
      </ResponsiveDialogContent>
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
