"use client";

import { type LucideIcon } from "lucide-react";

import {
  SegmentedControl,
  type SegmentedOption,
} from "@/components/ui/segmented-control";
import {
  ToolbarSortDropdown,
  type ToolbarSortOption,
} from "@/components/ui/toolbar";
import { t, type Language } from "@/lib/i18n";

export type FilterChip<TValue extends string = string> = {
  value: TValue;
  label: string;
};

export type SortOption<TValue extends string = string> = {
  value: TValue;
  label: string;
};

/**
 * Shared toolbar shell used by Listings / Collection / Reviews tabs. We keep
 * one consistent visual so the three tabs feel like siblings — left side is
 * a horizontally-scrollable segmented pill rail, right side is a sort dropdown.
 *
 * The filter rail is the canonical `SegmentedControl variant="pill"` (single
 * select). It renders in its natural row on desktop and can snap-scroll on
 * mobile when a tab has many segments (e.g. Collection's per-set chips), so we
 * never wrap awkwardly. Sort lives in the canonical `ToolbarSortDropdown` to
 * keep the toolbar height fixed regardless of how many sort options each tab
 * has.
 */
export function TabToolbar<F extends string, S extends string>({
  filters,
  activeFilter,
  onFilter,
  sortOptions,
  activeSort,
  onSort,
  lang,
  trailing,
  filterIcon,
}: {
  filters?: FilterChip<F>[];
  activeFilter?: F;
  onFilter?: (value: F) => void;
  sortOptions?: SortOption<S>[];
  activeSort?: S;
  onSort?: (value: S) => void;
  lang: Language;
  trailing?: React.ReactNode;
  filterIcon?: LucideIcon;
}) {
  const hasFilters = !!filters && filters.length > 0;
  const hasSort = !!sortOptions && sortOptions.length > 0;
  if (!hasFilters && !hasSort && !trailing) return null;

  const segmentedOptions: SegmentedOption<F>[] =
    filters?.map((f) => ({ value: f.value, label: f.label })) ?? [];

  const sortDropdownOptions: ToolbarSortOption<S>[] =
    sortOptions?.map((s) => ({ key: s.value, label: s.label })) ?? [];

  return (
    <div className="flex items-center gap-2">
      {hasFilters && activeFilter !== undefined && (
        <div className="flex min-w-0 flex-1 items-center overflow-x-auto pb-px scrollbar-none">
          <SegmentedControl
            options={segmentedOptions}
            value={activeFilter}
            onChange={(v) => onFilter?.(v)}
            variant="pill"
            size="sm"
            leadingIcon={filterIcon}
            className="shrink-0"
          />
        </div>
      )}
      {!hasFilters && <div className="flex-1" />}

      {trailing}

      {hasSort && activeSort !== undefined && (
        <ToolbarSortDropdown
          options={sortDropdownOptions}
          activeKey={activeSort}
          activeDir="desc"
          onChange={(key) => onSort?.(key)}
          fallbackLabel={t(lang, "toolbarSort")}
          className="shrink-0 rounded-full"
        />
      )}
    </div>
  );
}
