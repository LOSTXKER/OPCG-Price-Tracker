"use client";

import {
  ArrowDownUp,
  Bell,
  Check,
  ChevronDown,
  Layers,
  LayoutGrid,
  List,
  Pencil,
  Pin,
  Search,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  TrendingUpDown,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { FilterModal } from "@/components/shared/filter-modal";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UpgradeBadge } from "@/components/shared/upgrade-badge";
import { OPCG_SETS } from "@/lib/constants/sets";
import { t, type Language } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

import {
  DEFAULT_FILTERS,
  type ChangePeriod,
  type SortKey,
  type WatchView,
  type WatchlistFilters,
} from "./watchlist-types";

const PERIODS: ChangePeriod[] = ["24h", "7d", "30d"];

const setNameByCode = new Map(OPCG_SETS.map((s) => [s.code, s.nameEn]));

export function WatchlistToolbar({
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
  itemCount,
  limit,
  editMode,
  onToggleEditMode,
  selectedCount,
  onClearSelection,
  onBulkRemove,
}: {
  view: WatchView;
  onViewChange: (v: WatchView) => void;
  period: ChangePeriod;
  onPeriodChange: (p: ChangePeriod) => void;
  sortKey: SortKey;
  onSortChange: (k: SortKey) => void;
  filters: WatchlistFilters;
  onFiltersChange: (next: WatchlistFilters) => void;
  search: string;
  onSearchChange: (s: string) => void;
  setOptions: { code: string; label: string }[];
  itemCount: number;
  limit: number;
  editMode: boolean;
  onToggleEditMode: () => void;
  selectedCount: number;
  onClearSelection: () => void;
  onBulkRemove: () => void;
}) {
  const lang = useUIStore((s) => s.language);
  const [filterOpen, setFilterOpen] = useState(false);

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

  const activeFilterCount =
    (filters.setCodes.length > 0 ? 1 : 0) +
    (filters.direction ? 1 : 0) +
    (filters.hasAlert ? 1 : 0) +
    (filters.pinnedOnly ? 1 : 0);

  return (
    <div className="space-y-3">
      {/* Bulk action bar — only in edit mode with a selection */}
      {editMode && selectedCount > 0 && (
        <div className="flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-3 py-1.5">
          <span className="text-meta tabular-nums text-primary">
            {selectedCount} {t(lang, "watchlistSelected")}
          </span>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className="h-7 gap-1 px-2.5"
            onClick={onBulkRemove}
          >
            <X className="size-3" />
            {t(lang, "watchlistRemoveSelected")}
          </Button>
          <button
            type="button"
            onClick={onClearSelection}
            className="min-h-11 px-2 text-meta text-muted-foreground hover:text-foreground sm:min-h-0"
          >
            {t(lang, "watchlistClearSelection")}
          </button>
        </div>
      )}

      {/* Single control row — search left, controls right (wraps on mobile) */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t(lang, "watchlistSearchPlaceholder")}
            aria-label={t(lang, "watchlistSearchPlaceholder")}
            className="h-11 w-full rounded-lg border border-transparent bg-muted pl-8 pr-2.5 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none dark:border-hair sm:h-9"
          />
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">
          {/* Period */}
          <SegmentedControl<ChangePeriod>
            options={PERIODS.map((p) => ({ value: p, label: p }))}
            value={period}
            onChange={onPeriodChange}
            size="sm"
            variant="pill"
            leadingIcon={TrendingUpDown}
            ariaLabel={t(lang, "change")}
          />

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-9 gap-1.5 px-2.5 text-muted-foreground hover:text-foreground"
              )}
            >
              <ArrowDownUp className="size-3.5 opacity-70" />
              <span>{t(lang, "watchlistSortBy")}</span>
              <ChevronDown className="size-3 opacity-70" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={4} className="w-56">
              {sortOptions.map((opt) => (
                <DropdownMenuItem
                  key={opt.key}
                  onClick={() => onSortChange(opt.key)}
                  className={cn(
                    "justify-between",
                    sortKey === opt.key && "font-semibold text-primary"
                  )}
                >
                  {opt.label}
                  {sortKey === opt.key && <Check className="size-3.5" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filter */}
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-9 gap-1.5 px-2.5",
              activeFilterCount > 0
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <SlidersHorizontal className="size-3.5 opacity-70" />
            <span>{t(lang, "filter")}</span>
            {activeFilterCount > 0 && (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/15 px-1 text-overlay tabular-nums text-primary ring-1 ring-primary/30">
                {activeFilterCount}
              </span>
            )}
          </button>
          <FilterModal
            open={filterOpen}
            onOpenChange={setFilterOpen}
            onReset={() => onFiltersChange(DEFAULT_FILTERS)}
            resetDisabled={activeFilterCount === 0}
          >
            <FilterPanel
              lang={lang}
              filters={filters}
              onFiltersChange={onFiltersChange}
              setOptions={setOptions}
            />
          </FilterModal>

          {/* View toggle */}
          <SegmentedControl<WatchView>
            value={view}
            onChange={onViewChange}
            size="sm"
            ariaLabel={`${t(lang, "watchlistViewList")} / ${t(lang, "watchlistViewGrid")}`}
            options={[
              {
                value: "list",
                label: <span className="sr-only">{t(lang, "watchlistViewList")}</span>,
                ariaLabel: t(lang, "watchlistViewList"),
                icon: List,
              },
              {
                value: "grid",
                label: <span className="sr-only">{t(lang, "watchlistViewGrid")}</span>,
                ariaLabel: t(lang, "watchlistViewGrid"),
                icon: LayoutGrid,
              },
            ]}
          />

          {/* Edit toggle — enters/exits multi-select mode */}
          <button
            type="button"
            onClick={onToggleEditMode}
            aria-pressed={editMode}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-9 gap-1.5 px-2.5",
              editMode
                ? "bg-primary/15 text-primary hover:bg-primary/20"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {editMode ? <Check className="size-3.5" /> : <Pencil className="size-3.5" />}
            {editMode ? t(lang, "watchlistEditDone") : t(lang, "watchlistEditMode")}
          </button>
        </div>
      </div>

      {/* Limit pill — only surfaces near/at cap (no redundant count otherwise) */}
      {isFinite && (isFull || isHigh) && (
        <div className="flex justify-end">
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-2 py-1",
              isFull ? "border-destructive/30 bg-destructive/5" : "border-warning/30 bg-warning/5"
            )}
            title={`${itemCount}/${limit}`}
          >
            <div className="hidden h-1 w-10 overflow-hidden rounded-full bg-muted sm:flex">
              <div
                className={cn(
                  "h-full rounded-full motion-base",
                  isFull ? "bg-destructive" : "bg-warning"
                )}
                style={{ width: `${usagePct}%` }}
              />
            </div>
            <span
              className={cn(
                "text-meta tabular-nums",
                isFull ? "text-destructive" : "text-warning"
              )}
            >
              {itemCount}/{limit}
            </span>
            <UpgradeBadge featureKey="watchlistCards" />
          </div>
        </div>
      )}
    </div>
  );
}

function SegButton({
  active,
  onClick,
  label,
  icon,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
  tone?: "up" | "down";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "ease-chrome inline-flex h-8 items-center justify-center gap-1 rounded-lg border px-2 text-xs font-medium",
        active
          ? tone === "up"
            ? "border-price-up/40 bg-price-up/10 text-price-up"
            : tone === "down"
              ? "border-price-down/40 bg-price-down/10 text-price-down"
              : "border-primary/40 bg-primary/15 text-primary"
          : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/** The filter-only content (movement + status + set) as plain elements, rendered
 *  inside the FilterModal. Filters apply on tap; the modal's Reset button clears them. */
function FilterPanel({
  lang,
  filters,
  onFiltersChange,
  setOptions,
}: {
  lang: Language;
  filters: WatchlistFilters;
  onFiltersChange: (next: WatchlistFilters) => void;
  setOptions: { code: string; label: string }[];
}) {
  return (
    <>
      <div>
        <span className="text-eyebrow mb-2 block">
          {t(lang, "watchlistFilterMovement")}
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          <SegButton
            active={filters.direction === null}
            onClick={() => onFiltersChange({ ...filters, direction: null })}
            label={t(lang, "watchlistFilterMovementAll")}
          />
          <SegButton
            active={filters.direction === "up"}
            onClick={() => onFiltersChange({ ...filters, direction: "up" })}
            label={t(lang, "watchlistFilterMovementUp")}
            icon={<TrendingUp className="size-3" />}
            tone="up"
          />
          <SegButton
            active={filters.direction === "down"}
            onClick={() => onFiltersChange({ ...filters, direction: "down" })}
            label={t(lang, "watchlistFilterMovementDown")}
            icon={<TrendingDown className="size-3" />}
            tone="down"
          />
        </div>
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

      {setOptions.length > 0 && (
        <div>
          <span className="text-eyebrow mb-2 block">{t(lang, "set")}</span>
          <div className="max-h-56 space-y-0.5 overflow-y-auto">
            {setOptions.map((opt) => {
              const checked = filters.setCodes.includes(opt.code);
              const setName = setNameByCode.get(opt.code.toLowerCase()) ?? "";
              const label = `${opt.code.toUpperCase()} · ${setName}`
                .trim()
                .replace(/ ·\s*$/, "");
              return (
                <ToggleRow
                  key={opt.code}
                  icon={<Layers className="size-4" />}
                  label={label}
                  checked={checked}
                  onToggle={() =>
                    onFiltersChange({
                      ...filters,
                      setCodes: checked
                        ? filters.setCodes.filter((c) => c !== opt.code)
                        : [...filters.setCodes, opt.code],
                    })
                  }
                />
              );
            })}
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
      className={cn(
        "ease-chrome flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm",
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
