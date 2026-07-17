"use client";

import {
  Bell,
  Check,
  ListChecks,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { type ReactNode, useRef, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { FilterModal } from "@/components/shared/filter-modal";
import { IconButton } from "@/components/ui/icon-button";
import { SetPicker, type SetPickerItem } from "@/components/shared/set-picker";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { FilterButton, ToolbarSearch } from "@/components/ui/toolbar";
import { UpgradeBadge } from "@/components/shared/upgrade-badge";
import { t, type Language } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

import { countActiveWatchlistFilters } from "./watchlist-sort";
import { DEFAULT_FILTERS, type WatchlistFilters } from "./watchlist-types";

export function WatchlistToolbar({
  scope,
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
  onBulkRemove,
}: {
  scope?: ReactNode;
  filters: WatchlistFilters;
  onFiltersChange: (next: WatchlistFilters) => void;
  search: string;
  onSearchChange: (s: string) => void;
  setOptions: SetPickerItem[];
  /** Only needed for the edit-mode "select all" disabled state. */
  resultCount: number;
  itemCount: number;
  limit: number;
  editMode: boolean;
  onToggleEditMode: () => void;
  selectedCount: number;
  allVisibleSelected: boolean;
  onToggleSelectAll: () => void;
  onBulkRemove: () => void;
}) {
  const lang = useUIStore((s) => s.language);
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState(filters);
  const mobileFilterButtonRef = useRef<HTMLButtonElement>(null);
  const desktopFilterButtonRef = useRef<HTMLButtonElement>(null);

  const isFinite = Number.isFinite(limit);
  const usagePct = isFinite ? Math.min(100, Math.round((itemCount / limit) * 100)) : 0;
  const isFull = isFinite && itemCount >= limit;
  const isHigh = isFinite && !isFull && usagePct >= 80;

  const activeFilterCount = countActiveWatchlistFilters(filters);
  const draftFilterCount = countActiveWatchlistFilters(draftFilters);

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

  return (
    <div className="space-y-2">
      {editMode ? (
        /* Select mode — one calm bar: count · select-all · delete · cancel. */
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
            {selectedCount > 0 && <span className="tabular-nums">({selectedCount})</span>}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onToggleEditMode}
            className="sm:min-h-11 md:min-h-0"
          >
            {t(lang, "cancel")}
          </Button>
        </div>
      ) : (
        <>
          {scope && <div className="min-w-0">{scope}</div>}

          {/* Mobile (<sm): a visible search field (owner: no icon-collapse) +
              filter + select. The period pill lives on the list header row. */}
          <div className="flex items-center gap-2 sm:hidden">
            <ToolbarSearch
              type="search"
              value={search}
              onValueChange={onSearchChange}
              placeholder={t(lang, "watchlistSearchPlaceholder")}
              aria-label={t(lang, "watchlistSearchPlaceholder")}
              containerClassName="min-w-0 flex-1 border-border bg-background py-0"
              className="h-11 w-full"
            />

            <div className="flex shrink-0 items-center gap-2">
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

              <IconButton
                aria-label={t(lang, "watchlistSelectMode")}
                onClick={onToggleEditMode}
                size="md"
              >
                <ListChecks className="size-4" />
              </IconButton>
            </div>
          </div>

          {limitMeter && <div className="sm:hidden">{limitMeter}</div>}

          {/* Desktop/tablet (>=sm): visible search left + filter · select
              right. No period control here — the table already has 24H/7D/30D
              columns — and no count text: it lives on the tab as a badge. */}
          <div className="hidden items-center gap-2 sm:flex">
            <ToolbarSearch
              type="search"
              value={search}
              onValueChange={onSearchChange}
              placeholder={t(lang, "watchlistSearchPlaceholder")}
              aria-label={t(lang, "watchlistSearchPlaceholder")}
              containerClassName="min-w-0 border-border bg-background py-0 md:w-72"
              className="h-9 w-full"
            />
            {limitMeter}

            <div className="ml-auto flex shrink-0 items-center gap-1.5">
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

              <button
                type="button"
                onClick={onToggleEditMode}
                aria-pressed={false}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "gap-1.5 px-2.5 text-muted-foreground hover:text-foreground",
                )}
              >
                <ListChecks className="size-3.5" />
                <span>{t(lang, "watchlistSelectMode")}</span>
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
