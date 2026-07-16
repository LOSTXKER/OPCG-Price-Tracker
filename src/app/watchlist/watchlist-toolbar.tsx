"use client";

import {
  Bell,
  Check,
  Pencil,
  Pin,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { type ReactNode, useMemo, useRef, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { FilterModal } from "@/components/shared/filter-modal";
import { SetPicker, type SetPickerItem } from "@/components/shared/set-picker";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ViewModeControl } from "@/components/ui/view-mode-control";
import {
  FilterButton,
  ToolbarSearch,
  ToolbarSortDropdown,
} from "@/components/ui/toolbar";
import { UpgradeBadge } from "@/components/shared/upgrade-badge";
import { t, type Language } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

import { countActiveWatchlistModalFilters } from "./watchlist-sort";
import { WatchlistPeriodControl } from "./watchlist-summary";
import {
  DEFAULT_FILTERS,
  type ChangePeriod,
  type SortKey,
  type WatchView,
  type WatchlistFilters,
} from "./watchlist-types";

export function WatchlistToolbar({
  scope,
  view,
  onViewChange,
  period,
  onPeriodChange,
  sortKey,
  onSortChange,
  filters,
  onFiltersChange,
  search,
  onSearchChange,
  setOptions,
  resultCount,
  itemCount,
  limit,
  editMode,
  onToggleEditMode,
  selectedCount,
  allVisibleSelected,
  onToggleSelectAll,
  onClearSelection,
  onBulkRemove,
}: {
  scope?: ReactNode;
  view: WatchView;
  onViewChange: (v: WatchView) => void;
  period: ChangePeriod;
  onPeriodChange: (period: ChangePeriod) => void;
  sortKey: SortKey;
  onSortChange: (k: SortKey) => void;
  filters: WatchlistFilters;
  onFiltersChange: (next: WatchlistFilters) => void;
  search: string;
  onSearchChange: (s: string) => void;
  setOptions: SetPickerItem[];
  resultCount: number;
  itemCount: number;
  limit: number;
  editMode: boolean;
  onToggleEditMode: () => void;
  selectedCount: number;
  allVisibleSelected: boolean;
  onToggleSelectAll: () => void;
  onClearSelection: () => void;
  onBulkRemove: () => void;
}) {
  const lang = useUIStore((s) => s.language);
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState(filters);
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  const sortOptions: { key: SortKey; label: string }[] = useMemo(
    () => [
      { key: "default", label: t(lang, "watchlistSortDefault") },
      { key: "recent", label: t(lang, "watchlistSortRecent") },
      { key: "gain", label: t(lang, "watchlistSortGain") },
      { key: "loss", label: t(lang, "watchlistSortLoss") },
      { key: "priceHigh", label: t(lang, "watchlistSortPriceHigh") },
      { key: "priceLow", label: t(lang, "watchlistSortPriceLow") },
      { key: "nameAz", label: t(lang, "watchlistSortNameAz") },
    ],
    [lang]
  );

  const isFinite = Number.isFinite(limit);
  const usagePct = isFinite ? Math.min(100, Math.round((itemCount / limit) * 100)) : 0;
  const isFull = isFinite && itemCount >= limit;
  const isHigh = isFinite && !isFull && usagePct >= 80;

  const activeFilterCount = countActiveWatchlistModalFilters(filters);
  const draftFilterCount = countActiveWatchlistModalFilters(draftFilters);
  const sortDirection: "asc" | "desc" =
    sortKey === "loss" || sortKey === "priceLow" || sortKey === "nameAz"
      ? "asc"
      : "desc";

  const openFilters = () => {
    setDraftFilters(filters);
    setFilterOpen(true);
  };

  const handleFilterOpenChange = (open: boolean) => {
    setFilterOpen(open);
    if (!open) requestAnimationFrame(() => filterButtonRef.current?.focus());
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] items-center gap-2 md:flex md:min-w-0 md:flex-nowrap">
        <ToolbarSearch
          type="search"
          value={search}
          onValueChange={onSearchChange}
          placeholder={t(lang, "watchlistSearchPlaceholder")}
          aria-label={t(lang, "watchlistSearchPlaceholder")}
          containerClassName="min-w-0 border-border bg-background py-0 sm:min-h-11 md:min-h-0 md:min-w-40 md:flex-1 md:py-2 lg:max-w-72"
          className="h-11 w-full md:h-auto"
        />

        <div className="min-w-0 md:min-w-40 md:flex-1 lg:max-w-64">
          <SetPicker
            sets={setOptions}
            selectedCode={filters.setCode}
            onSelect={(setCode) => onFiltersChange({ ...filters, setCode })}
            variant="inline"
            nullable
            triggerClassName="sm:h-11 md:h-9"
          />
        </div>

        <ToolbarSortDropdown
          options={sortOptions}
          activeKey={sortKey}
          activeDir={sortDirection}
          onChange={onSortChange}
          fallbackLabel={t(lang, "watchlistSortBy")}
          stableMobileWidth
          itemClassName="min-h-11 md:min-h-0"
          className="w-full sm:h-11 md:h-auto md:w-auto"
        />

        <FilterButton
          ref={filterButtonRef}
          onClick={openFilters}
          count={activeFilterCount}
          active={filterOpen || activeFilterCount > 0}
          aria-haspopup="dialog"
          aria-expanded={filterOpen}
          className="w-full sm:h-11 md:h-auto md:w-auto [&>span]:w-full"
        >
          <span>{t(lang, "filter")}</span>
        </FilterButton>
        <FilterModal
          open={filterOpen}
          onOpenChange={handleFilterOpenChange}
          onReset={() =>
            setDraftFilters({ ...DEFAULT_FILTERS, setCode: filters.setCode })
          }
          resetDisabled={draftFilterCount === 0}
          onApply={() => onFiltersChange(draftFilters)}
        >
          <WatchlistFilterPanel
            lang={lang}
            filters={draftFilters}
            onFiltersChange={setDraftFilters}
          />
        </FilterModal>
      </div>

      {editMode ? (
        <div
          className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 p-2"
          aria-label={t(lang, "watchlistSelected")}
        >
          <span className="mr-auto px-1 text-label tabular-nums text-primary">
            {selectedCount} {t(lang, "watchlistSelected")}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onToggleSelectAll}
            disabled={resultCount === 0}
            className="sm:min-h-11 md:min-h-0"
          >
            {allVisibleSelected ? t(lang, "deselectAll") : t(lang, "watchlistSelectAll")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={onBulkRemove}
            disabled={selectedCount === 0}
            className="sm:min-h-11 md:min-h-0"
          >
            <Trash2 className="size-3.5" />
            {t(lang, "watchlistRemoveSelected")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onClearSelection}
            disabled={selectedCount === 0}
            className="sm:min-h-11 md:min-h-0"
          >
            {t(lang, "watchlistClearSelection")}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onToggleEditMode}
            className="sm:min-h-11 md:min-h-0"
          >
            <Check className="size-3.5" />
            {t(lang, "watchlistEditDone")}
          </Button>
        </div>
      ) : (
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:min-h-11 md:min-h-9">
          {scope && <div className="w-full min-w-0 md:w-auto">{scope}</div>}

          <span
            className={cn(
              "hidden min-w-0 truncate whitespace-nowrap text-meta tabular-nums sm:inline",
              !scope && "sm:mr-auto",
            )}
            aria-live="polite"
          >
            {resultCount.toLocaleString()} {t(lang, "watchlistSummaryCards").toLowerCase()}
          </span>

          <div className="no-sb ml-auto flex max-w-full min-w-0 shrink-0 items-center justify-end gap-2 overflow-x-auto">
            <WatchlistPeriodControl
              period={period}
              onPeriodChange={onPeriodChange}
            />

            {isFinite && (isFull || isHigh) && (
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-md border px-2 py-1",
                  isFull
                    ? "border-destructive/30 bg-destructive/5"
                    : "border-warning/30 bg-warning/5",
                )}
                title={`${itemCount}/${limit}`}
              >
                <div className="hidden h-1 w-10 overflow-hidden rounded-full bg-muted sm:flex">
                  <div
                    className={cn(
                      "h-full rounded-full motion-base",
                      isFull ? "bg-destructive" : "bg-warning",
                    )}
                    style={{ width: `${usagePct}%` }}
                  />
                </div>
                <span
                  className={cn(
                    "text-meta tabular-nums",
                    isFull ? "text-destructive" : "text-warning",
                  )}
                >
                  {itemCount}/{limit}
                </span>
                <UpgradeBadge featureKey="watchlistCards" />
              </div>
            )}

            <ViewModeControl<WatchView>
              modes={["list", "grid"]}
              value={view}
              onChange={onViewChange}
            />

            <button
              type="button"
              onClick={onToggleEditMode}
              aria-pressed={false}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "min-w-11 gap-1.5 px-2.5 text-muted-foreground hover:text-foreground sm:min-h-11 md:min-h-0 md:min-w-0",
              )}
            >
              <Pencil className="size-3.5" />
              <span className="hidden sm:inline">{t(lang, "watchlistEditMode")}</span>
              <span className="sr-only sm:hidden">{t(lang, "watchlistEditMode")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Draft-only movement/status controls rendered inside the canonical FilterModal. */
export function WatchlistFilterPanel({
  lang,
  filters,
  onFiltersChange,
}: {
  lang: Language;
  filters: WatchlistFilters;
  onFiltersChange: (next: WatchlistFilters) => void;
}) {
  return (
    <>
      <div>
        <span className="text-eyebrow mb-2 block">
          {t(lang, "watchlistFilterMovement")}
        </span>
        <SegmentedControl<"all" | "up" | "down">
          options={[
            {
              value: "all",
              label: t(lang, "watchlistFilterMovementAll"),
            },
            {
              value: "up",
              label: t(lang, "watchlistFilterMovementUp"),
              icon: TrendingUp,
            },
            {
              value: "down",
              label: t(lang, "watchlistFilterMovementDown"),
              icon: TrendingDown,
            },
          ]}
          value={filters.direction ?? "all"}
          onChange={(value) =>
            onFiltersChange({
              ...filters,
              direction: value === "all" ? null : value,
            })
          }
          ariaLabel={t(lang, "watchlistFilterMovement")}
          fullWidth
          size="sm"
          compactVisual
          className="w-full"
        />
      </div>

      <div>
        <span className="text-eyebrow mb-2 block">
          {t(lang, "watchlistFilterStatus")}
        </span>
        <div className="space-y-0.5">
          <ToggleRow
            icon={<Bell className="size-4" />}
            label={t(lang, "watchlistFilterAlerts")}
            checked={filters.hasAlert}
            onToggle={() =>
              onFiltersChange({ ...filters, hasAlert: !filters.hasAlert })
            }
          />
          <ToggleRow
            icon={<Pin className="size-4" />}
            label={t(lang, "watchlistFilterPinned")}
            checked={filters.pinnedOnly}
            onToggle={() =>
              onFiltersChange({ ...filters, pinnedOnly: !filters.pinnedOnly })
            }
          />
        </div>
      </div>

    </>
  );
}

function ToggleRow({
  icon,
  label,
  checked,
  onToggle,
}: {
  icon?: React.ReactNode;
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className={cn(
        "ease-chrome flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm",
        checked ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
      )}
    >
      {icon && (
        <span className={checked ? "text-primary" : "text-muted-foreground"}>
          {icon}
        </span>
      )}
      <span className="flex-1 text-left">{label}</span>
      {checked && <Check className="size-4" />}
    </button>
  );
}
