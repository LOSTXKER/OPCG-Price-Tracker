"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Check, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { Price } from "@/components/shared/price-inline"
import { useCompareStore, type CompareItem } from "@/stores/compare-store"
import { useUIStore } from "@/stores/ui-store"
import { getCardName, t } from "@/lib/i18n"
import { fetchCards, type CardResult } from "@/lib/api/fetch-cards"
import { cn } from "@/lib/utils"

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
  const [sets, setSets] = useState<CardSet[]>([])
  const [selectedSet, setSelectedSet] = useState("")
  const [sort, setSort] = useState("price_desc")

  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const selectedCodes = new Set(storeItems.map((i) => i.cardCode))
  const atLimit = storeItems.length >= 6

  useEffect(() => {
    if (open) {
      setQuery("")
      setSelectedSet("")
      setSort("price_desc")
      requestAnimationFrame(() => inputRef.current?.focus())
      fetch("/api/sets")
        .then((r) => r.json())
        .then((d) => setSets(d.sets ?? []))
        .catch(() => {})
    }
  }, [open])

  const loadCards = useCallback(
    async (search: string, set: string, sortBy: string) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)
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
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError")
          console.error("Card picker fetch failed:", err)
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
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in-0 duration-150"
        onClick={onClose}
      />

      <div className="relative mx-auto mt-[5vh] flex h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-popover shadow-2xl ring-1 ring-border/50 animate-in fade-in-0 slide-in-from-bottom-4 duration-200 md:mt-[8vh] md:h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-base font-semibold">
            {t(lang, "addCardToCompare")}
          </h2>
          <button
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
            <select
              value={selectedSet}
              onChange={(e) => setSelectedSet(e.target.value)}
              className="h-8 rounded-lg border bg-background px-2 text-xs"
            >
              <option value="">{t(lang, "allSets")}</option>
              {sets.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.code.toUpperCase()}
                  {s.nameEn ? ` — ${s.nameEn}` : s.name ? ` — ${s.name}` : ""}
                </option>
              ))}
            </select>
            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-8 rounded-lg border bg-background px-2 text-xs"
            >
              <option value="views_desc">{t(lang, "popular")}</option>
              <option value="price_desc">{t(lang, "sortPriceDesc")}</option>
              <option value="price_asc">{t(lang, "sortPriceAsc")}</option>
              <option value="newest">{t(lang, "sortNewest")}</option>
            </select>
          </div>
        </div>

        {/* Card grid */}
        <div className="flex-1 overflow-y-auto p-4">
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
                        ? "border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/30"
                        : "border-border hover:border-primary/50 hover:shadow-sm",
                      disabled && "cursor-not-allowed opacity-40"
                    )}
                  >
                    {/* Check badge */}
                    {isSelected && (
                      <div className="absolute -right-1.5 -top-1.5 z-10 flex size-5 items-center justify-center rounded-full bg-blue-500 text-white shadow">
                        <Check className="size-3" />
                      </div>
                    )}

                    {/* Image */}
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
                        <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                          {card.cardCode}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="mt-1.5 space-y-0.5 px-0.5">
                      <div className="flex items-center gap-1">
                        <RarityBadge rarity={card.rarity} size="sm" />
                        <span className="font-mono text-[9px] text-muted-foreground">
                          {card.set?.code?.toUpperCase() ?? ""}
                        </span>
                      </div>
                      <p
                        className="truncate text-[11px] font-medium leading-tight"
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

          {!loading && cards.length === 0 && query.trim().length >= 2 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {t(lang, "noCardsFound")}
            </div>
          )}
        </div>

        {/* Footer with count */}
        <div className="flex items-center justify-between border-t px-4 py-2.5">
          <p className="text-xs text-muted-foreground">
            {storeItems.length}/6 {t(lang, "card")}
          </p>
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
