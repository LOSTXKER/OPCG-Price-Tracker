"use client"

import { useMemo, useState } from "react"

import { EmptyState } from "@/components/shared/empty-state"
import { t } from "@/lib/i18n"
import type {
  AssetRow,
  PortfolioPurchaseRow,
} from "@/lib/types/portfolio"
import type {
  CreatePortfolioLotInput,
  UpdatePortfolioLotInput,
} from "@/lib/portfolio/schemas"
import { useUIStore } from "@/stores/ui-store"

import { AssetsToolbar } from "./assets-toolbar"
import { DesktopAssetsTable } from "./desktop-table"
import { MobileAssetCard } from "./mobile-card"
import {
  PurchaseLotsDialog,
  type PortfolioItemUpdateInput,
} from "./purchase-lots-dialog"
import {
  mapAssetsToPurchaseRows,
  matchesPurchaseRow,
  getPurchaseRowEditTarget,
  sortPurchaseRows,
  type PurchaseSortKey,
  type SortDir,
} from "./utils"

export type { AssetRow } from "@/lib/types/portfolio"

const unsupportedRemoveItem = async (): Promise<boolean> => false

export function PortfolioAssetsTable({
  assets,
  onUpdate,
  onAddLot,
  onUpdateLot,
  onRemoveLot,
  onRemoveItem = unsupportedRemoveItem,
  hideBalance = false,
  showGameBadge = false,
  leading,
  quotaCurrent,
  quotaMax,
}: {
  assets: AssetRow[]
  onUpdate: (
    itemId: number,
    data: PortfolioItemUpdateInput,
  ) => Promise<boolean>
  onAddLot: (itemId: number, data: CreatePortfolioLotInput) => Promise<boolean>
  onUpdateLot: (lotId: number, data: UpdatePortfolioLotInput) => Promise<boolean>
  onRemoveLot: (lotId: number) => Promise<boolean>
  onRemoveItem?: (itemId: number) => Promise<boolean>
  hideBalance?: boolean
  /** Show a per-row game tag — pass true only when holdings span ≥2 games. */
  showGameBadge?: boolean
  /** Replaces the toolbar's default heading (e.g. the page's game tabs). */
  leading?: React.ReactNode
  /** Account-wide card-entry quota, shown contextually in the list toolbar. */
  quotaCurrent?: number
  quotaMax?: number
}) {
  const lang = useUIStore((s) => s.language)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [sortKey, setSortKey] = useState<PurchaseSortKey>("date")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [editOpen, setEditOpen] = useState(false)
  const [editFocusId, setEditFocusId] = useState<number | null>(null)
  const [initialLotId, setInitialLotId] = useState<number | null>(null)
  const [initialCompatibilityRow, setInitialCompatibilityRow] = useState(false)
  const purchaseRows = useMemo(() => mapAssetsToPurchaseRows(assets), [assets])
  const totalCopyCount = purchaseRows.reduce(
    (sum, row) => sum + row.quantity,
    0,
  )

  const filteredRows = useMemo(() => {
    let result = purchaseRows
    if (searchQuery.trim()) {
      result = result.filter((row) =>
        matchesPurchaseRow(row, searchQuery, lang),
      )
    }
    return sortPurchaseRows(result, sortKey, sortDir)
  }, [purchaseRows, searchQuery, sortKey, sortDir, lang])

  const handleSortSelect = (key: PurchaseSortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  const openEdit = (row: PortfolioPurchaseRow) => {
    const target = getPurchaseRowEditTarget(row)
    setEditFocusId(target.itemId)
    setInitialLotId(target.initialLotId)
    setInitialCompatibilityRow(row.isCompatibilityRow)
    setEditOpen(true)
  }

  const focusedRow = assets.find((row) => row.itemId === editFocusId) ?? null

  return (
    <>
      <AssetsToolbar
        lang={lang}
        purchaseCount={purchaseRows.length}
        copyCount={totalCopyCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchOpen={searchOpen}
        onSearchOpenChange={setSearchOpen}
        sortKey={sortKey}
        sortDir={sortDir}
        onSortSelect={handleSortSelect}
        leading={leading}
        quotaCurrent={quotaCurrent}
        quotaMax={quotaMax}
      />

      {filteredRows.length === 0 ? (
        <EmptyState variant="plain" title={t(lang, "noResults")} />
      ) : (
        <>
          <div
            className="divide-y divide-hair sm:hidden"
            data-slot="portfolio-assets-mobile-list"
          >
            {filteredRows.map((row, index) => (
              <MobileAssetCard
                key={row.rowKey}
                row={row}
                lang={lang}
                onEdit={() => openEdit(row)}
                hideBalance={hideBalance}
                showGameBadge={showGameBadge}
                eagerImage={index === 0}
              />
            ))}
          </div>

          <DesktopAssetsTable
            rows={filteredRows}
            lang={lang}
            onEdit={openEdit}
            hideBalance={hideBalance}
            showGameBadge={showGameBadge}
            sortKey={sortKey}
            sortDir={sortDir}
            onSortSelect={handleSortSelect}
          />
        </>
      )}

      {focusedRow ? (
        <PurchaseLotsDialog
          key={`${focusedRow.itemId}-${initialLotId ?? "list"}-${initialCompatibilityRow ? "compat" : "lot"}-${editOpen ? "open" : "closed"}`}
          open={editOpen}
          onOpenChange={setEditOpen}
          row={focusedRow}
          initialLotId={initialLotId}
          initialCompatibilityRow={initialCompatibilityRow}
          hideBalance={hideBalance}
          onUpdateItem={onUpdate}
          onAddLot={onAddLot}
          onUpdateLot={onUpdateLot}
          onRemoveLot={onRemoveLot}
          onRemoveItem={onRemoveItem}
        />
      ) : null}
    </>
  )
}
