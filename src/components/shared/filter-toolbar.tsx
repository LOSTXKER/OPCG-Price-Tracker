"use client";

import type { ReactNode } from "react";

import {
  FilterButton,
  Toolbar,
  ToolbarSearch,
  ToolbarSortDropdown,
  type ToolbarSortOption,
  type ToolbarSearchProps,
} from "@/components/ui/toolbar";
import { ViewModeControl, type ViewMode } from "@/components/ui/view-mode-control";
import { cn } from "@/lib/utils";

export interface FilterToolbarProps<TSortKey extends string = string, TView extends ViewMode = ViewMode> {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** Optional: triggered on Enter inside the search input. */
  onSubmit?: () => void;
  /** Sort dropdown — omit to hide. */
  sort?: {
    options: ReadonlyArray<ToolbarSortOption<TSortKey>>;
    activeKey: TSortKey;
    activeDir?: "asc" | "desc";
    onChange: (key: TSortKey) => void;
  };
  /** Filter toggle — omit to hide. */
  filters?: {
    count?: number;
    active?: boolean;
    open?: boolean;
    onToggle: () => void;
    label?: ReactNode;
  };
  /** View-mode toggle (grid/list/etc) — omit to hide. */
  view?: {
    modes?: ReadonlyArray<TView>;
    value: TView;
    onChange: (value: TView) => void;
  };
  /** Slot for an inline CTA at the right edge (e.g. "List card", "New asset"). */
  cta?: ReactNode;
  /** Pass-through search props (`size`, `containerClassName`, etc). */
  searchProps?: Partial<ToolbarSearchProps>;
  className?: string;
  /** When true, drop the bordered/inset `Toolbar` chrome (use inside `<Surface>`/`.panel` rows that already have a divider). */
  bare?: boolean;
}

const DEFAULT_VIEW_MODES: ReadonlyArray<ViewMode> = ["grid", "list"];

/**
 * Composed search + sort + filter + view-mode + CTA row.
 *
 * Single source of truth for table/grid filter bars. Replaces the bespoke
 * filter rows in:
 *   - `home-market-overview.tsx`
 *   - `marketplace-browse/browse-toolbar.tsx` (kills native `<select>`)
 *   - `portfolio/assets-table/assets-toolbar.tsx`
 *   - `search-client.tsx` top controls
 *
 * Internally composes the existing `Toolbar` primitives (`ToolbarSearch`,
 * `ToolbarSortDropdown`, `FilterButton`, `ViewModeControl`) so visual chrome stays
 * consistent across pages.
 */
export function FilterToolbar<TSortKey extends string = string, TView extends ViewMode = ViewMode>({
  search,
  onSearchChange,
  searchPlaceholder,
  onSubmit,
  sort,
  filters,
  view,
  cta,
  searchProps,
  className,
  bare = true,
}: FilterToolbarProps<TSortKey, TView>) {
  return (
    <Toolbar
      variant={bare ? "bare" : "inset"}
      className={cn("flex-col items-stretch gap-3 sm:flex-row sm:items-center", className)}
    >
      <div className="flex-1 min-w-0">
        <ToolbarSearch
          value={search}
          onValueChange={onSearchChange}
          onKeyDown={(e) => {
            if (onSubmit && e.key === "Enter") onSubmit();
          }}
          placeholder={searchPlaceholder}
          containerClassName="w-full"
          {...searchProps}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {filters && (
          <FilterButton
            count={filters.count}
            active={filters.active}
            aria-expanded={filters.open}
            onClick={filters.onToggle}
          >
            {filters.label ?? "Filters"}
          </FilterButton>
        )}
        {sort && (
          <ToolbarSortDropdown
            options={sort.options}
            activeKey={sort.activeKey}
            activeDir={sort.activeDir ?? "desc"}
            onChange={sort.onChange}
            stableMobileWidth
          />
        )}
        {view && (
          <ViewModeControl<TView>
            modes={(view.modes ?? DEFAULT_VIEW_MODES) as ReadonlyArray<TView>}
            value={view.value}
            onChange={view.onChange}
          />
        )}
        {cta}
      </div>
    </Toolbar>
  );
}
