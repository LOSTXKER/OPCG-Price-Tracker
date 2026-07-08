"use client"

import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { FilterToolbar } from "@/components/shared/filter-toolbar"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/ui-store"

import { SORT_OPTIONS } from "./types"

type SortKey = (typeof SORT_OPTIONS)[number]["value"]

export function BrowseToolbar({
  search,
  onSearchChange,
  onSubmit,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
}: {
  search: string
  onSearchChange: (v: string) => void
  onSubmit: () => void
  sort: string
  onSortChange: (v: string) => void
  viewMode: "grid" | "list"
  onViewModeChange: (v: "grid" | "list") => void
}) {
  const lang = useUIStore((s) => s.language)

  return (
    <FilterToolbar<SortKey, "grid" | "list">
      search={search}
      onSearchChange={onSearchChange}
      onSubmit={onSubmit}
      searchPlaceholder={t(lang, "mktToolbarSearchPlaceholder")}
      sort={{
        options: SORT_OPTIONS.map((o) => ({ key: o.value as SortKey, label: o.label })),
        activeKey: sort as SortKey,
        onChange: (key) => onSortChange(key),
      }}
      view={{
        value: viewMode,
        onChange: onViewModeChange,
      }}
      cta={
        <Link
          href="/marketplace/create"
          className={cn(buttonVariants({ size: "sm" }), "shrink-0")}
        >
          {t(lang, "listCard")}
        </Link>
      }
    />
  )
}
