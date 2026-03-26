"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import {
  AlertTriangle,
  Box,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
  Minus,
  Package,
  Plus,
  Search,
  ShieldCheck,
  X,
} from "lucide-react"

import { RarityBadge } from "@/components/shared/rarity-badge"
import { Price } from "@/components/shared/price-inline"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { BLUR_DATA_URL } from "@/lib/constants/ui"
import { getCardName } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import {
  pullChance,
  pullChanceMulti,
  cardChancePerBox,
  formatPct,
  BOX_PATTERNS,
  CARTON_ESTIMATES,
  PACKS_PER_BOX,
  CARDS_PER_PACK_JP,
  BOXES_PER_CARTON,
  COMMUNITY_SOURCES,
  EXPECTED_PARALLEL_SLOTS_PER_BOX,
  officialProductUrl,
} from "@/lib/utils/pull-rate"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SetListItem {
  id: number
  code: string
  name: string
  nameEn: string | null
  nameTh: string | null
  type: string
  releaseDate: string | null
}

interface DropRate {
  rarity: string
  avgPerBox: number | null
  ratePerPack: number | null
}

interface CardItem {
  id: number
  cardCode: string
  nameJp: string
  nameEn: string | null
  nameTh: string | null
  rarity: string
  isParallel: boolean
  imageUrl: string | null
  latestPriceJpy: number | null
}

interface RarityCount {
  rarity: string
  normal: number
  parallel: number
}

interface SetDetail {
  set: {
    code: string
    name: string
    nameEn: string | null
    nameTh: string | null
    type: string
    packsPerBox: number | null
    cardsPerPack: number | null
    msrpJpy: number | null
    boxImageUrl: string | null
    cardCount: number
    releaseDate: string | null
  }
  dropRates: DropRate[]
  cards: CardItem[]
  rarityCounts: RarityCount[]
}

type Unit = "pack" | "box" | "carton"

const UNIT_LABELS: Record<Unit, string> = {
  pack: "ซอง",
  box: "กล่อง",
  carton: "คาตั้น",
}

const TIER_ORDER = [
  "L", "C", "UC", "R", "SR", "SEC", "SP", "SP CARD",
  "P-L", "P-C", "P-UC", "P-R", "P-SR", "P-SEC", "DON",
]

function tierSort(a: string, b: string) {
  const ai = TIER_ORDER.indexOf(a)
  const bi = TIER_ORDER.indexOf(b)
  return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function PullCalculatorPage() {
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
  const [showDropdown, setShowDropdown] = useState(false)
  const [setSearch, setSetSearch] = useState("")

  useEffect(() => {
    fetch("/api/pull-calculator")
      .then((r) => r.json())
      .then((d) => setSets(d.sets ?? []))
      .finally(() => setSetsLoading(false))
  }, [])

  const loadSet = useCallback(async (code: string) => {
    setSelectedCode(code)
    setWantList(new Set())
    setCardSearch("")
    setRarityFilter("all")
    if (!code) { setDetail(null); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/pull-calculator?set=${code}`)
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

  const sortedRarityCounts = useMemo(() => {
    if (!detail) return []
    return [...detail.rarityCounts].sort((a, b) => tierSort(a.rarity, b.rarity))
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

  function getCardChance(card: CardItem): number {
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
  }

  const wantCards = useMemo(
    () => detail?.cards.filter((c) => wantList.has(c.id)) ?? [],
    [detail, wantList]
  )

  const wantResults = useMemo(() => {
    return wantCards.map((card) => ({
      card,
      chance: getCardChance(card),
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantCards, unit, quantity, dropRateMap, rarityPoolSizes])

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

  const selectedSet = sets.find((s) => s.code === selectedCode)

  const groupedSets = useMemo(() => {
    const q = setSearch.trim().toLowerCase()
    const filtered = q
      ? sets.filter(
          (s) =>
            s.code.toLowerCase().includes(q) ||
            s.name.toLowerCase().includes(q) ||
            s.nameEn?.toLowerCase().includes(q) ||
            s.nameTh?.toLowerCase().includes(q)
        )
      : sets

    const groups: { label: string; items: SetListItem[] }[] = []
    const boosters = filtered.filter((s) => s.type === "BOOSTER")
    const extras = filtered.filter((s) => s.type === "EXTRA_BOOSTER")
    const others = filtered.filter(
      (s) => s.type !== "BOOSTER" && s.type !== "EXTRA_BOOSTER"
    )

    const codeSort = (a: SetListItem, b: SetListItem) => {
      const aMatch = a.code.match(/(\D+)-?(\d+)/)
      const bMatch = b.code.match(/(\D+)-?(\d+)/)
      if (aMatch && bMatch) {
        if (aMatch[1] !== bMatch[1]) return aMatch[1].localeCompare(bMatch[1])
        return parseInt(bMatch[2]) - parseInt(aMatch[2])
      }
      return b.code.localeCompare(a.code)
    }

    if (boosters.length)
      groups.push({ label: "Booster Pack", items: boosters.sort(codeSort) })
    if (extras.length)
      groups.push({ label: "Extra Booster", items: extras.sort(codeSort) })
    if (others.length)
      groups.push({ label: "อื่นๆ", items: others.sort(codeSort) })

    return groups
  }, [sets, setSearch])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">คำนวณดรอปเรท</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          เลือกชุดการ์ด กำหนดจำนวนซื้อ แล้วเลือกการ์ดที่อยากได้ ระบบจะคำนวณโอกาสให้
        </p>
      </div>

      {/* 1. Set Selector */}
      <section className="panel p-4">
        <label className="mb-2 block text-sm font-semibold">เลือกชุดการ์ด</label>
        {setsLoading ? (
          <Skeleton className="h-10 w-full rounded-lg" />
        ) : (
          <div className="relative">
            <button
              type="button"
              onClick={() => { setShowDropdown(!showDropdown); setSetSearch("") }}
              className="flex h-10 w-full items-center justify-between rounded-lg border border-border bg-background px-3 text-sm transition-colors hover:bg-muted/50"
            >
              {selectedSet ? (
                <span className="flex items-center gap-2 text-foreground">
                  <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                    {selectedSet.code}
                  </span>
                  <span className="truncate">
                    {lang === "EN" ? (selectedSet.nameEn ?? selectedSet.name) : selectedSet.name}
                  </span>
                </span>
              ) : (
                <span className="text-muted-foreground">เลือกชุดการ์ด...</span>
              )}
              <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", showDropdown && "rotate-180")} />
            </button>

            {showDropdown && (
              <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-background shadow-lg">
                {/* Search within dropdown */}
                <div className="sticky top-0 border-b border-border bg-background p-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={setSearch}
                      onChange={(e) => setSetSearch(e.target.value)}
                      placeholder="ค้นหาชุดการ์ด..."
                      className="h-8 w-full rounded-md border border-border bg-muted/30 pl-8 pr-3 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto py-1">
                  {groupedSets.length === 0 && (
                    <p className="px-3 py-4 text-center text-sm text-muted-foreground">ไม่พบชุดการ์ด</p>
                  )}
                  {groupedSets.map((group) => (
                    <div key={group.label}>
                      <div className="border-b border-border/40 bg-muted/30 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                        {group.label}
                        <span className="ml-1.5 text-muted-foreground/60">({group.items.length})</span>
                      </div>
                      {group.items.map((s) => (
                        <button
                          key={s.code}
                          type="button"
                          onClick={() => { void loadSet(s.code); setShowDropdown(false); setSetSearch("") }}
                          className={cn(
                            "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/60",
                            s.code === selectedCode && "bg-primary/5 font-medium"
                          )}
                        >
                          <span className="shrink-0 w-14 rounded bg-muted px-1.5 py-0.5 text-center font-mono text-xs text-muted-foreground">
                            {s.code}
                          </span>
                          <span className="flex-1 truncate">
                            {lang === "EN" ? (s.nameEn ?? s.name) : s.name}
                          </span>
                          {s.releaseDate && (
                            <span className="shrink-0 text-xs text-muted-foreground/50">
                              {new Date(s.releaseDate).getFullYear()}
                            </span>
                          )}
                          {s.code === selectedCode && (
                            <Check className="size-3.5 shrink-0 text-primary" />
                          )}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Always show 2-panel layout for continuity */}
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1fr_380px] lg:gap-6 lg:items-start">
        {/* ======== LEFT PANEL ======== */}
        <div className="min-w-0 space-y-4 lg:col-start-1">
          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          )}

          {!detail && !loading && <EmptyStateLeft />}

          {detail && !loading && (
            <SetInfoPanel detail={detail} lang={lang} />
          )}
        </div>

        {/* ======== RIGHT SIDEBAR ======== */}
        <div className="space-y-3 lg:col-start-2 lg:row-start-1 lg:row-span-3 lg:sticky lg:top-20 lg:h-fit">
          {detail ? (
            <>
              {/* Purchase Config + Expected */}
              <section className="panel overflow-hidden">
                <div className="space-y-3 p-3">
                  <div className="flex w-full rounded-lg border border-border bg-muted/50 p-0.5">
                    {(["pack", "box", "carton"] as Unit[]).map((u) => (
                      <button
                        key={u}
                        onClick={() => setUnit(u)}
                        className={cn(
                          "flex-1 rounded-md py-1.5 text-center text-sm font-medium transition-all",
                          unit === u
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {UNIT_LABELS[u]}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="flex size-8 items-center justify-center rounded-md border border-border transition-colors hover:bg-muted"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
                      className="h-8 w-16 rounded-md border border-border bg-background px-2 text-center font-mono text-sm tabular-nums outline-none"
                    />
                    <button
                      onClick={() => setQuantity(Math.min(99, quantity + 1))}
                      className="flex size-8 items-center justify-center rounded-md border border-border transition-colors hover:bg-muted"
                    >
                      <Plus className="size-3.5" />
                    </button>
                    <span className="text-sm text-muted-foreground">{UNIT_LABELS[unit]}</span>
                  </div>
                  <p className="text-center text-[11px] text-muted-foreground">
                    {unit === "pack" && `${quantity} ซอง`}
                    {unit === "box" && `${quantity} กล่อง = ${PACKS_PER_BOX * quantity} ซอง`}
                    {unit === "carton" && `${quantity} คาตั้น = ${BOXES_PER_CARTON * quantity} กล่อง = ${PACKS_PER_BOX * BOXES_PER_CARTON * quantity} ซอง`}
                  </p>
                </div>
                <div className="border-t border-border bg-muted/20 px-3 py-2.5">
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                    {detail.dropRates
                      .filter((dr) => (dr.avgPerBox ?? 0) > 0 || (dr.ratePerPack ?? 0) > 0)
                      .sort((a, b) => tierSort(a.rarity, b.rarity))
                      .map((dr) => {
                        const count =
                          unit === "pack"
                            ? (dr.ratePerPack ?? 0) * quantity
                            : unit === "box"
                              ? (dr.avgPerBox ?? 0) * quantity
                              : (dr.avgPerBox ?? 0) * BOXES_PER_CARTON * quantity
                        if (count <= 0) return null
                        return (
                          <span key={dr.rarity} className="inline-flex items-center gap-1">
                            <RarityBadge rarity={dr.rarity} size="sm" />
                            <span className="font-mono font-bold tabular-nums">
                              ~{count >= 10 ? Math.round(count) : count.toFixed(1)}
                            </span>
                          </span>
                        )
                      })}
                  </div>
                </div>
              </section>

              {/* Want List */}
              <section className="panel p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">
                    รายการที่อยากได้
                    {wantCards.length > 0 && (
                      <span className="ml-1 text-primary">({wantCards.length})</span>
                    )}
                  </h2>
                  {wantCards.length > 0 && (
                    <button
                      onClick={() => setWantList(new Set())}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      ล้างทั้งหมด
                    </button>
                  )}
                </div>
                {wantCards.length === 0 ? (
                  <p className="py-3 text-center text-xs text-muted-foreground">
                    กดเลือกการ์ดจากฝั่งซ้าย
                  </p>
                ) : (
                  <>
                    <div className="max-h-[300px] space-y-1 overflow-y-auto">
                      {wantResults.map(({ card, chance }) => {
                        const name = getCardName(lang, card as never)
                        return (
                          <div
                            key={card.id}
                            className="flex items-center gap-2 rounded-md py-1.5 px-1 transition-colors hover:bg-muted/40"
                          >
                            <div className="relative size-8 shrink-0 overflow-hidden rounded bg-muted">
                              {card.imageUrl && (
                                <Image src={card.imageUrl} alt={name} fill className="object-contain" sizes="32px" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium leading-tight">{name}</p>
                              <span className="text-[10px] text-muted-foreground">
                                {card.rarity}
                                {card.latestPriceJpy != null && <> · <Price jpy={card.latestPriceJpy} /></>}
                              </span>
                            </div>
                            <span className={cn(
                              "shrink-0 font-mono text-xs font-bold",
                              chance >= 0.5 ? "text-emerald-500" : chance >= 0.1 ? "text-amber-500" : "text-destructive"
                            )}>
                              {formatPct(chance)}
                            </span>
                            <button onClick={() => toggleWant(card.id)} className="shrink-0 text-muted-foreground/40 hover:text-foreground">
                              <X className="size-3" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                    <div className="space-y-1 border-t border-border pt-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">โอกาสได้ครบทุกใบ</span>
                        <span className={cn(
                          "font-mono font-bold text-sm",
                          allChance >= 0.5 ? "text-emerald-500" : allChance >= 0.1 ? "text-amber-500" : "text-destructive"
                        )}>
                          {formatPct(allChance)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">มูลค่ารวมการ์ดที่เลือก</span>
                        <span className="font-price font-bold text-sm"><Price jpy={totalWantValue} /></span>
                      </div>
                      {purchaseCost != null && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">ต้นทุนซื้อ ({quantity} {UNIT_LABELS[unit]})</span>
                          <span className="font-price font-bold text-sm"><Price jpy={purchaseCost} /></span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </section>
            </>
          ) : (
            <EmptyStateSidebar />
          )}
        </div>

        {/* ======== CARD PICKER — row 2 left ======== */}
        {detail && !loading && (
          <section className="panel min-w-0 p-4 space-y-3 lg:col-start-1">
            <h2 className="text-sm font-semibold">เลือกการ์ดที่อยากได้</h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="ค้นหาชื่อหรือรหัส..."
                  value={cardSearch}
                  onChange={(e) => setCardSearch(e.target.value)}
                  className="h-8 w-full rounded-lg border-0 bg-muted/60 pl-8 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:bg-muted focus:ring-1 focus:ring-border"
                />
              </div>
              <select
                value={rarityFilter}
                onChange={(e) => setRarityFilter(e.target.value)}
                className="h-8 rounded-lg border border-border bg-background px-2 text-sm outline-none"
              >
                <option value="all">ทุก Rarity</option>
                {uniqueRarities.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5">
              {filteredCards.map((card) => {
                const name = getCardName(lang, card as never)
                const selected = wantList.has(card.id)
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => toggleWant(card.id)}
                    className={cn(
                      "group relative overflow-hidden rounded-lg border transition-all text-left",
                      selected ? "border-primary ring-2 ring-primary/30" : "border-border/50 hover:border-border"
                    )}
                  >
                    <div className="relative aspect-[63/88] bg-muted">
                      {card.imageUrl ? (
                        <Image src={card.imageUrl} alt={name} fill className="object-contain" sizes="120px" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
                      ) : (
                        <div className="flex size-full items-center justify-center text-xs text-muted-foreground">No Image</div>
                      )}
                      {selected && (
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                          <Check className="size-6 text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="p-1.5">
                      <p className="truncate text-xs font-medium leading-tight">{name}</p>
                      <div className="mt-0.5 flex items-center justify-between">
                        <RarityBadge rarity={card.rarity} size="sm" />
                        {card.latestPriceJpy != null && (
                          <span className="font-price text-xs font-medium"><Price jpy={card.latestPriceJpy} /></span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            {filteredCards.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">ไม่พบการ์ด</p>
            )}
          </section>
        )}

        {/* ======== REFERENCES — row 3 left ======== */}
        {detail && !loading && (
          <div className="min-w-0 lg:col-start-1">
            <ReferencesFooter setCode={detail.set.code} />
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function EmptyStateLeft() {
  return (
    <div className="panel flex flex-col items-center justify-center px-6 py-16 text-center">
      <Package className="mb-4 size-12 text-muted-foreground/30" />
      <h2 className="text-base font-semibold">เลือกชุดการ์ดเพื่อเริ่มต้น</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground leading-relaxed">
        เลือกชุด Booster จาก dropdown ด้านบน แล้วระบบจะแสดงรายการการ์ดให้เลือกคำนวณโอกาส
      </p>
      <div className="mt-6 flex items-center gap-6 text-xs text-muted-foreground/60">
        <span className="flex items-center gap-1.5"><span className="flex size-5 items-center justify-center rounded-full bg-muted font-bold text-[10px]">1</span> เลือกชุด</span>
        <span className="flex items-center gap-1.5"><span className="flex size-5 items-center justify-center rounded-full bg-muted font-bold text-[10px]">2</span> เลือกการ์ด</span>
        <span className="flex items-center gap-1.5"><span className="flex size-5 items-center justify-center rounded-full bg-muted font-bold text-[10px]">3</span> ดูโอกาส</span>
      </div>
    </div>
  )
}

function EmptyStateSidebar() {
  return (
    <div className="panel p-4 space-y-3">
      <div className="space-y-1.5 text-xs text-muted-foreground">
        <p className="text-sm font-semibold text-foreground">การตั้งค่าและผลลัพธ์</p>
        <p>เลือกชุดการ์ดก่อน จากนั้นกำหนดจำนวนที่จะซื้อ แล้วเลือกการ์ดที่อยากได้</p>
      </div>
      <div className="rounded-md border border-dashed border-border/60 bg-muted/20 p-3 text-center text-xs text-muted-foreground/50">
        ซอง / กล่อง / คาตั้น
      </div>
      <div className="rounded-md border border-dashed border-border/60 bg-muted/20 p-3 text-center text-xs text-muted-foreground/50">
        รายการที่อยากได้จะแสดงที่นี่
      </div>
    </div>
  )
}

function SourceBadge({ type }: { type: "official" | "community" }) {
  if (type === "official") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <ShieldCheck className="size-3" />
        ข้อมูลจากบันได
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
      <AlertTriangle className="size-3" />
      ข้อมูลจากชุมชน
    </span>
  )
}

function SetInfoPanel({ detail, lang }: { detail: SetDetail; lang: string }) {
  const [open, setOpen] = useState(false)
  const s = detail.set
  const name =
    lang === "EN" ? (s.nameEn ?? s.name) : lang === "TH" ? (s.nameTh ?? s.name) : s.name
  const sortedCounts = [...detail.rarityCounts].sort((a, b) =>
    tierSort(a.rarity, b.rarity)
  )
  const totalCards = detail.rarityCounts.reduce(
    (sum, rc) => sum + rc.normal + rc.parallel,
    0
  )

  return (
    <section className="panel overflow-hidden">
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
      >
        {s.boxImageUrl && (
          <div className="relative size-10 shrink-0 overflow-hidden rounded bg-muted">
            <Image src={s.boxImageUrl} alt={name} fill className="object-contain" sizes="40px" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{s.code} — {name}</p>
          <p className="text-xs text-muted-foreground">
            {totalCards} การ์ด · {CARDS_PER_PACK_JP} ใบ/ซอง · {PACKS_PER_BOX} ซอง/กล่อง
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="size-3.5" />
          <span className="hidden sm:inline">{open ? "ซ่อนข้อมูลชุด" : "ดูข้อมูลชุด"}</span>
          {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </div>
      </button>

      {/* Collapsible body */}
      {open && (
        <div className="border-t border-border">
          {/* Rarity counts — compact table-like row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border/50 bg-muted/20 px-4 py-2.5 text-xs">
            {sortedCounts.map((rc) => (
              <span key={rc.rarity} className="inline-flex items-center gap-1">
                <RarityBadge rarity={rc.rarity} size="sm" />
                <span className="font-mono font-bold">{rc.normal}</span>
                {rc.parallel > 0 && (
                  <span className="text-muted-foreground/60">+{rc.parallel}P</span>
                )}
              </span>
            ))}
          </div>

          <div className="px-4 py-3 space-y-3 text-xs">
            {/* Set meta */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
              {s.releaseDate && (
                <span>{new Date(s.releaseDate).toLocaleDateString("th-TH")}</span>
              )}
              {s.msrpJpy && <span>¥{s.msrpJpy}/ซอง</span>}
              <a
                href={officialProductUrl(s.code)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                Official <ExternalLink className="size-3" />
              </a>
            </div>

            {/* Box Guarantee — single compact row */}
            <div>
              <p className="mb-1.5 font-semibold text-foreground">การันตีต่อกล่อง</p>
              <div className="grid grid-cols-3 gap-1.5">
                {BOX_PATTERNS.map((pattern) => (
                  <div key={pattern.name} className="rounded border border-border/40 bg-muted/20 px-2 py-1.5 text-center">
                    <span className="font-mono font-bold text-primary">{Math.round(pattern.prob * 100)}%</span>
                    <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight">
                      SR {pattern.sr}
                      {pattern.sec > 0 && <> · <span className="text-amber-500">SEC {pattern.sec}</span></>}
                      {pattern.parallel > 0 && <> · <span className="text-purple-500">P {pattern.parallel}</span></>}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                การันตี SR 3+/กล่อง · SEC/Parallel อย่างน้อย 1 ใบ
              </p>
            </div>

            {/* Carton Estimate — inline */}
            <div>
              <p className="mb-1 font-semibold text-foreground">ต่อคาตั้น (12 กล่อง)</p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground">
                {[
                  { label: "SEC", value: CARTON_ESTIMATES.sec, color: "text-amber-500" },
                  { label: "SR", value: CARTON_ESTIMATES.sr, color: "text-purple-500" },
                  { label: "Parallel", value: CARTON_ESTIMATES.parallel, color: "text-sky-500" },
                  { label: "L-P", value: CARTON_ESTIMATES.leaderParallel, color: "text-red-500" },
                  { label: "SP", value: CARTON_ESTIMATES.sp, color: "text-pink-500" },
                ].map((item) => (
                  <span key={item.label}>
                    <span className={cn("font-mono font-bold", item.color)}>~{item.value}</span>{" "}
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}


function ReferencesFooter({ setCode }: { setCode: string }) {
  return (
    <section className="panel p-4 space-y-3">
      <h2 className="text-sm font-semibold">แหล่งอ้างอิง</h2>
      <div className="space-y-2 text-xs text-muted-foreground">
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
          <div>
            <span className="font-medium text-foreground">ข้อมูลจำนวนการ์ดอ้างอิงจาก</span>{" "}
            <a
              href={officialProductUrl(setCode)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              ONE PIECE CARD GAME Official
              <ExternalLink className="ml-0.5 inline size-3" />
            </a>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
          <div>
            <span className="font-medium text-foreground">ข้อมูล Pull Rate อ้างอิงจาก:</span>
            <ul className="mt-1 space-y-0.5">
              {COMMUNITY_SOURCES.map((src) => (
                <li key={src.name}>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {src.name}
                  </a>
                  {" "}— {src.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="rounded-md bg-amber-500/5 px-2 py-1.5 text-amber-600 dark:text-amber-400">
          Pull Rate เป็นข้อมูลประมาณการจากชุมชน ไม่ใช่ข้อมูลทางการจาก Bandai
          ผลลัพธ์อาจแตกต่างจากการเปิดจริง
        </p>
      </div>
    </section>
  )
}
