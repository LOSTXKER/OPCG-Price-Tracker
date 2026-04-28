"use client"

import { useMemo, useState } from "react"

import { useConfirm } from "@/components/shared/confirm-dialog"
import { EmptyState } from "@/components/shared/empty-state"
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
}) {
  const lang = useUIStore((s) => s.language)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>("value")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [editOpen, setEditOpen] = useState(false)
  const [editFocusId, setEditFocusId] = useState<number | null>(null)
  const confirm = useConfirm()

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

  const handleRemove = async (row: AssetRow) => {
    const name = getCardName(lang as "TH" | "EN" | "JP", row)
    const ok = await confirm({
      title: `${t(lang, "remove")} ${name}`,
      description: t(lang, "confirmRemoveCard"),
      confirmLabel: t(lang, "remove"),
      cancelLabel: t(lang, "cancel"),
      variant: "destructive",
    })
    if (ok) onRemove(row.itemId)
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
      />

      {filteredAssets.length === 0 ? (
        <EmptyState variant="plain" title={t(lang, "noResults")} />
      ) : (
        <>
          <div className="divide-y divide-border/10 sm:hidden">
            {filteredAssets.map((row) => (
              <MobileAssetCard
                key={row.itemId}
                row={row}
                lang={lang}
                onEdit={() => openEdit(row)}
                onRemove={() => void handleRemove(row)}
                hideBalance={hideBalance}
              />
            ))}
          </div>

          <DesktopAssetsTable
            rows={filteredAssets}
            lang={lang}
            onEdit={openEdit}
            onRemove={(row) => void handleRemove(row)}
            hideBalance={hideBalance}
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
