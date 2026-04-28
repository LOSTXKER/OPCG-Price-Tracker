"use client";

import { Grid3x3, List as ListIcon, SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";

import {
  FilterButton,
  Toolbar,
  ToolbarSearch,
  ToolbarSortDropdown,
  ViewToggle,
  type ToolbarSortOption,
  type ToolbarSearchProps,
  type ViewToggleMode,
} from "@/components/ui/toolbar";
import { cn } from "@/lib/utils";

export interface FilterToolbarProps<TSortKey extends string = string, TView extends string = string> {
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
    onToggle: () => void;
    label?: ReactNode;
  };
  /** View-mode toggle (grid/list/etc) — omit to hide. */
  view?: {
    modes?: ReadonlyArray<ViewToggleMode<TView>>;
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

const DEFAULT_VIEW_MODES: ReadonlyArray<ViewToggleMode<"grid" | "list">> = [
  { value: "grid", icon: Grid3x3, ariaLabel: "Grid view" },
  { value: "list", icon: ListIcon, ariaLabel: "List view" },
];

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
 * `ToolbarSortDropdown`, `FilterButton`, `ViewToggle`) so visual chrome stays
 * consistent across pages.
 */
export function FilterToolbar<TSortKey extends string = string, TView extends string = string>({
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
            iconLeft={<SlidersHorizontal className="size-3.5" />}
            count={filters.count}
            active={filters.active}
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
          />
        )}
        {view && (
          <ViewToggle
            modes={(view.modes ?? DEFAULT_VIEW_MODES) as ReadonlyArray<ViewToggleMode<TView>>}
            value={view.value}
            onChange={view.onChange}
          />
        )}
        {cta}
      </div>
    </Toolbar>
  );
}
