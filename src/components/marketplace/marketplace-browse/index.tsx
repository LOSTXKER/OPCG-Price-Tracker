"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { AlertCircle } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { LoadingState } from "@/components/shared/loading-state"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { apiGet } from "@/lib/api/client"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { formatCount } from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"

import { BrowseGrid } from "./browse-grid"
import { BrowseList } from "./browse-list"
import { BrowseToolbar } from "./browse-toolbar"
import { SellerLockBanner } from "./seller-lock-banner"
import type {
  BrowseResponse,
  LockedSeller,
  MarketplaceBrowseListing,
} from "./types"

export type { LockedSeller, MarketplaceBrowseListing } from "./types"

export function MarketplaceBrowse({
  initialListings,
  initialTotal,
  initialPage,
  pageSize,
  initialSearch = "",
  initialCardCode = "",
  initialCondition = null,
  initialRarities = [],
  initialVariants = [],
  initialSort = "newest",
  lockedSeller = null,
}: {
  initialListings: MarketplaceBrowseListing[]
  initialTotal: number
  initialPage: number
  pageSize: number
  initialSearch?: string
  initialCardCode?: string
  initialCondition?: string | null
  initialRarities?: string[]
  initialVariants?: string[]
  initialSort?: string
  lockedSeller?: LockedSeller
}) {
  const lang = useUIStore((s) => s.language)
  const [listings, setListings] = useState(initialListings)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(initialPage)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const skipNextFetch = useRef(true)
  const activeRequest = useRef<AbortController | null>(null)

  const [search, setSearch] = useState(initialSearch)
  const [appliedSearch, setAppliedSearch] = useState(
    initialCardCode ? "" : initialSearch,
  )
  const [exactCardCode, setExactCardCode] = useState(initialCardCode)
  const [condition, setCondition] = useState<string | null>(initialCondition)
  const [rarities, setRarities] = useState<string[]>(initialRarities)
  const [variants, setVariants] = useState<string[]>(initialVariants)
  const [sort, setSort] = useState(initialSort)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  // Facet filters live in the FilterModal. Condition is intentionally a single
  // value because /api/listings accepts one `condition`; rarity remains a
  // multi-value facet and is handled as `{ in: [...] }` server-side.
  const buildParams = useCallback(
    (pageNum: number) => {
      const params = new URLSearchParams()
      params.set("page", String(pageNum))
      params.set("limit", String(pageSize))
      if (sort !== "newest") params.set("sort", sort)
      if (condition) params.set("condition", condition)
      // Rarity is BASE-only; the server expands each to its P- family. The
      // version facet (ปกติ/พาราเลล) narrows regular vs parallel via `variant` —
      // single-value, so we only send it when exactly one version is chosen
      // (picking both = no narrowing, same as none).
      if (rarities.length > 0) params.set("rarity", rarities.join(","))
      if (variants.length === 1) params.set("variant", variants[0]!)
      if (exactCardCode) params.set("cardCode", exactCardCode)
      else if (appliedSearch) params.set("q", appliedSearch)
      // When deep-linked from a public profile, we keep all subsequent
      // pagination/filter requests scoped to that seller.
      if (lockedSeller) params.set("seller", lockedSeller.id)
      return params
    },
    [
      pageSize,
      sort,
      condition,
      rarities,
      variants,
      exactCardCode,
      appliedSearch,
      lockedSeller,
    ],
  )

  const fetchPage = useCallback(
    async (pageNum: number, signal: AbortSignal) => {
      const params = buildParams(pageNum)
      return apiGet<BrowseResponse>(`/api/listings?${params.toString()}`, signal)
    },
    [buildParams],
  )

  const loadPage = useCallback((pageNum: number) => {
    activeRequest.current?.abort()
    const controller = new AbortController()
    activeRequest.current = controller
    setIsPending(true)
    setError(null)

    void fetchPage(pageNum, controller.signal)
      .then((data) => {
        if (activeRequest.current !== controller) return
        setListings(data.listings)
        setTotal(data.total)
      })
      .catch(() => {
        if (controller.signal.aborted || activeRequest.current !== controller) return
        // Read lang imperatively so changing language does not refetch data.
        setError(t(useUIStore.getState().language, "marketplaceUnavailableDesc"))
      })
      .finally(() => {
        if (activeRequest.current !== controller) return
        activeRequest.current = null
        setIsPending(false)
      })
  }, [fetchPage])

  useEffect(() => () => activeRequest.current?.abort(), [])

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false
      return
    }
    const timeoutId = window.setTimeout(() => loadPage(page), 0)
    return () => window.clearTimeout(timeoutId)
  }, [page, loadPage])

  useEffect(() => {
    const url = new URL(window.location.href)
    const setOrDelete = (key: string, value: string) => {
      if (value) url.searchParams.set(key, value)
      else url.searchParams.delete(key)
    }

    setOrDelete("cardCode", exactCardCode)
    setOrDelete("q", exactCardCode ? "" : appliedSearch)
    setOrDelete("condition", condition ?? "")
    setOrDelete("rarity", rarities.join(","))
    setOrDelete("variant", variants.join(","))
    setOrDelete("sort", sort === "newest" ? "" : sort)
    setOrDelete("page", page > 1 ? String(page) : "")
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`)
  }, [appliedSearch, condition, exactCardCode, page, rarities, sort, variants])

  const handleSearch = useCallback(() => {
    const nextSearch = search.trim()
    const nextExactCardCode =
      initialCardCode && nextSearch.toUpperCase() === initialCardCode.toUpperCase()
        ? initialCardCode
        : ""
    const nextAppliedSearch = nextExactCardCode ? "" : nextSearch

    if (
      page === 1 &&
      exactCardCode === nextExactCardCode &&
      appliedSearch === nextAppliedSearch
    ) {
      loadPage(1)
      return
    }
    setExactCardCode(nextExactCardCode)
    setAppliedSearch(nextAppliedSearch)
    setPage(1)
  }, [appliedSearch, exactCardCode, initialCardCode, loadPage, page, search])

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    if (value !== "" || (!appliedSearch && !exactCardCode)) return

    setAppliedSearch("")
    setExactCardCode("")
    setPage(1)
  }, [appliedSearch, exactCardCode])

  const handleClearBrowse = useCallback(() => {
    setSearch("")
    setAppliedSearch("")
    setExactCardCode("")
    setCondition(null)
    setRarities([])
    setVariants([])
    setPage(1)
  }, [])

  const handleRetry = useCallback(() => {
    loadPage(page)
  }, [loadPage, page])

  const hasActiveBrowseFilter = Boolean(
    exactCardCode || appliedSearch || condition || rarities.length > 0 || variants.length > 0,
  )

  return (
    <div className="space-y-4">
      {lockedSeller && <SellerLockBanner seller={lockedSeller} />}

      <BrowseToolbar
        search={search}
        onSearchChange={handleSearchChange}
        onSubmit={handleSearch}
        sort={sort}
        onSortChange={(v) => {
          setSort(v)
          setPage(1)
        }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        condition={condition}
        onConditionChange={(v) => {
          setCondition(v)
          setPage(1)
        }}
        rarities={rarities}
        onRaritiesChange={(v) => {
          setRarities(v)
          setPage(1)
        }}
        variants={variants}
        onVariantsChange={(v) => {
          setVariants(v)
          setPage(1)
        }}
      />

      <div className="flex items-center gap-2 text-meta">
        <span>{t(lang, "mktBrowseItemCount").replace("{n}", formatCount(total))}</span>
        {condition && (
          <>
            <span>·</span>
            <span>{condition}</span>
          </>
        )}
        {rarities.length > 0 && (
          <>
            <span>·</span>
            <span>{rarities.join(", ")}</span>
          </>
        )}
        {variants.length > 0 && (
          <>
            <span>·</span>
            <span>{variants.map((v) => t(lang, v as "regular" | "parallel")).join(", ")}</span>
          </>
        )}
      </div>

      {error ? (
        <EmptyState
          variant="error"
          icon={AlertCircle}
          title={t(lang, "marketplaceUnavailable")}
          description={error}
          action={
            <Button type="button" variant="outline" onClick={handleRetry} disabled={isPending}>
              {t(lang, "retry")}
            </Button>
          }
        />
      ) : (
        <div
          aria-busy={isPending}
          className={cn(isPending && listings.length > 0 && "pointer-events-none opacity-50 transition-opacity")}
        >
          {isPending && listings.length === 0 ? (
            <LoadingState
              variant={viewMode === "grid" ? "skeleton-grid" : "skeleton-list"}
              count={viewMode === "grid" ? 8 : 5}
              label={t(lang, "loading")}
            />
          ) : listings.length === 0 ? (
            <EmptyState
              mascot="kuma"
              lang={lang}
              title={
                hasActiveBrowseFilter
                  ? t(lang, "mktEmptyFilteredTitle")
                  : lockedSeller
                    ? t(lang, "mktEmptySellerTitle")
                    : t(lang, "mktEmptyMarketplaceTitle")
              }
              description={
                hasActiveBrowseFilter
                  ? t(lang, "mktEmptyFilteredDesc")
                  : lockedSeller
                    ? t(lang, "mktEmptySellerDesc")
                    : t(lang, "mktEmptyMarketplaceDesc")
              }
              action={
                hasActiveBrowseFilter ? (
                  <Button type="button" variant="outline" onClick={handleClearBrowse}>
                    {t(lang, "mktFilterClear")}
                  </Button>
                ) : lockedSeller ? (
                  <Button variant="outline" render={<Link href="/marketplace" />}>
                    {t(lang, "mktLockViewAll")}
                  </Button>
                ) : (
                  <Button render={<Link href="/marketplace/create" />}>
                    {t(lang, "listCard")}
                  </Button>
                )
              }
            />
          ) : viewMode === "grid" ? (
            <BrowseGrid listings={listings} />
          ) : (
            <BrowseList listings={listings} />
          )}
        </div>
      )}

      {!error && totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || isPending}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t(lang, "prev")}
          </Button>
          <span className="text-muted-foreground text-sm tabular-nums">
            {t(lang, "pageOf")} {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages || isPending}
            onClick={() => setPage((p) => p + 1)}
          >
            {t(lang, "next")}
          </Button>
        </div>
      )}
    </div>
  )
}

export function MarketplacePageHeader() {
  const lang = useUIStore((s) => s.language)
  return (
    <PageHeader
      title={t(lang, "marketplace")}
      description={t(lang, "marketplaceDesc")}
    />
  )
}
