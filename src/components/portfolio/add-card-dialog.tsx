"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { useUIStore } from "@/stores/ui-store"
import { displayValueToJpy } from "@/lib/utils/currency"
import { fetchCards } from "@/lib/api/fetch-cards"

import { SelectStep } from "./add-card-select-step"
import { DetailStep } from "./add-card-detail-step"
import {
  SET_TYPE_ORDER,
  type CardWithSet,
  type ApiResponse,
  type SetInfo,
  type CartItem,
} from "./add-card-types"

export type { CartItem }

export function AddCardDialog({
  open,
  onOpenChange,
  onAddBatch,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddBatch: (items: CartItem[]) => Promise<void>
}) {
  const [step, setStep] = useState<"select" | "detail">("select")
  const [selectedCard, setSelectedCard] = useState<CardWithSet | null>(null)

  const [query, setQuery] = useState("")
  const [results, setResults] = useState<CardWithSet[]>([])
  const [loading, setLoading] = useState(false)
  const [initialCards, setInitialCards] = useState<CardWithSet[]>([])
  const [initialLoaded, setInitialLoaded] = useState(false)

  const [sets, setSets] = useState<SetInfo[]>([])
  const [activeType, setActiveType] = useState<string | null>(null)
  const [activeSet, setActiveSet] = useState<string | null>(null)
  const [setDropdownOpen, setSetDropdownOpen] = useState(false)
  const setDropdownRef = useRef<HTMLDivElement>(null)

  const [activeRarity, setActiveRarity] = useState<string | null>(null)
  const [activeColor, setActiveColor] = useState<string | null>(null)
  const [activeCardType, setActiveCardType] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const [quantity, setQuantity] = useState(1)
  const [purchasePrice, setPurchasePrice] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const currency = useUIStore((s) => s.currency)

  useEffect(() => {
    if (!open || sets.length > 0) return
    void fetch("/api/sets")
      .then((r) => { if (!r.ok) throw new Error(`/api/sets ${r.status}`); return r.json() })
      .then((data: { sets: SetInfo[] }) => setSets(data.sets ?? []))
      .catch((err: unknown) => { console.error("Failed to load sets:", err) })
  }, [open, sets.length])

  const loadInitial = useCallback(async () => {
    if (initialLoaded) return
    try {
      const data = await fetchCards({ sort: "price_desc", limit: 30 })
      setInitialCards((data.cards ?? []) as CardWithSet[])
    } catch { /* ignore */ }
    setInitialLoaded(true)
  }, [initialLoaded])

  useEffect(() => {
    if (open) void loadInitial()
  }, [open, loadInitial])

  const hasAnyFilter = activeSet != null || activeRarity != null || activeColor != null || activeCardType != null
  const activeFilterCount = [activeSet, activeRarity, activeColor, activeCardType].filter(Boolean).length

  useEffect(() => {
    const q = query.trim()
    const hasSearch = q.length >= 2

    if (!hasSearch && !hasAnyFilter) {
      setResults([])
      return
    }

    setLoading(true)

    const t = window.setTimeout(() => {
      void fetchCards({
        limit: 40,
        search: hasSearch ? q : undefined,
        set: activeSet ?? undefined,
        rarity: activeRarity ?? undefined,
        color: activeColor ?? undefined,
        type: activeCardType ?? undefined,
      })
        .then((data) => setResults((data.cards ?? []) as CardWithSet[]))
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
    }, hasSearch ? 300 : 50)

    return () => { window.clearTimeout(t); setLoading(false) }
  }, [query, activeSet, activeRarity, activeColor, activeCardType, hasAnyFilter])

  useEffect(() => {
    if (!setDropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (setDropdownRef.current && !setDropdownRef.current.contains(e.target as Node)) {
        setSetDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [setDropdownOpen])

  const reset = () => {
    setStep("select")
    setSelectedCard(null)
    setQuery("")
    setResults([])
    setActiveType(null)
    setActiveSet(null)
    setSetDropdownOpen(false)
    setActiveRarity(null)
    setActiveColor(null)
    setActiveCardType(null)
    setShowFilters(false)
    setQuantity(1)
    setPurchasePrice("")
  }

  const clearAllFilters = () => {
    setActiveSet(null)
    setActiveRarity(null)
    setActiveColor(null)
    setActiveCardType(null)
    setActiveType(null)
  }

  const goToDetail = (card: CardWithSet) => {
    setSelectedCard(card)
    setQuantity(1)
    setPurchasePrice("")
    setStep("detail")
  }

  const goBackToSelect = () => {
    setStep("select")
    setSelectedCard(null)
  }

  const handleSubmit = async () => {
    if (!selectedCard) return
    setSubmitting(true)
    try {
      const raw = purchasePrice.trim() === "" ? null : parseInt(purchasePrice)
      const priceJpy = raw != null ? Math.round(displayValueToJpy(raw, currency)) : null
      await onAddBatch([{ card: selectedCard, quantity, purchasePrice: priceJpy }])
      reset()
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  const availableTypes = useMemo(() => {
    const typeSet = new Set(sets.map((s) => s.type))
    return SET_TYPE_ORDER.filter((t) => typeSet.has(t))
  }, [sets])

  const filteredSets = useMemo(() => {
    if (!activeType) return sets
    return sets.filter((s) => s.type === activeType)
  }, [sets, activeType])

  const activeSetInfo = useMemo(
    () => sets.find((s) => s.code === activeSet),
    [sets, activeSet]
  )

  const isFiltered = query.trim().length >= 2 || hasAnyFilter
  const displayCards = isFiltered ? results : initialCards
  const showEmpty = isFiltered && !loading && results.length === 0

  const selectSetCode = (code: string | null) => {
    setActiveSet(code)
    setSetDropdownOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset() }}>
      <DialogContent
        className="flex flex-col gap-0 overflow-hidden p-0"
        style={{ maxWidth: "min(36rem, calc(100% - 2rem))", maxHeight: "85dvh" }}
      >
        {step === "select" ? (
          <SelectStep
            query={query}
            setQuery={setQuery}
            loading={loading}
            displayCards={displayCards}
            showEmpty={showEmpty}
            isFiltered={isFiltered}
            sets={sets}
            activeType={activeType}
            setActiveType={setActiveType}
            activeSet={activeSet}
            activeSetInfo={activeSetInfo}
            availableTypes={availableTypes}
            filteredSets={filteredSets}
            setDropdownOpen={setDropdownOpen}
            setSetDropdownOpen={setSetDropdownOpen}
            setDropdownRef={setDropdownRef}
            selectSetCode={selectSetCode}
            activeRarity={activeRarity}
            setActiveRarity={setActiveRarity}
            activeColor={activeColor}
            setActiveColor={setActiveColor}
            activeCardType={activeCardType}
            setActiveCardType={setActiveCardType}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            activeFilterCount={activeFilterCount}
            clearAllFilters={clearAllFilters}
            onSelectCard={goToDetail}
          />
        ) : selectedCard ? (
          <DetailStep
            card={selectedCard}
            quantity={quantity}
            setQuantity={setQuantity}
            purchasePrice={purchasePrice}
            setPurchasePrice={setPurchasePrice}
            submitting={submitting}
            onBack={goBackToSelect}
            onSubmit={() => void handleSubmit()}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
