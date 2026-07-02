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
              variant="outline"
              size="xs"
              onClick={onBulkEdit}
              className="border-[var(--p-hair)] bg-muted/20 text-foreground/80 hover:bg-muted/50"
            >
              <Edit2 className="size-3 text-muted-foreground/60" />
              {t(lang, "bulkEdit")}
            </Button>
          )}
        </>
      }
    >
      <p className="text-h5">{t(lang, "assets")}</p>
      <span className="rounded-full bg-primary/8 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-primary/80">
        {count} {t(lang, "card")}
      </span>
    </Toolbar>
  )
}
