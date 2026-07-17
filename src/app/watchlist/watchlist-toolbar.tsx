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
import { IconButton } from "@/components/ui/icon-button";
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

import { countActiveWatchlistFilters } from "./watchlist-sort";
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
  const [searchOpen, setSearchOpen] = useState(false);
  const mobileFilterButtonRef = useRef<HTMLButtonElement>(null);
  const desktopFilterButtonRef = useRef<HTMLButtonElement>(null);

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

  const activeFilterCount = countActiveWatchlistFilters(filters);
  const draftFilterCount = countActiveWatchlistFilters(draftFilters);
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
    if (!open) {
      requestAnimationFrame(() => {
        const target = mobileFilterButtonRef.current?.offsetParent
          ? mobileFilterButtonRef.current
          : desktopFilterButtonRef.current;
        target?.focus();
      });
    }
  };

  const limitMeter =
    isFinite && (isFull || isHigh) ? (
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
    ) : null;

  const resultCountLine = (
    <span className="shrink-0 text-meta tabular-nums" aria-live="polite">
      {resultCount.toLocaleString()} {t(lang, "watchlistSummaryCards").toLowerCase()}
    </span>
  );

  return (
    <div className="space-y-2">
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
        <>
          {scope && <div className="min-w-0">{scope}</div>}

          {/* Mobile (<sm): essentials only — period (rows show one delta) +
              a compact icon cluster, then sort. Set/movement/status filters
              all live inside the one FilterModal. */}
          <div className="space-y-2 sm:hidden">
            <div className="flex flex-wrap items-center gap-2">
              <WatchlistPeriodControl period={period} onPeriodChange={onPeriodChange} />

              <div className="ml-auto flex shrink-0 items-center gap-2">
                <ToolbarSearch
                  type="search"
                  value={search}
                  onValueChange={onSearchChange}
                  collapsible
                  open={searchOpen}
                  onOpenChange={setSearchOpen}
                  placeholder={t(lang, "watchlistSearchPlaceholder")}
                  aria-label={t(lang, "watchlistSearchPlaceholder")}
                  size="sm"
                />

                <FilterButton
                  ref={mobileFilterButtonRef}
                  onClick={openFilters}
                  count={activeFilterCount}
                  active={filterOpen || activeFilterCount > 0}
                  aria-haspopup="dialog"
                  aria-expanded={filterOpen}
                  iconOnly
                  aria-label={t(lang, "filter")}
                />

                <ViewModeControl<WatchView>
                  modes={["list", "grid"]}
                  value={view}
                  onChange={onViewChange}
                />

                <IconButton
                  aria-label={t(lang, "watchlistEditMode")}
                  onClick={onToggleEditMode}
                  size="md"
                >
                  <Pencil className="size-4" />
                </IconButton>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="shrink-0 text-meta">{t(lang, "sortBy")}</span>
              <ToolbarSortDropdown
                options={sortOptions}
                activeKey={sortKey}
                activeDir={sortDirection}
                onChange={onSortChange}
                fallbackLabel={t(lang, "watchlistSortBy")}
                align="end"
                stableMobileWidth
                itemClassName="min-h-11 md:min-h-0"
                className="ml-auto w-48 min-w-0 flex-none"
              />
            </div>

            {limitMeter}

            <p className="text-meta tabular-nums" aria-live="polite">
              {resultCount.toLocaleString()} {t(lang, "watchlistSummaryCards").toLowerCase()}
            </p>
          </div>

          {/* Desktop/tablet (>=sm): one lean row — count on the left, then
              search · sort · filter · view · edit. The period pill only shows
              in grid view: the list view's table already has 24H/7D/30D
              columns, so a period switch there would be a duplicate control. */}
          <div className="hidden items-center gap-2 sm:flex">
            {resultCountLine}
            {limitMeter}

            <div className="ml-auto flex shrink-0 items-center gap-1.5">
              {view === "grid" && (
                <>
                  <WatchlistPeriodControl period={period} onPeriodChange={onPeriodChange} />
                  <div className="h-5 w-px bg-border/40" />
                </>
              )}

              <ToolbarSearch
                type="search"
                value={search}
                onValueChange={onSearchChange}
                collapsible
                open={searchOpen}
                onOpenChange={setSearchOpen}
                placeholder={t(lang, "watchlistSearchPlaceholder")}
                aria-label={t(lang, "watchlistSearchPlaceholder")}
                size="sm"
              />

              {/* List view sorts at the table headers (SortableHeader) — the
                  dropdown only backs the grid view, which has no headers. */}
              {view === "grid" && (
                <ToolbarSortDropdown
                  options={sortOptions}
                  activeKey={sortKey}
                  activeDir={sortDirection}
                  onChange={onSortChange}
                  fallbackLabel={t(lang, "watchlistSortBy")}
                  itemClassName="min-h-11 md:min-h-0"
                />
              )}

              <FilterButton
                ref={desktopFilterButtonRef}
                onClick={openFilters}
                count={activeFilterCount}
                active={filterOpen || activeFilterCount > 0}
                aria-haspopup="dialog"
                aria-expanded={filterOpen}
              >
                <span>{t(lang, "filter")}</span>
              </FilterButton>

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
                  "gap-1.5 px-2.5 text-muted-foreground hover:text-foreground",
                )}
              >
                <Pencil className="size-3.5" />
                <span>{t(lang, "watchlistEditMode")}</span>
              </button>
            </div>
          </div>
        </>
      )}

      <FilterModal
        open={filterOpen}
        onOpenChange={handleFilterOpenChange}
        onReset={() => setDraftFilters(DEFAULT_FILTERS)}
        resetDisabled={draftFilterCount === 0}
        onApply={() => onFiltersChange(draftFilters)}
      >
        <WatchlistFilterPanel
          lang={lang}
          filters={draftFilters}
          onFiltersChange={setDraftFilters}
          setOptions={setOptions}
        />
      </FilterModal>
    </div>
  );
}

/** Draft-only set/movement/status controls rendered inside the canonical FilterModal. */
export function WatchlistFilterPanel({
  lang,
  filters,
  onFiltersChange,
  setOptions = [],
}: {
  lang: Language;
  filters: WatchlistFilters;
  onFiltersChange: (next: WatchlistFilters) => void;
  setOptions?: SetPickerItem[];
}) {
  return (
    <>
      {setOptions.length > 0 && (
        <div>
          <span className="text-eyebrow mb-2 block">{t(lang, "setFilter")}</span>
          <SetPicker
            sets={setOptions}
            selectedCode={filters.setCode}
            onSelect={(setCode) => onFiltersChange({ ...filters, setCode })}
            variant="inline"
            nullable
          />
        </div>
      )}

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
