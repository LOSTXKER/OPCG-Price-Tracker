"use client"

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Camera, Clock, Search, TrendingUp, Boxes, X } from "lucide-react"

import { SearchResultRow } from "@/components/shared/search-result-row"
import { PhotoSearchButton } from "@/app/search/photo-search-button"
import { getCardName, getSetName, t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import { BLUR_DATA_URL } from "@/lib/constants/ui"
import { useCardSearch } from "@/hooks/use-card-search"
import { useRecentSearches } from "@/hooks/use-recent-searches"
import { useSearchKeyboardNav } from "@/hooks/use-search-keyboard-nav"

const MAX_SETS = 4

export type SetSuggestion = {
  code: string
  name: string
  nameEn?: string | null
  nameTh?: string | null
  type?: string
  imageUrl?: string | null
}

export type PopularCard = {
  cardCode: string
  nameJp: string
  nameEn?: string | null
  nameTh?: string | null
}

export function HeroSearchBar({ sets = [], trending = [] }: { sets?: SetSuggestion[]; trending?: PopularCard[] }) {
  const router = useRouter()
  const lang = useUIStore((s) => s.language)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()

  // Shared engine: 6-result cap, zero debounce (instant feel), and keep prior
  // results on a transient error so the list doesn't blank out mid-typing.
  const { query, setQuery, results, loading, reset } = useCardSearch({
    limit: 6,
    debounceMs: 0,
    keepPreviousOnError: true,
  })
  const { recent, push: pushRecent, remove: removeRecent, clear: clearRecentBase } = useRecentSearches()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  // NOTE: ⌘K is owned globally by the header command palette (header.tsx) so the
  // shortcut behaves identically on every page. The hero bar deliberately does
  // NOT bind ⌘K — two listeners on the home page double-opened and flickered.

  const clearRecent = useCallback(() => {
    clearRecentBase()
    inputRef.current?.focus()
  }, [clearRecentBase])

  // Popular searches — the trending cards, shown as quick-pick pills in the
  // empty-state dropdown (replaces the old chip row under the bar).
  const popularCards = trending.slice(0, 8)

  const commitSearch = useCallback((q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return
    pushRecent(trimmed)
    setOpen(false)
    router.push(`/opcg/search?q=${encodeURIComponent(trimmed)}`)
  }, [pushRecent, router])

  const go = useCallback((href: string) => {
    setOpen(false)
    router.push(href)
  }, [router])

  const trimmed = query.trim()
  const q = trimmed.toLowerCase()
  const searching = trimmed.length >= 1

  const setMatches = useMemo(() => {
    if (!searching) return []
    return sets
      .filter((s) =>
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.nameEn ?? "").toLowerCase().includes(q) ||
        (s.nameTh ?? "").toLowerCase().includes(q),
      )
      .slice(0, MAX_SETS)
  }, [sets, q, searching])

  const filteredRecent = searching
    ? recent.filter((r) => r.toLowerCase().includes(q))
    : recent

  // Flat navigable list (keyboard) — section order matches the render order.
  type NavItem = { run: () => void }
  const nav: NavItem[] = []
  if (searching) {
    for (const c of results) nav.push({ run: () => go(`/opcg/cards/${c.cardCode}`) })
    for (const s of setMatches) nav.push({ run: () => go(`/opcg/sets/${s.code}`) })
    if (trimmed.length >= 2) nav.push({ run: () => commitSearch(query) })
  } else {
    for (const r of filteredRecent) nav.push({ run: () => commitSearch(r) })
    for (const c of popularCards) nav.push({ run: () => go(`/opcg/cards/${c.cardCode}`) })
  }

  const { activeIdx, setActiveIdx, onKeyDown: handleKeyDown } = useSearchKeyboardNav({
    length: nav.length,
    onSelect: (i) => nav[i].run(),
    onCommit: () => commitSearch(query),
    onEscape: () => setOpen(false),
    arrowUpFloor: -1,
  })

  // A fresh result batch drops any stale keyboard highlight so an in-flight
  // ArrowDown can't retarget a different row (debounceMs:0 race). setTimeout
  // keeps the setState out of the effect body per the repo lint rule.
  useEffect(() => {
    const tm = setTimeout(() => setActiveIdx(-1), 0)
    return () => clearTimeout(tm)
  }, [results, setActiveIdx])

  const hasContent =
    (searching && (results.length > 0 || setMatches.length > 0 || loading || (trimmed.length >= 2 && results.length === 0))) ||
    (!searching && (filteredRecent.length > 0 || popularCards.length > 0))
  const hasDropdown = open && hasContent
  const activeOptionId = activeIdx >= 0 ? `${listboxId}-option-${activeIdx}` : undefined

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    commitSearch(query)
  }

  const sectionLabel = "px-3 pb-1.5 pt-3 text-eyebrow"
  const rowBase = "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left motion-base"

  return (
    <div ref={wrapperRef} className="relative">
      <form onSubmit={handleSubmit}>
        <div
          className={cn(
            "ease-chrome surface-1 relative flex items-center gap-2 rounded-2xl pl-4 pr-2 ring-1 ring-hair transition-[box-shadow,border-color]",
            hasDropdown
              ? "z-[51] rounded-b-none shadow-lg"
              : "focus-within:ring-2 focus-within:ring-primary/40",
          )}
        >
          <Search className="size-5 shrink-0 text-muted-foreground/60" aria-hidden />
          <input
            ref={inputRef}
            type="text"
            placeholder={t(lang, "searchLong")}
            className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIdx(-1); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            aria-label={t(lang, "searchLong")}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={hasDropdown}
            aria-controls={hasDropdown ? listboxId : undefined}
            aria-activedescendant={hasDropdown ? activeOptionId : undefined}
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => { reset(); inputRef.current?.focus() }}
              className="tap-safe ease-chrome rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
          <PhotoSearchButton
            trigger={
              <button
                type="button"
                aria-label={t(lang, "photoSearchTitle")}
                title={t(lang, "photoSearchTitle")}
                onClick={() => setOpen(false)}
                className="ease-chrome flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-primary"
              >
                <Camera className="size-5" />
              </button>
            }
          />
        </div>
      </form>

      {hasDropdown && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={t(lang, "searchLong")}
          className="absolute inset-x-0 top-full z-50 overflow-hidden rounded-b-2xl bg-popover shadow-xl ring-1 ring-hair"
        >
          <div className="max-h-[60vh] overflow-y-auto px-2 pb-3 pt-1">
            {/* CARDS */}
            {searching && loading && results.length === 0 && (
              <div className="space-y-1 p-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2">
                    <div className="size-9 shrink-0 animate-pulse rounded-md bg-muted" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-32 animate-pulse rounded-sm bg-muted" />
                      <div className="h-3 w-20 animate-pulse rounded-sm bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searching && results.length > 0 && (
              <>
                <p className={sectionLabel}>{t(lang, "card")}</p>
                {results.map((card, i) => (
                  <button
                    key={card.cardCode}
                    id={`${listboxId}-option-${i}`}
                    role="option"
                    aria-selected={activeIdx === i}
                    type="button"
                    onMouseEnter={() => setActiveIdx(i)}
                    onClick={() => go(`/opcg/cards/${card.cardCode}`)}
                    className={cn(rowBase, activeIdx === i ? "bg-accent" : "hover:bg-accent/60")}
                  >
                    <SearchResultRow
                      card={card}
                      lang={lang}
                      size="sm"
                      thumbFit="contain"
                      thumbClassName="rounded-md"
                      blur
                      nameClassName="text-sm font-medium"
                      uppercaseSetCode
                      priceClassName="font-price text-sm font-semibold"
                      alt={getCardName(lang, card)}
                    />
                  </button>
                ))}
              </>
            )}

            {/* SETS */}
            {searching && setMatches.length > 0 && (
              <>
                <p className={sectionLabel}>{t(lang, "sets")}</p>
                {setMatches.map((s, j) => {
                  const i = results.length + j
                  return (
                    <button
                      key={s.code}
                      id={`${listboxId}-option-${i}`}
                      role="option"
                      aria-selected={activeIdx === i}
                      type="button"
                      onMouseEnter={() => setActiveIdx(i)}
                      onClick={() => go(`/opcg/sets/${s.code}`)}
                      className={cn(rowBase, activeIdx === i ? "bg-accent" : "hover:bg-accent/60")}
                    >
                      <div className="relative size-9 shrink-0 overflow-hidden rounded-md bg-muted">
                        {s.imageUrl ? (
                          <Image src={s.imageUrl} alt={getSetName(lang, s)} fill className="object-cover" sizes="36px" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
                        ) : (
                          <Boxes className="absolute inset-0 m-auto size-4 text-muted-foreground/50" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{getSetName(lang, s)}</p>
                        <span className="font-mono text-meta">{s.code.toUpperCase()}</span>
                      </div>
                    </button>
                  )
                })}
              </>
            )}

            {/* RECENT (empty query only) — header with clear-all + individual × per row */}
            {!searching && filteredRecent.length > 0 && (
              <>
                <div className="flex items-center justify-between px-3 pb-1.5 pt-3">
                  <p className="text-eyebrow">{t(lang, "recentSearches")}</p>
                  <button
                    type="button"
                    onClick={clearRecent}
                    className="ease-chrome rounded-md px-1.5 py-0.5 text-meta hover:bg-muted hover:text-foreground"
                  >
                    {t(lang, "clearAll")}
                  </button>
                </div>
                {filteredRecent.map((item, i) => (
                  <div
                    key={item}
                    className={cn(
                      "group flex items-center rounded-xl motion-base",
                      activeIdx === i ? "bg-accent" : "hover:bg-accent/60",
                    )}
                    onMouseEnter={() => setActiveIdx(i)}
                  >
                    <button
                      type="button"
                      id={`${listboxId}-option-${i}`}
                      role="option"
                      aria-selected={activeIdx === i}
                      onClick={() => commitSearch(item)}
                      className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-sm text-left"
                    >
                      <Clock className="size-4 shrink-0 text-muted-foreground/60" />
                      <span className="truncate">{item}</span>
                    </button>
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={(e) => { e.stopPropagation(); removeRecent(item) }}
                      className="ease-chrome mr-2 shrink-0 rounded-md p-1.5 text-muted-foreground/30 opacity-0 transition-opacity hover:bg-muted hover:text-muted-foreground group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none"
                      aria-label="Remove"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </>
            )}

            {/* POPULAR (empty query only) — quick-pick pills */}
            {!searching && popularCards.length > 0 && (
              <>
                <p className={sectionLabel}>{t(lang, "popular")}</p>
                <div className="flex flex-wrap gap-2 px-3 pb-3 pt-1">
                  {popularCards.map((c, popularIndex) => {
                    const i = filteredRecent.length + popularIndex
                    return (
                      <button
                        key={c.cardCode}
                        id={`${listboxId}-option-${i}`}
                        role="option"
                        aria-selected={activeIdx === i}
                        type="button"
                        onMouseEnter={() => setActiveIdx(i)}
                        onClick={() => go(`/opcg/cards/${c.cardCode}`)}
                        className={cn(
                          "tap-safe ease-chrome inline-flex items-center gap-1.5 rounded-full border border-hair bg-transparent px-3.5 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          activeIdx === i && "bg-accent text-foreground",
                        )}
                      >
                        <TrendingUp className="size-3 text-primary/50" aria-hidden />
                        {getCardName(lang, c)}
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            {/* VIEW ALL */}
            {searching && trimmed.length >= 2 && (
              <button
                type="button"
                id={`${listboxId}-option-${results.length + setMatches.length}`}
                role="option"
                aria-selected={activeIdx === results.length + setMatches.length}
                onMouseEnter={() => setActiveIdx(results.length + setMatches.length)}
                onClick={() => commitSearch(query)}
                className={cn(
                  "mt-1 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-meta motion-base hover:bg-accent/60 hover:text-foreground",
                  activeIdx === results.length + setMatches.length && "bg-accent text-foreground",
                )}
              >
                <Search className="size-3" />
                {t(lang, "viewAllResults")} &ldquo;{trimmed}&rdquo;
              </button>
            )}

            {/* EMPTY */}
            {searching && !loading && trimmed.length >= 2 && results.length === 0 && setMatches.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                {t(lang, "noResultsFor")} &ldquo;{trimmed}&rdquo;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
