"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import { EmptyState } from "@/components/shared/empty-state"
import { apiGet, apiTry } from "@/lib/api/client"
import { getCardName, t } from "@/lib/i18n"
import type { AssetRow } from "@/lib/types/portfolio"
import { useUIStore } from "@/stores/ui-store"

import { AssetsToolbar } from "./assets-toolbar"
import { BulkEditDialog } from "./bulk-edit-dialog"
import { DesktopAssetsTable } from "./desktop-table"
import { MobileAssetCard } from "./mobile-card"
import { SingleEditDialog } from "./single-edit-dialog"
import { sortAssets, type SortDir, type SortKey } from "./utils"

export type { AssetRow } from "@/lib/types/portfolio"

export function PortfolioAssetsTable({
  assets,
  onUpdate,
  onRemove,
  hideBalance = false,
  showGameBadge = false,
  leading,
}: {
  assets: AssetRow[]
  onUpdate: (
    itemId: number,
    data: {
      quantity?: number
      purchasePrice?: number | null
      isPrivate?: boolean
      notes?: string | null
    },
  ) => void
  onRemove: (itemId: number) => void
  hideBalance?: boolean
  /** Show a per-row game tag — pass true only when holdings span ≥2 games. */
  showGameBadge?: boolean
  /** Replaces the toolbar's default heading (e.g. the page's game tabs). */
  leading?: React.ReactNode
}) {
  const lang = useUIStore((s) => s.language)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>("value")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [editOpen, setEditOpen] = useState(false)
  const [editFocusId, setEditFocusId] = useState<number | null>(null)

  // Real 7-day sparklines per card (same endpoint the watchlist uses) —
  // fetched once per card id, optional eye-candy so failures are ignored.
  const [sparklines, setSparklines] = useState<Record<number, number[]>>({})
  const sparklineFetchedRef = useRef<Set<number>>(new Set())
  useEffect(() => {
    const ids = assets
      .map((a) => a.cardId)
      .filter((id) => id > 0 && !sparklineFetchedRef.current.has(id))
    if (ids.length === 0) return
    ids.forEach((id) => sparklineFetchedRef.current.add(id))
    void apiTry(
      apiGet<{ sparklines?: Record<number, number[]> }>(
        `/api/cards/sparklines?ids=${ids.slice(0, 50).join(",")}`,
      ),
    ).then((data) => {
      if (data?.sparklines) setSparklines((prev) => ({ ...prev, ...data.sparklines }))
    })
  }, [assets])

  const filteredAssets = useMemo(() => {
    let result = assets
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((row) => {
        const name = getCardName(lang as "TH" | "EN" | "JP", row).toLowerCase()
        const code = (row.baseCode ?? row.cardCode).toLowerCase()
        return name.includes(q) || code.includes(q)
      })
    }
    return sortAssets(result, sortKey, sortDir)
  }, [assets, searchQuery, sortKey, sortDir, lang])

  const handleSortSelect = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  const openEdit = (row: AssetRow) => {
    setEditFocusId(row.itemId)
    setEditOpen(true)
  }

  const openBulkEdit = () => {
    setEditFocusId(null)
    setEditOpen(true)
  }

  return (
    <>
      <AssetsToolbar
        lang={lang}
        count={assets.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchOpen={searchOpen}
        onSearchOpenChange={setSearchOpen}
        sortKey={sortKey}
        sortDir={sortDir}
        onSortSelect={handleSortSelect}
        onBulkEdit={openBulkEdit}
        hasAssets={assets.length > 0}
        leading={leading}
      />

      {filteredAssets.length === 0 ? (
        <EmptyState variant="plain" title={t(lang, "noResults")} />
      ) : (
        <>
          <div className="divide-y divide-[var(--p-hair)] sm:hidden">
            {filteredAssets.map((row) => (
              <MobileAssetCard
                key={row.itemId}
                row={row}
                lang={lang}
                onEdit={() => openEdit(row)}
                hideBalance={hideBalance}
                showGameBadge={showGameBadge}
              />
            ))}
          </div>

          <DesktopAssetsTable
            rows={filteredAssets}
            lang={lang}
            onEdit={openEdit}
            hideBalance={hideBalance}
            showGameBadge={showGameBadge}
            sparklines={sparklines}
          />
        </>
      )}

      {editFocusId != null ? (
        <SingleEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          assets={assets}
          focusItemId={editFocusId}
          onUpdate={onUpdate}
          onRemove={onRemove}
        />
      ) : (
        <BulkEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          assets={assets}
          onUpdate={onUpdate}
          onRemove={onRemove}
        />
      )}
    </>
  )
}
