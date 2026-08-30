"use client";

import {
  Bell,
  Check,
  ListChecks,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { type ReactNode, useRef, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { FilterModal } from "@/components/shared/filter-modal";
import { IconButton } from "@/components/ui/icon-button";
import { SetPicker, type SetPickerItem } from "@/components/shared/set-picker";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { FilterButton, ToolbarSearch } from "@/components/ui/toolbar";
import { GradeControl } from "@/components/market/price-mode-control";
import { t, type Language } from "@/lib/i18n";
import { isRawGrade, type GradeKey } from "@/lib/pricing/grade-tiers";
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
  editMode,
  onToggleEditMode,
  grade,
  onGradeChange,
}: {
  scope?: ReactNode;
  filters: WatchlistFilters;
  onFiltersChange: (next: WatchlistFilters) => void;
  search: string;
  onSearchChange: (s: string) => void;
  setOptions: SetPickerItem[];
  /** Select mode — the toggle shows pressed state; actions live on the
   *  sticky WatchlistSelectionBar. */
  editMode: boolean;
  onToggleEditMode: () => void;
  grade: GradeKey;
  onGradeChange: (grade: GradeKey) => void;
}) {
  const lang = useUIStore((s) => s.language);
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState(filters);
  const mobileFilterButtonRef = useRef<HTMLButtonElement>(null);
  const desktopFilterButtonRef = useRef<HTMLButtonElement>(null);

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

  return (
    <>
      <div
        className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-x-2 sm:gap-y-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-y-0"
        data-slot="watchlist-toolbar"
      >
        {/* Select mode no longer swaps the toolbar away — the sticky
            WatchlistSelectionBar above the table header carries the actions.
            Search/filter stay usable while picking rows; picks are pruned to
            the rows that stay visible (see pruneSelectedToVisible). */}
        {/* Mobile row one: the game scope and the search field share a line.
            The mobile search lives inside the scope's own grid cell — a second
            grid item could not sit beside it on a one-column grid. From sm up
            this cell turns back into scope-only and the wider search cell
            below takes over. */}
        <div
          className={cn(
            "flex min-w-0 items-center gap-2 sm:col-start-1 sm:row-start-1 sm:block",
            !scope && "sm:hidden",
          )}
          data-slot="watchlist-game-scope"
        >
          {scope}

          <ToolbarSearch
            type="search"
            value={search}
            onValueChange={onSearchChange}
            placeholder={t(lang, "watchlistSearchPlaceholder")}
            aria-label={t(lang, "watchlistSearchPlaceholder")}
            containerClassName="min-w-0 flex-1 border-border bg-background py-0 sm:hidden"
            className="h-11 w-full"
          />
        </div>

        <div
          className="contents"
          data-slot="watchlist-toolbar-controls"
        >
          {/* Mobile row two: the grade rail keeps the free space and scrolls,
              with filter + select parked at its tail. The period pill lives on
              the list header row. */}
          <div className="flex min-w-0 items-center gap-2 sm:hidden">
            <GradeControl
              value={grade}
              onChange={onGradeChange}
              className="flex-1"
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
                aria-pressed={editMode}
                onClick={onToggleEditMode}
                size="md"
                className={cn(editMode && "bg-primary/10 text-primary")}
              >
                <ListChecks className="size-4" />
              </IconButton>
            </div>
          </div>

          {/* Tablet: scope + search share row one, actions get a deliberate
              second row. Desktop: all three collapse onto one toolbar line.
              This avoids leaving the game context floating by itself at the
              app's 768px chrome boundary. */}
          <div
            className={cn(
              "hidden min-w-0 sm:row-start-1 sm:block",
              scope
                ? "sm:col-start-2"
                : "sm:col-start-1 lg:col-start-2",
            )}
            data-slot="watchlist-toolbar-search"
          >
            <ToolbarSearch
              type="search"
              value={search}
              onValueChange={onSearchChange}
              placeholder={t(lang, "watchlistSearchPlaceholder")}
              aria-label={t(lang, "watchlistSearchPlaceholder")}
              containerClassName="min-w-0 border-border bg-background py-0 md:w-72"
              className="h-9 w-full"
            />
          </div>

          <div
            className={cn(
              "hidden shrink-0 items-center gap-1.5 sm:row-start-2 sm:flex sm:justify-self-end lg:col-start-3 lg:row-start-1",
              scope ? "sm:col-span-2" : "sm:col-start-2",
            )}
            data-slot="watchlist-toolbar-actions"
          >
            <GradeControl value={grade} onChange={onGradeChange} />
            <div className="h-5 w-px bg-border/40" />

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
              aria-pressed={editMode}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "gap-1.5 px-2.5 text-muted-foreground hover:text-foreground",
                editMode && "bg-primary/10 text-primary hover:text-primary",
              )}
            >
              <ListChecks className="size-3.5" />
              <span>{t(lang, "watchlistSelectMode")}</span>
            </button>
          </div>
        </div>
      </div>

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
          grade={grade}
        />
      </FilterModal>
    </>
  );
}

/** Draft-only set/movement/status controls rendered inside the canonical FilterModal. */
export function WatchlistFilterPanel({
  lang,
  filters,
  onFiltersChange,
  setOptions = [],
  grade = "raw",
}: {
  lang: Language;
  filters: WatchlistFilters;
  onFiltersChange: (next: WatchlistFilters) => void;
  setOptions?: SetPickerItem[];
  grade?: GradeKey;
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

      {isRawGrade(grade) && (
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
      )}

      {isRawGrade(grade) && (
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
      )}

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
