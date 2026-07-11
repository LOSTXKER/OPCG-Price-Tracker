"use client"

import { useRouter } from "next/navigation"
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
} from "react"
import {
  ArrowRightLeft,
  BarChart3,
  BookOpen,
  Briefcase,
  Clock,
  Heart,
  LayoutGrid,
  LineChart,
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
import { getCardName, t, type TranslationKey } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import { useCardSearch } from "@/hooks/use-card-search"
import { useRecentSearches } from "@/hooks/use-recent-searches"
import { useSearchKeyboardNav } from "@/hooks/use-search-keyboard-nav"

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

export function CommandSearchTrigger({ onClick }: { onClick: () => void }) {
  const lang = useUIStore((s) => s.language);
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 w-52 items-center gap-2 rounded-lg border border-transparent dark:border-hair bg-muted/40 px-2.5 text-sm text-muted-foreground/60 motion-base hover:bg-muted/70 hover:text-muted-foreground lg:w-60"
    >
      <Search className="size-3.5 shrink-0" />
      <span className="flex-1 text-left">{t(lang, "searchCardsDots")}</span>
      <kbd className="hidden rounded-md border border-hair bg-background px-1.5 py-0.5 font-mono text-micro text-muted-foreground/60 sm:inline">/</kbd>
    </button>
  )
}

export function CommandSearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const lang = useUIStore((s) => s.language)
  const listboxId = useId()
  const restoreFocusRef = useRef<HTMLElement | null>(null)

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

  // Nav shortcuts: all of them when the box is empty (quick links), otherwise
  // those whose localized label matches the query.
  const matchedNav = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return NAV_ACTIONS
    return NAV_ACTIONS.filter((a) => t(lang, a.labelKey).toLowerCase().includes(q))
  }, [query, lang])

  const allItems = useMemo(() => {
    const items: { type: "result" | "search" | "nav" | "recent"; key: string }[] = []
    for (const r of results) items.push({ type: "result", key: r.cardCode })
    if (results.length > 0) items.push({ type: "search", key: query.trim() })
    for (const a of matchedNav) items.push({ type: "nav", key: a.href })
    if (results.length === 0) for (const r of filteredRecent) items.push({ type: "recent", key: r })
    return items
  }, [results, matchedNav, filteredRecent, query])

  const searchIndex = results.length
  const navBase = results.length + (results.length > 0 ? 1 : 0)
  const recentBase = results.length + matchedNav.length

  const { activeIdx, setActiveIdx, onKeyDown: handleKeyDown } = useSearchKeyboardNav({
    length: allItems.length,
    onSelect: (i) => {
      const item = allItems[i]
      if (item.type === "result") goToCard(item.key)
      else if (item.type === "nav") goToPage(item.key)
      else commitSearch(item.key)
    },
    onCommit: () => commitSearch(query),
    onEscape: onClose,
    arrowUpFloor: -1,
  })

  // A fresh result batch drops any stale keyboard highlight (debounceMs:0 means
  // an in-flight ArrowDown could otherwise retarget onto a different card and
  // mis-fire on Enter). setTimeout keeps the setState out of the effect body.
  useEffect(() => {
    const tm = setTimeout(() => setActiveIdx(-1), 0)
    return () => clearTimeout(tm)
  }, [results, setActiveIdx])

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
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent
        showCloseButton={false}
        finalFocus={restoreFocusRef}
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
                <button
                  id={`${listboxId}-option-${searchIndex}`}
                  type="button"
                  role="option"
                  aria-selected={activeIdx === searchIndex}
                  onClick={() => commitSearch(query)}
                  className={cn(
                    "mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-meta motion-base hover:bg-accent/60 hover:text-foreground",
                    activeIdx === searchIndex && "bg-accent text-foreground",
                  )}
                >
                  <Search className="size-3" />
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

            {results.length === 0 && !loading && filteredRecent.length > 0 && (
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
  )
}
