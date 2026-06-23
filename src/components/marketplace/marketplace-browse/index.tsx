"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"

import { KumaEmptyState } from "@/components/kuma/kuma-empty-state"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { ApiError, apiGet } from "@/lib/api/client"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { formatCount } from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"

import { BrowseFiltersSheet } from "./browse-filters-sheet"
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
  lockedSeller = null,
}: {
  initialListings: MarketplaceBrowseListing[]
  initialTotal: number
  initialPage: number
  pageSize: number
  lockedSeller?: LockedSeller
}) {
  const lang = useUIStore((s) => s.language)
  const [listings, setListings] = useState(initialListings)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(initialPage)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const skipNextFetch = useRef(true)

  const [search, setSearch] = useState("")
  const [conditions, setConditions] = useState<string[]>([])
  const [rarities, setRarities] = useState<string[]>([])
  const [sort, setSort] = useState("newest")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const toggleFilter = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]

  const buildParams = useCallback(
    (pageNum: number) => {
      const params = new URLSearchParams()
      params.set("page", String(pageNum))
      params.set("limit", String(pageSize))
      if (sort !== "newest") params.set("sort", sort)
      if (conditions.length === 1) params.set("condition", conditions[0]!)
      if (rarities.length > 0) params.set("rarity", rarities.join(","))
      if (search.trim()) params.set("q", search.trim())
      // When deep-linked from a public profile, we keep all subsequent
      // pagination/filter requests scoped to that seller.
      if (lockedSeller) params.set("seller", lockedSeller.id)
      return params
    },
    [pageSize, sort, conditions, rarities, search, lockedSeller],
  )

  const fetchPage = useCallback(
    async (pageNum: number) => {
      const params = buildParams(pageNum)
      try {
        return await apiGet<BrowseResponse>(`/api/listings?${params.toString()}`)
      } catch (err) {
        throw new Error(err instanceof ApiError ? err.message : t(useUIStore.getState().language, "loadFailed"))
      }
    },
    [buildParams],
  )

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false
      return
    }
    startTransition(() => {
      void fetchPage(page)
        .then((data) => {
          setListings(data.listings)
          setTotal(data.total)
          setError(null)
        })
        .catch((e: unknown) => {
          // read lang imperatively so the fetch effect doesn't re-run (re-fetch)
          // on every language toggle just for this fallback string
          setError(e instanceof Error ? e.message : t(useUIStore.getState().language, "loadFailed"))
        })
    })
  }, [page, sort, conditions, rarities, fetchPage])

  const handleSearch = useCallback(() => {
    setPage(1)
    skipNextFetch.current = false
    startTransition(() => {
      void fetchPage(1)
        .then((data) => {
          setListings(data.listings)
          setTotal(data.total)
          setError(null)
        })
        .catch((e: unknown) => {
          // read lang imperatively so the fetch effect doesn't re-run (re-fetch)
          // on every language toggle just for this fallback string
          setError(e instanceof Error ? e.message : t(useUIStore.getState().language, "loadFailed"))
        })
    })
  }, [fetchPage])

  return (
    <div className="space-y-4">
      {lockedSeller && <SellerLockBanner seller={lockedSeller} />}

      <BrowseToolbar
        search={search}
        onSearchChange={setSearch}
        onSubmit={handleSearch}
        filterCount={conditions.length + rarities.length}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters((v) => !v)}
        sort={sort}
        onSortChange={(v) => {
          setSort(v)
          setPage(1)
        }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {showFilters && (
        <BrowseFiltersSheet
          conditions={conditions}
          rarities={rarities}
          onToggleCondition={(c) => {
            setConditions((prev) => toggleFilter(prev, c))
            setPage(1)
          }}
          onToggleRarity={(r) => {
            setRarities((prev) => toggleFilter(prev, r))
            setPage(1)
          }}
          onClear={() => {
            setConditions([])
            setRarities([])
            setPage(1)
          }}
        />
      )}

      <div className="flex items-center gap-2 text-meta">
        <span>{t(lang, "mktBrowseItemCount").replace("{n}", formatCount(total))}</span>
        {conditions.length > 0 && (
          <>
            <span>·</span>
            <span>{conditions.join(", ")}</span>
          </>
        )}
        {rarities.length > 0 && (
          <>
            <span>·</span>
            <span>{rarities.join(", ")}</span>
          </>
        )}
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className={cn(isPending && "pointer-events-none opacity-50 transition-opacity")}>
        {listings.length === 0 && !isPending ? (
          <KumaEmptyState variant="dashed" title={t(lang, "noListingsYet")} />
        ) : viewMode === "grid" ? (
          <BrowseGrid listings={listings} />
        ) : (
          <BrowseList listings={listings} />
        )}
      </div>

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
