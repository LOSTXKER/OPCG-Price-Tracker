"use client"

import { useRouter } from "next/navigation"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react"
import {
  ArrowRightLeft,
  Briefcase,
  Clock,
  Heart,
  LayoutGrid,
  LineChart,
  Search,
  Settings,
  Sparkles,
  Swords,
  TrendingUp,
  XIcon,
  type LucideIcon,
} from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { SearchResultRow } from "@/components/shared/search-result-row"
import { getCardName, t, type TranslationKey } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import { useCardSearch } from "@/hooks/use-card-search"
import { useRecentSearches } from "@/hooks/use-recent-searches"
import { useSearchKeyboardNav } from "@/hooks/use-search-keyboard-nav"

/** Navigation shortcuts surfaced in the palette (cards + "go to" pages). */
const NAV_ACTIONS: { href: string; labelKey: TranslationKey; icon: LucideIcon }[] = [
  { href: "/", labelKey: "market", icon: LineChart },
  { href: "/sets", labelKey: "browse", icon: LayoutGrid },
  { href: "/decks", labelKey: "decksAndTools", icon: Swords },
  { href: "/portfolio", labelKey: "portfolioNav", icon: Briefcase },
  { href: "/watchlist", labelKey: "watchlistNav", icon: Heart },
  { href: "/trending", labelKey: "footerTrending", icon: TrendingUp },
  { href: "/compare", labelKey: "compareCards", icon: ArrowRightLeft },
  { href: "/honey", labelKey: "honeyPageTitle", icon: Sparkles },
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
  const inputRef = useRef<HTMLInputElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Shared engine: 8-result cap + zero debounce keep the palette's snappy feel.
  const { query, setQuery, results, loading, error, reset } = useCardSearch({
    limit: 8,
    debounceMs: 0,
  })
  const { recent, push: pushRecent, refresh: refreshRecent } = useRecentSearches()

  const goToCard = useCallback((code: string) => {
    onClose()
    router.push(`/cards/${code}`)
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
    router.push(`/search?q=${encodeURIComponent(trimmed)}`)
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
    const items: { type: "result" | "nav" | "recent"; key: string }[] = []
    for (const r of results) items.push({ type: "result", key: r.cardCode })
    for (const a of matchedNav) items.push({ type: "nav", key: a.href })
    if (results.length === 0) for (const r of filteredRecent) items.push({ type: "recent", key: r })
    return items
  }, [results, matchedNav, filteredRecent])

  const navBase = results.length
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

  useLayoutEffect(() => {
    if (!open) return
    const active = document.activeElement
    previousFocusRef.current = active instanceof HTMLElement ? active : null
    inputRef.current?.focus()
    return () => {
      previousFocusRef.current?.focus({ preventScroll: true })
      previousFocusRef.current = null
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-label={t(lang, "searchCardsDots")}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in-0 duration-150"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative mx-auto mt-[15vh] w-full max-w-lg px-4 animate-in fade-in-0 slide-in-from-top-2 duration-150">
        <div className="overflow-hidden rounded-2xl bg-popover shadow-[var(--elev-overlay)] ring-1 ring-border/50">
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-hair px-4">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setActiveIdx(-1)
              }}
              onKeyDown={handleKeyDown}
              placeholder={t(lang, "searchCardsCodesDots")}
              className="h-12 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/50"
              aria-expanded={allItems.length > 0}
              aria-autocomplete="list"
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
              className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground motion-base hover:bg-primary/90 disabled:opacity-30"
            >
              {t(lang, "search")}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-transparent dark:border-hair bg-muted/40 px-1.5 py-0.5 font-mono text-micro text-muted-foreground"
            >
              ESC
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[50vh] overflow-y-auto">
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
                    type="button"
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
                  type="button"
                  onClick={() => commitSearch(query)}
                  className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-meta motion-base hover:bg-accent/60 hover:text-foreground"
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
                      type="button"
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
                    type="button"
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
        </div>
      </div>
    </div>
  )
}
