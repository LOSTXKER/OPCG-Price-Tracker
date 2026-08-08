"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { AlertTriangle, Calculator, Check, ChevronLeft, Package, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Surface } from "@/components/ui/surface"
import { PageHeader } from "@/components/layout/page-header"
import { FormattedDate } from "@/components/shared/formatted-date"
import { Price } from "@/components/shared/price-inline"
import { SectionHead } from "@/components/shared/section-head"
import { PurchaseConfig } from "@/components/drop-calculator/purchase-config"
import { WantList } from "@/components/drop-calculator/want-list"
import { CardPicker } from "@/components/drop-calculator/card-picker"
import type { SetListItem, SetDetail, DropRate, CardItem, Unit } from "@/components/drop-calculator/types"
import { raritySort } from "@/lib/constants/rarities"
import { getGameConfig } from "@/lib/game-config"
import { useUIStore } from "@/stores/ui-store"
import { getCardName, getSetName, t, type Language } from "@/lib/i18n"
import { buildDropCalculatorCopy } from "@/lib/seo/copy/tools"
import { apiGet, apiTry } from "@/lib/api/client"
import {
  pullChance,
  pullChanceMulti,
  cardChancePerBox,
  PACKS_PER_BOX,
  BOXES_PER_CARTON,
  EXPECTED_PARALLEL_SLOTS_PER_BOX,
} from "@/lib/utils/pull-rate"

type WizardStep = 1 | 2 | 3

export function getDefaultDropSetCode(sets: SetListItem[]) {
  return sets[0]?.code ?? ""
}

export function DropCalculatorWizard({
  lang,
  currentStep,
}: {
  lang: Language
  currentStep: WizardStep
}) {
  const steps = [
    { step: 1, label: t(lang, "selectSet") },
    { step: 2, label: t(lang, "selectWantedCards") },
    { step: 3, label: t(lang, "viewResults") },
  ] as const

  return (
    <nav aria-label={t(lang, "dropCalculator")} className="px-0.5">
      <div className="flex items-center gap-3 sm:hidden">
        <span aria-current="step" className="sr-only">
          {steps[currentStep - 1].label}
        </span>
        <div aria-hidden className="grid flex-1 grid-cols-3 gap-1.5">
          {steps.map(({ step }) => (
            <span
              key={step}
              className={`h-1 rounded-full ${
                step <= currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <span aria-hidden className="text-code text-muted-foreground">
          {currentStep} / {steps.length}
        </span>
      </div>

      <ol className="hidden grid-cols-3 sm:grid">
        {steps.map(({ step, label }, index) => {
          const isComplete = step < currentStep
          const isCurrent = step === currentStep

          return (
            <li
              key={step}
              aria-current={isCurrent ? "step" : undefined}
              className="relative flex min-w-0 items-center justify-center gap-2 text-center"
            >
              {index < steps.length - 1 && (
                <span
                  aria-hidden
                  className={`absolute left-1/2 top-3 h-px w-full ${
                    isComplete ? "bg-primary/50" : "bg-hair"
                  }`}
                />
              )}
              <span
                className={`relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full text-micro tabular-nums ${
                  isComplete
                    ? "bg-primary/15 text-primary"
                    : isCurrent
                      ? "bg-primary text-primary-foreground"
                      : "border border-hair bg-background text-muted-foreground"
                }`}
              >
                {isComplete ? <Check className="size-3.5" aria-hidden /> : step}
              </span>
              <span
                className={`relative z-10 max-w-36 bg-background px-1 text-label ${
                  isCurrent ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function focusCalculatorSection(id: string) {
  window.requestAnimationFrame(() => {
    const target = document.getElementById(id)
    target?.focus({ preventScroll: true })
    target?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    })
  })
}

/**
 * The product the odds are about — a booster-box calculator should show the box.
 * Set art is a square asset with the pack drawn portrait inside transparent
 * margins, so the slot stays square + `object-contain`: a card-shaped crop would
 * clip the wide "Starter Deck EX" display boxes. Sets with no packaging (`don`)
 * carry no art at all, hence the icon fallback.
 */
function SelectedSetPanel({ lang, set }: { lang: Language; set: SetDetail["set"] }) {
  return (
    <Surface variant="panel" className="flex items-center gap-4 p-3 sm:gap-6 sm:p-4">
      <div className="relative aspect-square w-24 shrink-0 sm:w-32 lg:w-40">
        {set.boxImageUrl ? (
          <Image
            src={set.boxImageUrl}
            alt=""
            fill
            className="object-contain"
            sizes="(min-width: 1024px) 160px, (min-width: 640px) 128px, 96px"
          />
        ) : (
          <span className="surface-1 flex size-full items-center justify-center rounded-xl">
            <Package className="size-7 text-muted-foreground/30" />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="text-h3">{set.code.toUpperCase()}</h2>
        <p className="mt-0.5 text-body-sm text-muted-foreground">
          {getSetName(lang, set)}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-meta">
          <span>
            {set.cardCount.toLocaleString()} {t(lang, "cardsCount")}
          </span>
          {set.packsPerBox != null && (
            <span>
              {set.packsPerBox} {t(lang, "packUnit")} / {t(lang, "boxUnit")}
            </span>
          )}
          {set.msrpJpy != null && (
            <span className="text-foreground">
              <Price jpy={set.msrpJpy} />
              <span className="text-muted-foreground"> / {t(lang, "packUnit")}</span>
            </span>
          )}
          {set.releaseDate && (
            <FormattedDate
              date={set.releaseDate}
              options={{ year: "numeric", month: "short" }}
            />
          )}
        </div>
      </div>
    </Surface>
  )
}

function SelectedCardsTray({
  lang,
  cards,
  onRemove,
  onClear,
  onCalculate,
}: {
  lang: Language
  cards: CardItem[]
  onRemove: (cardId: number) => void
  onClear: () => void
  onCalculate: () => void
}) {
  return (
    <Surface
      as="aside"
      variant="outline"
      aria-label={t(lang, "selectedCards")}
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-1/2 z-floating w-[min(48rem,calc(100%-2rem))] -translate-x-1/2 overflow-hidden bg-card/95 shadow-[var(--elev-overlay)] backdrop-blur md:bottom-5"
    >
      <div className="flex items-center gap-1.5 p-2 sm:gap-2">
        <div className="flex shrink-0 items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-label tabular-nums text-primary">
            {cards.length}
          </span>
          <span className="hidden text-label sm:inline">{t(lang, "selectedCards")}</span>
        </div>

        <span aria-hidden className="mx-0.5 h-9 w-px shrink-0 bg-hair" />

        <div className="no-sb flex min-w-0 flex-1 gap-1.5 overflow-x-auto py-0.5">
          {cards.map((card) => {
            const name = getCardName(lang, card as never)
            return (
              <button
                key={card.id}
                type="button"
                aria-label={`${t(lang, "remove")} ${name}`}
                onClick={() => onRemove(card.id)}
                className="group/thumb ease-chrome relative w-9 shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="relative block aspect-[63/88] w-full overflow-hidden rounded-md border border-hair bg-muted">
                  {card.imageUrl ? (
                    <Image
                      src={card.imageUrl}
                      alt=""
                      fill
                      className="object-contain"
                      sizes="36px"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center">
                      <Package className="size-3.5 text-muted-foreground/30" />
                    </span>
                  )}
                </span>
                <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-foreground text-background shadow-[var(--elev-raised)] group-hover/thumb:bg-destructive group-hover/thumb:text-destructive-foreground">
                  <X className="size-2.5" />
                </span>
              </button>
            )
          })}
        </div>

        <Button
          onClick={onClear}
          variant="ghost"
          size="icon-xs"
          aria-label={t(lang, "clearAll")}
          title={t(lang, "clearAll")}
        >
          <Trash2 className="size-3.5" />
        </Button>
        <Button onClick={onCalculate} className="px-3 sm:min-w-32">
          <Calculator className="size-4" />
          {t(lang, "calculate")}
        </Button>
      </div>
    </Surface>
  )
}

export default function DropCalculatorClient() {
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
  const [rarityFilter, setRarityFilter] = useState<string[]>([])
  const [variantFilter, setVariantFilter] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<"selection" | "results">("selection")

  const loadSet = useCallback(async (code: string) => {
    setSelectedCode(code)
    setDetail(null)
    setWantList(new Set())
    setCardSearch("")
    setRarityFilter([])
    setVariantFilter(null)
    setActiveView("selection")
    if (!code) return
    setLoading(true)
    try {
      const data = await apiTry(apiGet<SetDetail>(`/api/drop-calculator?set=${code}`))
      if (data) setDetail(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void apiTry(apiGet<{ sets?: SetListItem[] }>("/api/drop-calculator"))
      .then(async (d) => {
        if (cancelled) return
        const nextSets = d?.sets ?? []
        setSets(nextSets)
        const defaultCode = getDefaultDropSetCode(nextSets)
        if (defaultCode) await loadSet(defaultCode)
      })
      .finally(() => { if (!cancelled) setSetsLoading(false) })
    return () => { cancelled = true }
  }, [loadSet])

  const toggleWant = useCallback((cardId: number) => {
    setWantList((prev) => {
      const next = new Set(prev)
      if (next.has(cardId)) next.delete(cardId)
      else next.add(cardId)
      return next
    })
  }, [])

  const showSelection = useCallback(() => {
    setActiveView("selection")
    focusCalculatorSection("drop-calculator-selection")
  }, [])

  const showResults = useCallback(() => {
    if (wantList.size === 0) return
    setActiveView("results")
    focusCalculatorSection("drop-calculator-results")
  }, [wantList.size])

  const clearWantList = useCallback(() => {
    setWantList(new Set())
    setActiveView("selection")
    focusCalculatorSection("drop-calculator-selection")
  }, [])

  const removeResultCard = useCallback((cardId: number) => {
    const removingLastCard = wantList.size === 1 && wantList.has(cardId)
    toggleWant(cardId)
    if (removingLastCard) {
      setActiveView("selection")
      focusCalculatorSection("drop-calculator-selection")
    }
  }, [toggleWant, wantList])

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
    if (rarityFilter.length > 0) {
      // Chips are BASE rarities (SEC, SR…). A parallel card's rarity is stored
      // "P-SEC" (except SP/TR which stay base), so a base chip matches its whole
      // family — done client-side here (drop-calc has its own API, no server expand).
      list = list.filter(
        (c) =>
          rarityFilter.includes(c.rarity) ||
          (c.rarity.startsWith("P-") && rarityFilter.includes(c.rarity.slice(2)))
      )
    }
    if (variantFilter) {
      const wantParallel = variantFilter === "parallel"
      list = list.filter((c) => c.isParallel === wantParallel)
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
    return [...list].sort((a, b) => raritySort(a.rarity, b.rarity))
  }, [detail, rarityFilter, variantFilter, cardSearch])

  // Rarity chips = BASE options only (no P- variants) — the P- family is reached
  // via the base chip's client-side family match above. Show only bases actually
  // present in this set (collapse P-SEC → SEC etc.) so no dead facet renders.
  const uniqueRarities = useMemo(() => {
    if (!detail) return []
    const baseOrder = (getGameConfig("opcg")?.rarityFilterOptions ?? []).map((o) => o.code)
    const present = new Set(
      detail.cards.map((c) => (c.rarity.startsWith("P-") ? c.rarity.slice(2) : c.rarity))
    )
    return baseOrder.filter((code) => present.has(code))
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

  const wizardStep: WizardStep = activeView === "results" ? 3 : selectedCode ? 2 : 1
  const showLoading = setsLoading || loading
  const noSets = !setsLoading && sets.length === 0

  return (
    <div className="space-y-5 pt-3 sm:space-y-6 sm:pt-5">
      <div className="border-b border-hair pb-5 sm:pb-6">
        <PageHeader
          title={buildDropCalculatorCopy(lang).h1}
          size="sm"
          className="mb-4 sm:mb-5"
        >
          <p className="mt-1 hidden text-meta sm:block">
            {t(lang, "dropCalculatorDesc")}
          </p>
        </PageHeader>
        <DropCalculatorWizard lang={lang} currentStep={wizardStep} />
      </div>

      {showLoading && !noSets && (
        <>
          {/* matches SelectedSetPanel's height so the box art doesn't shove the
              card grid down when the set detail lands */}
          <Skeleton className="h-30 w-full rounded-xl sm:h-40" />
          <div className="lg:flex lg:gap-8">
            <aside className="hidden w-52 shrink-0 space-y-5 lg:block">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-5 w-24" />
              <div className="space-y-2">
                {Array.from({ length: 5 }, (_, index) => (
                  <Skeleton key={index} className="h-9 w-full rounded-md" />
                ))}
              </div>
            </aside>
            <div className="min-w-0 flex-1">
              <div className="mb-5 space-y-3 lg:hidden">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
              <div className="grid grid-cols-3 gap-x-2.5 gap-y-4 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {Array.from({ length: 12 }, (_, index) => (
                  <div key={index} className="min-w-0 space-y-2">
                    <Skeleton className="aspect-[63/88] w-full rounded-lg" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-3.5 w-2/5" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {noSets && (
        <Surface variant="subtle" className="px-4 py-8 text-center">
          <p className="text-meta">{t(lang, "noSetsFound")}</p>
        </Surface>
      )}

      {!showLoading && !noSets && detail && (
        <>
          <SelectedSetPanel lang={lang} set={detail.set} />

          {activeView === "selection" ? (
            <div
              id="drop-calculator-selection"
              tabIndex={-1}
              className={wantCards.length > 0
                ? "scroll-mt-20 pb-40 outline-none sm:scroll-mt-24 md:pb-24"
                : "scroll-mt-20 outline-none sm:scroll-mt-24"}
            >
              <CardPicker
                sets={sets}
                selectedCode={selectedCode}
                setsLoading={setsLoading}
                cards={filteredCards}
                uniqueRarities={uniqueRarities}
                wantSet={wantList}
                wantCount={wantCards.length}
                cardSearch={cardSearch}
                rarityFilter={rarityFilter}
                variantFilter={variantFilter}
                onToggleWant={toggleWant}
                onSearchChange={setCardSearch}
                onRarityChange={setRarityFilter}
                onVariantChange={setVariantFilter}
                onSetChange={(code) => void loadSet(code)}
              />
              <p className="mt-3 flex items-center gap-1.5 text-meta text-muted-foreground/60">
                <AlertTriangle className="size-3 shrink-0" />
                {t(lang, "communityEstimate")}
              </p>
            </div>
          ) : (
            <div
              id="drop-calculator-results"
              tabIndex={-1}
              className="scroll-mt-20 outline-none sm:scroll-mt-24"
            >
              <SectionHead
                title={t(lang, "viewResults")}
                action={(
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={showSelection}
                    aria-label={`${t(lang, "edit")} ${t(lang, "selectedCards")}`}
                  >
                  <ChevronLeft className="size-4" />
                    {t(lang, "edit")}
                  </Button>
                )}
              />

              <div className="grid items-start gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
                <Surface variant="panel" className="order-1 p-4 sm:p-5 lg:order-2">
                  <WantList
                    wantCards={wantCards}
                    wantResults={wantResults}
                    allChance={allChance}
                    totalWantValue={totalWantValue}
                    purchaseCost={purchaseCost}
                    unit={unit}
                    quantity={quantity}
                    onRemove={removeResultCard}
                    onClearAll={clearWantList}
                  />
                </Surface>
                <Surface variant="panel" className="order-2 p-4 sm:p-5 lg:order-1">
                  <PurchaseConfig
                    unit={unit}
                    quantity={quantity}
                    dropRates={detail.dropRates}
                    onUnitChange={setUnit}
                    onQuantityChange={setQuantity}
                  />
                </Surface>
              </div>

              <p className="mt-4 flex items-center gap-1.5 text-meta text-muted-foreground/60">
                <AlertTriangle className="size-3 shrink-0" />
                {t(lang, "communityEstimate")}
              </p>

            </div>
          )}

          {activeView === "selection" && wantCards.length > 0 && (
            <SelectedCardsTray
              lang={lang}
              cards={wantCards}
              onRemove={toggleWant}
              onClear={clearWantList}
              onCalculate={showResults}
            />
          )}
        </>
      )}
    </div>
  )
}
