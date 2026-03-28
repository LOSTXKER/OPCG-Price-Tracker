"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { Clock, Search, XIcon } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { Price } from "@/components/shared/price-inline"
import { getCardName } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import type { SearchResult } from "@/components/shared/search-results-dropdown"

const STORAGE_KEY = "opcg-recent-searches"
const MAX_RECENT = 6

function readRecent(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((x): x is string => typeof x === "string")
      .slice(0, MAX_RECENT)
  } catch {
    return []
  }
}

function writeRecent(items: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_RECENT)))
  } catch { /* ignore */ }
}

export function CommandSearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 w-52 items-center gap-2 rounded-lg border border-border/50 bg-muted/40 px-2.5 text-sm text-muted-foreground/60 transition-colors hover:bg-muted/60 hover:text-muted-foreground lg:w-60"
    >
      <Search className="size-3.5 shrink-0" />
      <span className="flex-1 text-left">ค้นหาการ์ด...</span>
      <kbd className="hidden rounded-md border border-border/60 bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/60 sm:inline">/</kbd>
    </button>
  )
}

export function CommandSearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const lang = useUIStore((s) => s.language)
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [recent, setRecent] = useState<string[]>([])
  const [activeIdx, setActiveIdx] = useState(-1)

  useEffect(() => {
    if (open) {
      setRecent(readRecent())
      setQuery("")
      setResults([])
      setActiveIdx(-1)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) { setResults([]); return }
    const controller = new AbortController()
    setLoading(true)
    fetch(`/api/cards?search=${encodeURIComponent(trimmed)}&limit=8`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => { setResults(data.cards ?? []); setActiveIdx(-1) })
      .catch(() => {})
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [query])

  const pushRecent = useCallback((q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return
    setRecent((prev) => {
      const next = [trimmed, ...prev.filter((x) => x.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_RECENT)
      writeRecent(next)
      return next
    })
  }, [])

  const goToCard = useCallback((code: string) => {
    onClose()
    router.push(`/cards/${code}`)
  }, [onClose, router])

  const commitSearch = useCallback((q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return
    pushRecent(trimmed)
    onClose()
    router.push(`/search?q=${encodeURIComponent(trimmed)}`)
  }, [onClose, pushRecent, router])

  const filteredRecent = useMemo(() => {
    const t = query.trim().toLowerCase()
    if (!t) return recent
    return recent.filter((r) => r.toLowerCase().includes(t))
  }, [recent, query])

  const allItems = useMemo(() => {
    const items: { type: "result" | "recent"; key: string }[] = []
    for (const r of results) items.push({ type: "result", key: r.cardCode })
    if (results.length === 0) for (const r of filteredRecent) items.push({ type: "recent", key: r })
    return items
  }, [results, filteredRecent])

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
        commitSearch(query)
      }
    } else if (e.key === "Escape") onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in-0 duration-150"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative mx-auto mt-[15vh] w-full max-w-lg px-4 animate-in fade-in-0 slide-in-from-top-2 duration-150">
        <div className="overflow-hidden rounded-2xl bg-popover shadow-2xl ring-1 ring-border/50">
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-border/60 px-4">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActiveIdx(-1) }}
              onKeyDown={handleKeyDown}
              placeholder="ค้นหาการ์ด, ชุด, รหัส..."
              className="h-12 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/50"
              aria-expanded={allItems.length > 0}
              aria-autocomplete="list"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); setResults([]) }}
                className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
              >
                <XIcon className="size-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => commitSearch(query)}
              disabled={!query.trim()}
              className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-30"
            >
              ค้นหา
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border/60 bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
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
                      <Skeleton className="h-3.5 w-32 rounded" />
                      <Skeleton className="h-3 w-20 rounded" />
                    </div>
                    <Skeleton className="h-4 w-16 shrink-0 rounded" />
                  </div>
                ))}
              </div>
            )}

            {results.length > 0 && (
              <div className="p-2">
                <p className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                  การ์ด
                </p>
                {results.map((card, i) => (
                  <button
                    key={card.cardCode}
                    type="button"
                    onClick={() => goToCard(card.cardCode)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                      activeIdx === i ? "bg-accent" : "hover:bg-accent/60"
                    )}
                  >
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {card.imageUrl ? (
                        <Image src={card.imageUrl} alt="" fill className="object-contain" sizes="40px" />
                      ) : (
                        <div className="size-full bg-muted" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{getCardName(lang, card)}</p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {card.set?.code && <span className="font-mono">{card.set.code}</span>}
                        <RarityBadge rarity={card.rarity} size="sm" />
                      </div>
                    </div>
                    {card.latestPriceJpy != null && (
                      <span className="shrink-0 font-mono text-sm font-semibold">
                        <Price jpy={Math.round(card.latestPriceJpy)} />
                      </span>
                    )}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => commitSearch(query)}
                  className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
                >
                  <Search className="size-3" />
                  ดูผลลัพธ์ทั้งหมดสำหรับ &ldquo;{query.trim()}&rdquo;
                </button>
              </div>
            )}

            {results.length === 0 && !loading && filteredRecent.length > 0 && (
              <div className="p-2">
                <p className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                  ค้นหาล่าสุด
                </p>
                {filteredRecent.map((item, i) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => commitSearch(item)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                      activeIdx === i ? "bg-accent" : "hover:bg-accent/60"
                    )}
                  >
                    <Clock className="size-3.5 text-muted-foreground" />
                    {item}
                  </button>
                ))}
              </div>
            )}

            {!loading && query.trim().length >= 2 && results.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                ไม่พบผลลัพธ์สำหรับ &ldquo;{query.trim()}&rdquo;
              </div>
            )}

            {!loading && query.trim().length < 2 && filteredRecent.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground/50">
                พิมพ์เพื่อค้นหาการ์ด
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
