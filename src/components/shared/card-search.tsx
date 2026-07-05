"use client"

import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { useRouter } from "next/navigation"
import { Search, X } from "lucide-react"

import { SearchResultsDropdown, type SearchResult } from "@/components/shared/search-results-dropdown"
import { useCardSearch, type CardSearchResult } from "@/hooks/use-card-search"
import { useRecentSearches } from "@/hooks/use-recent-searches"
import { ALL_GAMES } from "@/lib/game/constants"
import { t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"

/**
 * The ONE card search for the whole app. Composes the shared useCardSearch engine
 * + the (formerly orphaned) SearchResultsDropdown so every surface — home hero,
 * Cmd-K palette, and every "add a card" dialog — looks and behaves identically.
 *
 * - mode="navigate": pick a card → teleport to its page (hero, palette).
 * - mode="pick": pick a card → onSelect(card) callback (every add dialog).
 *
 * Game-scoped: defaults to the current game (header switcher); pass game="all"
 * for every game. Keyboard: ↑↓ move, Enter select, Esc clear. Recent searches +
 * one placeholder shared everywhere.
 */
export function CardSearch({
  mode,
  onSelect,
  game,
  placeholder,
  autoFocus = false,
  className,
}: {
  mode: "navigate" | "pick"
  /** pick mode — the chosen card. */
  onSelect?: (card: CardSearchResult) => void
  /** Scope to a game slug; defaults to the current game; "all" = every game. */
  game?: string
  placeholder?: string
  autoFocus?: boolean
  className?: string
}) {
  const lang = useUIStore((s) => s.language)
  const currentGame = useUIStore((s) => s.currentGame)
  const router = useRouter()

  const scope = game ?? currentGame ?? ALL_GAMES
  const { query, setQuery, results, loading, reset } = useCardSearch({
    game: scope === ALL_GAMES ? undefined : scope,
  })

  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const { recent, push: pushRecent } = useRecentSearches()
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [open])

  const q = query.trim()
  const filteredRecent = q
    ? recent.filter((r) => r.toLowerCase().includes(q.toLowerCase()))
    : recent
  // The keyboard navigates results when querying, else recent searches.
  const navLen = results.length > 0 ? results.length : filteredRecent.length

  const selectCard = (code: string) => {
    const card = results.find((c) => c.cardCode === code)
    pushRecent(q)
    setOpen(false)
    if (mode === "pick") {
      if (card) onSelect?.(card)
      reset()
    } else {
      router.push(`/cards/${code}`)
    }
  }

  const selectRecent = (value: string) => {
    setQuery(value)
    setActiveIdx(-1)
    inputRef.current?.focus()
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setOpen(true)
      setActiveIdx((i) => Math.min(i + 1, navLen - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      if (activeIdx >= 0 && activeIdx < navLen) {
        if (results.length > 0) selectCard(results[activeIdx].cardCode)
        else selectRecent(filteredRecent[activeIdx])
      } else if (mode === "navigate" && q) {
        pushRecent(q)
        setOpen(false)
        router.push(`/search?q=${encodeURIComponent(q)}`)
      }
    } else if (e.key === "Escape") {
      setOpen(false)
      if (query) reset()
    }
  }

  const showDropdown = open && (q.length >= 2 || filteredRecent.length > 0)

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActiveIdx(-1)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          autoFocus={autoFocus}
          placeholder={placeholder ?? t(lang, "searchByNameOrCode")}
          className="h-11 w-full rounded-xl border border-[var(--p-hair)] bg-card px-9 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
          aria-label={t(lang, "searchByNameOrCode")}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              reset()
              inputRef.current?.focus()
            }}
            aria-label={t(lang, "clearAll")}
            className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {showDropdown && (
        <SearchResultsDropdown
          results={results as SearchResult[]}
          filteredRecent={results.length > 0 ? [] : filteredRecent}
          loading={loading}
          activeIdx={activeIdx}
          onSelectCard={selectCard}
          onSelectRecent={selectRecent}
        />
      )}
    </div>
  )
}
