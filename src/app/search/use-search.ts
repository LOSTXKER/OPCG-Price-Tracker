"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { type FormEvent, useCallback, useEffect, useRef, useState, useTransition } from "react"

import { fetchCards } from "@/lib/api/fetch-cards"
import {
  type SortKey,
  type ColumnId,
  type ViewMode,
  type ChangePeriod,
  type CardRow,
  COLUMN_SORTS,
  parseSortColumn,
  PAGE_SIZE,
} from "@/components/home/market-types"
import { useSparklines } from "@/hooks/use-sparklines"

/**
 * Owns all of /search's query state and data fetching: the debounced URL-driven
 * search, sort/filter/pagination handlers, abortable fetches, and the derived
 * sort column + active-filter count. The view stays a pure render of this.
 */
export function useSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialQuery = searchParams.get("q") ?? ""
  const [query, setQuery] = useState(initialQuery)
  const [inputValue, setInputValue] = useState(initialQuery)
  const [sort, setSort] = useState<SortKey>("price_desc")
  const [page, setPage] = useState(1)
  const [cards, setCards] = useState<CardRow[]>([])
  const sparklines = useSparklines(cards)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [hasSearched, setHasSearched] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [changePeriod, setChangePeriod] = useState<ChangePeriod>("7d")
  const [selectedSet, setSelectedSet] = useState("")
  const [selectedRarity, setSelectedRarity] = useState("")
  // Version facet — "regular" | "parallel" | "" (both). Passed as `variant` to
  // /api/cards; the server picks the isParallel side. Base rarity (e.g. SEC)
  // already expands to its P- family server-side, so no client expansion here.
  const [selectedVariant, setSelectedVariant] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const fetchAbortRef = useRef<AbortController | null>(null)
  const sortRef = useRef(sort)
  const setRef = useRef(selectedSet)
  const rarityRef = useRef(selectedRarity)
  const variantRef = useRef(selectedVariant)
  useEffect(() => {
    sortRef.current = sort
    setRef.current = selectedSet
    rarityRef.current = selectedRarity
    variantRef.current = selectedVariant
  }, [sort, selectedSet, selectedRarity, selectedVariant])

  const fetchResults = useCallback(
    (
      q: string,
      sortKey: SortKey,
      pg: number,
      filterSet?: string,
      filterRarity?: string,
      filterVariant?: string,
    ) => {
      if (!q.trim()) {
        setCards([])
        setTotal(0)
        setTotalPages(0)
        return
      }
      fetchAbortRef.current?.abort()
      const controller = new AbortController()
      fetchAbortRef.current = controller

      startTransition(async () => {
        try {
          setFetchError(false)
          const data = await fetchCards(
            {
              search: q.trim(),
              sort: sortKey,
              page: pg,
              limit: PAGE_SIZE,
              set: filterSet || undefined,
              rarity: filterRarity || undefined,
              variant: filterVariant || undefined,
            },
            { signal: controller.signal },
          )
          setCards(data.cards as CardRow[])
          setTotal(data.total ?? 0)
          setTotalPages(data.totalPages ?? 0)
          setHasSearched(true)
        } catch (e) {
          if (e instanceof Error && e.name === "AbortError") return
          console.error("Search fetch failed:", e)
          setFetchError(true)
        }
      })
    },
    [],
  )

  useEffect(() => {
    const q = searchParams.get("q") ?? ""
    const timer = setTimeout(() => {
      setQuery(q)
      setInputValue(q)
      setPage(1)
      if (q.trim())
        fetchResults(
          q,
          sortRef.current,
          1,
          setRef.current,
          rarityRef.current,
          variantRef.current,
        )
    }, 0)
    return () => clearTimeout(timer)
  }, [searchParams, fetchResults])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const refetch = useCallback(
    (overrides?: {
      sort?: SortKey
      page?: number
      set?: string
      rarity?: string
      variant?: string
    }) => {
      const s = overrides?.sort ?? sort
      const p = overrides?.page ?? 1
      const st = overrides?.set ?? selectedSet
      const r = overrides?.rarity ?? selectedRarity
      const v = overrides?.variant ?? selectedVariant
      fetchResults(query, s, p, st, r, v)
    },
    [query, sort, selectedSet, selectedRarity, selectedVariant, fetchResults],
  )

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = inputValue.trim()
    if (!trimmed) return
    router.push(`/opcg/search?q=${encodeURIComponent(trimmed)}`)
  }

  const handleSortChange = (newSort: SortKey) => {
    setSort(newSort)
    setPage(1)
    refetch({ sort: newSort, page: 1 })
  }

  const handleColumnSort = (col: ColumnId) => {
    const current = parseSortColumn(sort)
    const newSort = current.col === col
      ? COLUMN_SORTS[col][current.dir === "desc" ? "asc" : "desc"]
      : COLUMN_SORTS[col].desc
    handleSortChange(newSort)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    fetchResults(query, sort, newPage, selectedSet, selectedRarity, selectedVariant)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSetChange = (v: string) => {
    setSelectedSet(v)
    setPage(1)
    refetch({ set: v, page: 1 })
  }

  const handleRarityChange = (v: string) => {
    setSelectedRarity(v)
    setPage(1)
    refetch({ rarity: v, page: 1 })
  }

  const handleVariantChange = (v: string) => {
    setSelectedVariant(v)
    setPage(1)
    refetch({ variant: v, page: 1 })
  }

  const clearFilters = () => {
    setSelectedSet("")
    setSelectedRarity("")
    setSelectedVariant("")
    setPage(1)
    refetch({ set: "", rarity: "", variant: "", page: 1 })
  }

  const clearInput = () => {
    setInputValue("")
    inputRef.current?.focus()
  }

  const { col: sortCol, dir: sortDir } = parseSortColumn(sort)
  const activeFilterCount =
    (selectedSet ? 1 : 0) + (selectedRarity ? 1 : 0) + (selectedVariant ? 1 : 0)

  return {
    query,
    inputValue,
    setInputValue,
    sort,
    page,
    cards,
    total,
    totalPages,
    isPending,
    hasSearched,
    fetchError,
    viewMode,
    setViewMode,
    changePeriod,
    setChangePeriod,
    selectedSet,
    selectedRarity,
    selectedVariant,
    inputRef,
    sortCol,
    sortDir,
    sparklines,
    activeFilterCount,
    handleSubmit,
    handleSortChange,
    handleColumnSort,
    handlePageChange,
    handleSetChange,
    handleRarityChange,
    handleVariantChange,
    refetch,
    clearFilters,
    clearInput,
  }
}
