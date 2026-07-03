"use client"

import { Edit2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Toolbar,
  ToolbarSearch,
  ToolbarSortDropdown,
  type ToolbarSortOption,
} from "@/components/ui/toolbar"
import { t, type Language } from "@/lib/i18n"

import type { SortDir, SortKey } from "./utils"

export function AssetsToolbar({
  lang,
  count,
  searchQuery,
  onSearchChange,
  searchOpen,
  onSearchOpenChange,
  sortKey,
  sortDir,
  onSortSelect,
  onBulkEdit,
  hasAssets,
  leading,
}: {
  lang: Language
  count: number
  searchQuery: string
  onSearchChange: (v: string) => void
  searchOpen: boolean
  onSearchOpenChange: (v: boolean) => void
  sortKey: SortKey
  sortDir: SortDir
  onSortSelect: (key: SortKey) => void
  onBulkEdit: () => void
  hasAssets: boolean
  /** Replaces the default "สินทรัพย์ · count" heading — e.g. the game tabs. */
  leading?: React.ReactNode
}) {
  const sortOptions: ToolbarSortOption<SortKey>[] = [
    { key: "value", label: t(lang, "value") },
    { key: "pnl", label: t(lang, "pnl") },
    { key: "change24h", label: "24h" },
    { key: "cost", label: t(lang, "costBasis") },
    { key: "qty", label: t(lang, "quantity") },
  ]

  return (
    <Toolbar
      variant="bare"
      className="border-b border-[var(--p-hair)] pb-3"
      right={
        <>
          <ToolbarSearch
            value={searchQuery}
            onValueChange={onSearchChange}
            collapsible
            open={searchOpen}
            onOpenChange={onSearchOpenChange}
            placeholder={t(lang, "searchByNameOrCode")}
            size="sm"
          />
          <ToolbarSortDropdown
            options={sortOptions}
            activeKey={sortKey}
            activeDir={sortDir}
            onChange={onSortSelect}
            fallbackLabel={t(lang, "toolbarSort")}
          />
          {hasAssets && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={onBulkEdit}
              className="text-muted-foreground hover:text-foreground"
            >
              <Edit2 className="size-3" />
              {t(lang, "bulkEdit")}
            </Button>
          )}
        </>
      }
    >
      {leading ?? (
        <p className="text-eyebrow">
          {t(lang, "assets")}
          <span className="ml-2 tabular-nums text-muted-foreground/70">{count}</span>
        </p>
      )}
    </Toolbar>
  )
}
