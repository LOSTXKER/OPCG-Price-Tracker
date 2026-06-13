"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Camera, Clock, Search, X } from "lucide-react"

import { RarityBadge } from "@/components/shared/rarity-badge"
import { Price } from "@/components/shared/price-inline"
import { PhotoSearchButton } from "@/app/search/photo-search-button"
import { getCardName, t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import { BLUR_DATA_URL } from "@/lib/constants/ui"
import { fetchCards } from "@/lib/api/fetch-cards"

const RECENT_KEY = "meecard-recent-searches"
const MAX_RECENT = 6

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

export function HeroSearchBar() {
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
    const t = setTimeout(() => setRecent(readRecent()), 0)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const trimmed = query.trim()
    const controller = new AbortController()
    // Async tick keeps the setState calls out of the synchronous effect body.
    const t = setTimeout(() => {
      if (trimmed.length < 2) { setResults([]); return }
      setLoading(true)
      fetchCards({ search: trimmed, limit: 6 }, { signal: controller.signal })
        .then((data) => { setResults(data.cards ?? []); setActiveIdx(-1) })
        .catch((err: unknown) => { if (err instanceof Error && err.name !== "AbortError") console.error(err) })
        .finally(() => setLoading(false))
    }, 0)
    return () => {
      clearTimeout(t)
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

  const pushRecent = useCallback((q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return
    setRecent((prev) => {
      const next = [trimmed, ...prev.filter((x) => x.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_RECENT)
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

  const goToCard = useCallback((code: string) => {
    setOpen(false)
    router.push(`/cards/${code}`)
  }, [router])

  const filteredRecent = query.trim()
    ? recent.filter((r) => r.toLowerCase().includes(query.trim().toLowerCase()))
    : recent

  const allItems: { type: "result" | "recent"; key: string }[] = []
  for (const r of results) allItems.push({ type: "result", key: r.cardCode })
  if (results.length === 0) for (const r of filteredRecent) allItems.push({ type: "recent", key: r })

  const hasDropdown = open && (allItems.length > 0 || loading || (query.trim().length >= 2 && results.length === 0))

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, allItems.length - 1)) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)) }
    else if (e.key === "Enter") {
      if (activeIdx >= 0 && activeIdx < allItems.length) {
        e.preventDefault()
        const item = allItems[activeIdx]
        if (item.type === "result") goToCard(item.key)
        else commitSearch(item.key)
      } else {
        e.preventDefault()
        commitSearch(query)
      }
    } else if (e.key === "Escape") { setOpen(false) }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    commitSearch(query)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <form onSubmit={handleSubmit} className="flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground/50" />
          <input
            ref={inputRef}
            type="text"
            placeholder={t(lang, "searchLong")}
            className={cn(
              "h-12 w-full border border-r-0 border-border/60 bg-card pl-12 pr-20 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary/40 focus:ring-2 focus:ring-primary/20",
              hasDropdown ? "rounded-tl-xl" : "rounded-l-xl"
            )}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIdx(-1); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus() }}
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
            <span aria-hidden className="h-5 w-px bg-border/60" />
            <PhotoSearchButton
              trigger={
                <button
                  type="button"
                  aria-label={t(lang, "photoSearchTitle")}
                  title={t(lang, "photoSearchTitle")}
                  onClick={() => setOpen(false)}
                  className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                >
                  <Camera className="size-5" />
                </button>
              }
            />
          </div>
        </div>
        <button
          type="submit"
          className={cn(
            "h-12 shrink-0 bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:px-6",
            hasDropdown ? "rounded-tr-xl" : "rounded-r-xl"
          )}
        >
          {t(lang, "searchButton")}
        </button>
      </form>

      {hasDropdown && (
        <div className="absolute inset-x-0 top-full z-50 overflow-hidden rounded-b-xl border border-t-0 border-border/60 bg-card shadow-lg">
          <div className="max-h-[50vh] overflow-y-auto">
            {loading && results.length === 0 && (
              <div className="space-y-1 p-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2">
                    <div className="size-9 shrink-0 animate-pulse rounded-md bg-muted" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-32 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {results.length > 0 && (
              <div className="p-2">
                {results.map((card, i) => (
                  <button
                    key={card.cardCode}
                    type="button"
                    onClick={() => goToCard(card.cardCode)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                      activeIdx === i ? "bg-accent" : "hover:bg-accent/60"
                    )}
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
                ))}
                <button
                  type="button"
                  onClick={() => commitSearch(query)}
                  className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-meta transition-colors hover:bg-accent/60 hover:text-foreground"
                >
                  <Search className="size-3" />
                  {t(lang, "viewAllResults")} &ldquo;{query.trim()}&rdquo;
                </button>
              </div>
            )}

            {results.length === 0 && !loading && filteredRecent.length > 0 && (
              <div className="p-2">
                <p className="px-2 py-1 text-eyebrow text-muted-foreground/60">
                  {t(lang, "recentSearches")}
                </p>
                {filteredRecent.map((item, i) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => commitSearch(item)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      activeIdx === i ? "bg-accent" : "hover:bg-accent/60"
                    )}
                  >
                    <Clock className="size-3.5 text-muted-foreground" />
                    {item}
                  </button>
                ))}
              </div>
            )}

            {!loading && query.trim().length >= 2 && results.length === 0 && filteredRecent.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                {t(lang, "noResultsFor")} &ldquo;{query.trim()}&rdquo;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
