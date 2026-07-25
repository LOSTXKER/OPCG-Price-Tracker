"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { type FormEvent, useCallback, useEffect, useRef, useState, useTransition } from "react"

import { fetchCards } from "@/lib/api/fetch-cards"
import {
  countAllSearchFilters,
  countSearchModalFilters,
  createEmptySearchFilters,
  resetSearchModalFilters,
  serializeSearchFilters,
  toggleSearchMultiFilter,
  type CardSearchFacets,
  type SearchFilters,
  type SearchMultiFilterKey,
  type SearchVariant,
} from "@/lib/cards/search-filters"
import { ALL_GAMES } from "@/lib/game/constants"
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
import {
  isRawGrade,
  type GradeKey,
} from "@/lib/pricing/grade-tiers"

/**
 * Owns all of /search's query state and data fetching: the debounced URL-driven
 * search, sort/filter/pagination handlers, abortable fetches, and the derived
 * sort column + active-filter count. The view stays a pure render of this.
 */
export function useSearch(game: string) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const routeQuery = searchParams.get("q") ?? ""

  const [query, setQuery] = useState(routeQuery)
  const [inputValue, setInputValue] = useState(routeQuery)
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
  const [grade, setGrade] = useState<GradeKey>("raw")
  const [filters, setFilters] = useState<SearchFilters>(createEmptySearchFilters)
  const [facets, setFacets] = useState<CardSearchFacets | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fetchAbortRef = useRef<AbortController | null>(null)
  const sortRef = useRef(sort)
  const gradeRef = useRef<GradeKey>(grade)
  const filtersRef = useRef(filters)
  const facetsRef = useRef<CardSearchFacets | null>(null)

  const replaceFilters = useCallback((next: SearchFilters) => {
    filtersRef.current = next
    setFilters(next)
  }, [])

  const replaceFacets = useCallback((next: CardSearchFacets | null) => {
    facetsRef.current = next
    setFacets(next)
  }, [])

  useEffect(() => {
    sortRef.current = sort
  }, [sort])

  const fetchResults = useCallback(
    (
      q: string,
      sortKey: SortKey,
      pg: number,
      activeFilters: SearchFilters,
      includeFacets = facetsRef.current === null,
      selectedGrade = gradeRef.current,
    ) => {
      fetchAbortRef.current?.abort()
      if (!q.trim()) {
        fetchAbortRef.current = null
        setCards([])
        setTotal(0)
        setTotalPages(0)
        setHasSearched(false)
        replaceFacets(null)
        return
      }
      const controller = new AbortController()
      fetchAbortRef.current = controller
      const serializedFilters = serializeSearchFilters(activeFilters)

      startTransition(async () => {
        try {
          setFetchError(false)
          const data = await fetchCards(
            {
              search: q.trim(),
              sort: sortKey,
              page: pg,
              limit: PAGE_SIZE,
              game: game === ALL_GAMES ? undefined : game,
              ...serializedFilters,
              includeFacets,
              grade: isRawGrade(selectedGrade) ? undefined : selectedGrade,
            },
            { signal: controller.signal },
          )
          if (controller.signal.aborted || fetchAbortRef.current !== controller) return
          setCards(data.cards as CardRow[])
          setTotal(data.total ?? 0)
          setTotalPages(data.totalPages ?? 0)
          if (data.facets) replaceFacets(data.facets)
          setHasSearched(true)
        } catch (e) {
          if (
            controller.signal.aborted
            || fetchAbortRef.current !== controller
            || (e instanceof Error && e.name === "AbortError")
          ) return
          console.error("Search fetch failed:", e)
          setFetchError(true)
        }
      })
    },
    [game, replaceFacets],
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      const nextFilters = createEmptySearchFilters()
      setQuery(routeQuery)
      setInputValue(routeQuery)
      setPage(1)
      setCards([])
      setTotal(0)
      setTotalPages(0)
      setHasSearched(false)
      setFetchError(false)
      replaceFacets(null)
      replaceFilters(nextFilters)
      fetchResults(routeQuery, sortRef.current, 1, nextFilters, true)
    }, 0)
    return () => clearTimeout(timer)
  }, [routeQuery, fetchResults, replaceFacets, replaceFilters])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => () => fetchAbortRef.current?.abort(), [])

  const commitFilters = useCallback((nextFilters: SearchFilters) => {
    replaceFilters(nextFilters)
    setPage(1)
    fetchResults(query, sort, 1, nextFilters)
  }, [fetchResults, query, replaceFilters, sort])

  const refetch = useCallback(() => {
    fetchResults(query, sort, page, filtersRef.current)
  }, [fetchResults, page, query, sort])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = inputValue.trim()
    if (!trimmed) return
    router.push(`/${game}/search?q=${encodeURIComponent(trimmed)}`)
  }

  const handleSortChange = (newSort: SortKey) => {
    const column = parseSortColumn(newSort).col
    if (
      !isRawGrade(gradeRef.current) &&
      (column === "price" || (column && column.startsWith("change")))
    ) {
      return
    }
    setSort(newSort)
    sortRef.current = newSort
    setPage(1)
    fetchResults(query, newSort, 1, filtersRef.current)
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
    fetchResults(query, sort, newPage, filtersRef.current)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSetChange = (v: string) => {
    commitFilters({ ...filtersRef.current, set: v })
  }

  const handleMultiFilterToggle = (key: SearchMultiFilterKey, value: string) => {
    commitFilters(toggleSearchMultiFilter(filtersRef.current, key, value))
  }

  const handleVariantChange = (variant: SearchVariant) => {
    commitFilters({ ...filtersRef.current, variant })
  }

  const handlePriceChange = (key: "minPrice" | "maxPrice", value: string) => {
    commitFilters({ ...filtersRef.current, [key]: value })
  }

  const resetModalFilters = () => {
    commitFilters(resetSearchModalFilters(filtersRef.current))
  }

  const clearFilters = () => {
    commitFilters(createEmptySearchFilters())
  }

  const clearInput = () => {
    setInputValue("")
    inputRef.current?.focus()
  }

  const handleGradeChange = (nextGrade: GradeKey) => {
    gradeRef.current = nextGrade
    setGrade(nextGrade)
    setPage(1)

    let nextFilters = filtersRef.current
    let nextSort = sortRef.current
    if (!isRawGrade(nextGrade)) {
      // Price ranges and price/change sorting are currently backed by Raw
      // scalar columns. Never carry those constraints into a graded lens.
      nextFilters = { ...nextFilters, minPrice: "", maxPrice: "" }
      const column = parseSortColumn(nextSort).col
      if (column === "price" || (column && column.startsWith("change"))) {
        nextSort = "newest"
      }
    }

    replaceFilters(nextFilters)
    sortRef.current = nextSort
    setSort(nextSort)
    fetchResults(query, nextSort, 1, nextFilters, false, nextGrade)
  }

  const { col: sortCol, dir: sortDir } = parseSortColumn(sort)
  const modalFilterCount = countSearchModalFilters(filters)
  const activeFilterCount = countAllSearchFilters(filters)

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
    grade,
    filters,
    facets,
    inputRef,
    sortCol,
    sortDir,
    sparklines,
    modalFilterCount,
    activeFilterCount,
    handleSubmit,
    handleSortChange,
    handleColumnSort,
    handlePageChange,
    handleSetChange,
    handleMultiFilterToggle,
    handleVariantChange,
    handlePriceChange,
    handleGradeChange,
    resetModalFilters,
    refetch,
    clearFilters,
    clearInput,
  }
}
