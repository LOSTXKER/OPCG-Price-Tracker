"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { ApiError, apiGet } from "@/lib/api/client"
import { buildCardsUrl } from "@/lib/api/fetch-cards"
import { useSparklines } from "@/hooks/use-sparklines"
import {
  type TabId,
  type Tab,
  type SortKey,
  type PriceMode,
  type ViewMode,
  type ChangePeriod,
  type ColumnId,
  type CardRow,
  type ApiResponse,
  COLUMN_SORTS,
  parseSortColumn,
  PAGE_SIZE,
} from "@/components/home/market-types"

export type UseMarketCardsOptions = {
  initialCards: CardRow[]
  initialTotal: number
  initialTotalPages: number
  tabs: Tab[]
  initialSearch?: string
}

export function useMarketCards({
  initialCards,
  initialTotal,
  initialTotalPages,
  tabs,
  initialSearch,
}: UseMarketCardsOptions) {
  const [activeTab, setActiveTab] = useState<TabId>("all")
  const [sort, setSort] = useState<SortKey>("price_desc")
  const [page, setPage] = useState(1)
  const [cards, setCards] = useState<CardRow[]>(initialCards)
  const [total, setTotal] = useState(initialTotal)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState(initialSearch ?? "")
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const sparklines = useSparklines(cards)
  const [changePeriod, setChangePeriod] = useState<ChangePeriod>("7d")
  const [priceMode, setPriceMode] = useState<PriceMode>("raw")
  const [filterOpen, setFilterOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isInitialMount = useRef(true)
  const fetchAbortRef = useRef<AbortController | null>(null)
  const tabsRef = useRef(tabs)
  useEffect(() => {
    tabsRef.current = tabs
  }, [tabs])
  const initialSearchRef = useRef(initialSearch)

  useEffect(() => {
    const t = setTimeout(() => setSearch(initialSearch ?? ""), 0)
    return () => clearTimeout(t)
  }, [initialSearch])

  const fetchCards = useCallback(
    (tab: TabId, sortKey: SortKey, pg: number, q: string, f: Record<string, string[]>, pMin: string, pMax: string, mode: PriceMode = "raw") => {
      const tabDef = tabsRef.current.find((t) => t.id === tab) ?? tabsRef.current[0]
      const minP = parseInt(pMin)
      const maxP = parseInt(pMax)
      const filterParams: Record<string, string> = {}
      for (const [key, values] of Object.entries(f)) {
        if (values.length > 0) filterParams[key] = values.join(",")
      }

      const url = buildCardsUrl({
        sort: sortKey,
        page: pg,
        limit: PAGE_SIZE,
        search: q.trim() || undefined,
        minPrice: minP > 0 ? minP : undefined,
        maxPrice: maxP > 0 ? maxP : undefined,
        priceMode: mode === "psa10" ? "psa10" : undefined,
        ...tabDef.extraParams,
        ...filterParams,
      })

      fetchAbortRef.current?.abort()
      const controller = new AbortController()
      fetchAbortRef.current = controller

      startTransition(async () => {
        try {
          const data = await apiGet<ApiResponse>(url, controller.signal)
          setError(null)
          setCards(
            data.cards.map((c) => ({
              ...c,
              setCode: c.set?.code ?? c.setCode ?? "",
            }))
          )
          setTotal(data.total)
          setTotalPages(data.totalPages)
        } catch (e) {
          if (e instanceof Error && e.name === "AbortError") return
          setError(e instanceof ApiError ? `Failed to load cards (${e.status})` : "Failed to load cards")
        }
      })
    },
    []
  )

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      if (!initialSearchRef.current && priceMode === "raw") return
    }
    fetchCards(activeTab, sort, page, search, filters, minPrice, maxPrice, priceMode)
  }, [activeTab, sort, page, search, filters, minPrice, maxPrice, priceMode, fetchCards])

  const handleTabChange = (tab: TabId) => {
    const tabDef = tabs.find((t) => t.id === tab) ?? tabs[0]
    setActiveTab(tab)
    setSort(tabDef.defaultSort)
    setPage(1)
  }

  const handleColumnSort = (col: ColumnId) => {
    const current = parseSortColumn(sort)
    if (current.col === col) {
      setSort(COLUMN_SORTS[col][current.dir === "desc" ? "asc" : "desc"])
    } else {
      setSort(COLUMN_SORTS[col].desc)
    }
    setPage(1)
  }

  const handleFilterChange = (key: string, values: string[]) => {
    setFilters((prev) => ({ ...prev, [key]: values }))
    setPage(1)
  }

  const activeFilterCount =
    Object.entries(filters).reduce((sum, [key, v]) => sum + (key === "set" ? 0 : v.length), 0) +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0)

  const clearAllFilters = () => {
    setSearch("")
    setFilters({})
    setMinPrice("")
    setMaxPrice("")
    setPage(1)
  }

  const { col: sortCol, dir: sortDir } = parseSortColumn(sort)

  return {
    activeTab,
    sort,
    page,
    cards,
    total,
    totalPages,
    isPending,
    error,
    search,
    filters,
    viewMode,
    minPrice,
    maxPrice,
    sparklines,
    changePeriod,
    priceMode,
    filterOpen,
    sortCol,
    sortDir,
    activeFilterCount,
    showViews: activeTab === "popular",
    setSearch,
    setPage,
    setViewMode,
    setMinPrice,
    setMaxPrice,
    setChangePeriod,
    setPriceMode,
    setFilterOpen,
    handleTabChange,
    handleColumnSort,
    handleFilterChange,
    clearAllFilters,
  }
}
