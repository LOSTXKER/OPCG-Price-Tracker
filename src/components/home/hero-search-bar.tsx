"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Camera, Clock, Search, TrendingUp, Boxes, X } from "lucide-react"

import { RarityBadge } from "@/components/shared/rarity-badge"
import { Price } from "@/components/shared/price-inline"
import { PhotoSearchButton } from "@/app/search/photo-search-button"
import { getCardName, getSetName, t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import { BLUR_DATA_URL } from "@/lib/constants/ui"
import { fetchCards } from "@/lib/api/fetch-cards"

const RECENT_KEY = "meecard-recent-searches"
const MAX_RECENT = 6
const MAX_SETS = 4

function readRecent(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string").slice(0, MAX_RECENT) : []
  } catch { return [] }
}

function writeRecent(items: string[]) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(items.slice(0, MAX_RECENT))) } catch { /* */ }
}

type SuggestionCard = {
  cardCode: string
  nameJp: string
  nameEn?: string | null
  nameTh?: string | null
  rarity: string
  imageUrl?: string | null
  latestPriceJpy?: number | null
  set?: { code: string; name?: string; nameEn?: string | null }
}

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

  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SuggestionCard[]>([])
  const [loading, setLoading] = useState(false)
  const [recent, setRecent] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)

  useEffect(() => {
    const id = setTimeout(() => setRecent(readRecent()), 0)
    return () => clearTimeout(id)
  }, [])

  useEffect(() => {
    const trimmed = query.trim()
    const controller = new AbortController()
    const id = setTimeout(() => {
      if (trimmed.length < 2) { setResults([]); return }
      setLoading(true)
      fetchCards({ search: trimmed, limit: 6 }, { signal: controller.signal })
        .then((data) => { setResults(data.cards ?? []); setActiveIdx(-1) })
        .catch((err: unknown) => { if (err instanceof Error && err.name !== "AbortError") console.error(err) })
        .finally(() => setLoading(false))
    }, 0)
    return () => {
      clearTimeout(id)
      controller.abort()
    }
  }, [query])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  // ⌘K / Ctrl+K focuses the hero search from anywhere on the page (Linear teleport).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  const pushRecent = useCallback((q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return
    setRecent((prev) => {
      const next = [trimmed, ...prev.filter((x) => x.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_RECENT)
      writeRecent(next)
      return next
    })
  }, [])

  const clearRecent = useCallback(() => {
    setRecent([])
    try { localStorage.removeItem(RECENT_KEY) } catch { /* */ }
    inputRef.current?.focus()
  }, [])

  // Popular searches — the trending cards, shown as quick-pick pills in the
  // empty-state dropdown (replaces the old chip row under the bar).
  const popularCards = trending.slice(0, 8)

  const removeRecent = useCallback((item: string) => {
    setRecent((prev) => {
      const next = prev.filter((x) => x !== item)
      writeRecent(next)
      return next
    })
  }, [])

  const commitSearch = useCallback((q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return
    pushRecent(trimmed)
    setOpen(false)
    router.push(`/search?q=${encodeURIComponent(trimmed)}`)
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
    for (const c of results) nav.push({ run: () => go(`/cards/${c.cardCode}`) })
    for (const s of setMatches) nav.push({ run: () => go(`/sets/${s.code}`) })
  } else {
    for (const r of filteredRecent) nav.push({ run: () => commitSearch(r) })
  }

  const hasContent =
    (searching && (results.length > 0 || setMatches.length > 0 || loading || (trimmed.length >= 2 && results.length === 0))) ||
    (!searching && (filteredRecent.length > 0 || popularCards.length > 0))
  const hasDropdown = open && hasContent

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, nav.length - 1)) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)) }
    else if (e.key === "Enter") {
      e.preventDefault()
      if (activeIdx >= 0 && activeIdx < nav.length) nav[activeIdx].run()
      else commitSearch(query)
    } else if (e.key === "Escape") { setOpen(false) }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    commitSearch(query)
  }

  const sectionLabel = "px-3 pb-1.5 pt-3 text-eyebrow"
  const rowBase = "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors"

  return (
    <div ref={wrapperRef} className="relative">
      <form onSubmit={handleSubmit}>
        <div
          className={cn(
            "ease-chrome surface-1 relative flex items-center gap-2 rounded-2xl pl-4 pr-2 ring-1 ring-[var(--p-hair)] transition-[box-shadow,border-color]",
            hasDropdown
              ? "z-[51] rounded-b-none shadow-lg"
              : "shadow-sm focus-within:ring-2 focus-within:ring-primary/40",
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
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus() }}
              className="ease-chrome rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
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
                className="ease-chrome rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-primary"
              >
                <Camera className="size-5" />
              </button>
            }
          />
          {/* ⌘K hint — desktop only (no physical key on mobile) */}
          <kbd className="text-micro ml-0.5 hidden shrink-0 items-center gap-0.5 rounded-md bg-foreground/[0.06] px-1.5 py-1 font-sans text-muted-foreground/70 ring-1 ring-[var(--p-hair)] sm:inline-flex">
            ⌘K
          </kbd>
        </div>
      </form>

      {hasDropdown && (
        <div className="absolute inset-x-0 top-full z-50 overflow-hidden rounded-b-2xl bg-popover shadow-xl ring-1 ring-[var(--p-hair)]">
          <div className="max-h-[60vh] overflow-y-auto px-2 pb-3 pt-1">
            {/* CARDS */}
            {searching && loading && results.length === 0 && (
              <div className="space-y-1 p-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2">
                    <div className="size-9 shrink-0 animate-pulse rounded-md bg-muted" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-32 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searching && results.length > 0 && (
              <>
                <p className={sectionLabel}>{t(lang, "card")}</p>
                {results.map((card, i) => {
                  return (
                    <button
                      key={card.cardCode}
                      type="button"
                      onMouseEnter={() => setActiveIdx(i)}
                      onClick={() => go(`/cards/${card.cardCode}`)}
                      className={cn(rowBase, activeIdx === i ? "bg-accent" : "hover:bg-accent/60")}
                    >
                      <div className="relative size-9 shrink-0 overflow-hidden rounded-md bg-muted">
                        {card.imageUrl ? (
                          <Image src={card.imageUrl} alt={getCardName(lang, card)} fill className="object-contain" sizes="36px" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
                        ) : (
                          <div className="size-full bg-muted" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{getCardName(lang, card)}</p>
                        <div className="flex items-center gap-1.5 text-meta">
                          {card.set?.code && <span className="font-mono">{card.set.code.toUpperCase()}</span>}
                          <RarityBadge rarity={card.rarity} size="sm" />
                        </div>
                      </div>
                      {card.latestPriceJpy != null && (
                        <span className="shrink-0 font-price text-sm font-semibold">
                          <Price jpy={Math.round(card.latestPriceJpy)} />
                        </span>
                      )}
                    </button>
                  )
                })}
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
                      type="button"
                      onMouseEnter={() => setActiveIdx(i)}
                      onClick={() => go(`/sets/${s.code}`)}
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
                      "group flex items-center rounded-xl transition-colors",
                      activeIdx === i ? "bg-accent" : "hover:bg-accent/60",
                    )}
                    onMouseEnter={() => setActiveIdx(i)}
                  >
                    <button
                      type="button"
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
                  {popularCards.map((c) => (
                    <button
                      key={c.cardCode}
                      type="button"
                      onClick={() => go(`/cards/${c.cardCode}`)}
                      className="ease-chrome inline-flex items-center gap-1.5 rounded-full border border-[var(--p-hair)] bg-transparent px-3.5 py-1.5 text-sm font-medium text-muted-foreground hover:border-primary/30 hover:bg-primary/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <TrendingUp className="size-3 text-primary/50" aria-hidden />
                      {getCardName(lang, c)}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* VIEW ALL */}
            {searching && trimmed.length >= 2 && (
              <button
                type="button"
                onClick={() => commitSearch(query)}
                className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-meta transition-colors hover:bg-accent/60 hover:text-foreground"
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
