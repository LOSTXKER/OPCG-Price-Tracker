"use client"

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react"
import Image from "next/image"
import { Check, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { Price } from "@/components/shared/price-inline"
import { useCompareStore, type CompareItem } from "@/stores/compare-store"
import { useUIStore } from "@/stores/ui-store"
import { getCardName, t } from "@/lib/i18n"
import { fetchCards, type CardResult } from "@/lib/api/fetch-cards"
import { cn } from "@/lib/utils"
import { useTierLimits } from "@/hooks/use-tier-limits"
import { UpgradeBadge } from "@/components/shared/upgrade-badge"

type CardSet = {
  code: string
  name: string
  nameEn?: string | null
  _count?: { cards: number }
}

export function CardPickerModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const lang = useUIStore((s) => s.language)
  const storeItems = useCompareStore((s) => s.items)
  const toggle = useCompareStore((s) => s.toggle)

  const [query, setQuery] = useState("")
  const [cards, setCards] = useState<CardResult[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [sets, setSets] = useState<CardSet[]>([])
  const [selectedSet, setSelectedSet] = useState("")
  const [sort, setSort] = useState("price_desc")

  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const titleId = useId()

  const { limits } = useTierLimits()
  const tierMax = isFinite(limits.compareCards) ? limits.compareCards : 6

  const selectedCodes = new Set(storeItems.map((i) => i.cardCode))
  const atLimit = storeItems.length >= tierMax

  useEffect(() => {
    if (open) {
      setQuery("")
      setSelectedSet("")
      setSort("price_desc")
      setFetchError(null)
      fetch("/api/sets")
        .then((r) => r.json())
        .then((d) => setSets(d.sets ?? []))
        .catch(() => {})
    }
  }, [open])

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

  const loadCards = useCallback(
    async (search: string, set: string, sortBy: string) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)
      setFetchError(null)
      try {
        const data = await fetchCards(
          {
            search: search || undefined,
            set: set || undefined,
            sort: sortBy,
            limit: 24,
          },
          { signal: controller.signal }
        )
        setCards(data.cards ?? [])
        setFetchError(null)
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return
        console.error("Card picker fetch failed:", err)
        setCards([])
        setFetchError("Search failed. Please try again.")
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {
      loadCards(query.trim(), selectedSet, sort)
    }, query ? 300 : 0)
    return () => clearTimeout(timer)
  }, [open, query, selectedSet, sort, loadCards])

  const handleAdd = (card: CardResult) => {
    const item: CompareItem = {
      cardCode: card.cardCode,
      name: getCardName(lang, card),
      imageUrl: card.imageUrl ?? null,
      rarity: card.rarity,
    }
    toggle(item)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in-0 duration-150"
        onClick={onClose}
      />

      <div className="relative mx-auto mt-[5vh] flex h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-popover shadow-2xl ring-1 ring-border/50 animate-in fade-in-0 slide-in-from-bottom-4 duration-200 md:mt-[8vh] md:h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 id={titleId} className="text-h3">
            {t(lang, "addCardToCompare")}
          </h2>
          <button
            aria-label="Close"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Search + Filters */}
        <div className="space-y-2 border-b px-4 py-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t(lang, "searchPlaceholder")}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            {/* Set filter */}
            <Select
              items={[
                { value: "__all__", label: t(lang, "allSets") },
                ...sets.map((s) => ({
                  value: s.code,
                  label:
                    s.code.toUpperCase() +
                    (s.nameEn ? ` — ${s.nameEn}` : s.name ? ` — ${s.name}` : ""),
                })),
              ]}
              value={selectedSet || "__all__"}
              onValueChange={(value) => setSelectedSet(!value || value === "__all__" ? "" : value)}
            >
              <SelectTrigger size="sm" className="text-xs">
                <SelectValue placeholder={t(lang, "allSets")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t(lang, "allSets")}</SelectItem>
                {sets.map((s) => (
                  <SelectItem key={s.code} value={s.code}>
                    {s.code.toUpperCase()}
                    {s.nameEn ? ` — ${s.nameEn}` : s.name ? ` — ${s.name}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Sort */}
            <Select
              items={[
                { value: "views_desc", label: t(lang, "popular") },
                { value: "price_desc", label: t(lang, "sortPriceDesc") },
                { value: "price_asc", label: t(lang, "sortPriceAsc") },
                { value: "newest", label: t(lang, "sortNewest") },
              ]}
              value={sort}
              onValueChange={(value) => setSort(value ?? "price_desc")}
            >
              <SelectTrigger size="sm" className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="views_desc">{t(lang, "popular")}</SelectItem>
                <SelectItem value="price_desc">{t(lang, "sortPriceDesc")}</SelectItem>
                <SelectItem value="price_asc">{t(lang, "sortPriceAsc")}</SelectItem>
                <SelectItem value="newest">{t(lang, "sortNewest")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Card grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {fetchError && !loading && (
            <div className="mb-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {fetchError}
            </div>
          )}

          {loading && cards.length === 0 && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="aspect-[63/88] w-full rounded-lg" />
                  <Skeleton className="h-3 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
              ))}
            </div>
          )}

          {cards.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {cards.map((card) => {
                const isSelected = selectedCodes.has(card.cardCode)
                const disabled = !isSelected && atLimit
                return (
                  <button
                    key={card.cardCode}
                    type="button"
                    onClick={() => handleAdd(card)}
                    disabled={disabled}
                    className={cn(
                      "group/pick relative rounded-xl border p-1.5 text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary"
                        : "border-border hover:border-primary/50 hover:shadow-sm",
                      disabled && "cursor-not-allowed opacity-40"
                    )}
                  >
                    {/* Image — clean, no overlays. Selection state lives on the tile border. */}
                    <div className="relative aspect-[63/88] w-full overflow-hidden rounded-lg bg-muted">
                      {card.imageUrl ? (
                        <Image
                          src={card.imageUrl}
                          alt={getCardName(lang, card)}
                          fill
                          className="object-contain"
                          sizes="(max-width: 640px) 30vw, 140px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-meta">
                          {card.cardCode}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="mt-1.5 space-y-0.5 px-0.5">
                      <div className="flex items-center gap-1">
                        <RarityBadge rarity={card.rarity} size="sm" />
                        <span className="font-mono text-xs text-muted-foreground">
                          {card.set?.code?.toUpperCase() ?? ""}
                        </span>
                        {isSelected && (
                          <span className="ml-auto inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                            <Check className="size-2.5" />
                          </span>
                        )}
                      </div>
                      <p
                        className="truncate text-xs font-medium leading-tight"
                        title={getCardName(lang, card)}
                      >
                        {getCardName(lang, card)}
                      </p>
                      {card.latestPriceJpy != null && (
                        <p className="font-mono text-xs font-semibold">
                          <Price jpy={Math.round(card.latestPriceJpy)} />
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {!loading &&
            cards.length === 0 &&
            query.trim().length >= 2 &&
            !fetchError && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {t(lang, "noCardsFound")}
            </div>
          )}
        </div>

        {/* Footer with count */}
        <div className="flex items-center justify-between border-t px-4 py-2.5">
          <div className="flex items-center gap-2">
            <p className="text-meta">
              {storeItems.length}/{tierMax} {t(lang, "card")}
            </p>
            {atLimit && isFinite(limits.compareCards) && (
              <UpgradeBadge featureKey="comparePlus" />
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t(lang, "compareNow")}
          </button>
        </div>
      </div>
    </div>
  )
}
