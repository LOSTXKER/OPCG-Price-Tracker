"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertTriangle, Calculator, ListChecks, Package, LayoutGrid } from "lucide-react"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { SetSelector } from "@/components/pull-calculator/set-selector"
import { PurchaseConfig } from "@/components/pull-calculator/purchase-config"
import { WantList } from "@/components/pull-calculator/want-list"
import { CardPicker } from "@/components/pull-calculator/card-picker"
import type { SetListItem, SetDetail, DropRate, CardItem, Unit } from "@/components/pull-calculator/types"
import { tierSort } from "@/components/pull-calculator/types"
import { useUIStore } from "@/stores/ui-store"
import { t } from "@/lib/i18n"
import {
  pullChance,
  pullChanceMulti,
  cardChancePerBox,
  PACKS_PER_BOX,
  BOXES_PER_CARTON,
  EXPECTED_PARALLEL_SLOTS_PER_BOX,
} from "@/lib/utils/pull-rate"

export default function PullCalculatorClient() {
  const lang = useUIStore((s) => s.language)
  const [sets, setSets] = useState<SetListItem[]>([])
  const [selectedCode, setSelectedCode] = useState<string>("")
  const [detail, setDetail] = useState<SetDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [setsLoading, setSetsLoading] = useState(true)

  const [unit, setUnit] = useState<Unit>("box")
  const [quantity, setQuantity] = useState(1)
  const [wantList, setWantList] = useState<Set<number>>(new Set())

  const [cardSearch, setCardSearch] = useState("")
  const [rarityFilter, setRarityFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState<"cards" | "results">("cards")

  useEffect(() => {
    fetch("/api/pull-calculator")
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load sets: ${r.status}`)
        return r.json()
      })
      .then((d) => setSets(d.sets ?? []))
      .catch((err: unknown) => { console.error(err) })
      .finally(() => setSetsLoading(false))
  }, [])

  const loadSet = useCallback(async (code: string) => {
    setSelectedCode(code)
    setWantList(new Set())
    setCardSearch("")
    setRarityFilter("all")
    setActiveTab("cards")
    if (!code) { setDetail(null); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/pull-calculator?set=${code}`)
      if (!res.ok) throw new Error(`Failed to load set ${code}: ${res.status}`)
      const data = await res.json()
      setDetail(data)
    } finally {
      setLoading(false)
    }
  }, [])

  const toggleWant = useCallback((cardId: number) => {
    setWantList((prev) => {
      const next = new Set(prev)
      if (next.has(cardId)) next.delete(cardId)
      else next.add(cardId)
      return next
    })
  }, [])

  const dropRateMap = useMemo(() => {
    if (!detail) return new Map<string, DropRate>()
    const map = new Map<string, DropRate>()
    for (const dr of detail.dropRates) map.set(dr.rarity, dr)
    return map
  }, [detail])

  const rarityPoolSizes = useMemo(() => {
    if (!detail) return { normal: new Map<string, number>(), parallel: new Map<string, number>(), totalParallel: 0 }
    const normal = new Map<string, number>()
    const parallel = new Map<string, number>()
    let totalParallel = 0
    for (const rc of detail.rarityCounts) {
      normal.set(rc.rarity, rc.normal)
      parallel.set(rc.rarity, rc.parallel)
      totalParallel += rc.parallel
    }
    return { normal, parallel, totalParallel }
  }, [detail])

  const filteredCards = useMemo(() => {
    if (!detail) return []
    let list = detail.cards
    if (rarityFilter !== "all") {
      list = list.filter((c) => c.rarity === rarityFilter)
    }
    if (cardSearch.trim()) {
      const q = cardSearch.trim().toLowerCase()
      list = list.filter(
        (c) =>
          c.cardCode.toLowerCase().includes(q) ||
          c.nameJp.toLowerCase().includes(q) ||
          c.nameEn?.toLowerCase().includes(q) ||
          c.nameTh?.toLowerCase().includes(q)
      )
    }
    return list
  }, [detail, rarityFilter, cardSearch])

  const uniqueRarities = useMemo(() => {
    if (!detail) return []
    const set = new Set(detail.cards.map((c) => c.rarity))
    return Array.from(set).sort(tierSort)
  }, [detail])

  const getCardChance = useCallback(
    (card: CardItem): number => {
      const dr = dropRateMap.get(card.rarity)
      const isP = card.isParallel
      const pool = isP
        ? (rarityPoolSizes.parallel.get(card.rarity) ?? 1)
        : (rarityPoolSizes.normal.get(card.rarity) ?? 1)
      const totalPPool = rarityPoolSizes.totalParallel

      if (unit === "pack") {
        if (isP) {
          const pPack = totalPPool > 0 ? (EXPECTED_PARALLEL_SLOTS_PER_BOX / PACKS_PER_BOX) * (1 / totalPPool) : 0
          return pullChanceMulti(pPack, quantity)
        }
        const rpp = dr?.ratePerPack ?? 0
        const pPack = pullChance(rpp, pool)
        return pullChanceMulti(pPack, quantity)
      }

      if (unit === "box") {
        const pBox = cardChancePerBox(card.rarity, pool, dr?.avgPerBox ?? 0, isP, totalPPool)
        return pullChanceMulti(pBox, quantity)
      }

      const pBox = cardChancePerBox(card.rarity, pool, dr?.avgPerBox ?? 0, isP, totalPPool)
      const pCarton = pullChanceMulti(pBox, BOXES_PER_CARTON)
      return pullChanceMulti(pCarton, quantity)
    },
    [dropRateMap, rarityPoolSizes, unit, quantity],
  )

  const wantCards = useMemo(
    () => detail?.cards.filter((c) => wantList.has(c.id)) ?? [],
    [detail, wantList]
  )

  const wantResults = useMemo(() => {
    return wantCards.map((card) => ({
      card,
      chance: getCardChance(card),
    }))
  }, [wantCards, getCardChance])

  const allChance = useMemo(() => {
    if (wantResults.length === 0) return 0
    return wantResults.reduce((acc, r) => acc * r.chance, 1)
  }, [wantResults])

  const totalWantValue = useMemo(() => {
    return wantCards.reduce((acc, c) => acc + (c.latestPriceJpy ?? 0), 0)
  }, [wantCards])

  const purchaseCost = useMemo(() => {
    if (!detail?.set.msrpJpy) return null
    const msrp = detail.set.msrpJpy
    if (unit === "pack") return msrp * quantity
    if (unit === "box") return msrp * PACKS_PER_BOX * quantity
    return msrp * PACKS_PER_BOX * BOXES_PER_CARTON * quantity
  }, [detail, unit, quantity])

  const selectCardsLabel = t(lang, "selectWantedCards")
  const resultsLabel = t(lang, "viewResults")

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Calculator className="size-4" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t(lang, "pullCalculator")}</h1>
      </div>

      {/* ── Set Selector ── */}
      <SetSelector
        sets={sets}
        selectedCode={selectedCode}
        setsLoading={setsLoading}
        onSelect={(code) => void loadSet(code)}
      />

      {/* ── Main content ── */}
      <div className={cn(
        "transition-opacity duration-300",
        !selectedCode && "pointer-events-none opacity-30"
      )}>
        {/* Mobile: compact config + tabs */}
        {detail && !loading && (
          <div className="space-y-3 lg:hidden">
            <PurchaseConfig
              unit={unit}
              quantity={quantity}
              dropRates={detail.dropRates}
              onUnitChange={setUnit}
              onQuantityChange={setQuantity}
              compact
            />
            <div className="flex rounded-lg border border-border bg-muted/50 p-0.5">
              <button
                onClick={() => setActiveTab("cards")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all",
                  activeTab === "cards"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid className="size-4" />
                {selectCardsLabel}
              </button>
              <button
                onClick={() => setActiveTab("results")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all",
                  activeTab === "results"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ListChecks className="size-4" />
                {resultsLabel}
                {wantCards.length > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {wantCards.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Mobile: tab content */}
        <div className="mt-4 lg:hidden">
          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          )}
          {!detail && !loading && (
            <div className="panel flex flex-col items-center justify-center px-6 py-10 text-center">
              <Package className="mb-2 size-8 text-muted-foreground/20" />
              <p className="text-xs text-muted-foreground">{t(lang, "selectSet")}</p>
            </div>
          )}
          {detail && !loading && activeTab === "cards" && (
            <>
              <CardPicker
                cards={filteredCards}
                uniqueRarities={uniqueRarities}
                wantSet={wantList}
                wantCount={wantCards.length}
                cardSearch={cardSearch}
                rarityFilter={rarityFilter}
                onToggleWant={toggleWant}
                onSearchChange={setCardSearch}
                onRarityChange={setRarityFilter}
              />
              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
                <AlertTriangle className="size-3 shrink-0" />
                {t(lang, "communityEstimate")}
              </p>
            </>
          )}
          {detail && !loading && activeTab === "results" && (
            <WantList
              wantCards={wantCards}
              wantResults={wantResults}
              allChance={allChance}
              totalWantValue={totalWantValue}
              purchaseCost={purchaseCost}
              unit={unit}
              quantity={quantity}
              onRemove={toggleWant}
              onClearAll={() => setWantList(new Set())}
            />
          )}
        </div>

        {/* Desktop: two-column layout (no tabs) */}
        <div className="hidden lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-5">
          <div className="min-w-0 lg:col-start-1">
            {loading && (
              <div className="space-y-3">
                <Skeleton className="h-14 w-full rounded-lg" />
                <Skeleton className="h-64 w-full rounded-lg" />
              </div>
            )}
            {!detail && !loading && (
              <div className="panel flex flex-col items-center justify-center px-6 py-10 text-center">
                <Package className="mb-2 size-8 text-muted-foreground/20" />
                <p className="text-xs text-muted-foreground">{t(lang, "selectSet")}</p>
              </div>
            )}
            {detail && !loading && (
              <CardPicker
                cards={filteredCards}
                uniqueRarities={uniqueRarities}
                wantSet={wantList}
                wantCount={wantCards.length}
                cardSearch={cardSearch}
                rarityFilter={rarityFilter}
                onToggleWant={toggleWant}
                onSearchChange={setCardSearch}
                onRarityChange={setRarityFilter}
              />
            )}
            {detail && !loading && (
              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
                <AlertTriangle className="size-3 shrink-0" />
                {t(lang, "communityEstimate")}
              </p>
            )}
          </div>

          <div className="space-y-3 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:sticky lg:top-20 lg:h-fit">
            {detail ? (
              <>
                <PurchaseConfig
                  unit={unit}
                  quantity={quantity}
                  dropRates={detail.dropRates}
                  onUnitChange={setUnit}
                  onQuantityChange={setQuantity}
                />
                <WantList
                  wantCards={wantCards}
                  wantResults={wantResults}
                  allChance={allChance}
                  totalWantValue={totalWantValue}
                  purchaseCost={purchaseCost}
                  unit={unit}
                  quantity={quantity}
                  onRemove={toggleWant}
                  onClearAll={() => setWantList(new Set())}
                />
              </>
            ) : (
              <div className="panel p-4">
                <div className="rounded-lg border border-dashed border-border/50 bg-muted/10 p-6 text-center text-xs text-muted-foreground/40">
                  {t(lang, "selectSet")}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
