"use client";

import {
  ArrowDownUp,
  Bell,
  ChevronDown,
  Filter,
  LayoutGrid,
  List,
  Pin,
  RotateCcw,
  Search,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { useMemo } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UpgradeBadge } from "@/components/shared/upgrade-badge";
import { t } from "@/lib/i18n";
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
  selectedCount: number;
  onClearSelection: () => void;
  onBulkRemove: () => void;
}) {
  const lang = useUIStore((s) => s.language);

  const sortOptions: { key: SortKey; label: string }[] = useMemo(
    () => [
      { key: "default", label: t(lang, "watchlistSortDefault") },
      { key: "recent", label: t(lang, "watchlistSortRecent") },
      { key: "gain", label: t(lang, "watchlistSortGain") },
      { key: "loss", label: t(lang, "watchlistSortLoss") },
      { key: "priceHigh", label: t(lang, "watchlistSortPriceHigh") },
      { key: "priceLow", label: t(lang, "watchlistSortPriceLow") },
      { key: "nameAz", label: t(lang, "watchlistSortNameAz") },
      { key: "target", label: t(lang, "watchlistSortTarget") },
    ],
    [lang]
  );

  const activeSortLabel = sortOptions.find((o) => o.key === sortKey)?.label ?? sortOptions[0].label;

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
      {/* Bulk action bar (only visible when something is selected) */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5">
          <span className="text-meta tabular-nums text-primary">
            {selectedCount} {t(lang, "watchlistSelected")}
          </span>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className="h-7 px-2.5 gap-1"
            onClick={onBulkRemove}
          >
            <X className="size-3" />
            {t(lang, "watchlistRemoveSelected")}
          </Button>
          <button
            type="button"
            onClick={onClearSelection}
            className="text-meta text-muted-foreground hover:text-foreground"
          >
            {t(lang, "watchlistClearSelection")}
          </button>
        </div>
      )}

      {/* Controls row — search + period + sort + filter + view */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t(lang, "watchlistSearchPlaceholder")}
            className="h-9 w-full rounded-lg border border-border bg-card pl-8 pr-2.5 text-sm placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none"
          />
        </div>

        {/* Period segmented */}
        <div className="inline-flex h-9 shrink-0 items-center rounded-lg border border-border bg-card p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPeriodChange(p)}
              className={cn(
                "h-8 rounded-md px-2.5 text-xs font-medium transition-colors",
                period === p
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-9 gap-1.5"
            )}
          >
            <ArrowDownUp className="size-3 text-muted-foreground" />
            <span className="hidden sm:inline text-muted-foreground">{t(lang, "watchlistSortBy")}:</span>
            <span className="font-medium">{activeSortLabel}</span>
            <ChevronDown className="size-3 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" sideOffset={4}>
            {sortOptions.map((opt) => (
              <DropdownMenuItem
                key={opt.key}
                onClick={() => onSortChange(opt.key)}
                className={cn(sortKey === opt.key && "font-semibold text-primary")}
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Unified filter dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({
                variant: activeFilterCount > 0 ? "default" : "outline",
                size: "sm",
              }),
              "h-9 gap-1.5"
            )}
          >
            <Filter className="size-3" />
            <span>{t(lang, "watchlistFiltersButton")}</span>
            {activeFilterCount > 0 && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-overlay tabular-nums",
                  "bg-primary-foreground/20 text-primary-foreground"
                )}
              >
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className="size-3 opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            sideOffset={4}
            className="w-64 max-h-[28rem] overflow-y-auto p-2"
          >
            {/* Movement segmented */}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-eyebrow px-1 pb-1">
                {t(lang, "watchlistFilterMovement")}
              </DropdownMenuLabel>
              <div className="grid grid-cols-3 gap-1 p-1">
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
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            {/* Status checkboxes */}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-eyebrow px-1 pb-0">
                {t(lang, "watchlistFilterStatus")}
              </DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={filters.hasAlert}
                onCheckedChange={(next) =>
                  onFiltersChange({ ...filters, hasAlert: !!next })
                }
              >
                <Bell className="size-3 mr-2 text-muted-foreground" />
                {t(lang, "watchlistFilterAlerts")}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.pinnedOnly}
                onCheckedChange={(next) =>
                  onFiltersChange({ ...filters, pinnedOnly: !!next })
                }
              >
                <Pin className="size-3 mr-2 text-muted-foreground" />
                {t(lang, "watchlistFilterPinned")}
              </DropdownMenuCheckboxItem>
            </DropdownMenuGroup>

            {/* Set list (if any) */}
            {setOptions.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-eyebrow px-1 pb-0">
                    {t(lang, "set")}
                  </DropdownMenuLabel>
                  <div className="max-h-40 overflow-y-auto">
                    {setOptions.map((opt) => {
                      const checked = filters.setCodes.includes(opt.code);
                      return (
                        <DropdownMenuCheckboxItem
                          key={opt.code}
                          checked={checked}
                          onCheckedChange={(next) => {
                            if (next) {
                              onFiltersChange({
                                ...filters,
                                setCodes: [...filters.setCodes, opt.code],
                              });
                            } else {
                              onFiltersChange({
                                ...filters,
                                setCodes: filters.setCodes.filter(
                                  (c) => c !== opt.code
                                ),
                              });
                            }
                          }}
                        >
                          {opt.label}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                  </div>
                </DropdownMenuGroup>
              </>
            )}

            {activeFilterCount > 0 && (
              <>
                <DropdownMenuSeparator />
                <button
                  type="button"
                  onClick={() => onFiltersChange(DEFAULT_FILTERS)}
                  className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <RotateCcw className="size-3" />
                  {t(lang, "watchlistResetFilters")}
                </button>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Spacer */}
        <div className="ml-auto flex items-center gap-2">
          {/* Limit pill (compact, hidden when bulk bar is showing to avoid clutter) */}
          {isFinite && (
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-2 py-1",
                isFull
                  ? "border-destructive/30 bg-destructive/5"
                  : isHigh
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-border bg-card"
              )}
              title={`${itemCount}/${limit}`}
            >
              <div className="hidden sm:flex h-1 w-10 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    isFull
                      ? "bg-destructive"
                      : isHigh
                        ? "bg-amber-500"
                        : "bg-primary"
                  )}
                  style={{ width: `${usagePct}%` }}
                />
              </div>
              <span
                className={cn(
                  "text-meta tabular-nums",
                  isFull && "text-destructive",
                  isHigh && !isFull && "text-amber-600 dark:text-amber-400"
                )}
              >
                {itemCount}/{limit}
              </span>
              {(isFull || isHigh) && <UpgradeBadge featureKey="watchlistCards" />}
            </div>
          )}

          {/* View toggle */}
          <div className="inline-flex h-9 shrink-0 items-center rounded-lg border border-border bg-card p-0.5">
            <button
              type="button"
              onClick={() => onViewChange("list")}
              className={cn(
                "inline-flex h-8 items-center justify-center rounded-md px-2 text-xs font-medium transition-colors",
                view === "list"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title={t(lang, "watchlistViewList")}
              aria-label={t(lang, "watchlistViewList")}
            >
              <List className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewChange("grid")}
              className={cn(
                "inline-flex h-8 items-center justify-center rounded-md px-2 text-xs font-medium transition-colors",
                view === "grid"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title={t(lang, "watchlistViewGrid")}
              aria-label={t(lang, "watchlistViewGrid")}
            >
              <LayoutGrid className="size-4" />
            </button>
          </div>
        </div>
      </div>
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
        "inline-flex h-8 items-center justify-center gap-1 rounded-md border px-2 text-xs font-medium transition-colors",
        active
          ? tone === "up"
            ? "border-price-up/40 bg-price-up/10 text-price-up"
            : tone === "down"
              ? "border-price-down/40 bg-price-down/10 text-price-down"
              : "border-primary/40 bg-primary/10 text-primary"
          : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
